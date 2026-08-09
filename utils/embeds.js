const { EmbedBuilder, Colors } = require("discord.js");

const palette = {
  success: Colors.Green,
  error: Colors.Red,
  warning: Colors.Yellow,
  security: Colors.Blurple,
  moderation: Colors.Orange,
  info: Colors.Blurple,
  afk: Colors.Purple,
};

const icons = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  security: "🛡️",
  moderation: "🔨",
  info: "ℹ️",
  afk: "💤",
};

function createEmbed({ type = "info", title = "FirstLight", description = "", fields = [], footer = "FirstLight", timestamp = true } = {}) {
  const embed = new EmbedBuilder()
    .setColor(palette[type] || palette.info)
    .setTitle(`${icons[type] || icons.info} ${title}`)
    .setFooter({ text: footer });

  if (typeof description === "string" && description.trim().length > 0) {
    embed.setDescription(description);
  }

  if (Array.isArray(fields) && fields.length > 0) {
    embed.addFields(fields.map(([name, value, inline = false]) => ({ name, value, inline })));
  }

  if (timestamp) embed.setTimestamp();
  return embed;
}

function successEmbed(description, title = "Success") {
  return createEmbed({ type: "success", title, description });
}

function errorEmbed(description, title = "Error") {
  return createEmbed({ type: "error", title, description });
}

function warningEmbed(description, title = "Warning") {
  return createEmbed({ type: "warning", title, description });
}

function securityEmbed(description, title = "Security Alert") {
  return createEmbed({ type: "security", title, description });
}

function moderationEmbed(description, title = "Moderation Action") {
  return createEmbed({ type: "moderation", title, description });
}

function afkData(description, title = "AFK") {
  return createEmbed({ type: "afk", title, description });
}

function getCommands(client) {
  const categories = {};
  if (client && client.commands) {
    for (const command of client.commands.values()) {
      if (!command) continue;
      const category = command.category || "Utility";
      if (!categories[category]) categories[category] = [];
      if (command.name) categories[category].push(command.name);
    }
  }

  const fields = Object.entries(categories).map(([name, list]) => [name, list.join(", ") || "No commands", false]);
  return createEmbed({
    type: "info",
    title: "FirstLight Commands",
    description: "Available commands in this bot.",
    fields,
  });
}

module.exports = {
  createEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  securityEmbed,
  moderationEmbed,
  afkData,
  getCommands,
};