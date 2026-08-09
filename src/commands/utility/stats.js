const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("View your server statistics."),
  async execute(interaction, client) {
    const members = await interaction.guild.members.fetch();
    const channels = interaction.guild.channels.cache.size;
    const roles = interaction.guild.roles.cache.size;
    await interaction.reply({
      embeds: [embed("info", "Server Statistics", `👥 **Members:** ${members.size}\n📢 **Channels:** ${channels}\n🏷️ **Roles:** ${roles}\n📅 **Created:** <t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:D>`)],
    });
  },
};
