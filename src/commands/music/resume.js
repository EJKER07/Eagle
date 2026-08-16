const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("resume").setDescription("Resume music."),
  async execute(interaction, client) {
    try {
      requireQueue(client, interaction).resume();
      await interaction.reply("▶️ Music resumed.");
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Resume failed", error.message)], ephemeral: true });
    }
  },
};
