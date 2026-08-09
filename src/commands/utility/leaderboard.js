const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

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
    const rows = top.map((row, i) => `**${i + 1}.** <@${row.userId}> — **${row.value}**`);
    await interaction.reply({ embeds: [embed("info", `${type} Leaderboard`, rows.length ? rows.join("\n") : "No data yet.")] });
  },
};
