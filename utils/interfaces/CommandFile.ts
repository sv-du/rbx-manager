import Discord from 'discord.js';

import BotClient from '../classes/BotClient';
import CommandData from './CommandData';

export default interface CommandFile {
    run: (interaction: Discord.CommandInteraction, client: BotClient, args: any) => Promise<any>,
    autocomplete?: (interaction: Discord.AutocompleteInteraction, client: BotClient) => Promise<any>,
    slashData: Discord.SlashCommandBuilder,
    commandData: CommandData,
}