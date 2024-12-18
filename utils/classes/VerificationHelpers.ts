import Discord from 'discord.js';
import roblox from 'noblox.js';

import BetterConsole from './BetterConsole';

import RequestOptions from '../interfaces/RequestOptions';
import NeededRobloxPermissions from '../interfaces/NeededRobloxPermissions';
import VerificationResult from '../interfaces/VerificationResult';

import config from '../../config';

export default class VerificationHelpers {
    private static discordToRobloxCache: {discordID: string, robloxID: number, timeAdded: number}[] = [];
    private static robloxToDiscordCache: {robloxID: number, discordIDs: string[], timeAdded: number}[] = [];

    public static async preformVerificationChecks(groupID: number, robloxID: number, permissionNeeded: NeededRobloxPermissions, victimUserID?: number): Promise<VerificationResult> {
        if(!config.verificationChecks) return {success: true};
        let authorGroupRole = await roblox.getRankInGroup(groupID, robloxID);
        if(authorGroupRole === 0) return {success: false, err: "User is not in group"};
        let permissions = await this.getPermissions(groupID, robloxID);
        if(!permissions[permissionNeeded]) return {success: false, err: "User does not have required permission"};
        if(victimUserID) {
            let victimGroupRole = await roblox.getRankInGroup(groupID, victimUserID);
            if(victimGroupRole >= authorGroupRole) return {success: false, err: "User does not have permission to manage other user"};
        }
        return {success: true};
    }

    public static async getRobloxUser(guildID: string, discordID: string): Promise<number> {
        let index = this.discordToRobloxCache.findIndex(v => v.discordID === discordID);
        if(index != -1) {
            if(Date.now() - this.discordToRobloxCache[index].timeAdded >= 300_000) { // Remove cache items if older than 5 minutes
                this.discordToRobloxCache.splice(index, 1);
            } else {
                return this.discordToRobloxCache[index].robloxID;
            }
        }
        try {
            if(config.verificationProvider === "rover") {
                return this.getRobloxUserUsingRover(guildID, discordID);
            } else if(config.verificationProvider === "rowifi") {
                return this.getRobloxUserUsingRowifi(guildID, discordID);
            } else {
                return this.getRobloxUserUsingBloxlink(guildID, discordID);
            }
        } catch(e) {
            BetterConsole.log(`Error while trying to fetch a Roblox ID: ${e}`, true);
            return 0;
        }
    }

    public static async getDiscordUsers(guildID: string, robloxID: number): Promise<string[]> {
        let index = this.robloxToDiscordCache.findIndex(v => v.robloxID === robloxID);
        if(index != -1) {
            if(Date.now() - this.robloxToDiscordCache[index].timeAdded >= 300_000) { // Remove cache items if older than 5 minutes
                this.robloxToDiscordCache.splice(index, 1);
            } else {
                return this.robloxToDiscordCache[index].discordIDs;
            }
        }
        try {
            if(config.verificationProvider === "rover") {
                return this.getDiscordUsersUsingRover(guildID, robloxID);
            } else if(config.verificationProvider === "rowifi") {
                return this.getDiscordUsersUsingRowifi(guildID, robloxID);
            } else {
                return this.getDiscordUsersUsingBloxlink(guildID, robloxID);
            }
        } catch(e) {
            BetterConsole.log(`Error while trying to fetch Discord IDs: ${e}`, true);
            return [];
        }
    }

    private static async getPermissions(groupID: number, rbxID: number) {
        let rank = await roblox.getRankInGroup(groupID, rbxID);
        let role = (await roblox.getRoles(groupID)).find(r => r.rank === rank);
        let permissions = (await roblox.getRolePermissions(groupID, role.id)).permissions;
        let permissionData = {
            "JoinRequests": permissions.groupMembershipPermissions.inviteMembers,
            "Ranking": permissions.groupMembershipPermissions.changeRank,
            "Shouts": permissions.groupPostsPermissions.postToStatus,
            "Exile": permissions.groupMembershipPermissions.removeMembers,
            "Wall": permissions.groupPostsPermissions.deleteFromWall
        }
        return permissionData;
    }

    private static async request(requestOptions: RequestOptions) : Promise<Response> {
        if(requestOptions.robloxRequest) {
            requestOptions.headers = {
                "X-CSRF-TOKEN": await roblox.getGeneralToken(),
                "Cookie": `.ROBLOSECURITY=${config.ROBLOX_COOKIE}`,
                ...requestOptions.headers
            }
        }
        BetterConsole.log(requestOptions);
        return await fetch(requestOptions.url, {
            method: requestOptions.method,
            headers: requestOptions.headers,
            body: JSON.stringify(requestOptions.body)
        });
    }

