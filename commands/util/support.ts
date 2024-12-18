import Discord from 'discord.js';
import fs from 'fs';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';

import config, { envValues } from '../../config';

const DATA_FILE_PATH = `${process.cwd()}/data.txt`;

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let data = {};
        data["env"] = {};
        data["config"] = config;
        for(let i = 0; i < envValues.length; i++) {
            data["env"][envValues[i]] = config[envValues[i]];
            delete data["config"][envValues[i]];
        }
        data["config"]["lockedCommands"] = client.originalLockedCommands;
        data["gen"] = {
            ids: {
                server: interaction.guild.id,
                bot: client.user.id,
                author: interaction.user.id
            },
            botVersion: JSON.parse(await fs.promises.readFile(`${process.cwd()}/package.json`, "utf-8")).version
        }
        let parsedData = btoa(JSON.stringify(data));
        await fs.promises.writeFile(DATA_FILE_PATH, parsedData);
        let embed = client.embedMaker({title: "Support Data", description: "Send this data in your ticket and I'll do my best to help you. DO NOT SEND THIS ANYWHERE ELSE!!!!", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        await interaction.followUp({files: [DATA_FILE_PATH], ephemeral: true});
        try { await fs.promises.unlink(DATA_FILE_PATH) } catch {}
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Easily compile configuration values and general info to send for me to help you"),
    commandData: {
        category: "Util",
        isEphemeral: true,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;