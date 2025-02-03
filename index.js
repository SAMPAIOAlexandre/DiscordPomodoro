import 'dotenv/config';
import { Client, Events, GatewayIntentBits, Collection } from 'discord.js';
import { readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const token = process.env.DISCORD_TOKEN;

// Fix pour __dirname with ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

// Load all commands from the commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = await readdir(commandsPath);

// loop for loading of all commands in the commands folder
for (const folder of commandFolders) {
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

client.once(Events.ClientReady, (readyClient) => {
	console.log(`✅ Bot prêt et connecté en tant que ${readyClient.user.tag}`);
});

client.login(token);
