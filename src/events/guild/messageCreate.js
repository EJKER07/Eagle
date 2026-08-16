const { Events } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { runPrefixCommand } = require("../../services/prefixCommandService");
const { metric } = require("../../services/communityService");
const { getLevelInfo } = require("../../services/levelingService");

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

    client.db.setLevel(message.guild.id, message.author.id, { xp: totalXp, level: nextLevelInfo.level, lastXpAt: Date.now() });
    if (nextLevelInfo.level > previousLevel) {
      await message.channel.send({ embeds: [embed("leveling", "Level up!", `${message.author} reached level **${nextLevelInfo.level}**.`)] });
    }
  },
};
