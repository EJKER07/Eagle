const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("Beg for coins."),
  async execute(interaction, client) {
    try {
      const amount = Math.floor(Math.random() * 50) + 10;
      const economy = client.db.getEconomy(interaction.guildId, interaction.user.id) || { coins: 0 };
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: economy.coins + amount, lastDaily: economy.lastDaily });
      await interaction.reply({ embeds: [embed("economy", "Begging", `You begged and received **${amount}** coins!`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Beg failed", error.message)] });
    }
  },
};
