import Discord from 'discord.js';

import BotClient from '../classes/BotClient';

export default interface XPRewardFile {
    run: (interaction: Discord.CommandInteraction, client: BotClient) => Promise<any>,
}