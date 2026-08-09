const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("rank").setDescription("View a member's level and XP.").addUserOption((o) => o.setName("user").setDescription("Member")),
  async execute(interaction, client) { const user = interaction.options.getUser("user") || interaction.user; const row = client.db.getLevel(interaction.guildId, user.id); await interaction.reply({ embeds: [embed("leveling", `${user.username}'s rank`, `Level: **${row.level || 0}**\nXP: **${row.xp || 0}**`)] }); },
};
