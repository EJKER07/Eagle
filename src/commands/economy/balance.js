const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("balance").setDescription("View your server wallet.").addUserOption((o) => o.setName("user").setDescription("Member")),
  async execute(interaction, client) { 
    try {
      const user = interaction.options.getUser("user") || interaction.user; 
      const row = client.db.getEconomy(interaction.guildId, user.id) || { coins: 0 }; 
      await interaction.reply({ embeds: [embed("economy", `${user.username}'s Balance`, `**${(row.coins || 0).toLocaleString()}** coins`)] }); 
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Balance error", error.message)] });
    }
  },
};
