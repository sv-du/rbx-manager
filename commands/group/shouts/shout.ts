import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let message = args["message"];
        try {
            await roblox.shout(groupID, message);
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to shout the inputted message to the group: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully shouted the inputted message to the group shout", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> has shouted "**${message}**" to the group in **${GroupHandler.getNameFromID(groupID)}**`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Shouts a message to the group")
    .addStringOption(o => o.setName("group").setDescription("The group to do the shouting in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to shout to the group").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Shout",
        isEphemeral: false,
        permissions: config.permissions.group.shout,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Shouts"
    }
}

export default command;