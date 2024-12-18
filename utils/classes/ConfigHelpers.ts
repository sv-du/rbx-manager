import fs from 'fs';

import config from "../../config";

import { envValues } from "../../config";

import BotClient from "./BotClient";

const isPrimitive = obj => obj === null || ['string', 'number', 'boolean'].includes(typeof obj);
const isArrayOfPrimitive = obj => Array.isArray(obj) && obj.every(isPrimitive);
const format = arr => `^^^[${arr.map(val => JSON.stringify(val)).join(', ')}]`;
const replacer = (key, value) => isArrayOfPrimitive(value) ? format(value) : value;
const expand = str => str.replace(/(?:"\^\^\^)(\[.*\])(?:\")/g, ( match, a ) => a.replace(/\\"/g, '"'));

export default class ConfigHelpers {
    public static parseArray(array: any[]): string {
        let parsed = "[";
        for(let i = 0; i < array.length; i++) {
            let element = array[i];
            let st: string;
            if(typeof(element) === "string") {
                st = `"${element}"`;
            } else {
                st = `${element}`;
            }
            if(i !== array.length - 1) {
                st += ", ";
            }
            parsed += st;
        }
        parsed += "]";
        return parsed;
    }
    public static getObjectStrings(object: Object, keyString?: string): string[] {
        let strings = [];
        let keys = Object.keys(object);
        for(let i = 0; i < keys.length; i++) {
            let key = keys[i];
            let value = object[key];
            let string = keyString ? `${keyString}.${key}` : `${key}`;
            if(typeof(value) === "object" && !Array.isArray(value)) {
                let valueStrings = this.getObjectStrings(value, `${string}`);
                strings = strings.concat(valueStrings);
            } else {
                strings.push(string);
            }
        }
        return strings;
    }
    public static getPropertyFromString(item: Object, propertyString: string): any {
        let stringArray = propertyString.split(".");
        let value = item;
        for(let i = 0; i < stringArray.length; i++) {
            try {
                value = value[stringArray[i]];
            } catch {
                return null;
            }
        }
        return value;
    }
    public static setPropertyFromString(item: Object, propertyString: string, newValue: any): void {
        let stringArray = propertyString.split(".");
        let value = item;
        for(let i = 0; i < stringArray.length; i++) {
            try {
                value = value[stringArray[i]];
            } catch {
                return null;
            }
        }
        value = newValue;
    }
    public static replaceENVValues(configString: string): string {
        for(let i = 0; i < envValues.length; i++) {
            let oldValue = `"${process.env[envValues[i]]}"`;
            let newValue = `process.env.${envValues[i]}`;
            configString = configString.replace(oldValue, newValue);
        }
        return configString;
    }
    public static async writeToConfigFile(client: BotClient): Promise<void> {
        let configContent = await fs.promises.readFile(`${process.cwd()}/config.ts`, "utf-8");
        configContent = configContent.slice(0, configContent.indexOf("const config: BotConfig"));
        let temp = config.lockedCommands;
        config.lockedCommands = client.originalLockedCommands; // Reset locked commands as we are saving them to the file config
        let jsonContent = expand(JSON.stringify(config, replacer, 4));
        jsonContent = this.replaceENVValues(jsonContent); // Removes raw ENV values from JSON string
        jsonContent = jsonContent.replace(/"([^"]+)":/g, '$1:'); // Removes quotes from properties
        configContent += `const config: BotConfig = ${jsonContent}\n\nexport default config;`;
        await fs.promises.writeFile(`${process.cwd()}/config.ts`, configContent);
        config.lockedCommands = temp; // Restore locked commands
    }
}