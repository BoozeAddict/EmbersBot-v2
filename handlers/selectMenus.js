import signupsList from '#classes/SignupsList';

export default async function handleSelectMenus(interaction) {
    if (interaction.customId.startsWith('signup')) {
        handleSignupMessage(interaction);
    }
};


async function handleSignupMessage(interaction)
{
    //const signupsList = new SignupsList();
    //console.log(`signupsList: ${signupsList}`);

    const signupVars = interaction.customId.split('-');
    const eventType = signupVars[1];
    console.log(`eventType: ${eventType}`);
    const day = signupVars[2];
    console.log(`day: ${day}`);
    
    const signup = signupsList.getSignupByTypeDay(eventType, day);
    if (!signup) {
        console.error(`No signup found for eventType: ${eventType}, day: ${day}`);
        await interaction.reply({ content: 'No signup found for the selected event type and day. Please report it to Booze',
            flags: MessageFlags.Ephemeral});
        return;
    }

    await signup.addPlayer(interaction);
    //await interaction.deferUpdate();
}