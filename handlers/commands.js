module.exports = async function handleCommands(interaction) {
    const command = interaction.client.commands.get(
        interaction.commandName
    );

    if (!command) {
        console.error(
            `No command matching ${interaction.commandName} was found.`
        );
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
    }
};