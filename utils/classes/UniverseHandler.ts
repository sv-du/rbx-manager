import Discord from 'discord.js';

import config from '../../config';

export default class UniverseHandler {
    private static universeData: {id: number, name: string}[] = [];
    public static async loadUniverses() {
        let universeString = "";
        config.universes.map((e) => {universeString += `${e},`});
        universeString.substring(0, universeString.length - 1);
        let res = await fetch(`https://games.roblox.com/v1/games?universeIds=${universeString}`);
        let body = (await res.json()).data;
        for(let i = 0; i < body.length; i++) {
            this.universeData.push({id: body[i].id, name: body[i].name});
        }
    }
    public static parseUniverses(): Discord.APIApplicationCommandOptionChoice[] {
        let parsed: Discord.APIApplicationCommandOptionChoice[] = [];
        for(let i = 0; i < this.universeData.length; i++) {
            parsed.push({name: this.universeData[i].name, value: this.universeData[i].name});
        }
        return parsed;
    }
    public static getNameFromID(universeID: number): string {
        return this.universeData.find(v => v.id === universeID).name;
    }
    public static getIDFromName(universeName: string): number {
        return this.universeData.find(v => v.name === universeName).id;
    }
}