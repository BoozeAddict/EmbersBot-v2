const { 
	SlashCommandBuilder,
    MessageFlags,
 } = require('discord.js');

//const Signup = require('#classes/Signup');
const signupsList = require('#classes/SignupsList');



 function createHRSignupMessage(channel) {
	//const signupsList = new SignupsList();
	signupsList.postHRSignups(channel);
}

function createGVGSignupMessage(channel) {
	//const signupsList = new SignupsList();
	signupsList.postGVGSignups(channel);
}

async function createSignupMessage(type, channel) {
  switch (type) {
	case 'hr':
		return createHRSignupMessage(channel);
	case 'gvg':
		return createGVGSignupMessage(channel);
	default:
		return 'Creating a new signup!';
  }
}

module.exports = {
	data: new SlashCommandBuilder().setName('signup')
	.setDescription('Create a new signup!')
	.addStringOption(option => 
		option.setName('type')
		.setDescription('The type of signup to create')
		.setRequired(true)
		.addChoices(
			{ name: 'Hero Realm', value: 'hr'},
			{ name: 'GvG', value: 'gvg' }
		)
	),

	async execute(interaction) {
		if (!interaction.isChatInputCommand()) return;
		await interaction.reply({
			content: `Creating a new ${interaction.options.getString('type')} signup!`,
			flags: MessageFlags.Ephemeral
		});
		await createSignupMessage(interaction.options.getString('type'), interaction.channel);
	},
};