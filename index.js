const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');


const interactionCreate = require('#events/interactionCreate');
const { checkForResets, checkForResetsTimer } = require('#events/botTimer');

const client = require('#classes/Client');
client.login(TOKEN);

client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
	checkForResets();
	checkForResetsTimer();
});

// Load commands from the commands folder
client.commands = new Collection(); 
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(
    interactionCreate.name,
    (...args) => interactionCreate.execute(...args)
);