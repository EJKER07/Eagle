const { EmbedBuilder } = require('discord.js');

async function sendLog(guild, context, type, payload) {
  const channelId = context.database.getGuild(guild.id).logging?.[type];
  if (!channelId) return false;
  const channel = guild.channels.cache.get(channelId) || await guild.channels.fetch(channelId).catch(() => null);
  if (!channel?.isTextBased()) return false;
  await channel.send({ embeds: [new EmbedBuilder().setTitle(payload.title).setDescription(payload.description || '').setColor(payload.color || 0x64748b).setTimestamp()] });
  return true;
}

function attachLogging(context) {
  context.log = (guild, type, payload) => sendLog(guild, context, type, payload);
}

module.exports = { sendLog, attachLogging };
