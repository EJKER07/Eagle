const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("daily").setDescription("Claim your daily coin reward."),
  cooldown: 10,
  async execute(interaction, client) { const row = client.db.getEconomy(interaction.guildId, interaction.user.id); if (row.lastDaily && Date.now() - row.lastDaily < 86400000) throw new Error(`Your daily reward is ready <t:${Math.floor((row.lastDaily + 86400000) / 1000)}:R>.`); const amount = 250; client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: row.coins + amount, lastDaily: Date.now() }); await interaction.reply({ embeds: [embed("economy", "Daily reward", `You received **${amount}** coins.`)] }); },
};
