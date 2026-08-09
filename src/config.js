const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config();

const emojis = Object.freeze({
  check: '✅',
  cross: '❌',
  info: 'ℹ️',
  sparkles: '✨',
  arrowLeft: '◀️',
  home: '🏠',
  settings: '⚙️',
  bot: '🤖'
});

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function loadConfig({ requireToken = true } = {}) {
  const token = process.env.DISCORD_TOKEN?.trim();
  if (requireToken && !token) throw new Error('Missing required environment variable: DISCORD_TOKEN');
  const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || './data');
  const logLevels = new Set(['debug', 'info', 'warn', 'error']);
  const logLevel = process.env.LOG_LEVEL?.trim() || 'info';
  if (!logLevels.has(logLevel)) throw new Error(`Invalid LOG_LEVEL: ${logLevel}`);
  return Object.freeze({
    token: token || null,
    clientId: required('DISCORD_CLIENT_ID'),
    guildId: process.env.DISCORD_GUILD_ID?.trim() || null,
    dataDir,
    logLevel,
    environment: process.env.NODE_ENV?.trim() || 'development',
    emojis
  });
}

module.exports = { loadConfig, emojis };
