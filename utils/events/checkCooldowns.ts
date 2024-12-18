import BotClient from "../classes/BotClient";

export default function checkCooldowns(client: BotClient) {
    for(let i = client.commandCooldowns.length - 1; i >= 0; i--) {
        if(Date.now() < client.commandCooldowns[i].cooldownExpires) continue;
        client.commandCooldowns.splice(i, 1);
    }
    setTimeout(() => {
        checkCooldowns(client);
    }, 5);
}