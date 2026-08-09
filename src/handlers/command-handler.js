const fs = require("node:fs");
const path = require("node:path");
const { PermissionFlagsBits } = require("discord.js");
const { checkCooldown } = require("../utils/cooldowns");
const { errorEmbed } = require("../utils/embeds");

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function loadCommands(client, directory) {
  const files = filesIn(directory).filter((file) => file.endsWith(".js")).sort();
  for (const file of files) {
    const command = require(file);
    if (!command.data?.name || typeof command.execute !== "function") {
      throw new Error(`Invalid command module: ${file}`);
    }
    if (client.commands.has(command.data.name)) throw new Error(`Duplicate command: ${command.data.name}`);
    client.commands.set(command.data.name, command);
  }
  console.log(`Loaded ${client.commands.size} command(s).`);
}

async function executeCommand(client, interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  if (command.guildOnly && !interaction.guild) {
    return interaction.reply({ embeds: [errorEmbed("This command can only be used in a server.")], ephemeral: true });
  }
  if (command.permissions && interaction.guild && !interaction.memberPermissions.has(command.permissions)) {
    return interaction.reply({ embeds: [errorEmbed("You do not have permission to use this command.")], ephemeral: true });
  }
  const remaining = checkCooldown(client, command.data.name, interaction.user.id, command.cooldown);
  if (remaining) {
    return interaction.reply({ embeds: [errorEmbed(`Please wait ${Math.ceil(remaining / 1000)}s before using this again.`)], ephemeral: true });
  }
  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Command failed: ${command.data.name}`, error);
    const response = { embeds: [errorEmbed("Something went wrong. Please try again later.")], ephemeral: true };
    if (interaction.deferred || interaction.replied) await interaction.followUp(response);
    else await interaction.reply(response);
  }
}

module.exports = { loadCommands, executeCommand, PermissionFlagsBits };
