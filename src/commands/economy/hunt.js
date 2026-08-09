const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("Go hunting to earn coins."),
  async execute(interaction, client) {
    const outcomes = ["🦌", "🐻", "🐺", "🦊", "🐿️", "Nothing"];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];
    const amount = result === "Nothing" ? 0 : Math.floor(Math.random() * 150) + 30;
    const economy = client.db.getEconomy(interaction.guildId, interaction.user.id);
    client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: economy.coins + amount, lastDaily: economy.lastDaily });
    await interaction.reply({ embeds: [embed("economy", "Hunting", `You hunted ${result}! Earned **${amount}** coins.`)] });
  },
};
