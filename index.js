// @ts-nocheck
import 'dotenv/config';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { startPomodoro, activeTimers } from './commands/utils/pomodoroTimer.js';

const token = process.env.DISCORD_TOKEN;

// Fix for __dirname with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.commands = new Collection();

// Load all commands from the commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = await readdir(commandsPath);

// loop for loading of all commands in the commands folder
for (const folder of commandFolders) {
	if (folder === 'utils') continue;
	const commandsFolder = path.join(commandsPath, folder);
	const commandFiles = await readdir(commandsFolder);

	for (const file of commandFiles) {
		if (file.endsWith('.js')) {
			const filePath = path.join(commandsFolder, file);
			const command = (await import(`file://${filePath}`)).default;
			if (command && command.data && command.execute) {
				client.commands.set(command.data.name, command);
				console.log(`✅ Commande chargée : ${command.data.name}`);
			}
			else {
				console.log(`⚠️ La commande ${file} est invalide.`);
			}
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		await interaction.reply({ content: 'Erreur lors de l\'exécution de la commande.', ephemeral: true });
	}
});

client.on('voiceStateUpdate', async (oldState, newState) => {
	const user = newState.member;
	const channel = newState.channel;
	const oldChannel = oldState.channel;

	if (channel && channel.name.startsWith('Pomodoro')) {
		console.log(`🎯 ${user.user.username} a rejoint ${channel.name}`);

		if (!activeTimers.has(channel.id)) {
			startPomodoro(channel);
		}
	}

	if (oldChannel && oldChannel.name.startsWith('Pomodoro')) {
		setTimeout(async () => {
			if (oldChannel.members.size === 0) {
				console.log('🚫 Nobody on channel timer go for 0');
				clearInterval(activeTimers.get(oldChannel.id));
				activeTimers.delete(oldChannel.id);
				await oldChannel.setName(oldChannel.name.split(' - ')[0]);
			}
		}, 5000);
	}
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`✅ Bot prêt et connecté en tant que ${readyClient.user.tag}`);
});

client.login(token);
