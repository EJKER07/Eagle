const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("slowmode").setDescription("Set channel slowmode.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption((o) => o.setName("seconds").setDescription("0-21600 seconds").setRequired(true).setMinValue(0).setMaxValue(21600)),
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(interaction) {
    try {
      const seconds = interaction.options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);
      await interaction.reply({ embeds: [embed("moderation", "Slowmode updated", `Slowmode is now **${seconds}s**.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Slowmode failed", error.message)] });
    }
  },
};
