const { REST, Routes } = require('discord.js');
const { loadCommands } = require('./loaders');
const path = require('node:path');

async function buildCommandPayload(directory = path.join(__dirname, 'commands')) {
  const commands = await loadCommands(directory);
  return [...commands.values()].map(command => command.data.toJSON());
}

async function deployCommands(config) {
  const body = await buildCommandPayload();
  const rest = new REST({ version: '10' }).setToken(config.token);
  const route = config.guildId ? Routes.applicationGuildCommands(config.clientId, config.guildId) : Routes.applicationCommands(config.clientId);
  console.log(`Deploying ${body.length} command(s) to ${config.guildId ? 'guild' : 'global'} scope.`);
  return rest.put(route, { body });
}

module.exports = { buildCommandPayload, deployCommands };
