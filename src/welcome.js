const { EmbedBuilder } = require('discord.js');

function render(template, member) {
  return template.replaceAll('{user}', `<@${member.id}>`).replaceAll('{username}', member.user.username).replaceAll('{server}', member.guild.name);
}

async function sendWelcome(member, settings, goodbye = false) {
  const channelId = goodbye ? settings.goodbyeChannelId : settings.channelId;
  if (!channelId) return false;
  const channel = member.guild.channels.cache.get(channelId) || await member.guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return false;
  const message = goodbye ? settings.goodbyeMessage : settings.message;
  const embed = new EmbedBuilder().setDescription(render(message || (goodbye ? '{username} left {server}.' : 'Welcome {user} to {server}!'), member)).setColor(settings.color || 0x22c55e);
  await channel.send({ embeds: [embed] });
  return true;
}

module.exports = { render, sendWelcome };
