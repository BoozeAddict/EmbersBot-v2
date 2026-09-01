const path = require('node:path');
const signupsList = require('#classes/SignupsList');
//const Signup = require('#classes/Signup');

module.exports = async function handleSelectMenus(interaction) {
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

    await signup.addPlayer(interaction);
    //await interaction.deferUpdate();
}