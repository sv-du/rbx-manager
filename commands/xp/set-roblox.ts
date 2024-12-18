import Discord from 'discord.js';
import roblox from 'noblox.js';

import fs from "fs";

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';
import UserEntry from '../../utils/interfaces/UserEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let username = args["username"];
        let robloxID = await roblox.getIdFromUsername(username) as number;
        if(!robloxID) {
            let embed = client.embedMaker({title: "Invalid Username", description: "The username provided is an invalid Roblox username", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        username = await roblox.getUsernameFromId(robloxID);
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
        userData.robloxID = robloxID;
        if(index !== -1) {
            xpData[index] = userData;
        } else {
            xpData.push(userData);
        }
        await fs.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
        let embed = client.embedMaker({title: "Set User", description: "You've successfully set your Roblox account", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await client.logXPAction("Set Roblox User", `<@${interaction.user.id}> has set their linked Roblox account to **${username}**`);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Sets your Roblox account")
    .addStringOption(o => o.setName("username").setDescription("The username of the account to set").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "XP",
        isEphemeral: false,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;