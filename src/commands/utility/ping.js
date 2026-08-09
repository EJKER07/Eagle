const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Show bot and API latency."),
  aliases: ["up", "uptime"],
  guildOnly: false,
  async execute(interaction, client) {
    await interaction.reply({ embeds: [embed("info", "Pong", `API latency: **${client.ws.ping}ms**\nUptime: <t:${Math.floor(client.startedAt / 1000)}:R>`)] });
  },
};
