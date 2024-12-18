export default interface GroupLog {
    groupID: number,
    userID: number,
    cooldownExpires: number,
    action: "Rank" | "Exile",
    amount: number
}