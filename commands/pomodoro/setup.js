// This component is for the slash command /setup that creates a category and a voice channel for the pomodoro sessions.

import { SlashCommandBuilder, ChannelType } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Setup the category and voice channel for pomodoro sessions.'),
    async execute(interaction) {
      const guild = interaction.guild;
      const sessionType = [25/5, 50/10, 90/20];

      for (const type of sessionType) {
        let category = guild.channels.cache.find(c => c.name === `Pomodoro ${type}` && c.type === ChannelType.GuildCategory);
        
        if(!category) {
          category = await guild.channels.create({
            name: `Pomodoro ${type}`
            type: ChannelType.GuildCategory,
          })
          console.log(`Category created: ${category.name}`);
        }
        }
        await interaction.reply("All the categories have been created.");
      }
    }