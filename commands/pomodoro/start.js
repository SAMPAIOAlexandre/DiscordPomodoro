// Slash command /start that creates a new voice channel for a Pomodoro session.

import { SlashCommandBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import { originalChannelNames } from '../utils/pomodoroTimer.js';

export default {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start a new pomodoro session with desired time.')
		.addIntegerOption(option =>
			option.setName('duration')
				.setDescription('The time in minutes for the pomodoro session.')
				.setRequired(true),
		)
		.addIntegerOption(option =>
			option.setName('break')
				.setDescription('Time of break in minutes.')
				.setRequired(true),
		),
	async execute(interaction) {
		try {
			const duration = interaction.options.getInteger('duration');
			const breakDuration = interaction.options.getInteger('break');
			const guild = interaction.guild;
			const categoryName = `Pomodoro ${duration}/${breakDuration}`;

			// Check if the category exists
			const category = guild.channels.cache.find(
				c => c.name === categoryName && c.type === ChannelType.GuildCategory,
			);

			if (!category) {
				await interaction.reply(`⚠️ The category **${categoryName}** does not exist. Please run \`/setup\` first.`);
				return;
			}


			// Check how many channels are in the category
			const existingChannelCount = guild.channels.cache
				.filter(channel => channel.parentId === category.id)
				.size;

			// Create a unique name for the new channel
			const newChannelName = `Pomodoro ${duration}/${breakDuration} #${existingChannelCount + 1}`;

			for (const [key, value] of originalChannelNames.entries()) {
				if (value === newChannelName) {
					console.log(`🗑️ Suppression de l'ancien enregistrement du salon ${value} (ID: ${key})`);
					originalChannelNames.delete(key);
				}
			}

			// Creating the new channel
			const newChannel = await guild.channels.create({
				name: newChannelName,
				type: ChannelType.GuildVoice,
				parent: category.id,
				permissionOverwrites: [
					{
						id: guild.roles.everyone.id,
						deny: [PermissionsBitField.Flags.ViewChannel],
					},
				],
			});

			// Saving the original name for reset using the channel ID
			originalChannelNames.set(newChannel.id, newChannel.name);
			console.log(`📝 Stockage du nom original : ${newChannel.name} (ID: ${newChannel.id})`);

			await interaction.reply(`✅ Pomodoro session created: **${newChannel.name}** in **${categoryName}**. Join to start!`);
		}
		catch (error) {
			console.error('❌ Erreur dans /start :', error);
			await interaction.reply({ content: '❌ An error occurred while executing this command.', ephemeral: true });
		}
	},
};
