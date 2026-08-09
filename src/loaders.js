const fs = require('node:fs/promises');
const path = require('node:path');

async function filesRecursive(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await filesRecursive(fullPath));
    else if (entry.isFile() && fullPath.endsWith('.js')) files.push(fullPath);
  }
  return files.sort();
}

async function loadCommands(directory) {
  const commands = new Map();
  const aliasCommand = (command, name) => {
    if (name === command.data.name) return command;
    const json = command.data.toJSON();
    const data = { ...command.data, name, description: json.description, options: json.options, toJSON: () => ({ ...json, name }) };
    return { ...command, data };
  };
  for (const file of await filesRecursive(directory)) {
    const command = require(file);
    if (!command.data?.name || typeof command.execute !== 'function') {
      throw new Error(`Invalid command module: ${file}`);
    }
    const names = [command.data.name, ...(command.aliases || [])];
    for (const name of names) {
      if (commands.has(name)) throw new Error(`Duplicate command: ${name}`);
      commands.set(name, aliasCommand(command, name));
    }
  }
  return commands;
}

async function loadEvents(directory) {
  const events = [];
  const names = new Set();
  for (const file of await filesRecursive(directory)) {
    const event = require(file);
    if (!event.name || typeof event.once !== 'boolean' || typeof event.execute !== 'function') {
      throw new Error(`Invalid event module: ${file}`);
    }
    if (names.has(event.name)) throw new Error(`Duplicate event: ${event.name}`);
    names.add(event.name);
    events.push(event);
  }
  return events;
}

module.exports = { filesRecursive, loadCommands, loadEvents };
