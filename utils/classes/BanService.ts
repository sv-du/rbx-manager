import ms from "ms";

import BotClient from "./BotClient";

import config from "../../config";

interface BanResponse {
    success: boolean,
    err?: string
}

interface BanData { // Derived from the ModerationData interface
    isBanned: boolean,
    reason: string,
    releaseTime?: number
}

export default class BanService extends BotClient {
    public static async ban(universeID: number, userID: number, reason: string, durationInSeconds?: string | number): Promise<BanResponse> {
        if(durationInSeconds) durationInSeconds = `${durationInSeconds}s`;
        let res = await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ROBLOX_API_KEY
            },
            body: {
                gameJoinRestriction: {
                    active: true,
                    duration: durationInSeconds, // When it does JSON.stringify(), if durationInSeconds is undefined, the duration field is removed, making the ban indefinite
                    privateReason: reason,
                    displayReason: (config.ban.useSamePrivateReasonForDisplay ? reason : config.ban.displayReason),
                    excludeAltAccounts: config.ban.excludeAlts
                }
            },
            robloxRequest: false
        });
        let body = await res.json();
        if(body.message) return {success: false, err: body.message};
        return {success: true};
    }

    public static async unban(universeID: number, userID: number): Promise<void> {
        await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ROBLOX_API_KEY
            },
            body: {
                gameJoinRestriction: {
                    active: false
                }
            },
            robloxRequest: false
        });
    }

    public static async getBanData(universeID: number, userID: number): Promise<BanData> {
        let res = await this.request({
            url: `https://apis.roblox.com/cloud/v2/universes/${universeID}/user-restrictions/${userID}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ROBLOX_API_KEY
            },
            body: undefined,
            robloxRequest: false
        });
        let restirctionData = (await res.json()).gameJoinRestriction;
        let data: BanData = {isBanned: restirctionData.active, reason: restirctionData.privateReason};
        if(restirctionData.duration) {
            data.releaseTime = Date.parse(restirctionData.startTime) + ms(restirctionData.duration as string);
        }
        return data;
    }
}