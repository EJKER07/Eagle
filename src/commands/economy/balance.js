const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("balance").setDescription("View your server wallet.").addUserOption((o) => o.setName("user").setDescription("Member")),
  async execute(interaction, client) { const user = interaction.options.getUser("user") || interaction.user; const row = client.db.getEconomy(interaction.guildId, user.id); await interaction.reply({ embeds: [embed("economy", `${user.username}'s balance`, `**${(row.coins || 0).toLocaleString()}** coins`)] }); },
};
