import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let ranks = await roblox.getRoles(groupID);
        let description = "";
        for(let i = 1; i < ranks.length; i++) {
            if(client.isLockedRole(ranks[i])) {
                description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank} [LOCKED]\n`;
            } else {
                description += `**Name**: ${ranks[i].name} | **ID**: ${ranks[i].rank}\n`;
            }
        }
        let embed = client.embedMaker({title: "Ranks in Group", description: description, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets the ranks of the group")
    .addStringOption(o => o.setName("group").setDescription("The group to get the ranks of").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;