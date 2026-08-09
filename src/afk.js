async function setAfk(database, guildId, userId, reason) {
  const guild = database.getGuild(guildId);
  const afk = { ...guild.afk, [userId]: { reason, createdAt: new Date().toISOString() } };
  database.setGuild(guildId, { afk });
  return afk[userId];
}

function clearAfk(database, guildId, userId) {
  const guild = database.getGuild(guildId);
  if (!guild.afk?.[userId]) return false;
  const afk = { ...guild.afk }; delete afk[userId]; database.setGuild(guildId, { afk }); return true;
}

module.exports = { setAfk, clearAfk };
