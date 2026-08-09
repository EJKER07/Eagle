const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "..", "config", "config.json");

function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch {
    const defaultConfig = {
      prefix: "$",
      loggingChannel: null,
      antiNuke: { enabled: true, whitelist: [], limits: {}, timeWindow: 60000, punishment: "kick" },
      welcomeMessages: { enabled: true, channelId: null, message: "Welcome to the server, {user}!", goodbyeMessage: "Goodbye, {user}! We will miss you!" },
      afk: { enabled: true, dmNotification: true },
    };
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    return defaultConfig;
  }
}

function updateConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function setConfig(config) {
  updateConfig(config);
}

module.exports = {
  getConfig,
  updateConfig,
  setConfig,
};