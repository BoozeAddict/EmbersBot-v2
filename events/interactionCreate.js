import { Events } from 'discord.js';
import handleCommands from '#handlers/commands';
import handleSelectMenus from '#handlers/selectMenus';

export default {
    name: Events.InteractionCreate,

    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            return handleCommands(interaction);
        }

        if (interaction.isStringSelectMenu()) {
            return handleSelectMenus(interaction);
        }
    },
};