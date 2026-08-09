const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("ban").setDescription("Ban a member.").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.BanMembers],
  async execute(interaction) { const user = interaction.options.getUser("user"); const member = await interaction.guild.members.fetch(user.id).catch(() => null); if (member && !member.bannable) throw new Error("I cannot ban this member because of role hierarchy."); await interaction.guild.members.ban(user, { reason: interaction.options.getString("reason") || `Banned by ${interaction.user.tag}` }); await interaction.reply({ embeds: [embed("moderation", "Member banned", `${user.tag} was banned.`)] }); },
};
