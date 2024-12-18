import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
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
                await MessagingService.sendMessage(universeID, "Kick", {username: username, reason: reason});
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has kicked **${username}** from **${universeName}** with the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Kicks user(s) from the game")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to kick").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the kick(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ban",
        isEphemeral: false,
        permissions: config.permissions.game.kick,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;