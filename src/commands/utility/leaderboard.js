const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

function getDisplayName(guild, userId) {
  const member = guild.members.cache.get(userId) || guild.members.cache.find((candidate) => candidate.user?.id === userId);
  if (member?.user?.username) return member.user.username;
  return userId;
}

function formatLeaderboardRow(guild, row, index) {
  const label = getDisplayName(guild, row.userId);
  return `**${index + 1}.** ${label} — **${row.value}**`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View server leaderboard.")
    .addStringOption((o) => o.setName("type").setDescription("Type").setRequired(false).addChoices(
      { name: "Messages", value: "messages" },
      { name: "Invites", value: "invites" },
      { name: "Level", value: "level" }
    )),
  async execute(interaction, client) {
    const type = interaction.options.getString("type") || "messages";
    const top = client.db.listMetrics(interaction.guildId, type, 10);
    const rows = top.map((row, i) => formatLeaderboardRow(interaction.guild, row, i));
    const title = `${type.toUpperCase()} LEADERBOARD`;
    await interaction.reply({ embeds: [embed("info", title, rows.length ? rows.join("\n") : "No data yet.")] });
  },
  formatLeaderboardRow,
  getDisplayName,
};
