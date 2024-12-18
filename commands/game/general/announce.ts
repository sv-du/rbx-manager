import Discord from 'discord.js';

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let title = args["title"];
        let message = args["message"];
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        try {
            await MessagingService.sendMessage(universeID, "Announce", {title: title, message: message});
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the announcement to the game: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has announced **${message}** with the title of **${title}** to the players of **${universeName}**`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully sent this announcement to the game", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Announces the inputted message to every game server")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("title").setDescription("The title of the announcement").setRequired(true))
    .addStringOption(o => o.setName("message").setDescription("The message that you wish to announce").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config.permissions.game.broadcast,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;