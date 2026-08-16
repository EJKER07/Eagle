const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily coin reward."),
  cooldown: 10,
  async execute(interaction, client) {
    try {
      const row = client.db.getEconomy(interaction.guildId, interaction.user.id) || { coins: 0, lastDaily: 0 };
      if (row.lastDaily && Date.now() - row.lastDaily < 86400000) {
        return interaction.reply({ embeds: [embed("error", "Daily reward", `Your daily reward is ready <t:${Math.floor((row.lastDaily + 86400000) / 1000)}:R>.`)] });
      }
      const amount = 250;
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: row.coins + amount, lastDaily: Date.now() });
      await interaction.reply({ embeds: [embed("economy", "Daily Reward", `You received **${amount}** coins.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Daily reward failed", error.message)] });
    }
  },
};
