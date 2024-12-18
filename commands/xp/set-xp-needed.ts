import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';
import ConfigHelpers from '../../utils/classes/ConfigHelpers';

import CommandFile from '../../utils/interfaces/CommandFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let id = args["id"];
        let index = config.xpSystem.rewards.findIndex(r => r.rewardID === id);
        if(index === -1) {
            let embed = client.embedMaker({title: "Reward ID Not Allocated", description: "The reward ID supplied is not allocated, pick another one", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        config.xpSystem.rewards[index].xpNeeded = args["xp"];
        ConfigHelpers.writeToConfigFile(client);
        let embed = client.embedMaker({title: "XP Needed Set", description: "You've successfully set the new amount of XP needed to redeem this reward", type: "success", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
    },
    autocomplete: async(interaction: Discord.AutocompleteInteraction, client: BotClient): Promise<any> => {
        let rewardIDs = config.xpSystem.rewards.map(r => r.rewardID);
        let focused = interaction.options.getFocused();
        let filteredIDs = rewardIDs.filter(r => r.startsWith(focused));
        return await interaction.respond(filteredIDs.map(id => ({name: id, value: id})));
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Sets the XP needed for a reward")
    .addStringOption(o => o.setName("id").setDescription("The ID of the reward").setRequired(true).setAutocomplete(true))
    .addNumberOption(o => o.setName("xp").setDescription("The new amount of XP that would be needed to redeem this reward").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "XP",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;