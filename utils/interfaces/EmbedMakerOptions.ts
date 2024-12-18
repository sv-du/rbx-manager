import Discord from 'discord.js';

export default interface EmbedMakerOptions {
    title: string,
    description: string,
    type: "info" | "success" | "error",
    author: Discord.User
}