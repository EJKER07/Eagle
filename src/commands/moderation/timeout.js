const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    .addIntegerOption((o) => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ embeds: [embed("error", "Member not found", "That member could not be found in this server.")] });
      }
      if (!member.moderatable) {
        return interaction.reply({ embeds: [embed("error", "Cannot timeout member", "I cannot timeout this member because of role hierarchy.")] });
      }
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || `Timeout by ${interaction.user.tag}`;
      await member.timeout(minutes * 60000, reason);
      await interaction.reply({ embeds: [embed("moderation", "Member timed out", `${member} was timed out for ${minutes} minutes.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Timeout failed", error.message || "Failed to timeout member.")] });
    }
  },
};
