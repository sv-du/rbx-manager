import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import UniverseHandler from '../../../utils/classes/UniverseHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let name = args["name"] as string;
        let key = args["key"] as string;
        let scope = args["scope"] as string || "global";
        let universeName = args["universe"];
        let universeID = UniverseHandler.getIDFromName(universeName);
        try {
            await roblox.deleteDatastoreEntry(universeID, name, key, scope);
        } catch(e) {
            let embed: Discord.EmbedBuilder;
            let err = e.toString() as string;
            if(err.includes("NOT_FOUND")) {
                embed = client.embedMaker({title: "Error", description: "The supplied data doesn't return any data, please try a different combination", type: "error", author: interaction.user});
            } else {
                embed = client.embedMaker({title: "Error", description: `There was an error while trying to delete data: ${e}`, type: "error", author: interaction.user});
            }
            return interaction.editReply({embeds: [embed]});
        }
        await client.logAction(`<@${interaction.user.id}> has deleted the **${key}** key in the **${name}** datastore, which is located in the **${scope}** scope from **${universeName}**`);
        let embed = client.embedMaker({title: "Success", description: "You've successfully deleted this data", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Deletes data from the datastores with the given settings")
    .addStringOption(o => o.setName("universe").setDescription("The universe to perform this action on").setRequired(true).addChoices(...UniverseHandler.parseUniverses() as any))
    .addStringOption(o => o.setName("name").setDescription("The name of the datastore to delete data from").setRequired(true))
    .addStringOption(o => o.setName("key").setDescription("The entry key of the data to delete from the datastore").setRequired(true))
    .addStringOption(o => o.setName("scope").setDescription("The scope of which the datastore is located at").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Database",
        isEphemeral: false,
        permissions: config.permissions.game.datastore,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;