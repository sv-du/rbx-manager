import Discord from 'discord.js';
import roblox = require('noblox.js');

import BotClient from '../classes/BotClient';

import config from '../../config';

const oldMemberCounts: {id: number, count: number}[] = [];

export default async function checkMemberCount(groupID: number, client: BotClient) {
    if(!config.counting.enabled) return;
    try {
        let groupInfo = await roblox.getGroup(groupID);
        let index = oldMemberCounts.findIndex(v => v.id === groupID);
        if(index === -1) {
            oldMemberCounts.push({id: groupID, count: groupInfo.memberCount});
            throw("Skip check");
        }
        if(groupInfo.memberCount === oldMemberCounts[index].count) throw("Skip check");
        let isAddition = groupInfo.memberCount > oldMemberCounts[index].count;
        let isAtGoal = groupInfo.memberCount >= config.counting.goal;
        let embedTitle: string;
        if(!isAtGoal) {
            embedTitle = (isAddition ? "Gained Members" : "Lost Members");
        } else {
            embedTitle = "Goal Reached";
        }
        let embedDescription = "";
        embedDescription += `We have ${(isAddition ? "gained" : "lost")} **${Math.abs(groupInfo.memberCount - oldMemberCounts[index].count)}** members\n`;
        embedDescription += `**Old MemberCount**: ${oldMemberCounts[index].count}\n`;
        embedDescription += `**New MemberCount**: ${groupInfo.memberCount}`;
        embedDescription += `**Goal Reached?**: ${isAtGoal ? "Yes" : "No"}`;
        let embed = client.embedMaker({title: embedTitle, description: embedDescription, type: "info", author: client.user});
        let channel = await client.channels.fetch(config.counting.loggingChannel) as Discord.TextChannel;
        if(channel) {
            await channel.send({embeds: [embed]});
        }
        oldMemberCounts[index].count = groupInfo.memberCount;
    } catch(e) {
        if(e !== "Skip check") {
            console.error(`There was an error while trying to check for member counts: ${e}`);
        }
    }
    setTimeout(async() => {
        await checkMemberCount(groupID, client);
    }, 15000);
}