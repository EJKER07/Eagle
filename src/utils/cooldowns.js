function checkCooldown(client, commandName, userId, duration) {
  if (!duration) return 0;
  if (!client.cooldowns.has(commandName)) client.cooldowns.set(commandName, new Map());
  const timestamps = client.cooldowns.get(commandName);
  const expiresAt = timestamps.get(userId) || 0;
  const remaining = expiresAt - Date.now();
  if (remaining > 0) return remaining;
  timestamps.set(userId, Date.now() + duration);
  return 0;
}

module.exports = { checkCooldown };
