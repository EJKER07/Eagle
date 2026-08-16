const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your economy profile.")
    .addUserOption((o) => o.setName("user").setDescription("User")),
  async execute(interaction, client) {
    try {
      const user = interaction.options.getUser("user") || interaction.user;
      const economy = client.db.getEconomy(interaction.guildId, user.id) || { coins: 0 };
      const level = client.db.getLevel(interaction.guildId, user.id) || { level: 0, xp: 0 };
      await interaction.reply({
        embeds: [embed("economy", `${user.username}'s Profile`, `💰 **Balance:** ${(economy.coins || 0).toLocaleString()}\n📊 **Level:** ${level.level || 0}\n⭐ **XP:** ${level.xp || 0}`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))],
      });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Profile error", error.message || "Failed to load profile.")] });
    }
  },
};
