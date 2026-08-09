const { Events } = require("discord.js");

module.exports = {
  name: Events.MessageReactionAdd,
  once: false,
  async execute(client, reaction, user) {
    if (user.bot) return;
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }
    const message = reaction.message;
    if (!message.guild) return;
    const reactionName = reaction.emoji.id ? reaction.emoji.name : reaction.emoji.name;
    const validEmoji = reaction.emoji.id ? reaction.emoji.name === "Fire_money" : reaction.emoji.name === "🎉";
    if (!validEmoji) return;
    if (message.partial) {
      try {
        await message.fetch();
      } catch {
        return;
      }
    }
    if (!message.guild) return;
    const giveaway = client.db.getGiveaways(message.guild.id).find((item) => item.messageId === message.id && !item.ended && item.endsAt > Date.now());
    if (!giveaway) return;
    if (giveaway.entries.includes(user.id)) return;
    giveaway.entries.push(user.id);
    client.db.saveGiveaway(message.guild.id, giveaway);
  },
};
