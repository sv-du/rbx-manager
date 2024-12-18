import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';

import CommandFile from '../../../utils/interfaces/CommandFile';

interface PageDataResponse {
    description: string,
    newStart: number,
    err?: string
}

async function generatePageData(client: BotClient, start: number, numberOfGroups: number): Promise<PageDataResponse> {
    let blacklists = config.groupBlacklists;
    let embedDescription = "";
    let end = (start + numberOfGroups >= blacklists.length) ? blacklists.length : start + numberOfGroups;
    for(let i = start; i < end; i++) {
        let entry = blacklists[i];
        let groupInfo: roblox.Group;
        try {
            groupInfo = await roblox.getGroup(entry.groupId);
        } catch(e) {
            return {description: "", newStart: 0, err: e};
        }
        embedDescription += `**${groupInfo.name}** (${groupInfo.id}) | ${!entry.reason ? "No reason provided" : entry.reason} - ${client.formatDate(new Date(entry.timeBlacklisted))}\n`;
    }
    return {description: embedDescription, newStart: end};
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let embed = client.embedMaker({title: "Disabled by Developer", description: "This command is currently disabled by me because it is incomplete", type: "error", author: interaction.user});
        return await interaction.editReply({embeds: [embed]});
        let subcommand = args["subcommand"];
        if(subcommand === "list") {
            let blacklists = config.groupBlacklists;
            if(blacklists.length === 0) {
                let embed = client.embedMaker({title: "No Blacklists", description: "There are currently no groups blacklists", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let start = 0;
            let numGroups = 5;
            let pageData = await generatePageData(client, start, numGroups);
            if(pageData.err) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to fetch blacklists: ${pageData.err}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed], components: []});
            }
            let embed = client.embedMaker({title: "Group Blacklists", description: pageData.description, type: "info", author: interaction.user});
            if(pageData.newStart === blacklists.length) {
                return await interaction.editReply({embeds: [embed]});
            }
            embed.setTitle(`Group Blacklists (${blacklists.length} total)`);
            let componentData = client.createButtons([
                {customID: "previousPage", label: "Previous Page", style: Discord.ButtonStyle.Primary},
                {customID: "nextPage", label: "Next Page", style: Discord.ButtonStyle.Primary}
            ]);

            let msg = await interaction.editReply({embeds: [embed], components: componentData.components});
            let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
            let collector = msg.createMessageComponentCollector({filter: filter, time: config.collectorTime});
            collector.on('collect', async(button: Discord.ButtonInteraction) => {

            });
            collector.on('end', async() => {
                let disabledComponents = client.disableButtons(componentData).components;
                try {
                    await msg.edit({components: disabledComponents});
                } catch {};
            });
        }
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Manage group blacklists")
    .addSubcommand(sc => {
        sc.setName("add");
        sc.setDescription("Adds a group to the blacklist");
        sc.addNumberOption(o => o.setName("id").setDescription("The group ID to blacklist").setRequired(true));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason for the blacklist").setRequired(false));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("list");
        sc.setDescription("Lists group blacklists");
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("setreason");
        sc.setDescription("Overrides the reason for why a group is blacklisted");
        sc.addNumberOption(o => o.setName("id").setDescription("The group ID of the group to modify the reason for").setRequired(true));
        sc.addStringOption(o => o.setName("reason").setDescription("The new reason for the blacklist").setRequired(true));
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("remove");
        sc.setDescription("Removes a group blacklist");
        sc.addNumberOption(o => o.setName("id").setDescription("The group ID to unblacklist").setRequired(true));
        sc.addStringOption(o => o.setName("reason").setDescription("The reason for why the blacklist is being removed").setRequired(false));
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "General Group",
        isEphemeral: false,
        permissions: config.permissions.group.blacklist,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;