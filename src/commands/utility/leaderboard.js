const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

async function getDisplayName(guild, userId, client) {
  try {
    const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
    if (member?.user?.username) return member.user.username;
    const user = await client.users.fetch(userId).catch(() => null);
    if (user?.username) return user.username;
  } catch (error) {
    // User not found or error fetching
  }
  return "Unknown User";
}

async function formatLeaderboardRow(guild, row, index, client) {
  const label = await getDisplayName(guild, row.userId, client);
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
    const rows = await Promise.all(top.map((row, i) => formatLeaderboardRow(interaction.guild, row, i, client)));
    const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
    const title = `${typeLabel} Leaderboard`;
    await interaction.reply({ embeds: [embed("info", title, rows.length ? rows.join("\n") : "No data yet.")] });
  },
  formatLeaderboardRow,
  getDisplayName,
};
