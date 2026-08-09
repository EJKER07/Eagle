const { Events } = require("discord.js");

module.exports = {
  name: Events.GuildCreate,
  once: false,
  execute(_client, guild) {
    _client.db.getGuildSettings(guild.id);
  },
};
