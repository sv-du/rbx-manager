import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let shout = await roblox.getShout(groupID);
        if(!shout) {
            let embed = client.embedMaker({title: "No Shout", description: "The group linked doesn't have a shout", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embedDescription = "";
        embedDescription += `**Poster**: ${shout.poster.username}\n`;
        embedDescription += `**Body**: ${shout.body}\n`;
        embedDescription += `**Created**: ${shout.created}\n`;
        let embed = client.embedMaker({title: "Current Shout", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets the current group shout")
    .addStringOption(o => o.setName("group").setDescription("The group get the shout of").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false,
    }
}

export default command;