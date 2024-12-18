import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from 'fs';

import config from './config';

import BotClient from './utils/classes/BotClient';
import CommandHelpers from './utils/classes/CommandHelpers';
import GroupHandler from './utils/classes/GroupHandler';
import UniverseHandler from './utils/classes/UniverseHandler';
import BetterConsole from './utils/classes/BetterConsole';
import VerificationHelpers from './utils/classes/VerificationHelpers';

import CommandFile from './utils/interfaces/CommandFile';
import CommandInstance from './utils/interfaces/CommandInstance';
import UserEntry from './utils/interfaces/UserEntry';
import VerificationResult from './utils/interfaces/VerificationResult';

import checkBans from './utils/events/checkBans';
import checkAudits from './utils/events/checkAuditLog';
import checkSuspensions from './utils/events/checkSuspensions';
import checkCooldowns from './utils/events/checkCooldowns';
import checkAbuse from './utils/events/checkAbuse';
import checkSales from './utils/events/checkSales';
import checkLoginStatus from './utils/events/checkLoginStatus';
import checkMemberCount from './utils/events/checkMemberCount';
import checkJobIDs from './utils/events/checkJobIDs';
import checkUpdates from './utils/events/checkUpdates';

const client = new BotClient();

export const commands: CommandInstance[] = [];
export const registeredCommands: CommandInstance[] = [];

async function readCommands(path?: string) {
    if(!path) path = "./commands";
    let files = await fs.promises.readdir(path);
    for(let i = 0; i < files.length; i++) {
        let file = files[i];
        if(!file.includes(".")) {
            await readCommands(`${path}/${file}`);
        } else {
            file = file.replace(".ts", ".js"); // This is here because when it compiles to JS, it saves to the build directory, and it starts as build/index.js, so it's reading files in build/commands, hence the string change
            let commandFile = require(`${path}/${file}`).default as CommandFile; // .default cause when you call "export default <x>" it adds a default property to it (idk why)
            try {
                let command = {
                    file: commandFile,
                    name: file.split('.')[0],
                    slashData: commandFile.slashData,
                    commandData: commandFile.commandData
                }
                commands.push(command);
            } catch(e) {
                console.error(`Couldn't load the command data for the ${file.split('.')[0]} command with error: ${e}`);
            }
        }
    }
}

export async function registerSlashCommands(reload?: boolean) {
    if(reload) {
        commands.length = 0;
        await readCommands();
    }
    let slashCommands = [];
    if(config.groupIds.length === 0) config.lockedCommands = config.lockedCommands.concat(CommandHelpers.getGroupCommands());
    if(config.universes.length === 0) config.lockedCommands = config.lockedCommands.concat(CommandHelpers.getGameCommands());
    if(!config.xpSystem.enabled) config.lockedCommands = config.lockedCommands.concat(CommandHelpers.getXPCommands());
    if(!config.counting.enabled) config.lockedCommands.push("setgoal");
    for(let i = 0; i < commands.length; i++) {
        let lockedCommandsIndex = config.lockedCommands.findIndex(c => c.toLowerCase() === commands[i].name);
        let allowedCommandsIndex = CommandHelpers.allowedCommands.findIndex(c => c.toLowerCase() === commands[i].name);
        if(lockedCommandsIndex !== -1 && allowedCommandsIndex === -1) {
            BetterConsole.log(`Skipped registering the ${commands[i].name} command because it's locked and not part of the default allowed commands list`);
            continue;
        }
        registeredCommands.push(commands[i]);
        let commandData;
        try {
            commandData = commands[i].slashData.toJSON()
            slashCommands.push(commandData);
        } catch(e) {
            console.error(`Couldn't load the slash command data for the ${commands[i].name} command with error: ${e}`);
        }
    }
    let rest = new Discord.REST().setToken(config.DISCORD_TOKEN);
    try {
        await rest.put(Discord.Routes.applicationCommands(client.user.id), {body: slashCommands});
    } catch(e) {
        console.error(`There was an error while registering slash commands: ${e}`);
    }
}

