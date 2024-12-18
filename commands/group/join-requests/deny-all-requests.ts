import Discord from 'discord.js';
import roblox = require('noblox.js');

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import GroupHandler from '../../../utils/classes/GroupHandler';

import CommandFile from '../../../utils/interfaces/CommandFile';

async function batchDeny(groupID: number, userIDS: number[]): Promise<void> {
    let res = await BotClient.request({
        url: `https://groups.roblox.com/v1/groups/${groupID}/join-requests`,
        method: "DELETE",
        headers: {},
        body: {
            "UserIds": userIDS
        },
        robloxRequest: true
    });
    let body = await res.json();
    if(body.errors) {
        throw new Error(body.errors[0].message);
    }
}

function parseUsers(users: roblox.GroupJoinRequest[]): number[] {
    let userIDs = [];
    for(let i = 0; i < users.length; i++) {
        userIDs.push(users[i].requester.userId);
    }
    return userIDs;
}

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let reason = args["reason"];
        let joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100);
        if(joinRequests.data.length === 0) {
            let embed = client.embedMaker({title: "No Join Requests", description: "There are currently no pending join requests", type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        let embed = client.embedMaker({title: "Processing Join Requests", description: "Currently processing join requests, please be patient. You will be pinged once the process is done", type: "info", author: interaction.user});
        await interaction.editReply({embeds: [embed]});
        let nextCursor = joinRequests.nextPageCursor;
        await client.logAction(`<@${interaction.user.id}> has started to deny all of the join requests in the group for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
        try {
            await batchDeny(groupID, parseUsers(joinRequests.data));
        } catch(e) {
            let embed = client.embedMaker({title: "Error", description: `There was an error while trying to deny the join requests: ${e}`, type: "error", author: interaction.user});
            return await interaction.editReply({embeds: [embed]});
        }
        while(nextCursor) {
            joinRequests = await roblox.getJoinRequests(groupID, "Desc", 100, nextCursor);
            nextCursor = joinRequests.nextPageCursor;
            try {
                await batchDeny(groupID, parseUsers(joinRequests.data));
            } catch(e) {
                let embed = client.embedMaker({title: "Error", description: `There was an error while trying to deny the join requests: ${e}`, type: "error", author: interaction.user});
                return await interaction.editReply({embeds: [embed]});
            }
        }
        embed = client.embedMaker({title: "Success", description: "You've successfully denied all the join requests in the group", type: "success", author: interaction.user});
        await interaction.editReply({content: `<@${interaction.user.id}>`, embeds: [embed]});
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Denies all the pending join requests")
    .addStringOption(o => o.setName("group").setDescription("The group to deny all the join requests of").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("reason").setDescription("The reason for why you are denying all these requests").setRequired(true)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Join Request",
        isEphemeral: false,
        permissions: config.permissions.group.joinrequests,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "JoinRequests"
    }
}

export default command;