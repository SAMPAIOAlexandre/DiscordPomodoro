import { SlashCommandBuilder, ChannelType } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('setup')
		.setDescription('Setup the category and voice channel for pomodoro sessions.'),
	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true }); 
		try {
			const guild = interaction.guild;
			const sessionTypes = ['25/5', '5/5', '50/10', '90/20'];

			for (const type of sessionTypes) {
				let category = guild.channels.cache.find(
					c => c.name === `Pomodoro ${type}` && c.type === ChannelType.GuildCategory,
				);

				if (!category) {
					category = await guild.channels.create({
						name: `Pomodoro ${type}`,
						type: ChannelType.GuildCategory,
					});
					console.log(`✅ Category created: ${category.name}`);
				}
			}

			await interaction.editReply('✅ All categories have been created.');
		}
		catch (error) {
			console.error('❌ Error in /setup:', error);
			await interaction.editReply('❌ An error occurred while creating categories.');
		}
	},
};
