require("dotenv").config();

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const config = require("./config/index");
const { loadCommands } = require("./handlers/command-handler");
const { loadEvents } = require("./handlers/event-handler");
const database = require("./database");

const token = config.deployment.token;

if (!token) {
  console.error("DISCORD_TOKEN or TOKEN is missing. Add one to .env before starting Eagle Premium.");
  process.exitCode = 1;
} else {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildBans,
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.MessageReaction, Partials.User],
  });

  client.commands = new Collection();
  client.cooldowns = new Collection();
  client.config = config;
  client.db = database;
  client.database = database;
  client.startedAt = Date.now();

  loadCommands(client, config.paths.commands);
  loadEvents(client, config.paths.events);
  require("./distube")(client);

  process.on("unhandledRejection", (error) => console.error("Unhandled rejection", error));
  process.on("uncaughtException", (error) => {
    console.error("Uncaught exception", error);
  });

  client.login(token).catch((error) => {
    console.error("Discord login failed", error);
    process.exitCode = 1;
  });
}
