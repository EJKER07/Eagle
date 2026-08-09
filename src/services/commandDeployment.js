const { REST, Routes } = require("discord.js");

const MAX_SLASH_COMMANDS = 100;
const slashPriority = [
  "help", "ping", "serverinfo", "userinfo", "avatar", "botinfo", "membercount", "afk",
  "setgreet", "testgreet", "disablegreet", "setup", "config", "automod", "antinuke",
  "ban", "kick", "timeout", "untimeout", "warn", "warnings", "clear", "lock", "unlock",
  "poll", "giveaway", "play", "queue", "skip", "stop", "balance", "daily", "rank",
  "invites", "messages", "lb", "vc", "gstart", "gend", "greroll", "setprefix",
];

function selectSlashCommands(commands, limit = MAX_SLASH_COMMANDS) {
  const values = [...commands.values()];
  const byName = new Map(values.map((command) => [command.data.name, command]));
  const selected = [];
  for (const name of slashPriority) {
    const command = byName.get(name);
    if (command && !selected.includes(command)) selected.push(command);
  }
  for (const command of values.sort((a, b) => a.data.name.localeCompare(b.data.name))) {
    if (selected.length >= limit) break;
    if (!selected.includes(command)) selected.push(command);
  }
  return { selected, skipped: values.filter((command) => !selected.includes(command)) };
}

async function deployCommands(client) {
  const { selected, skipped } = selectSlashCommands(client.commands);
  const body = selected.map((command) => command.data.toJSON());
  if (skipped.length) console.warn(`Discord slash-command limit: deploying ${body.length} core commands; prefix-only commands: ${skipped.map((command) => command.data.name).join(", ")}`);
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

function formatDeploymentError(error) {
  return JSON.stringify(error, Object.getOwnPropertyNames(error), 2);
}

module.exports = { deployCommands, formatDeploymentError, selectSlashCommands, MAX_SLASH_COMMANDS };
