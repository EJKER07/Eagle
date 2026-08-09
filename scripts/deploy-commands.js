require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { loadCommands } = require("../src/loaders/commandLoader");
const { Collection } = require("discord.js");
const config = require("../src/config");

const client = { commands: new Collection() };
loadCommands(client);
const token = config.deployment.token;
const clientId = config.deployment.clientId;
if (!token || !clientId) throw new Error("DISCORD_TOKEN and CLIENT_ID are required.");
const rest = new REST({ version: "10" }).setToken(token);
const route = config.deployment.guildId ? Routes.applicationGuildCommands(clientId, config.deployment.guildId) : Routes.applicationCommands(clientId);
const body = [...client.commands.values()].map((command) => command.data.toJSON());
rest.get(route)
  .then((current) => {
    const normalize = (commands) => JSON.stringify(commands.map(({ id, version, ...command }) => command).sort((a, b) => a.name.localeCompare(b.name)));
    if (normalize(current) === normalize(body)) return false;
    return rest.put(route, { body });
  })
  .then((updated) => console.log(updated === false ? "Slash commands already synchronized." : "Slash commands deployed."))
  .catch((error) => { console.error(error); process.exitCode = 1; });
