import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        let rbxID = await roblox.getIdFromUsername(username) as number;
        if(!rbxID) {
            let embed = client.embedMaker({title: "Invalid Username", description: "The username that you provided is invalid", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(rbxID);
        let embed = client.embedMaker({title: "Awaiting...", description: "This function requires a message from the Roblox game, meaning that you'll have to wait for it to get your response", type: "info", author: interaction.user});
        let msg = await interaction.editReply({embeds: [embed]});
        try {
            await MessagingService.sendMessage(universeID, "GetJobID", {
                username: username
            });
            client.jobIdsRequested.push({
                msgID: msg.id,
                universeID: universeID,
                channelID: msg.channel.id,
                username: username,
                timeRequested: Date.now()
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send out the request to the Roblox game server for the user's job id: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets the job ID of the server the inputted user is in")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("username").setDescription("The username of the user you wish to get the server job ID of").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "JobID",
        isEphemeral: false,
        permissions: config.permissions.game.jobIDs,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;