import BotClient from "./BotClient";

import RobloxRequestType from '../interfaces/RobloxRequestType';

import config from "../../config";

export default class MessagingService extends BotClient {
    public static async sendMessage(universeID: number, type: RobloxRequestType, payload: any) {
        await this.request({
            url: `https://apis.roblox.com/messaging-service/v1/universes/${universeID}/topics/DiscordModerationSystemCall`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": config.ROBLOX_API_KEY
            },
            body: {
                message: JSON.stringify({type: type, payload: payload})
            },
            robloxRequest: false
        });
    }
}