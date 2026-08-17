const { Events, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { runPrefixCommand } = require("../../services/prefixCommandService");
const { metric } = require("../../services/communityService");
const { getLevelInfo } = require("../../services/levelingService");
const { DEFAULT_STAFF_ROLE_ID, getCheckinState } = require("../../services/promoDemoService");

function shouldReactToEnter(content) {
  const normalized = String(content || "").trim().toLowerCase();
  return Boolean(normalized && /\b(enter|entry|entering|press enter|hit enter|submit|send|join)\b/.test(normalized));
}

function isGiveawayEntryMessage(content) {
  const normalized = String(content || "").trim().toLowerCase();
  return /^(?:enter|join)(?:\s+giveaway)?$/i.test(normalized);
}

async function processGiveawayEntry(client, message) {
  if (!isGiveawayEntryMessage(message.content)) return false;
  const giveaway = client.db.getGiveaways(message.guild.id).find((item) => item.channelId === message.channel.id && !item.ended && item.endsAt > Date.now());
  if (!giveaway) return false;
  if (giveaway.entries.includes(message.author.id)) {
    await message.react("✅").catch(() => {});
    return true;
  }
  giveaway.entries.push(message.author.id);
  client.db.saveGiveaway(message.guild.id, giveaway);
  await message.react("🎉").catch(() => {});
  return true;
}

module.exports = {
  shouldReactToEnter,
  isGiveawayEntryMessage,
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;
    const settings = client.db.getGuildSettings(message.guild.id);
    if (settings.automod.enabled) {
      const content = message.content.toLocaleLowerCase();
      const blocked = (settings.automod.blacklistWords || []).find((word) => new RegExp(`(?:^|\\s)${word.replace(/[.*+?^${}()|[\\]\\]/g, "\\\\$&")}(?:$|\\s)`, "iu").test(content));
      if (blocked) {
        await message.delete().catch(() => {});
        return;
      }
    }
    if (!settings.metrics.blacklistedChannelIds.includes(message.channel.id)) {
      await metric(client, message.guild.id, message.author.id, "messages");
      const day = new Date().toISOString().slice(0, 10);
      await metric(client, message.guild.id, `${message.author.id}:${day}`, "messages");
    }

    const ticketTopic = message.channel.topic || "";
    const ticketOwnerId = ticketTopic.match(/^ticket-owner:(\d+)$/)?.[1];
    const configuredStaffRoleIds = settings.tickets?.staffRoleIds?.length ? settings.tickets.staffRoleIds : (settings.tickets?.staffRoleId ? [settings.tickets.staffRoleId] : []);
    const staffRoleIds = [...new Set([DEFAULT_STAFF_ROLE_ID, ...configuredStaffRoleIds.filter(Boolean)])];
    const hasStaffRole = message.member && (message.member.permissions.has(PermissionFlagsBits.ManageChannels) || staffRoleIds.some((roleId) => message.member.roles.cache.has(roleId)));
    if (ticketOwnerId && hasStaffRole && message.author.id !== ticketOwnerId) {
      const promotionState = settings.promotion || { checkins: {}, ticketTotals: {} };
      const previousCheckin = promotionState.checkins?.[message.channel.id];
      const nextState = getCheckinState({
        ...promotionState,
        staffMembers: new Set(promotionState.staffMembers || []),
      }, { userId: message.author.id, roleId: staffRoleIds.find((roleId) => message.member.roles.cache.has(roleId)) || DEFAULT_STAFF_ROLE_ID }, message.channel.id);

      if (!previousCheckin && nextState.checkins?.[message.channel.id] === message.author.id) {
        const currentCount = nextState.ticketTotals?.[message.author.id] || 1;
        client.db.updateGuildSettings(message.guild.id, (guildSettings) => ({
          ...guildSettings,
          promotion: {
            ...(guildSettings.promotion || {}),
            checkins: nextState.checkins,
            ticketTotals: nextState.ticketTotals,
          },
        }));
        client.db.updateMetric(message.guild.id, message.author.id, "tickets", 1);
        const day = new Date().toISOString().slice(0, 10);
        client.db.updateMetric(message.guild.id, `${message.author.id}:${day}`, "tickets", 1);
        const confirmation = await message.reply({
          content: `${message.author} got check-in. This ticket is now counted for your check-ins (${currentCount}).`,
          allowedMentions: { repliedUser: false },
        }).catch(() => null);
        if (confirmation) setTimeout(() => confirmation.delete().catch(() => {}), 1000);
      }
    }
    if (await processGiveawayEntry(client, message)) return;
    if (shouldReactToEnter(message.content)) {
      await message.react("✅").catch(() => {});
    }
    const prefix = client.db.getGuildSettings(message.guild.id).prefix || client.config.prefix;
    if (message.content.startsWith(prefix)) {
      try {
        const handled = await runPrefixCommand(client, message, message.content.slice(prefix.length));
        if (handled) return;
      } catch (error) {
        console.error("Prefix command failed", error);
        await message.reply({ embeds: [embed("error", "Command failed", error.message || "Something went wrong.")] }).catch(() => {});
        return;
      }
    }
    const afk = client.db.getAfk(message.guild.id, message.author.id);
    if (afk) {
      client.db.clearAfk(message.guild.id, message.author.id);
      await message.reply({ embeds: [embed("success", "AFK removed", "Welcome back. Your AFK status has been cleared.")], allowedMentions: { repliedUser: false } });
    }
    for (const user of message.mentions.users.values()) {
      const mentionedAfk = client.db.getAfk(message.guild.id, user.id);
      if (mentionedAfk) await message.reply({ embeds: [embed("info", "AFK user", `<@${user.id}> is AFK: ${mentionedAfk.reason}`)], allowedMentions: { repliedUser: false } });
    }
    const leveling = client.db.getGuildSettings(message.guild.id).leveling;
    if (!leveling.enabled) return;
    const row = client.db.getLevel(message.guild.id, message.author.id);
    if (row && Date.now() - row.lastXpAt < leveling.cooldownMs) return;

    const gainedXp = Number(leveling.xpPerMessage) || 1;
    const previousLevel = row?.level || 0;
    const totalXp = (row?.xp || 0) + gainedXp;
    const nextLevelInfo = getLevelInfo(totalXp, `${message.guild.id}:${message.author.id}`);

    client.db.setLevel(message.guild.id, message.author.id, { xp: totalXp, level: Math.max(nextLevelInfo.level, previousLevel), lastXpAt: Date.now() });
    if (nextLevelInfo.level > previousLevel) {
      const announcementChannel = leveling.announcementChannelId
        ? message.guild.channels.cache.get(leveling.announcementChannelId) || message.guild.channels.resolve(leveling.announcementChannelId)
        : message.channel;
      const avatarUrl = message.author.displayAvatarURL({ size: 256, extension: "png" });
      const levelEmbed = new EmbedBuilder()
        .setColor(0x2b2d31)
        .setAuthor({ name: `${message.author.username.toUpperCase()} ON TOP`, iconURL: avatarUrl })
        .setTitle("LEVEL-UP!")
        .setDescription(`**${previousLevel + 1} • ${nextLevelInfo.level}**`)
        .setThumbnail(avatarUrl)
        .setFooter({ text: "Eagle Premium • leveling" })
        .setTimestamp();
      if (announcementChannel?.isTextBased()) {
        await announcementChannel.send({ embeds: [levelEmbed] }).catch(() => {});
      }
    }
  },
};
