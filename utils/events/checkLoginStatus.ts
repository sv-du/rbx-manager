import roblox = require('noblox.js');

import BotClient from '../classes/BotClient';

export default async function checkLoginStatus(client: BotClient) {
    try {
        await roblox.getAuthenticatedUser()
        client.isLoggedIn = true;
        client.setStatusActivity();
    } catch(e) {
        client.isLoggedIn = false;
        client.setStatusActivity();
    }
    setTimeout(async() => {
        await checkLoginStatus(client);
    }, 10000);
}