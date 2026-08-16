const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("stop").setDescription("Stop music and leave the voice channel."),
  async execute(interaction, client) {
    try {
      requireQueue(client, interaction).stop();
      await interaction.reply("⏹️ Music stopped and left voice channel.");
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Stop failed", error.message)], ephemeral: true });
    }
  },
};
