const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { embed } = require("../utils/embeds");

function giveawayComponents(id, ended = false) {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`giveaway:join:${id}`).setEmoji("🎉").setLabel(ended ? "Giveaway ended" : "Enter giveaway").setStyle(ended ? ButtonStyle.Secondary : ButtonStyle.Success).setDisabled(ended),
  )];
}

function activeEmbed(giveaway) {
  const card = embed("giveaway", "🎉 New Giveaway 🎉", `🎁 **${giveaway.prize}**\n\n• Winners: **${giveaway.winnerCount}**\n• Ends in: <t:${Math.floor(giveaway.endsAt / 1000)}:R>\n• Hosted by: <@${giveaway.hostId}>\n\n• React with 🎉 to participate!`)
    .setFooter({ text: `Ends at • ${new Date(giveaway.endsAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}` });
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