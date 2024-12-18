import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';

import CommandFile from '../../../utils/interfaces/CommandFile';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let username = args["username"];
        let userID = await roblox.getIdFromUsername(username) as number;
        if(!userID) {
            let embed = client.embedMaker({title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(userID);
        if(config.verificationChecks) {
            let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Ranking", userID);
            if(!verificationStatus.success) {
                let embed = client.embedMaker({title: "Verification Checks Failed", description: `You've failed the verification checks, reason: ${verificationStatus.err}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        let time = ms(args["time"]);
        if(!time) {
            let embed = client.embedMaker({title: "Invalid Time Suppiled", description: "You inputted an invalid time, please input a valid one", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let oldRank = await roblox.getRankInGroup(groupID, userID);
        if(oldRank === 0) {
            let embed = client.embedMaker({title: "User Not In Group", description: "This user is currently not in the group", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let suspensions = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
        let index = suspensions.findIndex(v => v.userId === userID);
        if(index != -1) {
            suspensions[index].timeToRelease = Date.now() + (time as any);
        } else {
            let oldRoleID = (await roblox.getRoles(groupID)).find(v => v.rank === oldRank).id;
            suspensions.push({
                groupID: groupID,
                userId: userID,
                reason: args["reason"],
                oldRoleID: oldRoleID,
                timeToRelease: Date.now() + (time as any)
            });
            try {
                await roblox.setRank(groupID, userID, config.suspensionRank);
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to change the rank of this user: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        await fs.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
        await client.logAction(`<@${interaction.user.id}> has suspended **${username}** for **${ms((time as any), {long: true})}** for the reason of **${args["reason"]}** in **${GroupHandler.getNameFromID(groupID)}**`);
        let embed = client.embedMaker({title: "Success", description: `You've successfully suspended this user`, type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Suspends the given users with the given amount of time")
    .addStringOption(o => o.setName("group").setDescription("The group to do the suspending in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username of the person you wish to suspend").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("The amount of time you wish to suspend the user for").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason for the suspension").setRequired(true)) as Discord.SlashCommandBuilder,
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