import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

function parseRanks(ranks: string): any[] {
    let parsed = ranks.split(",");
    for(let i = 0; i < parsed.length; i++) {
        parsed[i] = parsed[i].trim();
    }
    return parsed;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let ranks = parseRanks(args["rank"]);
        if(ranks.length === 1) {
            while(true) {
                if(ranks.length === usernames.length) break;
                ranks.push(ranks[0]);
            }
        } else if(ranks.length !== usernames.length) {
            let embed = client.embedMaker({title: "Argument Error", description: "You inputted an unequal amount of usernames and ranks, please make sure that these amounts are equal, or, if you wish to apply one rank to multiple people, only put that rank for the rank argument", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let rank = ranks[i];
            let victimRobloxID = await roblox.getIdFromUsername(username) as number;
            if(!victimRobloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Ranking", victimRobloxID);
                if(!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `Verification checks have failed, reason: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let suspensions = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
            let index = suspensions.findIndex(v => v.userId === victimRobloxID);
            if(index != -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "This user is currently suspended"
                });
                continue;
            }
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The user provided is not in the group"
                });
                continue;
            }
            let roles = await roblox.getRoles(groupID);
            let isRankID = Number(rank) == rank;
            try {
                if(!isRankID) { // If a rank name was inputed
                    rank = roles.find(v => v.name.toLowerCase() === rank.toLowerCase()).rank; // Errors if not a group role
                } else {
                    rank = Number(rank);
                    let index = roles.findIndex(v => v.rank === rank);
                    if(index === -1) throw("")
                }
            } catch {
                logs.push({
                    username: username,
                    status: "Error",
                    message: `The rank provided, **${rank}**, is invalid`
                });
                continue;
            }
            if(config.verificationChecks) {
                let authorRank = await roblox.getRankInGroup(groupID, authorRobloxID);
                if(rank >= authorRank) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: "Verification checks have failed"
                    });
                    continue;
                }
            }
            let roleObject = await roblox.getRole(groupID, rank);
            if(client.isLockedRole(roleObject)) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: `The rank provided, **${rank}**, is currently locked`
                });
                continue;
            }
            let oldRank = await roblox.getRankNameInGroup(groupID, victimRobloxID);
            try {
                await roblox.setRank(groupID, victimRobloxID, rank);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            let newRank = await roblox.getRankNameInGroup(groupID, victimRobloxID);
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has ranked **${username}** from **${oldRank}** to **${newRank}** for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Sets the rank of the inputted user(s) to the inputted rank(s)")
    .addStringOption(o => o.setName("group").setDescription("The group to do the ranking in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the person/people you wish to rank").setRequired(true))
    .addStringOption(o => o.setName("rank").setDescription("The rank(s) you wish to rank the inputted person/people to").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the ranking(s)").setRequired(false)) as Discord.SlashCommandBuilder,
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