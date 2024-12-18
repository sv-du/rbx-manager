import fs from 'fs';

import BotClient from "../classes/BotClient";

export default async function checkUpdates(client: BotClient) {
    let localVersion = Number(JSON.parse(await fs.promises.readFile(`${process.cwd()}/package.json`, "utf-8")).version.replaceAll(".", ""));
    let remoteVersion = Number((await (await fetch("https://raw.githubusercontent.com/sv-du/rbx-manager/master/package.json")).json()).version.replaceAll(".", ""));
    if(remoteVersion > localVersion) {
        client.onLatestVersion = false;
    } else {
        client.onLatestVersion = true;
    }
    client.setStatusActivity();
    setTimeout(async() => {
        await checkUpdates(client);
    }, 5000);
}