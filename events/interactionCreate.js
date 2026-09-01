const { Events } = require('discord.js');
const handleCommands = require('#handlers/commands');
const handleSelectMenus = require('#handlers/selectMenus');

module.exports = {
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