const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show current playing song."),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    const song = queue.songs[0];
    await interaction.reply({
      embeds: [embed("info", "Now Playing", `🎵 **${song.name}**\n⏱️ Duration: ${song.formattedDuration}\n👤 Requested by: ${song.user}`)],
    });
  },
};
