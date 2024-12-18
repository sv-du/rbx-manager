import Discord from 'discord.js';
import fs from 'fs';

import { registerSlashCommands } from '../..';

import BotClient from '../../utils/classes/BotClient';
import BetterConsole from '../../utils/classes/BetterConsole';

import CommandFile from '../../utils/interfaces/CommandFile';
import PluginEntry from '../../utils/interfaces/PluginEntry';
import GithubPluginAPIResponse from '../../utils/interfaces/GithubPluginAPIResponse';

const exe = require('util').promisify(require('child_process').exec);

const pluginAPIURL = "https://api.github.com/repos/sv-du/rbx-manager-plugins/contents/";

const map = {
    "Ban": `game/ban`,
    "Database": `game/database`,
    "General Game": `game/general`,
    "JobID": `game/general`,
    "Lock": `game/lock`,
    "Mute": `game/mute`,
    "General Group": `group/general`,
    "Join Request": `group/join-requests`,
    "Ranking": `group/ranking`,
    "User": `group/user`,
    "Shout": `group/shout`,
    "XP": `group/xp`,
    "Util": `util`,
}

async function fetchPlugins(): Promise<PluginEntry[]> {
    let res = await(await fetch(pluginAPIURL)).json() as GithubPluginAPIResponse[];
    let plugins: PluginEntry[] = [];
    for(let i = 0; i < res.length; i++) {
        if(res[i].name.includes(".ts")) {
            let source = await(await fetch(`${res[i].download_url}`)).text();
            let index = source.indexOf("category: ") + 11;
            source = source.substring(index);
            index = source.indexOf('"');
            source = source.substring(0, index);
            let normalDirectory = `${process.cwd()}/commands/${map[source]}`;
            let buildDirectory = `${process.cwd()}/build/commands/${map[source]}`;
            plugins.push({
                name: res[i].name.split(".")[0],
                downloadURL: res[i].download_url,
                normalInstallationPath: normalDirectory,
                buildInstallationPath: buildDirectory
            });
        }
    }
    return plugins;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let mode = args["subcommand"];
        let name = args["name"];
        let plugins = await fetchPlugins();
        if(mode === "list") {
            let installedPluginString = "";
            for(let i = 0; i < plugins.length; i++) {
                if(fs.existsSync(`${plugins[i].normalInstallationPath}/${plugins[i].name}.ts`)) {
                    let file = require(`${plugins[i].buildInstallationPath}/${plugins[i].name}.js`).default as CommandFile;
                    installedPluginString += `**${file.slashData.name}** - ${file.slashData.description}\n`;
                }
            }
            if(installedPluginString === "") {
                let embed = client.embedMaker({title: "No Plugins Installed", description: "You don't have any plugins installed", type: "info", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            } else {
                let embed = client.embedMaker({title: "Plugins Installed", description: `You have the following plugins installed:\n\n${installedPluginString}`, type: "info", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        if(mode === "install") {
            let pluginEntry = plugins.find(v => v.name.toLowerCase() === name.toLowerCase());
            if(!pluginEntry) {
                let embed = client.embedMaker({title: "Invalid Plugin Name", description: "You inputted an invalid plugin name, please find valid ones [here](https://github.com/sv-du/rbx-manager-plugins)", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            let source = await(await fetch(`${pluginEntry.downloadURL}`)).text();
            await fs.promises.writeFile(`${pluginEntry.normalInstallationPath}/${pluginEntry.name}.ts`, source);
        }
        if(mode === "uninstall") {
            let pluginEntry = plugins.find(v => v.name.toLowerCase() === name.toLowerCase());
            if(!pluginEntry) {
                let embed = client.embedMaker({title: "Invalid Plugin Name", description: "You inputted an invalid plugin name, please find valid ones [here](https://github.com/sv-du/rbx-manager-plugins)", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
            try {
                await fs.promises.unlink(`${pluginEntry.normalInstallationPath}/${pluginEntry.name}.ts`);
            } catch {
                let embed = client.embedMaker({title: "Not Installed", description: "The supplied plugin is not installed", type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        BetterConsole.log("Building...");
        if(process.platform === "win32") {
            await exe("npm run winBuild");
        } else {
            await exe("npm run linuxBuild");
        }
        BetterConsole.log("Registering...");
        try {
            await registerSlashCommands(true);
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while updating the command list: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Operation Successful", description: "The operation has successfully completed", type: "success", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Manages installed plugins")
    .addSubcommand(sc => {
        sc.setName("install")
        sc.setDescription("Installs a plugin")
        sc.addStringOption(o => o.setName("name").setDescription("The name of the plugin to install").setRequired(true))
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("list")
        sc.setDescription("Lists installed plugins")
        return sc;
    })
    .addSubcommand(sc => {
        sc.setName("uninstall")
        sc.setDescription("Uninstalls a plugin")
        sc.addStringOption(o => o.setName("name").setDescription("The name of the plugin to uninstall").setRequired(true))
        return sc;
    }) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Util",
        isEphemeral: false,
        permissions: ["Administrator"],
        useDiscordPermissionSystem: true,
        hasCooldown: false,
        preformGeneralVerificationChecks: false
    }
}

export default command;