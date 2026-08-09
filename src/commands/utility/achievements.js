const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("achievements")
    .setDescription("View your achievements."),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "🏆 Achievements", "🎉 Early Supporter\n🎮 Gamer\n💰 Wealthy\n🎵 Music Lover\n⭐ Regular\n🌟 VIP Member")],
    });
  },
};
