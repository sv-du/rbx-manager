import config from "../../config";

export default class BetterConsole {
    public static log(message: any, force?: boolean) {
        if(force) {
            console.log(message);
        } else {
            if(config.debug) {
                console.log(message);
            }
        }
    }
}