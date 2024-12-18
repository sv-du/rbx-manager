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
                let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Exile", victimRobloxID);
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
            try {
                await roblox.exile(groupID, victimRobloxID);
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
            await client.logAction(`<@${interaction.user.id}> has exiled **${username}** from the group for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Kicks the inputted user(s) from the group")
    .addStringOption(o => o.setName("group").setDescription("The group to do the exiling in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to exile").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the exile(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "User",
        isEphemeral: false,
        permissions: config.permissions.group.user,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Exile"
    }
}

export default command;