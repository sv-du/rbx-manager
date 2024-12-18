import Discord from 'discord.js';

import BotClient from '../classes/BotClient';
import GroupHandler from '../classes/GroupHandler';

import SalesLog from '../interfaces/SaleLog';

import config from '../../config';

const oldDates: {id: number, date: Date}[] = [];

async function getSales(groupID: number): Promise<SalesLog[]> {
    let res = await fetch(`https://economy.roblox.com/v2/groups/${groupID}/transactions?cursor=&limit=100&transactionType=Sale`, {
        headers: {
            "Cookie": `.ROBLOSECURITY=${config.ROBLOX_COOKIE}`
        }
    });
    let json = await res.json();
    if(json.data) {
        let sales = json.data as SalesLog[];
        for(let i = 0; i < sales.length; i++) {
            sales[i].created = new Date(sales[i].created);
        }
        return sales;
    }
}

export default async function checkSales(groupID: number, client: BotClient) {
    if(!client.isLoggedIn) return;
    if(config.logging.sales.enabled === false) return;
    try {
        let sales = await getSales(groupID);
        if(!sales) throw("Skip check");
        if(!oldDates.find(v => v.id === groupID)) oldDates.push({id: groupID, date: sales[0].created});
        let dateIndex = oldDates.findIndex(v => v.id === groupID);
        let saleIndex = sales.findIndex(log => log.created.toISOString() === oldDates[dateIndex].date.toISOString());
        if(saleIndex === 0 || saleIndex === -1) throw("Skip check");
        for(let i = saleIndex - 1; i >= 0; i--) {
            let log = sales[i];
            let channel = await client.channels.fetch(config.logging.sales.loggingChannel) as Discord.TextChannel;
            if(channel) {
                let embed = client.embedMaker({title: "New Sale", description: `**${log.agent.name}** has bought **${log.details.name}** for **${log.currency.amount}** robux after tax from **${GroupHandler.getNameFromID(groupID)}**`, type: "info", author: client.user});
                await channel.send({embeds: [embed]});
            }
        }
        oldDates[dateIndex].date = sales[0].created;
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check the sale logs: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkSales(groupID, client);
    }, 5000);
}