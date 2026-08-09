const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("View bot information."),
  async execute(interaction, client) {
    await interaction.reply({
      embeds: [embed("info", "Eagle Premium Bot", `🔧 **Servers:** ${client.guilds.cache.size}\n👥 **Commands:** ${client.commands.size}\n⏱️ **Uptime:** <t:${Math.floor(client.startedAt / 1000)}:R>\n📦 **Version:** 1.0.0`)
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))],
    });
  },
};
