const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
    console.error('Missing required environment variables. Please check your .env file.');
    process.exit(1);
}

import { Collection, Events } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import interactionCreate from '#events/interactionCreate';
import { checkForResets, checkForResetsTimer } from '#events/botTimer';

import client from '#classes/Client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
		const loadedCommand = await import(pathToFileURL(filePath).href);
		const command = loadedCommand.default ?? loadedCommand;
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