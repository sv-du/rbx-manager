import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let description = "Here's an FAQ of questions that I think people would ask me\n\nhttps://github.com/sv-du/rbx-manager/wiki/FAQ";
        let embed = client.embedMaker({title: "FAQ", description: description, type: "info", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets a list of random questions that I think people would ask"),
    commandData: {
        category: "Util",
        isEphemeral: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;