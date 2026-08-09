const { PermissionFlagsBits } = require("discord.js");
const { embed } = require("../utils/embeds");

function hasCooldown(client, interaction, command) {
  const scope = interaction.guildId || "global";
  const key = `${scope}:${command.data.name}:${interaction.user.id}`;
  const now = Date.now();
  const expires = client.cooldowns.get(key) || 0;
  if (expires > now) return Math.ceil((expires - now) / 1000);
  client.cooldowns.set(key, now + command.cooldown * 1000);
  return 0;
}

function enforceGuild(interaction) {
  if (!interaction.guild) throw new Error("This command can only be used inside a server.");
}

function enforcePermissions(interaction, permissions) {
  if (!permissions?.length) return;
  if (!interaction.memberPermissions?.has(permissions)) {
    throw new Error("You do not have the required Discord permission to use this command.");
  }
}

async function executeInteraction(client, interaction) {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    if (command.guildOnly !== false) enforceGuild(interaction);
    enforcePermissions(interaction, command.permissions);
    const remaining = hasCooldown(client, interaction, command);
    if (remaining) throw new Error(`Please wait ${remaining}s before using this command again.`);
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Command ${interaction.commandName} failed: ${error.stack || error}`);
    const payload = { embeds: [embed("error", "Command failed", error.message)], ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
    else await interaction.reply(payload).catch(() => {});
  }
}

module.exports = { executeInteraction, enforceGuild, enforcePermissions, PermissionFlagsBits };
