const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.BanMembers],
  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (member && !member.bannable) {
        return interaction.reply({ embeds: [embed("error", "Cannot ban member", "I cannot ban this member because of role hierarchy.")] });
      }
      const reason = interaction.options.getString("reason") || `Banned by ${interaction.user.tag}`;
      await interaction.guild.members.ban(user, { reason });
      await interaction.reply({ embeds: [embed("moderation", "Member banned", `${user.tag} was banned.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Ban failed", error.message || "Failed to ban member.")] });
    }
  },
};
