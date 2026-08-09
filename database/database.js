const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "firstlight.json");
const defaults = {
  guildSettings: {},
  warnings: [],
  afk: {},
  levels: {},
  economy: {},
};
let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : structuredClone(defaults);
for (const key of Object.keys(defaults)) state[key] ??= structuredClone(defaults[key]);
let writeTimer;

function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => fs.writeFileSync(file, JSON.stringify(state, null, 2)), 25);
}

function key(guildId, userId) {
  return `${guildId}:${userId}`;
}

const defaultSettings = {
  logging: {},
  welcome: { enabled: false, channelId: null, message: "Welcome {mention} to {server}! 🎉", deleteAfter: 0 },
  goodbye: { enabled: false, channelId: null, message: "Goodbye {username}, we will miss you!", deleteAfter: 0 },
  antinuke: { enabled: false, punishment: "timeout", windowMs: 10000, limits: { channelDelete: 5, roleDelete: 5, ban: 3 }, whitelistUsers: [] },
  automod: { enabled: false, rules: {} },
  moderation: { escalation: { "3": "timeout", "5": "kick", "7": "ban" } },
  tickets: { enabled: false, categoryId: null, staffRoleId: null, logChannelId: null },
  economy: { enabled: false },
  leveling: { enabled: true, xpPerMessage: 5, cooldownMs: 60000 },
};

function mergeDefaults(value, fallback) {
  const result = { ...fallback, ...(value || {}) };
  for (const [keyName, fallbackValue] of Object.entries(fallback)) {
    if (fallbackValue && typeof fallbackValue === "object" && !Array.isArray(fallbackValue)) result[keyName] = mergeDefaults(result[keyName], fallbackValue);
  }
  return result;
}

function getGuildSettings(guildId) {
  if (!state.guildSettings[guildId]) {
    state.guildSettings[guildId] = structuredClone(defaultSettings);
    persist();
  }
  return mergeDefaults(state.guildSettings[guildId], defaultSettings);
}

function updateGuildSettings(guildId, updater) {
  const next = typeof updater === "function" ? updater(getGuildSettings(guildId)) : { ...getGuildSettings(guildId), ...updater };
  state.guildSettings[guildId] = next;
  persist();
  return next;
}

function listWarnings(guildId, userId) {
  return state.warnings.filter((warning) => warning.guild_id === guildId && warning.user_id === userId).sort((a, b) => b.created_at - a.created_at);
}

function addWarning(guildId, userId, moderatorId, reason) {
  const warning = { id: state.warnings.length + 1, guild_id: guildId, user_id: userId, moderator_id: moderatorId, reason, created_at: Date.now() };
  state.warnings.push(warning);
  persist();
  return warning;
}

function clearWarnings(guildId, userId) {
  const before = state.warnings.length;
  state.warnings = state.warnings.filter((warning) => warning.guild_id !== guildId || warning.user_id !== userId);
  persist();
  return before - state.warnings.length;
}

const db = {
  prepare(sql) {
    return {
      get(...args) {
        if (sql.includes("FROM afk")) return state.afk[key(args[0], args[1])] || undefined;
        if (sql.includes("FROM levels")) return state.levels[key(args[0], args[1])] || undefined;
        if (sql.includes("FROM economy")) return state.economy[key(args[0], args[1])] || undefined;
        return undefined;
      },
      all(...args) {
        if (sql.includes("FROM warnings")) return listWarnings(args[0], args[1]);
        return [];
      },
      run(...args) {
        if (sql.includes("DELETE FROM afk")) delete state.afk[key(args[0], args[1])];
        if (sql.includes("INSERT INTO afk")) state.afk[key(args[0], args[1])] = { guild_id: args[0], user_id: args[1], reason: args[2], started_at: args[3] };
        if (sql.includes("INSERT INTO levels")) state.levels[key(args[0], args[1])] = { guild_id: args[0], user_id: args[1], xp: args[2], level: args[3], last_xp_at: args[4] };
        if (sql.includes("INSERT INTO economy")) {
          const id = key(args[0], args[1]);
          const current = state.economy[id] || { guild_id: args[0], user_id: args[1], coins: 0, last_daily: 0, last_work: 0 };
          state.economy[id] = { ...current, coins: current.coins + args[2], last_daily: args[3] || current.last_daily };
        }
        persist();
        return { changes: 1 };
      },
    };
  },
};

module.exports = { db, getGuildSettings, updateGuildSettings, listWarnings, addWarning, clearWarnings, defaults: defaultSettings };
