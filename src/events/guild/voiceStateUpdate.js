const { Events } = require("discord.js");
const { metric } = require("../../services/communityService");

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
      if (startedAt) await metric(client, oldState.guild.id, oldState.id, "voiceSeconds", Math.floor((Date.now() - startedAt) / 1000));
    }
  },
};