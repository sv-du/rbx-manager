import Discord from 'discord.js';
import roblox = require('noblox.js');

import fs from "fs";

import config from '../../../config';

import BotClient from '../../../utils/classes/BotClient';
import CommandHelpers from '../../../utils/classes/CommandHelpers';
import GroupHandler from '../../../utils/classes/GroupHandler';
import VerificationHelpers from '../../../utils/classes/VerificationHelpers';

import CommandFile from '../../../utils/interfaces/CommandFile';
import CommandLog from '../../../utils/interfaces/CommandLog';
import SuspensionEntry from '../../../utils/interfaces/SuspensionEntry';

const command: CommandFile = {
    run: async(interaction: Discord.CommandInteraction<Discord.CacheType>, client: BotClient, args: any): Promise<any> => {
        let groupID = GroupHandler.getIDFromName(args["group"]);
        let authorRobloxID = await VerificationHelpers.getRobloxUser(interaction.guild.id, interaction.user.id);
        let logs: CommandLog[] = [];
        let usernames = args["username"].replaceAll(" ", "").split(",");
        let reasonData = CommandHelpers.parseReasons(usernames, args["reason"]);
        if(reasonData.didError) {
            let embed = client.embedMaker({title: "Argument Error", description: `You inputted an unequal amount of usernames and reasons, please make sure that these amounts are equal, or, if you wish to apply one reason to multiple people, only put that reason for the reason argument`, type: "error", author: interaction.user})
            return await interaction.editReply({embeds: [embed]});
        }
        let reasons = reasonData.parsedReasons;
        for(let i = 0; i < usernames.length; i++) {
            let username = usernames[i];
            let reason = reasons[i];
            let victimRobloxID = await roblox.getIdFromUsername(username) as number;
            if(!victimRobloxID) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The username provided is an invalid Roblox username"
                });
                continue;
            }
            username = await roblox.getUsernameFromId(victimRobloxID);
            if(config.verificationChecks) {
                let verificationStatus = await VerificationHelpers.preformVerificationChecks(groupID, authorRobloxID, "Ranking", victimRobloxID);
                if(!verificationStatus.success) {
                    logs.push({
                        username: username,
                        status: "Error",
                        message: `Verification checks have failed, reason: ${verificationStatus.err}`
                    });
                    continue;
                }
            }
            let suspensions = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionEntry[];
            let index = suspensions.findIndex(v => v.userId === victimRobloxID);
            if(index != -1) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "This user is currently suspended"
                });
                continue;
            }
            let rankID = await roblox.getRankInGroup(groupID, victimRobloxID);
            if(rankID === 0) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The user provided is not in the group"
                });
                continue;
            }
            let roles = await roblox.getRoles(groupID);
            let currentRoleIndex = roles.findIndex(role => role.rank === rankID);
            let currentRole = roles[currentRoleIndex];
            let potentialRole = roles[currentRoleIndex + 1];
            let botRank = await roblox.getRankInGroup(groupID, client.robloxInfo.id);
            if(potentialRole.rank >= botRank) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: "The next rank of the user provided is equal to or higher than the bot account's rank"
                });
                continue;
            }
            let oldRoleName = currentRole.name;
            let lockedRank = false;
            if(client.isLockedRole(potentialRole)) {
                lockedRank = true;
                let shouldBreakAfterForLoop = false;
                for(let i = currentRoleIndex + 1; i < roles.length; i++) {
                    potentialRole = roles[i];
                    if(potentialRole.rank === botRank) {
                        logs.push({
                            username: username,
                            status: "Error",
                            message: "All the roles above the provided user are locked"
                        });
                        shouldBreakAfterForLoop = true;
                    }
                    if(!client.isLockedRole(potentialRole)) break;
                }
                if(shouldBreakAfterForLoop) continue; // If I call continue in the nested for loop (the one right above this line), it won't cause the main username for loop to skip over the rest of the code
            }
            if(lockedRank) {
                let shouldContinue = false;
                let embed = client.embedMaker({title: "Role Locked", description: `The role(s) above **${username}** is locked, would you like to promote **${username}** to **${potentialRole.name}**?`, type: "info", author: interaction.user});
                let componentData = client.createButtons([
                    {customID: "yesButton", label: "Yes", style: Discord.ButtonStyle.Success},
                    {customID: "noButton", label: "No", style: Discord.ButtonStyle.Danger}
                ]);
                let msg = await interaction.editReply({embeds: [embed], components: componentData.components}) as Discord.Message;
                let filter = (buttonInteraction: Discord.Interaction) => buttonInteraction.isButton() && buttonInteraction.user.id === interaction.user.id;
                let button = (await msg.awaitMessageComponent({filter: filter, time: config.collectorTime}));
                if(button) {
                    if(button.customId === "yesButton") {
                        shouldContinue = true;
                        await button.reply({content: "ㅤ"});
                        await button.deleteReply();
                    }
                } else {
                    let disabledComponents = client.disableButtons(componentData).components;
                    await msg.edit({components: disabledComponents});
                }
                if(!shouldContinue) {
                    logs.push({
                        username: username,
                        status: "Cancelled",
                    });
                    continue;
                }
            }
            try {
                await roblox.setRank(groupID, victimRobloxID, potentialRole.rank);
            } catch(e) {
                logs.push({
                    username: username,
                    status: "Error",
                    message: e
                });
                continue;
            }
            logs.push({
                username: username,
                status: "Success"
            });
            await client.logAction(`<@${interaction.user.id}> has promoted **${username}** from **${oldRoleName}** to **${potentialRole.name}** for the reason of **${reason}** in **${GroupHandler.getNameFromID(groupID)}**`);
        }
        await client.initiateLogEmbedSystem(interaction, logs);
    },
    slashData: new Discord.SlashCommandBuilder()
    .setName(require("path").basename(__filename).split(".")[0])
    .setDescription("Promotes the inputted user(s)")
    .addStringOption(o => o.setName("group").setDescription("The group to do the promoting in").setRequired(true).addChoices(...GroupHandler.parseGroups() as any))
    .addStringOption(o => o.setName("username").setDescription("The username(s) of the user(s) you wish to promote").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("The reason(s) of the promote(s)").setRequired(false)) as Discord.SlashCommandBuilder,
    commandData: {
        category: "Ranking",
        isEphemeral: false,
        permissions: config.permissions.group.ranking,
        hasCooldown: true,
        preformGeneralVerificationChecks: true,
        permissionToCheck: "Ranking"
    }
}

export default command;