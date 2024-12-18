import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';
import ConfigHelpers from '../../utils/classes/ConfigHelpers';
import GroupHandler from '../../utils/classes/GroupHandler';

import CommandFile from '../../utils/interfaces/CommandFile';
import RewardEntry from '../../utils/interfaces/RewardEntry';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let subcommand = args["subcommand"];
        if(subcommand === "add-roblox") {
            let id = args["id"];
            let group = GroupHandler.getIDFromName(args["group"]);
            let rankName = args["name"];
            let xpNeeded = args["xp"];
            if(config.xpSystem.rewards.find(r => r.rewardID === id)) {
                let embed = client.embedMaker({title: "Reward ID Allocated", description: "The reward ID supplied is already allocated, pick another one", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let newReward: RewardEntry = {
                rewardID: id,
                type: "RobloxRank",
                metadata: {
                    groupId: group,
                    rankName: rankName
                },
                xpNeeded: xpNeeded
            };
            config.xpSystem.rewards.push(newReward);
            ConfigHelpers.writeToConfigFile(client);
            let embed = client.embedMaker({title: "Added Reward", description: "You've successfully added this reward", type: "success", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(subcommand === "add-discord") {
            let id = args["id"];
            let role = args["role"];
            let xpNeeded = args["xp"];
            if(config.xpSystem.rewards.find(r => r.rewardID === id)) {
                let embed = client.embedMaker({title: "Reward ID Allocated", description: "The reward ID supplied is already allocated, pick another one", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let newReward: RewardEntry = {
                rewardID: id,
                type: "DiscordRole",
                metadata: {
                    discordRoleId: role
                },
                xpNeeded: xpNeeded
            };
            config.xpSystem.rewards.push(newReward);
            ConfigHelpers.writeToConfigFile(client);
            let embed = client.embedMaker({title: "Added Reward", description: "You've successfully added this reward", type: "success", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(subcommand === "remove") {
            let id = args["id"];
            let index = config.xpSystem.rewards.findIndex(r => r.rewardID === id);
            if(index === -1) {
                let embed = client.embedMaker({title: "Reward ID Not Allocated", description: "The reward ID supplied is not allocated, pick another one", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            config.xpSystem.rewards.splice(index, 1);
            ConfigHelpers.writeToConfigFile(client);
            let embed = client.embedMaker({title: "Removed Reward", description: "You've successfully removed this reward", type: "success", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(subcommand === "list") {
            let rewardIDs = config.xpSystem.rewards.map(r => r.rewardID);
            if(rewardIDs.length === 0) {
                let embed = client.embedMaker({title: "No Rewards", description: "There are no configured rewards, why don't you add one?", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let rewardIDString = rewardIDs.map(r => `${r}\n`).join("");
            let embed = client.embedMaker({title: "Rewards", description: `These are the rewards that users can get\n\n${rewardIDString}`, type: "info", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
    },
    autocomplete: async(interaction: Discord.AutocompleteInteraction, client: BotClient): Promise<any> => {
        let rewardIDs = config.xpSystem.rewards.map(r => r.rewardID);
        let focused = interaction.options.getFocused();
        let filteredIDs = rewardIDs.filter(r => r.startsWith(focused));
        return await interaction.respond(filteredIDs.map(id => ({name: id, value: id})));
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Configures XP rewards")
    .addSubcommand(sc => {
        sc.setName("add-roblox");
        sc.setDescription("Adds a RobloxRank reward");
        sc.addStringOption(o => o.setName("id").setDescription("The ID of the reward").setRequired(true));
        sc.addStringOption(o => o.setName("group").setDescription("The group of the rank to give to the user").setRequired(true).addChoices(...GroupHandler.parseGroups() as any));
        sc.addStringOption(o => o.setName("name").setDescription("The rank name of the rank to give to the user").setRequired(true));
        sc.addNumberOption(o => o.setName("xp").setDescription("The amount of XP needed to unlock this reward").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("add-discord");
        sc.setDescription("Adds a DiscordRole reward");
        sc.addStringOption(o => o.setName("id").setDescription("The ID of the reward").setRequired(true));
        sc.addRoleOption(o => o.setName("role").setDescription("The role to give to the user").setRequired(true));
        sc.addNumberOption(o => o.setName("xp").setDescription("The amount of XP needed to unlock this reward").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("remove");
        sc.setDescription("Removes a reward");
        sc.addStringOption(o => o.setName("id").setDescription("The ID of the reward").setRequired(true).setAutocomplete(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("list");
        sc.setDescription("Lists all rewards");
        return sc;
    }) as Discord.SlashCommandBuilder,
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