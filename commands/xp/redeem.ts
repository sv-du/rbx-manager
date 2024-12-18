import Discord from 'discord.js';
import roblox from 'noblox.js';

import fs from "fs"

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';
import UserEntry from '../../utils/interfaces/UserEntry';
import XPRewardFile from '../../utils/interfaces/XPRewardFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let rewardID = args["id"];
        let xpData = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
        let index = xpData.findIndex(v => v.discordID === interaction.user.id);
        let userData: UserEntry;
        if(index !== -1) {
            userData = xpData[index];
        } else {
            userData = {
                discordID: interaction.user.id,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            }
        }
        let rewards = config.xpSystem.rewards;
        let reward = rewards.find(r => r.rewardID.toLowerCase() === rewardID.toLowerCase());
        if(!reward) {
            let embed = client.embedMaker({title: "Invalid Reward ID", description: "You inputted an invalid reward ID. How can I reward you something that doesn't exist?", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(reward.xpNeeded > userData.xp) {
            let embed = client.embedMaker({title: "Not Enough XP", description: "You don't have enough XP to redeem this reward", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(userData.redeemedRewards.includes(reward.rewardID)) {
            let embed = client.embedMaker({title: "Already Redeemed", description: "You already redeemed this reward", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(reward.type === "RobloxRank") {
            if(userData.robloxID === 0) {
                let embed = client.embedMaker({title: "No configured Roblox account", description: "You didn't link a Roblox account to grant the roles to", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let roles = await roblox.getRoles(reward.metadata.groupId);
            let role = roles.find(r => r.name.toLowerCase() === reward.metadata.rankName.toLowerCase());
            if(!role) {
                let embed = client.embedMaker({title: "Invalid Role Configured", description: "The reward has an invalid role configured. Bug the person who set this bot up to fix it", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            try {
                await roblox.setRank(reward.metadata.groupId, userData.robloxID, role.id);
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to grant your reward: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        } else if(reward.type === "DiscordRole") {
            let role = await interaction.guild.roles.fetch(reward.metadata.discordRoleId);
            if(!role) {
                let embed = client.embedMaker({title: "Invalid Role Configured", description: "The reward has an invalid role configured. Bug the person who set this bot up to fix it", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            try {
                await (await interaction.guild.members.fetch(interaction.user.id)).roles.add(role);
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to grant your reward: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        } else {
            if(reward.metadata.willAutomaticallyGiveReward) {
                let files = await fs.promises.readdir(`${process.cwd()}/utils/rewards`);
                let file = files.find(v => v === `${reward.rewardID}.ts`);
                if(!file) {
                    let embed = client.embedMaker({title: "No Reward File", description: "The reward file for this reward is missing. Bug the person who set this up to fix it", type: "error", author: interaction.user});
                    return await interaction.editReply({embeds: [embed]});
                }
                let rewardFile = require(`${process.cwd()}/build/utils/rewards/${reward.rewardID}.js`).default as XPRewardFile;
                try {
                    await rewardFile.run(interaction, client);
                } catch(e) {
                    let embed = client.embedMaker({title: "Error", description: `There was an error while trying to grant your reward: ${e}`, type: "error", author: interaction.user});
                    return await interaction.editReply({embeds: [embed]});
                }
            }
        }
        userData.redeemedRewards.push(reward.rewardID);
        xpData[index] = userData;
        await fs.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
        let embed = client.embedMaker({title: "Success", description: "You've successfully redeemed this reward", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logXPAction("Redeemed Reward", `<@${interaction.user.id}> has redeemed the reward with the ID of **${reward.rewardID}**`);
    },
    autocomplete: async(interaction: Discord.AutocompleteInteraction, client: BotClient): Promise<any> => {
        let xpData = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
        let index = xpData.findIndex(v => v.discordID === interaction.user.id);
        let userData: UserEntry;
        if(index !== -1) {
            userData = xpData[index];
        } else {
            userData = {
                discordID: interaction.user.id,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            }
        }
        let rewards = config.xpSystem.rewards;
        let availableRewards:string[] = [];
        for(let i = 0; i < rewards.length; i++) {
            if(userData.xp >= rewards[i].xpNeeded && !userData.redeemedRewards.includes(rewards[i].rewardID)) {
                availableRewards.push(rewards[i].rewardID);
            }
        }
        availableRewards = availableRewards.filter(r => r.startsWith(interaction.options.getFocused()));
        return await interaction.respond(availableRewards.map(r => ({name: r, value: r})));
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Redeems a reward given an ID")
    .addStringOption(o => o.setName("id").setDescription("The ID of the reward you want to redeem").setRequired(true).setAutocomplete(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "XP",
        isEphemeral: false,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;