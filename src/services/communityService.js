const { embed } = require("../utils/embeds");

function getSettings(client, guildId) {
  return client.db.getGuildSettings(guildId);
}

function render(template, member, channel) {
  return String(template || "")
    .replaceAll("{user}", member.user.tag)
    .replaceAll("{username}", member.user.username)
    .replaceAll("{userid}", member.id)
    .replaceAll("{server}", member.guild.name)
    .replaceAll("{membercount}", String(member.guild.memberCount))
    .replaceAll("{mention}", `<@${member.id}>`)
    .replaceAll("{avatar}", member.displayAvatarURL({ size: 512 }))
    .replaceAll("{channel}", channel ? `<#${channel.id}>` : "");
}

function metric(client, guildId, userId, name, amount = 1) {
  return Promise.resolve(client.db.updateMetric(guildId, userId, name, amount));
}

function leaderboard(client, guildId, name, limit = 10) {
  if (name !== "dailymessages") return Promise.resolve(client.db.listMetrics(guildId, name, limit));
  const day = new Date().toISOString().slice(0, 10);
  const entries = client.db.listAllMetrics(guildId, "messages", 1000)
    .filter((entry) => entry.userId.endsWith(`:${day}`))
    .map((entry) => ({ ...entry, userId: entry.userId.slice(0, -11) }));
  return Promise.resolve(entries.slice(0, limit));
}

async function refreshInviteSnapshot(client, guild) {
  if (!guild?.invites?.fetch) return;
  try {
    const invites = await guild.invites.fetch();
    client.inviteCache ??= new Map();
    client.inviteCache.set(guild.id, new Map(invites.map((invite) => [invite.code, invite.uses || 0])));
  } catch (error) {
    console.warn(`Unable to cache invites for ${guild.id}: ${error.message}`);
  }
}

async function findUsedInvite(client, member) {
  if (!member.guild.invites?.fetch) return null;
  try {
    const before = client.inviteCache?.get(member.guild.id) || new Map();
    const after = await member.guild.invites.fetch();
    const used = after.find((invite) => (invite.uses || 0) > (before.get(invite.code) || 0));
    client.inviteCache ??= new Map();
    client.inviteCache.set(member.guild.id, new Map(after.map((invite) => [invite.code, invite.uses || 0])));
    return used || null;
  } catch (error) {
    console.warn(`Unable to resolve inviter for ${member.guild.id}: ${error.message}`);
    return null;
  }
}

async function sendMemberMessage(client, member, type) {
  const settings = getSettings(client, member.guild.id).invites;
  const channelId = type === "join" ? settings.joinChannelId : settings.leaveChannelId;
  if (!channelId) return;
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel?.isTextBased()) return;
  const message = render(type === "join" ? settings.joinMessage : settings.leaveMessage, member, channel);
  await channel.send({ content: message, embeds: [embed(type === "join" ? "success" : "info", type === "join" ? "Welcome" : "Goodbye", message)] });
}

module.exports = { getSettings, render, metric, leaderboard, refreshInviteSnapshot, findUsedInvite, sendMemberMessage };