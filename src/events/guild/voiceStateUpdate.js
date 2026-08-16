const { Events } = require("discord.js");
const { metric } = require("../../services/communityService");
const { getLevelInfo, getVoiceXpForSeconds } = require("../../services/levelingService");
const { embed } = require("../../utils/embeds");

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  async execute(client, oldState, newState) {
    client.voiceSessions ??= new Map();
    const key = `${oldState.guild.id}:${oldState.id}`;
    if (!oldState.channelId && newState.channelId) {
      client.voiceSessions.set(key, Date.now());
      return;
    }
    if (oldState.channelId && !newState.channelId) {
      const startedAt = client.voiceSessions.get(key);
      client.voiceSessions.delete(key);
      if (startedAt) {
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        await metric(client, oldState.guild.id, oldState.id, "voiceSeconds", seconds);

        const settings = client.db.getGuildSettings(oldState.guild.id);
        if (settings.leveling?.enabled) {
          const row = client.db.getLevel(oldState.guild.id, oldState.id);
          const gainedXp = getVoiceXpForSeconds(seconds, `${oldState.guild.id}:${oldState.id}`);
          const totalXp = (row?.xp || 0) + gainedXp;
          const previousLevel = row?.level || 0;
          const nextLevelInfo = getLevelInfo(totalXp, `${oldState.guild.id}:${oldState.id}`);
          client.db.setLevel(oldState.guild.id, oldState.id, { xp: totalXp, level: nextLevelInfo.level, lastXpAt: Date.now() });
          if (nextLevelInfo.level > previousLevel) {
            const member = oldState.guild.members.cache.get(oldState.id);
            const announcementChannelId = settings.leveling.announcementChannelId || settings.leveling.leaderboardChannelId;
            const targetChannel = announcementChannelId ? oldState.guild.channels.cache.get(announcementChannelId) || oldState.guild.channels.resolve(announcementChannelId) : oldState.channel;
            if (member && targetChannel?.isTextBased()) {
              const voiceLevelEmbed = embed("leveling", "XJKER", `${member} has reached level **${nextLevelInfo.level}** in voice!\n\n**Level-up!**`);
              await targetChannel.send({ embeds: [voiceLevelEmbed] }).catch(() => {});
            }
          }
        }
      }
    }
  },
};