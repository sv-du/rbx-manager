export default interface RewardEntry {
    rewardID: string,
    type: "RobloxRank" | "DiscordRole" | "Custom"
    metadata: {
        groupId?: number, // For RobloxRank type
        rankName?: string, // For RobloxRank type
        discordRoleId?: string, // For DiscordRole type
        rewardString?: string, // For Custom type
        willAutomaticallyGiveReward?: boolean, // For Custom type
    },
    xpNeeded: number
}