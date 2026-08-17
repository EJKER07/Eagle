const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { embed } = require("../utils/embeds");

function giveawayComponents(id, ended = false) {
  return [];
}

function formatDuration(ms) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

function activeEmbed(giveaway, reactionEmoji = "🎉", prizeEmoji = "🎁", announcementEmoji = "🎉") {
  const remainingMs = giveaway.endsAt - Date.now();
  const remainingText = remainingMs > 0 ? formatDuration(remainingMs) : "ending now";
  const unixTimestamp = Math.floor(giveaway.endsAt / 1000);
  const card = embed("giveaway", `${announcementEmoji} New Giveaway ${announcementEmoji}`, `${prizeEmoji} **${giveaway.prize}**\n\n• Winners: **${giveaway.winnerCount}**\n• Ends: <t:${unixTimestamp}:F> (in ${remainingText})\n• Hosted by: <@${giveaway.hostId}>\n\n• React with ${reactionEmoji} to participate!`)
    .setTimestamp(new Date(giveaway.endsAt));
  if (giveaway.hostAvatarUrl) card.setThumbnail(giveaway.hostAvatarUrl);
  return card;
}

function endedEmbed(giveaway, winners) {
  return embed("giveaway", "Giveaway ended", `Prize: **${giveaway.prize}**`, [
    { name: "Winner(s)", value: winners.length ? winners.map((id) => `<@${id}>`).join(", ") : "No valid entries", inline: false },
    { name: "Hosted by", value: `<@${giveaway.hostId}>`, inline: true },
  ]);
}

function pickWinners(entries, count) {
  const pool = [...entries];
  const winners = [];
  while (pool.length && winners.length < count) winners.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return winners;
}

async function finishGiveaway(client, giveaway) {
  const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
  const message = channel ? await channel.messages.fetch(giveaway.messageId).catch(() => null) : null;
  if (!message) {
    client.db.removeGiveaway(giveaway.guildId, giveaway.id);
    return [];
  }
  const winners = pickWinners(giveaway.entries || [], giveaway.winnerCount);
  const next = { ...giveaway, ended: true, winners, endedAt: Date.now() };
  client.db.saveGiveaway(giveaway.guildId, next);
  await message.edit({ embeds: [endedEmbed(next, winners)], components: giveawayComponents(next.id, true) });
  await message.channel.send({ content: winners.length ? `Congratulations ${winners.map((id) => `<@${id}>`).join(", ")}! You won **${giveaway.prize}**.` : "The giveaway ended with no valid entries." });
  return winners;
}

function scheduleGiveaway(client, giveaway) {
  if (giveaway.ended) return;
  const delay = Math.max(0, giveaway.endsAt - Date.now());
  setTimeout(() => finishGiveaway(client, giveaway).catch((error) => console.error("Giveaway finish failed", error)), delay);
}

function scheduleAll(client) {
  for (const guild of client.guilds.cache.values()) {
    for (const giveaway of client.db.getGiveaways(guild.id)) scheduleGiveaway(client, giveaway);
  }
}

module.exports = { activeEmbed, endedEmbed, giveawayComponents, finishGiveaway, scheduleGiveaway, scheduleAll };