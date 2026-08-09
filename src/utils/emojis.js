const config = require("../config/index");

function toComponentEmoji(value) {
  if (!value) return undefined;
  const match = /^<(a?):([\w~]+):(\d+)>$/.exec(value);
  if (!match) return value;
  return { id: match[3], name: match[2], animated: Boolean(match[1]) };
}

function emoji(name) {
  return config.emojis[name] || config.emojis.utility;
}

function componentEmoji(name) {
  return toComponentEmoji(emoji(name));
}

module.exports = { emoji, componentEmoji, toComponentEmoji };
