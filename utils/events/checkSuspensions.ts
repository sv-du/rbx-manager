import roblox = require('noblox.js');

import fs from "fs";

import BotClient from '../classes/BotClient';

import SuspensionEntry from '../interfaces/SuspensionEntry';

export default async function checkSuspensions(client: BotClient) {
    if(!client.isLoggedIn) return;
    let suspensions = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
    for(let i = suspensions.length - 1; i >= 0; i--) {
        if(Date.now() < suspensions[i].timeToRelease) continue;
        let groupID = suspensions[i].groupID;
        try {
            await roblox.setRank(groupID, suspensions[i].userId, suspensions[i].oldRoleID);
        } catch(e) {
            console.error(`There was an error while trying to rerank ${await roblox.getUsernameFromId(suspensions[i].userId)}: ${e}`);
        }
        suspensions.splice(i, 1)
    }
    await fs.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(suspensions));
    setTimeout(async() => {
        await checkSuspensions(client);
    }, 10000);
}