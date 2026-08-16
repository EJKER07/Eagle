const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song."),
  async execute(interaction, client) {
    try {
      await requireQueue(client, interaction).skip();
      await interaction.reply("⏭️ Song skipped.");
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Skip failed", error.message)], ephemeral: true });
    }
  },
};
