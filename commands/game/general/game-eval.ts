import Discord from 'discord.js';

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import MessagingService from '../../../utils/classes/MessagingService';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let typeOfOperation = args["subcommand"];
        let code = args["code"];
        let jobID = args["jobid"];
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        if(code.startsWith("https://")) {
            code = await (await fetch(code, {method: "GET"})).text();
        }
        try {
            await MessagingService.sendMessage(universeID, "Eval", {
                isGlobal: (typeOfOperation === "global"),
                code: code,
                jobID: jobID
            });
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to send this code for execution: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        if(typeOfOperation === "global") {
            await client.logAction(`<@${interaction.user.id}> has executed **${code}** in all of the servers of **${universeName}**`);
        } else {
            await client.logAction(`<@${interaction.user.id}> has executed **${code}** the server of **${universeName}** with the job ID of **${jobID}**`);
        }
        let embed = client.embedMaker({title: "Success", description: "You've successfully sent out the following code to be executed based on the inputted settings", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Runs serverside code")
    .addSubcommand(sc => {
        sc.setName("global")
        sc.setDescription("Runs serverside code on all running servers")
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
        sc.addStringOption(o => o.setName("code").setDescription("The code to execute in the game (can also be a URL to the code to run)").setRequired(true))
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("jobid")
        sc.setDescription("Runs serverside code in one specific server")
        sc.addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
        sc.addStringOption(o => o.setName("code").setDescription("The code to execute in the game (can also be a URL to the code to run)").setRequired(true))
        sc.addStringOption(o => o.setName("jobid").setDescription("The job ID of the server you wish to run the code in (only if you choose so)").setRequired(true))
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Game",
        isEphemeral: false,
        permissions: config.permissions.game.execution,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;