const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("View latest bot updates."),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "📝 Changelog v1.0.0", `✨ **New Features:**\n• Reaction-based giveaways\n• Custom emoji support\n• Persistent database\n• Music system\n• Economy system\n• Ticket system\n• Moderation tools\n\n🐛 **Fixes:**\n• Timestamp display\n• Entry tracking\n• Intent configuration`)],
      ephemeral: true,
    });
  },
};
