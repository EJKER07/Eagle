const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { target, validateTarget, confirm, record } = require('../../moderation');
module.exports = {
  data: new SlashCommandBuilder().setName('softban').setDescription('Ban and immediately unban a member.').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers.toString()).addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Reason')),
  permissions: ['BanMembers'],
  async execute(interaction, context) { const member = target(interaction); const reason = interaction.options.getString('reason') || 'No reason provided'; const error = validateTarget(interaction, member, PermissionFlagsBits.BanMembers); if (error) return interaction.reply({ content: error, ephemeral: true }); await confirm(interaction, `Softban ${member.user.tag}? This removes recent messages.`, async () => { await member.ban({ reason, deleteMessageSeconds: 86400 }); await interaction.guild.members.unban(member.id, reason); await record(context, interaction, 'softban', member, reason); await interaction.editReply({ content: `${member.user.tag} was softbanned.`, embeds: [], components: [] }); }); }
};
