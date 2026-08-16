const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("work")
    .setDescription("Work to earn coins.")
    .addStringOption((o) => o.setName("job").setDescription("Job type").setRequired(false).addChoices(
      { name: "Cashier", value: "cashier" },
      { name: "Developer", value: "developer" },
      { name: "Designer", value: "designer" }
    )),
  async execute(interaction, client) {
    try {
      const job = interaction.options.getString("job") || "cashier";
      const earnings = { cashier: 30, developer: 100, designer: 75 };
      const amount = (earnings[job] || 30) + Math.floor(Math.random() * 20);
      const economy = client.db.getEconomy(interaction.guildId, interaction.user.id) || { coins: 0 };
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: economy.coins + amount, lastDaily: economy.lastDaily });
      await interaction.reply({ embeds: [embed("economy", "Work", `You worked as a **${job}** and earned **${amount}** coins!`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Work failed", error.message)] });
    }
  },
};
