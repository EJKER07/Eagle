const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Toggle autoplay mode."),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    queue.autoplay = !queue.autoplay;
    await interaction.reply({ embeds: [embed("info", "Autoplay", `🎵 Autoplay: ${queue.autoplay ? "On" : "Off"}`)] });
  },
};
