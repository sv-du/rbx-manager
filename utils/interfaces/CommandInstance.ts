import Discord from 'discord.js';

import CommandFile from "./CommandFile";
import CommandData from './CommandData';

export default interface CommandInstance {
    file: CommandFile,
    name: string,
    slashData: Discord.SlashCommandBuilder,
    commandData: CommandData
}