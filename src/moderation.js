const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

function target(interaction, name = 'user') {
  return interaction.options.getMember(name) || interaction.guild.members.cache.get(interaction.options.getUser(name)?.id);
}

function validateTarget(interaction, member, permission) {
  if (!member) return 'That member could not be found.';
  if (member.id === interaction.user.id) return 'You cannot target yourself.';
  if (member.id === interaction.guild.ownerId) return 'The server owner cannot be targeted.';
  if (!interaction.guild.members.me.permissions.has(permission)) return `I need the ${permission} permission to do that.`;
  if (member.roles.highest.comparePositionTo(interaction.guild.members.me.roles.highest) >= 0) return 'My highest role must be above the target role.';
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 && interaction.guild.ownerId !== interaction.user.id) return 'Your highest role must be above the target role.';
  return null;
}

async function confirm(interaction, text, action) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('moderation:confirm').setLabel('Confirm').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('moderation:cancel').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );
  const response = await interaction.reply({ embeds: [new EmbedBuilder().setTitle('CONFIRM MODERATION ACTION').setDescription(text).setColor(0xef4444)], components: [row], ephemeral: true, fetchReply: true });
  try {
    const choice = await response.awaitMessageComponent({ time: 15_000, filter: component => component.user.id === interaction.user.id });
    if (choice.customId === 'moderation:cancel') return choice.update({ content: 'Action cancelled.', embeds: [], components: [] });
    await choice.update({ content: 'Applying action...', embeds: [], components: [] });
    await action();
  } catch (error) {
    if (error.code === 'InteractionCollectorError') await interaction.editReply({ content: 'Confirmation expired.', embeds: [], components: [] });
    else throw error;
  }
}

async function record(context, interaction, action, targetMember, reason) {
  const entry = context.database.addCase(interaction.guildId, { action, targetId: targetMember?.id, targetTag: targetMember?.user?.tag, moderatorId: interaction.user.id, reason });
  await context.log(interaction.guild, 'moderation', { title: `${action} | Case ${entry.id}`, description: `${targetMember?.user?.tag || 'Unknown target'}\n${reason}` });
}

function command({ name, description, permission, optionName = 'user', execute }) {
  return { name, description, permission, optionName, execute };
}

module.exports = { target, validateTarget, confirm, record, command, PermissionFlagsBits };
