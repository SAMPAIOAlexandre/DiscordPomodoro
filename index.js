// @ts-nocheck
import 'dotenv/config';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { startPomodoro, activeTimers, originalChannelNames } from './commands/utils/pomodoroTimer.js';

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
				console.log(`🚫 Salon vide, réinitialisation de ${oldChannel.name}`);

				// 🛑 STOPPER LE TIMER
				if (activeTimers.has(oldChannel.id)) {
					clearInterval(activeTimers.get(oldChannel.id));
					activeTimers.delete(oldChannel.id);
					console.log(`🛑 Timer arrêté pour ${oldChannel.name}`);
				}

				console.log(`🔎 Recherche du nom original pour ID: ${oldChannel.id}`);
				console.log('📌 Contenu actuel de originalChannelNames :', originalChannelNames);

				// ✅ Récupérer le NOM ORIGINAL STOCKÉ avec l'ID
				if (originalChannelNames.has(oldChannel.id)) {
					let originalName = originalChannelNames.get(oldChannel.id);
					console.log(`✅ Nom original retrouvé : ${originalName} pour ${oldChannel.name}`);

					// 🔍 Extraire le numéro (#1, #2, ...) s'il existe
					const match = oldChannel.name.match(/#\d+$/);
					const channelNumber = match ? match[0] : '';

					// 🔄 Réappliquer le numéro s'il existait
					originalName = `${originalName} ${channelNumber}`.trim();

					await oldChannel.setName(originalName);
					originalChannelNames.delete(oldChannel.id);
				}
				else {
					console.log(`⚠️ Nom original introuvable pour ${oldChannel.name}. La Map contient actuellement :`, originalChannelNames);
				}
			}
		}, 5000);
	}
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`✅ Bot ready and connected ${readyClient.user.tag}`);
});

client.login(token);
