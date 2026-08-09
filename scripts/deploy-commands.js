require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { loadCommands } = require("../src/loaders/commandLoader");
const { Collection } = require("discord.js");
const config = require("../src/config");
const { MAX_SLASH_COMMANDS } = require("../src/services/commandDeployment");

const client = { commands: new Collection() };
loadCommands(client);
const token = config.deployment.token;
const clientId = config.deployment.clientId;
if (!token || !clientId) throw new Error("DISCORD_TOKEN and CLIENT_ID are required.");
const rest = new REST({ version: "10" }).setToken(token);
const route = config.deployment.guildId ? Routes.applicationGuildCommands(clientId, config.deployment.guildId) : Routes.applicationCommands(clientId);
const body = [...client.commands.values()].map((command) => command.data.toJSON());
if (body.length > MAX_SLASH_COMMANDS) {
  throw new Error(`Discord allows at most ${MAX_SLASH_COMMANDS} slash commands per scope, but this deployment contains ${body.length}. Consolidate commands into subcommands or remove slash aliases.`);
}
rest.get(route)
  .then((current) => {
    const normalize = (commands) => JSON.stringify(commands.map(({ id, version, ...command }) => command).sort((a, b) => a.name.localeCompare(b.name)));
    if (normalize(current) === normalize(body)) return false;
    return rest.put(route, { body });
  })
  .then((updated) => console.log(updated === false ? "Slash commands already synchronized." : "Slash commands deployed."))
  .catch((error) => {
    console.error("Slash command deployment failed:");
    console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    process.exitCode = 1;
  });
