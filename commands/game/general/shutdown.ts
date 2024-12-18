import Discord from 'discord.js';

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let typeOfOperation = args["subcommand"];
        let jobID = args["jobid"];
        let reason = args["reason"];
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        try {
            await MessagingService.sendMessage(universeID, "Shutdown", {
                isGlobal: (typeOfOperation === "global"),
                jobID: jobID,
                reason: reason
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send the shutdown request: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has shutdown all of the servers of **${universeName}** for the reason of **${reason}**`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has shutdown the server of **${universeName}** with the job ID of **${jobID}** for the reason of **${reason}**`);
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully sent out the following shutdown to be executed based on the inputted settings", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Shutdowns all servers or shuts down a specific server")
    .addSubcommand(sc => {
        sc.setName("global")
        sc.setDescription("Shuts down all of the running servers")
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true))
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("jobid")
        sc.setDescription("Shuts down one specific server")
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
        sc.addStringOption(o => o.setName("reason").setDescription("The reason of the shutdown").setRequired(true))
        sc.addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to shutdown (only if you choose so)").setRequired(true))
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config.permissions.game.shutdown,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;