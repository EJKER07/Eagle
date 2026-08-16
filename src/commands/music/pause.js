const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("pause").setDescription("Pause music."),
  async execute(interaction, client) {
    try {
      requireQueue(client, interaction).pause();
      await interaction.reply("⏸️ Music paused.");
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Pause failed", error.message)], ephemeral: true });
    }
  },
};
