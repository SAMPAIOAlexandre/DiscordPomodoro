// This components is for the slash command /start that creates a new voice channel for a pomodoro session.

import { SlashCommandBuilder, ChannelType } from 'discord.js';

export default {
	data : new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start a new pomodoro session with desired time.')
		.addIntegerOption(option =>
			option.setName('duration')
				.setDescription('The time in minutes for the pomodoro session.')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('break')
				.setDescription('Time of break in minutes.')
				.setRequired(true),
		),
	async execute(interaction) {
		const duration = interaction.options.getInteger('duration');
		const breakDuration = interaction.options.getInteger('break');
		const guild = interaction.guild;
		const category = guild.channels.cache.find(c => c.name === 'Sessions Pomodoro' && c.type === ChannelType.GuildCategory);

		if (!category) {
			await interaction.reply('The category "Sessions Pomodoro" does not exist. Please create it first.');
			return;
		}
		const existingChannel = guild.channels.cache
			.filter (channel => channel.name.startsWith(`Pomodoro ${duration}/${breakDuration}`))
			.size;

		const newChannelName = `Pomodoro ${duration}/${breakDuration} #${existingChannel + 1}`;

		const newChannel = await guild.channels.create({
			name : newChannelName,
			type: ChannelType.GuildVoice,
			parent: category.id,
			permissionOverwrites: [
				{
					id: guild.roles.everyone.id,
					deny: ['VIEW_CHANNEL'],
				},
			],
		});
		await interaction.reply(`Pomodoro session created in ${newChannel}`);
	},
};