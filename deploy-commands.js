import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import path from 'path';
import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

// Fix pour __dirname avec ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];

// Reading all commands from the commands folder
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = await readdir(commandsPath);

for (const folder of commandFolders) {
	const commandsFolder = path.join(commandsPath, folder);
	const commandFiles = await readdir(commandsFolder);

	for (const file of commandFiles) {
		if (file.endsWith('.js')) {
			const filePath = path.join(commandsFolder, file);
			const command = (await import(`file://${filePath}`)).default;

			if (command && command.data && command.execute) {
				commands.push(command.data.toJSON());
				console.log(`✅ Commande détectée : ${command.data.name}`);
			}
			else {
				console.log(`⚠️ La commande ${file} est invalide.`);
			}
		}
	}
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
	try {
		console.log(`🚀 Déploiement de ${commands.length} commandes sur le serveur ${guildId}...`);

		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`✅ ${data.length} commandes ont été enregistrées avec succès !`);
	}
	catch (error) {
		console.error('❌ Erreur lors du déploiement des commandes :', error);
	}
})();
