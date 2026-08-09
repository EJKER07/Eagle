const { EmbedBuilder, Colors } = require("discord.js");
const config = require("../config/index");

const embedColors = {
  success: Colors.Green,
  error: Colors.Red,
  warning: Colors.Yellow,
  security: Colors.Blurple,
  moderation: Colors.Orange,
  info: Colors.Blurple,
  ticket: Colors.Purple,
  economy: Colors.Gold,
  leveling: Colors.Green,
  giveaway: Colors.Gold,
};

function embed(type, title, description, fields = []) {
  return new EmbedBuilder()
    .setColor(embedColors[type] || embedColors.info)
    .setTitle(`${config.emojis[type] || config.emojis.utility} ${title}`)
    .setDescription(description || null)
    .addFields(fields)
    .setFooter({ text: config.brand.name })
    .setTimestamp();
}

function baseEmbed() {
  return new EmbedBuilder()
    .setColor(config.brand.color)
    .setTimestamp()
    .setFooter({ text: config.brand.name });
}

function errorEmbed(message) {
  return baseEmbed().setColor(config.brand.colors.error).setDescription(`${config.emojis.error} ${message}`);
}

function successEmbed(message) {
  return baseEmbed().setColor(config.brand.colors.success).setDescription(`${config.emojis.success} ${message}`);
}

module.exports = { embed, baseEmbed, errorEmbed, successEmbed };