    private static async getRobloxUserUsingRover(guildID: string, discordID: string): Promise<number> {
        let res = await this.request({
            url: `https://registry.rover.link/api/guilds/${guildID}/discord-to-roblox/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${config.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rbxID = (await res.json()).robloxId;
            this.discordToRobloxCache.push({discordID: discordID, robloxID: rbxID, timeAdded: Date.now()});
            return rbxID;
        } else {
            let headers = res.headers;
            if(parseInt(headers.get("X-RateLimit-Remaining")) === 0) {
                console.error("Rover API limit reached");
                setTimeout(async() => {
                    return await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("X-RateLimit-Reset-After")) * 1000);
            } else if(res.status === 429) {
                console.error("Rover API limit reached");
                setTimeout(async() => {
                    return await this.getRobloxUser(guildID, discordID);
                }, parseInt(headers.get("Retry-After")) * 1000);
            } else {
                return 0;
            }
        }
    }

    private static async getRobloxUserUsingRowifi(guildID: string, discordID: string): Promise<number> {
        let res = await this.request({
            url: `https://api.rowifi.xyz/v2/guilds/${guildID}/members/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${config.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rbxID = (await res.json()).roblox_id;
            this.discordToRobloxCache.push({discordID: discordID, robloxID: rbxID, timeAdded: Date.now()});
            return rbxID;
        }
        return 0;
    }

    private static async getRobloxUserUsingBloxlink(guildID: string, discordID: string): Promise<number> {
        let res = await this.request({
            url: `https://api.blox.link/v4/public/guilds/${guildID}/discord-to-roblox/${discordID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": config.VERIFICATION_PROVIDER_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rbxID = (await res.json()).robloxID;
            this.discordToRobloxCache.push({discordID: discordID, robloxID: rbxID, timeAdded: Date.now()});
            return rbxID;
        }
        return 0;
    }

    private static async getDiscordUsersUsingRover(guildID: string, robloxID: number) {
        let res = await this.request({
            url: `https://registry.rover.link/api/guilds/${guildID}/roblox-to-discord/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json;charset=UTF-8",
                "Authorization": `Bearer ${config.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rawUsers = (await res.json()).discordUsers as Discord.GuildMember[];
            let users = [];
            for(let i = 0; i < rawUsers.length; i++) {
                users.push(rawUsers[i].user.id);
            }
            this.robloxToDiscordCache.push({robloxID: robloxID, discordIDs: users, timeAdded: Date.now()});
            return users;
        } else {
            let headers = res.headers;
            if(parseInt(headers.get("X-RateLimit-Remaining")) === 0) {
                console.error("Rover API limit reached");
                setTimeout(async() => {
                    return await this.getDiscordUsers(guildID, robloxID);
                }, parseInt(headers.get("X-RateLimit-Reset-After")) * 1000);
            } else if(res.status === 429) {
                console.error("Rover API limit reached");
                setTimeout(async() => {
                    return await this.getDiscordUsers(guildID, robloxID);
                }, parseInt(headers.get("Retry-After")) * 1000);
            } else {
                return [];
            }
        }
    }

    private static async getDiscordUsersUsingRowifi(guildID: string, robloxID: number) {
        let res = await this.request({
            url: `https://api.rowifi.xyz/v2/guilds/${guildID}/members/roblox/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bot ${config.VERIFICATION_PROVIDER_API_KEY}`
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let rawUsers = await res.json() as {discord_id: string}[];
            let users = [];
            for(let i = 0; i < rawUsers.length; i++) {
                users.push(rawUsers[i].discord_id);
            }
            this.robloxToDiscordCache.push({robloxID: robloxID, discordIDs: users, timeAdded: Date.now()});
            return users;
        }
        return [];
    }

    private static async getDiscordUsersUsingBloxlink(guildID: string, robloxID: number) {
        let res = await this.request({
            url: `https://api.blox.link/v4/public/guilds/${guildID}/roblox-to-discord/${robloxID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": config.VERIFICATION_PROVIDER_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        if(res.status === 200) {
            let users = (await res.json()).discordIDs;
            this.robloxToDiscordCache.push({robloxID: robloxID, discordIDs: users, timeAdded: Date.now()});
            return users;
        }
        return [];
    }
}