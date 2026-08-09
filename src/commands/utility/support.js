const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Get support server link."),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "Support Server", "Need help?\n\n🔗 https://discord.gg/eagle")],
      ephemeral: true,
    });
  },
};
