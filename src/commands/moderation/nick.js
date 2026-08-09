const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { target, validateTarget, record } = require('../../moderation');
module.exports = {
  data: new SlashCommandBuilder().setName('nick').setDescription('Change or clear a member nickname.').setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames.toString()).addUserOption(o => o.setName('user').setDescription('Member').setRequired(true)).addStringOption(o => o.setName('nickname').setDescription('New nickname; omit to clear')),
  permissions: ['ManageNicknames'],
  async execute(interaction, context) { const member = target(interaction); const nickname = interaction.options.getString('nickname'); const error = validateTarget(interaction, member, PermissionFlagsBits.ManageNicknames); if (error) return interaction.reply({ content: error, ephemeral: true }); await member.setNickname(nickname, `Changed by ${interaction.user.tag}`); await record(context, interaction, 'nick', member, nickname || 'Nickname cleared'); await interaction.reply(`${member.user.tag} nickname updated.`); }
};
