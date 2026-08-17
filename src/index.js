require("dotenv").config();

const { Client, Collection, GatewayIntentBits, Partials } = require("discord.js");
const config = require("./config/index");
const { loadCommands } = require("./handlers/command-handler");
const { loadEvents } = require("./handlers/event-handler");
const database = require("./database");
const CommandDataStore = require("./services/commandDataStore");
const VoiceConnectionManager = require("./services/voiceConnectionManager");
const AudioStreamMonitor = require("./services/audioStreamMonitor");

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
      GatewayIntentBits.GuildMessageReactions,
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
  client.dataStore = new CommandDataStore(database);
  client.startedAt = Date.now();

  loadCommands(client, config.paths.commands);
  loadEvents(client, config.paths.events);
  require("./distube")(client);
  client.voiceManager = new VoiceConnectionManager(client);
  client.audioMonitor = new AudioStreamMonitor(client);

  process.on("unhandledRejection", (error) => {
    console.error("[UNHANDLED REJECTION]", error?.message || error);
    if (error?.stack) console.error(error.stack);
  });
  process.on("uncaughtException", (error) => {
    console.error("[UNCAUGHT EXCEPTION]", error?.message || error);
    if (error?.stack) console.error(error.stack);
  });

  client.login(token).catch((error) => {
    console.error("Discord login failed", error);
    process.exitCode = 1;
  });
}
