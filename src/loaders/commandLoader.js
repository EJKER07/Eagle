const fs = require("node:fs");
const path = require("node:path");

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  });
}

function loadCommands(client) {
  const directory = path.join(__dirname, "..", "commands");
  const names = new Set();
  const aliasCommand = (command, name) => {
    if (name === command.data.name) return command;
    const json = command.data.toJSON();
    const data = { ...command.data, name, description: json.description, options: json.options, toJSON: () => ({ ...json, name }) };
    return { ...command, data };
  };
  for (const file of filesIn(directory).filter((item) => item.endsWith(".js"))) {
    const command = require(file);
    if (!command?.data?.name || typeof command.execute !== "function") {
      throw new Error(`Invalid command module: ${file}`);
    }
    const name = command.data.name;
    for (const commandName of [name, ...(command.aliases || [])]) {
      if (names.has(commandName)) throw new Error(`Duplicate command name: ${commandName}`);
      names.add(commandName);
      const registered = aliasCommand(command, commandName);
      registered.cooldown ??= 3;
      client.commands.set(commandName, registered);
    }
  }
  console.log(`Loaded ${client.commands.size} production command(s).`);
}

module.exports = { loadCommands };
