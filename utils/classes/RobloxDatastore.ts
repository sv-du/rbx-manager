import roblox = require('noblox.js');

import BanService from './BanService';

import ModerationData from '../interfaces/ModerationData';

import config from '../../config';

interface GetModerationDataResponse {
    data: ModerationData,
    err?: string
}

export default class RobloxDatastore {
    public static async getModerationData(universeID: number, userID: number): Promise<GetModerationDataResponse> {
        let userData: ModerationData;
        try {
            userData = (await roblox.getDatastoreEntry(universeID, config.datastoreName, `${userID}-moderationData`)).data;
        } catch(e) {
            let err = e.toString() as string;
            if(!err.includes("NOT_FOUND")) return {data: undefined, err: err};
            userData = {
                banData: {
                    isBanned: false,
                    reason: ""
                },
                muteData: {
                    isMuted: false,
                    reason: ""
                },
                warns: []
            }
        }
        let newBanData = await BanService.getBanData(universeID, userID);
        if(newBanData.isBanned) { // This would mean they are on v4.0.0+ which changes ban systems, making old data not needed
            if(userData.banData.isBanned) { // Migrate to new system and clear old data
                if(userData.banData.releaseTime) {
                    await BanService.ban(universeID, userID, userData.banData.reason, (userData.banData.releaseTime - Date.now()) / 1000);
                } else {
                    await BanService.ban(universeID, userID, userData.banData.reason)
                }
                this.setModerationData(universeID, userID, {
                    banData: {
                        isBanned: false,
                        reason: ""
                    },
                    muteData: userData.muteData,
                    warns: userData.warns
                });
            }
            userData.banData = newBanData;
        }
        return {data: userData};
    }
    public static async setModerationData(universeID: number, userID: number, moderationData: ModerationData) {
        await roblox.setDatastoreEntry(universeID, config.datastoreName, `${userID}-moderationData`, moderationData);
    }
}