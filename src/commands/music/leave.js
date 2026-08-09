const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Stop music and leave voice channel."),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    client.distube.stop(interaction.guildId);
    await interaction.reply({ embeds: [embed("info", "Left", "👋 Goodbye!")] });
  },
};
