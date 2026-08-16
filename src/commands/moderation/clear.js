const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("clear").setDescription("Bulk delete recent messages.").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption((o) => o.setName("amount").setDescription("1-100 messages").setRequired(true).setMinValue(1).setMaxValue(100)),
  permissions: [PermissionFlagsBits.ManageMessages],
  async execute(interaction) {
    try {
      const amount = interaction.options.getInteger("amount");
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.editReply({ embeds: [embed("moderation", "Messages cleared", `Deleted **${deleted.size}** message(s).`)] });
    } catch (error) {
      await interaction.editReply({ embeds: [embed("error", "Clear failed", error.message)] });
    }
  },
};
