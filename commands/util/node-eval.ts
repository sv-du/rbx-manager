import Discord from 'discord.js';

import BotClient from '../../utils/classes/BotClient';

import CommandFile from '../../utils/interfaces/CommandFile';

function formatLoggedData(data: any[]) {
    let formatted = "";
    for(let i = 0; i < data.length; i++) {
        formatted += `${data[i]}\n`;
    }
    return formatted;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let code = args["code"];
        let loggedData = [];
        let oldMethod = console.log;
        console.log = function(msg: any) {
            if(!msg) msg = "";
            loggedData.push(msg.toString());
            oldMethod(msg);
        }
        if(code.startsWith("https://")) {
            code = await (await fetch(code, {method: "GET"})).text();
        }
        try {
            let res = await eval(code);
            let embed = client.embedMaker({title: "Success", description: "The supplied code has ran successfully", type: "success", author: interaction.user});
            if(res) {
                embed.addFields({
                    name: "Returned Data",
                    value: res.toString()
                });
            }
            if(loggedData.length !== 0) {
                embed.addFields({
                    name: "Logged Data",
                    value: "```\n" + formatLoggedData(loggedData) + "```"
                });
            }
            await interaction.editReply({embeds: [embed]});
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: "There was an error while trying to run this code", type: "error", author: interaction.user});
            embed.addFields({
                name: "Error",
                value: "```\n" + e.toString() + "```"
            })
            await interaction.editReply({embeds: [embed]});
        }
        console.log = oldMethod;
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Runs Javascript code in the bot environment")
    .addStringOption(o => o.setName("code").setDescription("The code to run (can also be a URL to the code to run)").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Util",
        isEphemeral: true,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: true,
        preformGeneralVerificationChecks: false
    }
}

export default command;