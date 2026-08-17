const { EmbedBuilder, Colors } = require("discord.js");
const config = require("../config/index");

const embedColors = {
  success: 0xf4df1b,
  error: 0xed4245,
  warning: 0xf4df1b,
  security: 0xf4df1b,
  moderation: 0xf4df1b,
  info: 0xf4df1b,
  ticket: 0xf4df1b,
  economy: 0xf4df1b,
  leveling: 0xf4df1b,
  giveaway: 0xf4df1b,
};

function embed(type, title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(embedColors[type] || embedColors.info)
    .setTitle(title)
    .setDescription(description || null)
    .addFields(fields.map((field) => ({ ...field, name: field.name.trim(), value: String(field.value).trim() })))
    .setFooter({ text: `${config.brand.name} • server tools` })
    .setTimestamp(type === "giveaway" ? null : undefined);
}

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(0xf4df1b)
    .setTimestamp()
    .setFooter({ text: `${config.brand.name} • server tools` });
}

function errorEmbed(message) {
  return baseEmbed().setColor(embedColors.error).setDescription(message);
}

function successEmbed(message) {
  return baseEmbed().setDescription(message);
}

module.exports = { embed, baseEmbed, errorEmbed, successEmbed };
