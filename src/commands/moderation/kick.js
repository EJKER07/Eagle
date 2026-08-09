const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("kick").setDescription("Kick a member.").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.KickMembers],
  async execute(interaction) { const user = interaction.options.getUser("user"); const member = await interaction.guild.members.fetch(user.id).catch(() => null); if (!member?.kickable) throw new Error("I cannot kick this member because of role hierarchy."); await member.kick(interaction.options.getString("reason") || `Kicked by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("moderation", "Member kicked", `${user.tag} was kicked.`)] }); },
};
