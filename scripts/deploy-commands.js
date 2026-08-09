require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { loadCommands } = require("../src/loaders/commandLoader");
const { Collection } = require("discord.js");
const config = require("../src/config");
const { selectSlashCommands } = require("../src/services/commandDeployment");

const client = { commands: new Collection() };
loadCommands(client);
const token = config.deployment.token;
const clientId = config.deployment.clientId;
if (!token || !clientId) throw new Error("DISCORD_TOKEN and CLIENT_ID are required.");
const rest = new REST({ version: "10" }).setToken(token);
const route = config.deployment.guildId ? Routes.applicationGuildCommands(clientId, config.deployment.guildId) : Routes.applicationCommands(clientId);
const { selected, skipped } = selectSlashCommands(client.commands);
const body = selected.map((command) => command.data.toJSON());
if (skipped.length) console.warn(`Discord slash-command limit: deploying ${body.length} core commands; prefix-only commands: ${skipped.map((command) => command.data.name).join(", ")}`);
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
