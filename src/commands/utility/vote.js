const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("vote")
    .setDescription("Vote for Eagle Bot on top.gg"),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "Vote for Eagle", "Help us grow by voting!\n\n🔗 https://top.gg/bot/YOUR_BOT_ID/vote")],
      ephemeral: true,
    });
  },
};
