import Discord from 'discord.js';

import fs from "fs";

import config from '../../config';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';
import UserEntry from '../../utils/interfaces/UserEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let discordID = args["user"];
        let amount = args["amount"];
        let xpData = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
        let index = xpData.findIndex(v => v.discordID === discordID);
        let userData: UserEntry;
        if(index !== -1) {
            userData = xpData[index];
        } else {
            userData = {
                discordID: discordID,
                robloxID: 0,
                redeemedRewards: [],
                xp: 0
            }
        }
        userData.xp -= amount;
        if(index !== -1) {
            xpData[index] = userData;
        } else {
            xpData.push(userData);
        }
        await fs.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
        let embed = client.embedMaker({title: "Removed XP", description: "You've successfully removed the XP from the user", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logAction(`<@${interaction.user.id}> has removed **${amount}** XP from <@${discordID}>'s XP balance`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Removes XP from a user")
    .addUserOption(o => o.setName("user").setDescription("The user to remove XP from").setRequired(true))
    .addNumberOption(o => o.setName("amount").setDescription("The amount of XP to remove").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "XP",
        isEphemeral: false,
        permissions: config.permissions.group.xp,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;