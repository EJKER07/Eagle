const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.KickMembers],
  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member?.kickable) {
        return interaction.reply({ embeds: [embed("error", "Cannot kick member", "I cannot kick this member because of role hierarchy.")] });
      }
      const reason = interaction.options.getString("reason") || `Kicked by ${interaction.user.tag}`;
      await member.kick(reason);
      await interaction.reply({ embeds: [embed("moderation", "Member kicked", `${user.tag} was kicked.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Kick failed", error.message || "Failed to kick member.")] });
    }
  },
};
