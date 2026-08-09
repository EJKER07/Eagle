const { PermissionFlagsBits } = require("discord.js");

function requireVoice(interaction) {
  const channel = interaction.member?.voice?.channel;
  if (!channel) throw new Error("Join a voice channel first.");
  if (interaction.guild.members.me?.voice.channelId && interaction.guild.members.me.voice.channelId !== channel.id) {
    throw new Error("I am already playing in another voice channel.");
  }
  return channel;
}

function requireQueue(client, interaction) {
  const queue = client.distube?.getQueue(interaction.guildId);
  if (!queue) throw new Error("There is no active music queue.");
  return queue;
}

module.exports = { requireVoice, requireQueue, PermissionFlagsBits };