async function deleteGuildCommands() {
    let rest = new Discord.REST().setToken(config.DISCORD_TOKEN);
    let guilds = await client.guilds.fetch({limit: 200});
    for(let i = 0; i < guilds.size; i++) {
        let guild = guilds.at(i);
        try {
            await rest.put(Discord.Routes.applicationGuildCommands(client.user.id, guild.id), {body: []});
        } catch(e) {
            console.error(`There was an error while trying to delete guild commmands: ${e}`);
        }
    }
}

export async function loginToRoblox(robloxCookie: string) {
    try {
        client.robloxInfo = await roblox.setCookie(robloxCookie);
    } catch {
        console.error("Unable to login to Roblox");
        client.setStatusActivity();
        client.isLoggedIn = false;
        return;
    }
    BetterConsole.log(`Logged into the Roblox account - ${client.robloxInfo.name}`, true);
    client.isLoggedIn = true;
    for(let i = 0; i < config.groupIds.length; i++) {
        let groupID = config.groupIds[i];
        await checkAudits(groupID, client);
        await checkAbuse(groupID, client);
        await checkSales(groupID, client);
        await checkMemberCount(groupID, client);
    }
    await checkBans(client);
    await checkSuspensions(client);
    await checkLoginStatus(client);
}

client.once('ready', async() => {
    BetterConsole.log(`Logged into the Discord account - ${client.user.tag}`, true);
    if(client.application.botPublic) {
        console.warn("BOT IS PUBLIC | SHUTTING DOWN");
        return process.exit();
    }
    checkCooldowns(client);
    await checkUpdates(client);
    await roblox.setAPIKey(config.ROBLOX_API_KEY);
    if(config.groupIds.length !== 0) {
        await loginToRoblox(config.ROBLOX_COOKIE);
        await GroupHandler.loadGroups();
    }
    if(config.universes.length !== 0) {
        await UniverseHandler.loadUniverses();
        await checkJobIDs(client);
    }
    await readCommands();
    await deleteGuildCommands();
    await registerSlashCommands();
});

