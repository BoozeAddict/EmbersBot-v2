const { 
	SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits,
 } = require('discord.js');

//const Signup = require('#classes/Signup');
const signupsList = require('#classes/SignupsList');



 async function createHRSignupMessage(channel) {
	//const signupsList = new SignupsList();
	await signupsList.postHRSignups(channel);
}

async function createGVGSignupMessage(channel) {
	//const signupsList = new SignupsList();
	await signupsList.postGVGSignups(channel);
}

async function createSignupMessage(type, channel) {
  switch (type) {
	case 'hr':
		return await createHRSignupMessage(channel);
	case 'gvg':
		return await createGVGSignupMessage(channel);
	default:
		return 'Creating a new signup!';
  }
}

module.exports = {
	data: new SlashCommandBuilder().setName('signup')
	.setDescription('Create a new signup!')
	.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
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
		if (!interaction.memberPermissions?.has(PermissionFlagsBits.KickMembers)) {
			return interaction.reply({
				content: 'You do not have permission to create signups.',
				flags: MessageFlags.Ephemeral
			});
		}
		await interaction.reply({
			content: `Creating a new ${interaction.options.getString('type')} signup!`,
			flags: MessageFlags.Ephemeral
		});
		await createSignupMessage(interaction.options.getString('type'), interaction.channel);
	},
};