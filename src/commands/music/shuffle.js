const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shuffle")
    .setDescription("Shuffle the queue."),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    queue.shuffle();
    await interaction.reply({ embeds: [embed("info", "Shuffled", "🔀 Queue has been shuffled.")] });
  },
};
