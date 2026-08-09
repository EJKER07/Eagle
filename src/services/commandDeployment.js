const { REST, Routes } = require("discord.js");

async function deployCommands(client) {
  const body = [...client.commands.values()].map((command) => command.data.toJSON());
  const deployment = client.config.deployment;
  if (!deployment.token || !deployment.clientId) throw new Error("Discord deployment credentials are missing.");
  const rest = new REST({ version: "10" }).setToken(deployment.token);
  const route = deployment.guildId
    ? Routes.applicationGuildCommands(deployment.clientId, deployment.guildId)
    : Routes.applicationCommands(deployment.clientId);
  const current = await rest.get(route);
  const normalize = (commands) => JSON.stringify(commands.map(({ id, version, ...command }) => command).sort((a, b) => a.name.localeCompare(b.name)));
  if (normalize(current) === normalize(body)) {
    console.log(`Slash commands already synchronized (${body.length}).`);
    return;
  }
  await rest.put(route, { body });
  console.log(`Synchronized ${body.length} slash command(s) (${deployment.guildId ? "development" : "global"}).`);
}

module.exports = { deployCommands };
