const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("queue").setDescription("Show the current music queue."),
  async execute(interaction, client) {
    try {
      const queue = requireQueue(client, interaction);
      const songs = queue.songs.slice(0, 10).map((song, index) => `${index + 1}. ${song.name} (${song.formattedDuration})`).join("\n");
      await interaction.reply({
        embeds: [embed("info", "Music Queue", songs || "The queue is empty.")],
      });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Queue failed", error.message)], ephemeral: true });
    }
  },
};
