// Use this file to convert from the pre-2.5 database structure to the 2.5+ database structure

// Old formats

interface GroupBanFile {
    userIDs: number[]
}

interface SuspensionFile {
    users: {
        userId: number,
        reason: string,
        oldRoleID: number,
        timeToRelease: number
    }[]
}

// New formats

interface GroupBanEntry {
    groupID: number,
    userID: number
}

interface SuspensionEntry {
    groupID: number,
    userId: number,
    reason: string,
    oldRoleID: number,
    timeToRelease: number
}

import fs from 'fs'

import config from '../config'

fs.promises.readFile(`${process.cwd()}/database/groupbans.json`, "utf-8").then(async(fileContent) => {
    let banFileContent = JSON.parse(fileContent) as GroupBanFile;
    let suspensionFileContent = JSON.parse(await fs.promises.readFile(`${process.cwd()}/database/suspensions.json`, "utf-8")) as SuspensionFile;
    if(Array.isArray(banFileContent) || Array.isArray(suspensionFileContent)) return; // Means that you already did the conversion
    let newBans: GroupBanEntry[] = [];
    for(let i = 0; i < banFileContent.userIDs.length; i++) {
        newBans.push({groupID: (config as any).groupId, userID: banFileContent.userIDs[i]});
    }
    let newSuspensions: SuspensionEntry[] = [];
    for(let i = 0; i < suspensionFileContent.users.length; i++) {
        newSuspensions.push({
            groupID: (config as any).groupId,
            userId: suspensionFileContent.users[i].userId,
            reason: suspensionFileContent.users[i].reason,
            oldRoleID: suspensionFileContent.users[i].oldRoleID,
            timeToRelease: suspensionFileContent.users[i].timeToRelease
        });
    }
    await fs.promises.writeFile(`${process.cwd()}/database/groupbans.json`, JSON.stringify(newBans));
    await fs.promises.writeFile(`${process.cwd()}/database/suspensions.json`, JSON.stringify(newSuspensions));
});