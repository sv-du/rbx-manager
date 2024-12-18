import Discord from 'discord.js';

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        try {
            await MessagingService.sendMessage(universeID, "Lock", {
                jobID: jobID,
                reason: reason
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the lock request to the server: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has locked the server of **${universeName}** with the job id of **${jobID}** for the reason of **${reason}**`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully locked the inputted server", type: "success", author: interaction.user})
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Locks the inputted server")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to lock").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason of why you want to lock the supplied server").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Lock",
        isEphemeral: false,
        permissions: config.permissions.game.lock,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;