const { Events, AuditLogEvent } = require("discord.js");
const { embed } = require("../../utils/embeds");

const tracked = new Map();
const types = new Map([
  [AuditLogEvent.ChannelDelete, "channelDelete"],
  [AuditLogEvent.RoleDelete, "roleDelete"],
  [AuditLogEvent.MemberBanAdd, "ban"],
]);

module.exports = {
  name: Events.GuildAuditLogEntryCreate,
  once: false,
  async execute(client, entry, guild) {
    const key = types.get(entry.action);
    if (!key || !entry.executorId || entry.executorId === client.user.id) return;
    const settings = client.db.getGuildSettings(guild.id).antinuke;
    if (!settings.enabled || settings.whitelistUsers.includes(entry.executorId)) return;
    const now = Date.now();
    const bucketKey = `${guild.id}:${entry.executorId}:${key}`;
    const values = (tracked.get(bucketKey) || []).filter((timestamp) => now - timestamp < settings.windowMs);
    values.push(now);
    tracked.set(bucketKey, values);
    const limit = settings.limits[key] || 5;
    if (values.length < limit) return;
    const member = await guild.members.fetch(entry.executorId).catch(() => null);
    if (!member || !member.manageable) return;
    if (settings.punishment === "ban" && member.bannable) await member.ban({ reason: `FirstLight Anti-Nuke: ${key} threshold exceeded` });
    else if (settings.punishment === "kick" && member.kickable) await member.kick(`FirstLight Anti-Nuke: ${key} threshold exceeded`);
    else if (member.moderatable) await member.timeout(24 * 60 * 60 * 1000, `FirstLight Anti-Nuke: ${key} threshold exceeded`);
    const channelId = client.db.getGuildSettings(guild.id).logging.security;
    const channel = channelId ? guild.channels.cache.get(channelId) : null;
    if (channel?.isTextBased()) await channel.send({ embeds: [embed("security", "Anti-Nuke action", `${member.user.tag} exceeded the **${key}** limit and was punished.`)] });
    tracked.delete(bucketKey);
  },
};
