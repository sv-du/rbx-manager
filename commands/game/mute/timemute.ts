import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import RobloxDatastore from '../../../utils/classes/RobloxDatastore';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let timeData = CommandHelpers.parseTimes(usernames, args["time"]);
        if(timeData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `Something about your time input was wrong. Most likely it was because of invalid times, please input valid ones`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let times = timeData.parsedTimes;
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
            let time = times[i];
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
            let res = await RobloxDatastore.getModerationData(universeID, robloxID);
            if(res.err) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: res.err
                });
                continue;
            }
            let data = res.data;
            data.muteData.isMuted = true;
            data.muteData.reason = reason;
            data.muteData.releaseTime = Date.now() + time;
            try {
                await RobloxDatastore.setModerationData(universeID, robloxID, data);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            let didMuteError = false;
            try {
                await MessagingService.sendMessage(universeID, "Mute", {username: username, reason: reason});
            } catch(e) {
                didMuteError = true;
                logs.push({
                    username: username,
                    status: "Error",
                    message: `Although this user is now muted, I couldn't mute them in the game because of the following error: ${e}`
                });
            }
            if(!didMuteError) {
                logs.push({
                    username: username,
                    status: "Success"
                });
            }
            await client.logAction(`<@${interaction.user.id}> has muted **${username}** in **${universeName}** for **${ms(time, {long: true})}** with the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Mutes the inputted user(s) for the given time")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to mute").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("The duration of the mute(s)").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the mute(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Mute",
        isEphemeral: false,
        permissions: config.permissions.game.mute,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;