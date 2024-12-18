import Discord from 'discord.js';

import AntiAbuseAction from './AntiAbuseAction';
import LoggingConfig from './LoggingConfig';
import RewardEntry from './RewardEntry';
import VerificationProvider from './VerificationProvider';
import GroupBlacklistEntry from './GroupBlacklistEntry';

export default interface BotConfig {
    DISCORD_TOKEN: string,
    ROBLOX_COOKIE: string,
    ROBLOX_API_KEY: string,
    VERIFICATION_PROVIDER_API_KEY: string,
    groupIds: number[],
    permissions: {
        all: string[],
        group: {
            shout: string[],
            ranking: string[],
            joinrequests: string[],
            user: string[],
            xp: string[],
            wall: string[],
            blacklist: string[]
        },
        game: {
            general: string[]
            broadcast: string[],
            kick: string[],
            ban: string[],
            shutdown: string[],
            datastore: string[],
            execution: string[],
            jobIDs: string[],
            lock: string[],
            mute: string[]
        }
    },
    antiAbuse: {
        enabled: boolean,
        thresholds: {
            ranks: number,
            exiles: number
        },
        actions: {
            ranks: AntiAbuseAction,
            exiles: AntiAbuseAction
        }
    },
    xpSystem: {
        enabled: boolean,
        rewards: RewardEntry[],
        earnings: {
            messages: number,
            reactions: number
        }
    },
    counting: {
        enabled: boolean,
        goal: number,
        loggingChannel: string
    },
    logging: {
        audit: LoggingConfig,
        shout: LoggingConfig,
        command: LoggingConfig,
        antiAbuse: LoggingConfig,
        sales: LoggingConfig,
        xp: LoggingConfig,
    },
    embedColors: {
        info: Discord.ColorResolvable,
        success: Discord.ColorResolvable,
        error: Discord.ColorResolvable
    },
    ban: {
        banDiscordAccounts: boolean,
        useSamePrivateReasonForDisplay: boolean,
        displayReason: string,
        excludeAlts: boolean
    },
    groupBlacklists: GroupBlacklistEntry[]
    defaultCooldown: number,
    cooldownOverrides: {[key: string]: number},
    suspensionRank: number,
    universes: number[],
    datastoreName: string,
    verificationChecks: boolean,
    collectorTime: number,
    maximumNumberOfUsers: number,
    lockedRanks: (string | number)[],
    lockedCommands: string[],
    verificationProvider: VerificationProvider
    debug?: boolean,
}