client.on('interactionCreate', async(interaction: Discord.Interaction) => {
    if(interaction.type !== Discord.InteractionType.ApplicationCommand) return;
    let command = interaction.commandName.toLowerCase();
    let commandObject = commands.find(c => c.name === command);
    if(!commandObject) return;
    try {
        await interaction.deferReply({ephemeral: commandObject.commandData.isEphemeral});
    } catch(e) {
        console.error(e);
        return; // This error only happens with the plugin command. Idk why
    }
    if(!client.isLoggedIn && CommandHelpers.getGroupCommands().includes(commandObject.name)) {
        let embed = client.embedMaker({title: "Not Logged In", description: "The bot is currently not logged into Roblox, please log it in", type: "error", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        return;
    }
    let args = CommandHelpers.loadArguments(interaction);
    if(args["username"]) {
        let usernames = args["username"].replaceAll(" ", "").split(",") as string[];
        if(usernames.length > config.maximumNumberOfUsers) {
            let embed = client.embedMaker({title: "Maximum Number of Users Exceeded", description: "You've inputted more users than the currently allowed maximum, please lower the amount of users in your command and try again", type: "error", author: interaction.user});
            await interaction.editReply({embeds: [embed]});
            return;
        }
    }
    if(!CommandHelpers.checkPermissions(commandObject.file, interaction.member as Discord.GuildMember)) {
        let embed = client.embedMaker({title: "No Permission", description: "You don't have permission to run this command", type: "error", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        return;
    }
    if(commandObject.file.commandData.hasCooldown) {
        if(client.isUserOnCooldown(commandObject.file.slashData.name, interaction.user.id)) {
            let embed = client.embedMaker({title: "Cooldown", description: "You're currently on cooldown for this command, take a chill pill", type: "error", author: interaction.user});
            await interaction.editReply({embeds: [embed]});
            return;
        }
    }
    if(commandObject.file.commandData.preformGeneralVerificationChecks) {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let robloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let verificationStatus: VerificationResult;
        if(robloxID !== 0) {
            verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, robloxID, commandObject.commandData.permissionToCheck);
        } else {
            verificationStatus = {success: false, err: `User is not verified with the configured verification provider (${config.verificationProvider})`};
        }
        if(!verificationStatus.success) {
            let embed = client.embedMaker({title: "Verification Checks Failed", description: `You've failed the verification checks, reason: ${verificationStatus.err}`, type: "error", author: interaction.user});
            await interaction.editReply({embeds: [embed]});
            return;
        }
    }
    let res;
    try {
        res = await commandObject.file.run(interaction, client, args);
    } catch(e) {
        let embed = client.embedMaker({title: "Error", description: "There was an error while trying to run this command. The error has been logged in the console", type: "error", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        console.error(e);
    }
    if(commandObject && commandObject.file.commandData.hasCooldown) {
        let commandCooldown = client.getCooldownForCommand(commandObject.file.slashData.name);
        if(typeof(res) === "number") { // If we return a number, it means the cooldown multipler got calculated
            client.commandCooldowns.push({commandName: commandObject.file.slashData.name, userID: interaction.user.id, cooldownExpires: Date.now() + (commandCooldown * res)});
        } else if(args["username"]) {
            let usernames = args["username"].replaceAll(" ", "").split(",") as string[];
            client.commandCooldowns.push({commandName: commandObject.file.slashData.name, userID: interaction.user.id, cooldownExpires: Date.now() + (commandCooldown * usernames.length)});
        } else {
            client.commandCooldowns.push({commandName: commandObject.file.slashData.name, userID: interaction.user.id, cooldownExpires: Date.now() + commandCooldown});
        }
    }
});

client.on("interactionCreate", async(interaction: Discord.Interaction) => {
    if(interaction.type !== Discord.InteractionType.ApplicationCommandAutocomplete) return;
    let command = interaction.commandName.toLowerCase();
    let commandObject = commands.find(c => c.name === command);
    if(!commandObject) return;
    try {
        await commandObject.file.autocomplete(interaction, client);
    } catch(e) {
        console.error(e);
    }
});

client.on("messageCreate", async(message: Discord.Message) => {
    if(!config.xpSystem.enabled) return;
    if(message.author.bot) return;
    let xpData = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
    let index = xpData.findIndex(v => v.discordID === message.author.id);
    let userData: UserEntry;
    if(index !== -1) {
        userData = xpData[index];
    } else {
        userData = {
            discordID: message.author.id,
            robloxID: 0,
            redeemedRewards: [],
            xp: 0
        }
    }
    userData.xp += config.xpSystem.earnings.messages;
    if(index !== -1) {
        xpData[index] = userData;
    } else {
        xpData.push(userData);
    }
    await fs.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
});

client.on('messageReactionAdd', async(reaction: Discord.MessageReaction, user: Discord.User) => {
    if(!config.xpSystem.enabled) return;
    if(user.bot) return;
    let xpData = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/xpdata.json`, "utf-8")) as UserEntry[];
    let index = xpData.findIndex(v => v.discordID === user.id);
    let userData: UserEntry;
    if(index !== -1) {
        userData = xpData[index];
    } else {
        userData = {
            discordID: user.id,
            robloxID: 0,
            redeemedRewards: [],
            xp: 0
        }
    }
    userData.xp += config.xpSystem.earnings.reactions;
    if(index !== -1) {
        xpData[index] = userData;
    } else {
        xpData.push(userData);
    }
    await fs.promises.writeFile(`${process.cwd()}/database/xpdata.json`, JSON.stringify(xpData));
})

let oldMethod = console.error;
console.error = function(msg: string) {
    if(!msg.toString().includes("ExperimentalWarning")) oldMethod(msg);
}