import Discord from 'discord.js';

import CommandCategory from './CommandCategory';
import NeededRobloxPermissions from './NeededRobloxPermissions';

export default interface CommandData {
    category: CommandCategory,
    isEphemeral: boolean
    permissions?: Discord.PermissionResolvable[] | string[],
    useDiscordPermissionSystem?: boolean
    hasCooldown: boolean
    preformGeneralVerificationChecks: boolean,
    permissionToCheck?: NeededRobloxPermissions
}