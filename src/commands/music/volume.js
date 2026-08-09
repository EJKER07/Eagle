const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set music volume (0-100).")
    .addIntegerOption((o) => o.setName("level").setDescription("Volume level").setRequired(true).setMinValue(0).setMaxValue(100)),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    queue.volume = interaction.options.getInteger("level");
    await interaction.reply({ embeds: [embed("info", "Volume", `🔊 Volume set to ${queue.volume}%`)] });
  },
};
