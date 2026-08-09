const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("premium")
    .setDescription("View premium features and upgrade."),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "⭐ Premium Features", `✨ **Includes:**\n• Unlimited giveaways\n• Custom commands\n• Advanced moderation\n• Priority support\n• Custom prefix\n• More music features\n\n💎 **Pricing:** $5/month\n\n🔗 **Upgrade:** https://eagle-bot.com/premium`)],
      ephemeral: true,
    });
  },
};
