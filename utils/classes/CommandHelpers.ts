import Discord from 'discord.js';
import ms from 'ms';

import config from '../../config';
import { commands } from '../..';

import CommandCategory from '../interfaces/CommandCategory';
import CommandFile from '../interfaces/CommandFile';

export default class CommandHelpers {
    public static allowedCommands = ["checkuser"];
    public static loadArguments(interaction: Discord.CommandInteraction): any {
        let options = interaction.options.data;
        let args = {};
        if(options.length === 0) return args;
        for(let i = 0; i < options.length; i++) {
            if(options[i].options) {
                for(let x = 0; x < options[i].options.length; x++) {
                    args[options[i].options[x].name] = options[i].options[x].value;
                }
            } else {
                args[options[i].name] = options[i].value;
            }
        }
        if(options[0].options) {
            args["subcommand"] = options[0].name; // Expose the subcommand used if available because the documented way doesn't fucking exist
        }
        return args;
    }
    public static checkPermissions(command: CommandFile, user: Discord.GuildMember): boolean {
        if(command.commandData.useDiscordPermissionSystem) {
            let permissionsRequired = command.commandData.permissions as Discord.PermissionResolvable[];
            for(let i = 0; i < permissionsRequired.length; i++) {
                if(user.permissions.has(permissionsRequired[i])) return true;
            }
            return false;
        } else {
            let roleIDsRequired = command.commandData.permissions as string[];
            if(!roleIDsRequired) return true;
            roleIDsRequired = roleIDsRequired.concat(config.permissions.all);
            if(user.roles.cache.some(role => roleIDsRequired.includes(role.id))) return true;
            return false;
        }
    }
    public static parseReasons(usernames: string[], rawReasons: any): {parsedReasons: string[], didError: boolean} {
        if(!rawReasons) {
            let reasons = [];
            while(true) {
                if(reasons.length === usernames.length) break;
                reasons.push("No reason provided");
            }
            return {parsedReasons: reasons, didError: false};
        } else {
            let reasons = rawReasons.split(",");
            if(reasons.length === 1) {
                while(true) {
                    if(reasons.length === usernames.length) break;
                    reasons.push(reasons[0]);
                }
                return {parsedReasons: reasons, didError: false};
            } else if(reasons.length !== usernames.length) {
                return {parsedReasons: [], didError: true};
            }
        }
    }
    public static parseTimes(usernames: string[], rawTimes: any): {parsedTimes: number[], didError: boolean} {
        let times = rawTimes.replaceAll(" ", "").split(",");
        if(times.length === 1) {
            if(!ms(times[0])) {
                return {parsedTimes: [], didError: true};
            }
            times[0] = ms(times[0]);
            while(true) {
                if(times.length === usernames.length) break;
                times.push(times[0]);
            }
            return {parsedTimes: times, didError: false};
        } else if(times.length === usernames.length) {
            let newTimes = [];
            for(let i = 0; i < times.length; i++) {
                let newTime = ms(times[i]);
                if(!newTime) return {parsedTimes: [], didError: true};
                newTimes.push(newTime);
            }
            return {parsedTimes: newTimes, didError: false};
        } else {
            return {parsedTimes: [], didError: true};
        }
    }
    public static getGroupCommands(): string[] {
        let categories: CommandCategory[] = ["General Group", "Join Request", "Ranking", "Shout", "User", "XP"];
        let cmds = [];
        for(let i = 0; i < commands.length; i++) {
            if(categories.includes(commands[i].commandData.category)) {
                cmds.push(commands[i].name);
            }
        }
        return cmds;
    }
    public static getGameCommands(): string[] {
        let categories: CommandCategory[] = ["Ban", "Database", "General Game", "JobID", "Lock", "Mute"];
        let cmds = [];
        for(let i = 0; i < commands.length; i++) {
            if(categories.includes(commands[i].commandData.category)) {
                cmds.push(commands[i].name);
            }
        }
        return cmds;
    }
    public static getXPCommands(): string[] {
        let cmds = [];
        for(let i = 0; i < commands.length; i++) {
            if(commands[i].commandData.category === "XP") {
                cmds.push(commands[i].name);
            }
        }
        return cmds;
    }
}