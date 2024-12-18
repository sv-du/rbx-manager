import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const fileName = "RevertRanksData.txt";

async function logAction(msg: string) {
    await fs.promises.appendFile(`${process.cwd()}/${fileName}`, `${msg}\n`);
}

function getRankNameFromID(roles: roblox.Role[], roleSetID: any) {
    return roles.find(r => r.id === roleSetID).name;
}

function format(logDate: string) {
    return logDate.slice(0, logDate.indexOf("T")).split("-");
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let limit = parseInt(args["limit"]);
        let username = args["user"];
        let date = args["date"];
        let logDate = date;
        if(date) {
            date = date.split("/"); // 0 = month, 1 = day, 2 = year
            if(date[0].length === 1) date[0] = "0" + date[0];
            if(date[1].length === 1) date[1] = "0" + date[1];
            if(date[2].length === 2) date[2] = "20" + date[2];
        }
        let logs: roblox.AuditPage;
        let userID: number;
        if(username) {
            userID = await roblox.getIdFromUsername(username) as number;
            if(!userID) {
                let embed = client.embedMaker({title: "Invalid Username", description: "The username that you provided is invalid", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            logs = await roblox.getAuditLog(groupID, "ChangeRank", userID, "Desc", 100, "");
        } else {
            logs = await roblox.getAuditLog(groupID, "ChangeRank", null, "Desc", 100, "");
        }
        if(logs.data.length === 0) {
            let embed = client.embedMaker({title: "No Logs Found", description: "No audit logs have been found with the given settings", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        while(logs.data.length < limit) {
            let tempLogs: roblox.AuditPage;
            if(userID) {
                tempLogs = await roblox.getAuditLog(groupID, "ChangeRank", userID, "Desc", 100, logs.nextPageCursor);
            } else {
                tempLogs = await roblox.getAuditLog(groupID, "ChangeRank", null, "Desc", 100, logs.nextPageCursor);
            }
            logs.data = logs.data.concat(tempLogs.data);
            logs.previousPageCursor = tempLogs.previousPageCursor;
            logs.nextPageCursor = tempLogs.nextPageCursor;
        }
        if(logs.data.length > limit) logs.data = logs.data.slice(0, limit);
        if(date) {
            logs.data = logs.data.filter(log => {
                let formattedDate = format(log.created.toISOString()); // 0 = year, 1 = month, 2 = day
                if(parseInt(formattedDate[0]) === parseInt(date[2])) {
                    if(parseInt(formattedDate[1]) === parseInt(date[0])) {
                        return (parseInt(formattedDate[2]) >= parseInt(date[1]));
                    } else {
                        return (parseInt(formattedDate[1]) >= parseInt(date[0]));
                    }
                } else {
                    return (parseInt(formattedDate[0]) > parseInt(date[2]));
                }
            });
        }
        if(logs.data.length === 0) {
            let embed = client.embedMaker({title: "No Reversing Possible", description: "Based on the given settings, no rank reversing is possible", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Reversing Process Starting...", description: "I am now starting the reversal progress with the given settings. Please be patient as this may take some time. This message will be edited once the process is complete", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]}) as Discord.Message;
        if(userID) {
            await client.logAction(`<@${interaction.user.id}> has started a rank reversal in **${GroupHandler.getNameFromID(groupID)}**. The parameters they chose are the following\n\n**Number of Users**: ${logs.data.length}\n**Author to Revert**: ${await roblox.getUsernameFromId(userID)}\n**Start Date**: ${(logDate ? logDate : "No date filter provided")}`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has started a rank reversal in **${GroupHandler.getNameFromID(groupID)}**. The parameters they chose are the following\n\n**Numbers of Users**: ${logs.data.length}\n**Author to Revert**: No user filter provided\n**Start Date**: ${(logDate ? logDate : "No date filter provided")}`);
        }
        let roles = await roblox.getRoles(groupID);
        let failedAmount = 0;
        for(let i = 0; i < logs.data.length; i++) {
            let des = logs.data[i].description as any;
            let oldRankName: string;
            try {
                oldRankName = await roblox.getRankNameInGroup(groupID, des.TargetId);
            } catch {
                oldRankName = "Failed to get rank name";
            }
            let didSuc = true;
            try {
                await roblox.setRank(groupID, des.TargetId, des.OldRoleSetId);
            } catch(e) {
                console.error(`There was an error while trying to reverse the rank of ${des.TargetName}: ${e}`);
                await logAction(`${i + 1}: ${des.TargetName} (${des.TargetId}) was unable to get their rank reverted from ${oldRankName} to ${getRankNameFromID(roles, des.OldRoleSetId)} because of the following error: ${e}`);
                failedAmount++;
                didSuc = false;
            }
            if(didSuc) {
                await logAction(`${i + 1}: ${des.TargetName} (${des.TargetId}) was able to get their rank reverted from ${oldRankName} to ${getRankNameFromID(roles, des.OldRoleSetId)}`);
            }
        }
        let sucRate = Math.round(((logs.data.length - failedAmount) / logs.data.length) * 100);
        let newEmbed = client.embedMaker({title: "Reserving Complete", description: `I've finished the rank reversing process. The log has been attached below\n\nSuccess Percentage: ${sucRate}% (${logs.data.length - failedAmount}/${logs.data.length})\nFailure Percentage: ${100 - sucRate}% (${failedAmount}/${logs.data.length})`, type: "info", author: interaction.user});
        await interaction.editReply({content: `<@${interaction.user.id}>`, embeds: [newEmbed]});
        await interaction.channel.send({files: [`${process.cwd()}/${fileName}`]});
        await fs.promises.unlink(`${process.cwd()}/${fileName}`);
        return logs.data.length; // This is the only command where the multiplier is calculated, so I return it to multiply it in the main file
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Reverts rank actions based on given settings (user/date parameters are filters, both are accepted)")
    .addStringOption(o => o.setName("group").setDescription("The group to do the rank reverting in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("limit").setDescription("The amount of actions to revert").setRequired(true))
    .addStringOption(o => o.setName("user").setDescription("The username of the user whose actions you want to revert").setRequired(false))
    .addStringOption(o => o.setName("date").setDescription("The date that you want start from (formatted MM/DD/YYYY)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        permissions: config.permissions.group.ranking,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Ranking"
    }
}

export default command;
