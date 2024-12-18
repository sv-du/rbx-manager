import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
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
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The user provided is not in the group"
                });
                continue;
            }
            let ranks = await roblox.getRoles(groupID);
            let lowestRank = Number.MAX_VALUE;
            for(let i = 0; i < ranks.length; i++) {
                let rankID = ranks[i].rank;
                if(lowestRank > rankID && rankID != 0) {
                    lowestRank = rankID;
                }
            }
            try {
                await roblox.setRank(groupID, victimRobloxID, lowestRank);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has fired **${username}** for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Fires the inputted user(s)")
    .addStringOption(o => o.setName("group").setDescription("The group to do the firing in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to fire").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the firing").setRequired(false)) as Discord.SlashCommandBuilder,
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