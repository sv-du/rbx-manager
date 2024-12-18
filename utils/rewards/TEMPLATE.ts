import Discord from 'discord.js';

import BotClient from '../classes/BotClient';
import XPRewardFile from '../interfaces/XPRewardFile';

const reward: XPRewardFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient): Promise<any> => {
        // Do whatever you want in here to reward the user
        // This file is only here to make Github keep this otherwise empty directory
    }
}

export default reward;