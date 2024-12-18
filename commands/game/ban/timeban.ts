import Discord from 'discord.js';
import roblox = require('noblox.js');
import ms = require('ms');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import BanService from '../../../utils/classes/BanService';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import UniverseHandler from '../../../utils/classes/UniverseHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';
import BetterConsole from '../../../utils/classes/BetterConsole';

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
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let time = times[i]; // In milliseconds
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
            let res = await BanService.ban(universeID, robloxID, reason, time / 1000);
            if(res.err) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: res.err
                });
                continue;
            }
            let didDiscordBanError = false;
            if(config.ban.banDiscordAccounts) {
                let discordIDs = await VerificationHelpers.getDiscordUsers(interaction.guild.id, robloxID);
                BetterConsole.log(`Fetected Discord IDs for Roblox ID ${robloxID}: ${discordIDs}`);
                for(let i = 0; i < discordIDs.length; i++) {
                    try {
                        await interaction.guild.members.ban(discordIDs[i], {reason: reason});
                    } catch(e) {
                        didDiscordBanError = true;
                        logs.push({
                            username: `<@${discordIDs[i]}>`,
                            status: "Error",
                            message: `Although this user is now banned from the game, they are not banned from the Discord due to the following error: ${e}`
                        });
                    }
                }
            }
            if(!res.err && !didDiscordBanError) {
                logs.push({
                    username: username,
                    status: "Success"
                });
            }
            await client.logAction(`<@${interaction.user.id}> has banned **${username}** from **${universeName}** for **${ms(time, {long: true})}** with the reason of **${reason}**`);
            continue;
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Bans the inputted user(s) from the game for the given time")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to ban").setRequired(true))
    .addStringOption(o => o.setName("time").setDescription("The duration of the ban(s)").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the bans(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ban",
        isEphemeral: false,
        permissions: config.permissions.game.ban,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;