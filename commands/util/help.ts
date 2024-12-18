import Discord from 'discord.js';

import { commands, registeredCommands } from '../..';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';

import config from '../../config';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let helpData = {};
        for(let i = 0; i < commands.length; i++) {
            let commandName = commands[i].name;
            if(registeredCommands.findIndex(c => c.name === commandName) === -1) continue;
            let slashData = commands[i].slashData;
            let commandData = commands[i].commandData;
            if(!helpData[commandData.category]) helpData[commandData.category] = {commandHelpStrings: [], helpEmbed: null};
            let commandString = `**${commandName}** | ${slashData.description}`;
            helpData[commandData.category].commandHelpStrings.push(commandString);
        }
        let categories = Object.keys(helpData);
        for(let i = 0; i < categories.length; i++) {
            let embedDescription = "";
            let categoryHelpData = helpData[categories[i]];
            for(let i = 0; i < categoryHelpData.commandHelpStrings.length; i++) {
                embedDescription += `${categoryHelpData.commandHelpStrings[i]}\n`;
            }
            let embed = client.embedMaker({title: `${categories[i]} Commands`, description: embedDescription, type: "info", author: interaction.user});
            helpData[categories[i]].helpEmbed = embed;
        }
        let helpPageIndex = 0;
        let embed = helpData[categories[helpPageIndex]].helpEmbed;
        let componentData = client.createButtons([
            {customID: "previousPage", label: "Previous Page", style: Discord.ButtonStyle.Primary},
            {customID: "nextPage", label: "Next Page", style: Discord.ButtonStyle.Primary}
        ]);
        let msg = await interaction.editReply({embeds: [embed], components: componentData.components}) as Discord.Message;
        let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
        let collector = msg.createMessageComponentCollector({filter: filter, time: config.collectorTime});
        collector.on('collect', async(button: Discord.ButtonInteraction) => {
            if(button.customId === "previousPage") {
                helpPageIndex -= 1;
                if(helpPageIndex === -1) helpPageIndex = categories.length - 1;
            } else {
                helpPageIndex += 1;
                if(helpPageIndex === categories.length) helpPageIndex = 0;
            }
            embed = helpData[categories[helpPageIndex]].helpEmbed;
            await msg.edit({embeds: [embed]});
            await button.reply({content: "ㅤ"});
            await button.deleteReply();
        });
        collector.on('end', async() => {
            let disabledComponents = client.disableButtons(componentData).components;
            try {
                await msg.edit({components: disabledComponents});
            } catch {};
        });
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Gets a list of commands"),
    commandData: {
        category: "Util",
        isEphemeral: false,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;