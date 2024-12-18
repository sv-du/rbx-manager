import roblox = require('noblox.js');

import fs from 'fs';

import BotClient from '../classes/BotClient';
import GroupBanEntry from '../interfaces/GroupBanEntry';

async function isUserInGroup(userID: number, groupID: number): Promise<boolean> {
    let res = await fetch(`https://groups.roblox.com/v2/users/${userID}/groups/roles`);
    let userData = (await res.json()).data;
    let index = userData.findIndex(data => data.group.id === groupID);
    if(index === -1) return false;
    return true;
}

export default async function checkBans(client: BotClient) {
    if(!client.isLoggedIn) return;
    try {
        let bannedUsers = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8")) as GroupBanEntry[];
        for(let i = 0; i < bannedUsers.length; i++) {
            let groupID = bannedUsers[i].groupID;
            let userID = bannedUsers[i].userID;
            if(await isUserInGroup(userID, groupID)) {
                await roblox.exile(groupID, userID);
            }
        }
    } catch(e) {
        console.error(e);
    }
    setTimeout(async() => {
        await checkBans(client);
    }, 10000);
}