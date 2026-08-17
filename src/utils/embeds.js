const { EmbedBuilder } = require("discord.js");
const config = require("../config/index");

const embedColors = {
  success: config.brand.colors.success,
  error: config.brand.colors.error,
  warning: config.brand.colors.warning,
  security: config.brand.colors.neutral,
  moderation: config.brand.colors.neutral,
  info: config.brand.colors.neutral,
  ticket: config.brand.colors.neutral,
  economy: config.brand.colors.neutral,
  leveling: config.brand.colors.neutral,
  giveaway: config.brand.colors.neutral,
};

function embed(type, title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(embedColors[type] || embedColors.info)
    .setAuthor({ name: config.brand.author })
    .setTitle(title)
    .setDescription(description || null)
    .addFields(fields.map((field) => ({ ...field, name: field.name.trim(), value: String(field.value).trim() })))
    .setFooter({ text: config.brand.footer })
    .setTimestamp(type === "giveaway" ? null : undefined);
}

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.brand.colors.neutral)
    .setAuthor({ name: config.brand.author })
    .setTimestamp()
    .setFooter({ text: config.brand.footer });
}

function errorEmbed(message) {
  return baseEmbed().setColor(embedColors.error).setDescription(message);
}

function successEmbed(message) {
  return baseEmbed().setDescription(message);
}

module.exports = { embed, baseEmbed, errorEmbed, successEmbed };
