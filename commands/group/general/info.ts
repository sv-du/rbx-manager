import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let groupInfo: roblox.Group;
        try {
            groupInfo = await roblox.getGroup(groupID);
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to get the group information: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embedDescription = "";
        embedDescription += `**Group Description**: ${groupInfo.description}\n`;
        embedDescription += `**Group Owner**: ${groupInfo.owner.username}\n`;
        embedDescription += `**Group Membercount**: ${groupInfo.memberCount}\n`;
        let jrStatus = !groupInfo.publicEntryAllowed;
        embedDescription += `**Join Requests Enabled**: ${jrStatus ? "Yes" : "No"}`;
        let embed = client.embedMaker({title: "Group Information", description: embedDescription, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets the information of the group")
    .addStringOption(o => o.setName("group").setDescription("The group to get the info of").setRequired(true).addChoices(...GroupHandler.parseGroups() as any)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Group",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;