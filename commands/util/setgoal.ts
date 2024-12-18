import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';
import ConfigHelpers from '../../utils/classes/ConfigHelpers';

import CommandFile from '../../utils/interfaces/CommandFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let goal = args["goal"];
        config.counting.goal = goal;
        ConfigHelpers.writeToConfigFile(client);
        let embed = client.embedMaker({title: "Goal Set", description: "You've successfully set the goal", type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Sets the new goal for the group counting feature")
    .addNumberOption(o => o.setName("goal").setDescription("The new goal to set").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;