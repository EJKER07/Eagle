const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("Go fishing to earn coins."),
  async execute(interaction, client) {
    try {
      const outcomes = ["🐟", "🐠", "🐡", "🦈", "🐙", "Nothing"];
      const result = outcomes[Math.floor(Math.random() * outcomes.length)];
      const amount = result === "Nothing" ? 0 : Math.floor(Math.random() * 100) + 20;
      const economy = client.db.getEconomy(interaction.guildId, interaction.user.id) || { coins: 0 };
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: economy.coins + amount, lastDaily: economy.lastDaily });
      await interaction.reply({ embeds: [embed("economy", "Fishing", `You caught ${result}! Earned **${amount}** coins.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Fishing failed", error.message)] });
    }
  },
};
