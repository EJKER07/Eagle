const { Events } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { runPrefixCommand } = require("../../services/prefixCommandService");
const { metric } = require("../../services/communityService");

module.exports = {
  name: Events.MessageCreate,
  once: false,
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;
    const settings = client.db.getGuildSettings(message.guild.id);
    if (!settings.metrics.blacklistedChannelIds.includes(message.channel.id)) {
      await metric(client, message.guild.id, message.author.id, "messages");
      const day = new Date().toISOString().slice(0, 10);
      await metric(client, message.guild.id, `${message.author.id}:${day}`, "messages");
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
    const xp = (row?.xp || 0) + leveling.xpPerMessage;
    const level = Math.floor(Math.sqrt(xp / 100));
    client.db.setLevel(message.guild.id, message.author.id, { xp, level, lastXpAt: Date.now() });
    if (level > (row?.level || 0)) await message.channel.send({ embeds: [embed("leveling", "Level up!", `${message.author} reached level **${level}**.`)] });
  },
};
