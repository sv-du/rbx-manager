import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
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
            let robloxID = await roblox.getIdFromUsername(username) as number;
            if(!robloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(robloxID);
            try {
                await roblox.handleJoinRequest(groupID, robloxID, true);
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
            await client.logAction(`<@${interaction.user.id}> has accepted the join request of **${username}** for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Accepts the join request of the user(s) inputted")
    .addStringOption(o => o.setName("group").setDescription("The group to accept join requests in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to accept the join request of").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of why you're accepting the join request(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        isEphemeral: false,
        permissions: config.permissions.group.joinrequests,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "JoinRequests"
    }
}

export default command;