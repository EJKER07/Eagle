const { PermissionFlagsBits } = require('discord.js');

function hasPermission(interaction, required = []) {
  if (!required.length) return true;
  return required.every(permission => interaction.memberPermissions?.has(PermissionFlagsBits[permission]));
}

module.exports = { hasPermission };
