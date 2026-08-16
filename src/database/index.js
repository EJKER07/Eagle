const fs = require("node:fs");
const path = require("node:path");
const config = require("../config/index");

const dataFile = config?.paths?.dataFile;
if (!dataFile) {
  throw new Error("Database configuration is incomplete: config.paths.dataFile is required.");
}

const defaults = {
  version: 2,
  guilds: {},
};

const guildDefaults = {
  createdAt: null,
  logging: { moderation: null, security: null, member: null },
  welcome: { enabled: false, channelId: null, message: "Welcome {mention} to **{server}**!" },
  goodbye: { enabled: false, channelId: null, message: "Goodbye **{username}**." },
  tickets: { enabled: false, categoryId: null, staffRoleId: null, staffRoleIds: [], logChannelId: null },
  antinuke: {
    enabled: false, punishment: "clear_roles", windowMs: 10000, roleSnapshot: null,
    whitelistUsers: [], limits: { channelDelete: 3, roleDelete: 3, ban: 3 },
  },
  leveling: { enabled: false, xpPerMessage: 10, cooldownMs: 60000 },
  moderation: { escalation: {} },
  automod: {
    enabled: false,
    blacklistWords: ["fuck", "shit", "bitch", "asshole", "dick", "piss", "chutiya", "gandu", "harami", "kamina", "kutta", "bakwass", "madarchod", "bhenchod"],
  },
  giveaways: [],
  invites: { joinChannelId: null, leaveChannelId: null, joinMessage: "Welcome {mention} to **{server}**!", leaveMessage: "Goodbye **{username}**.", tracked: {} },
  metrics: { blacklistedChannelIds: [] },
  members: { afk: {}, levels: {}, economy: {}, warnings: [] },
  commands: {},
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function merge(base, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value ?? clone(base);
  const result = { ...base, ...value };
  for (const [key, defaultValue] of Object.entries(base)) {
    if (defaultValue && typeof defaultValue === "object" && !Array.isArray(defaultValue)) {
      result[key] = merge(defaultValue, value[key]);
    }
  }
  return result;
}

let state;
try {
  state = fs.existsSync(dataFile)
    ? JSON.parse(fs.readFileSync(dataFile, "utf8"))
    : clone(defaults);
} catch (error) {
  throw new Error(`Unable to read database file: ${error.message}`);
}

state = merge(defaults, state);
let writeTimer;

function persist() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    const temporaryFile = `${dataFile}.tmp`;
    fs.writeFileSync(temporaryFile, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(temporaryFile, dataFile);
  }, 50);
}

function getGuild(guildId) {
  if (!state.guilds[guildId]) {
    state.guilds[guildId] = merge(guildDefaults, { createdAt: new Date().toISOString() });
    persist();
  }
  return merge(guildDefaults, state.guilds[guildId]);
}

function updateGuild(guildId, updater) {
  const current = getGuild(guildId);
  const next = typeof updater === "function" ? updater(clone(current)) : { ...current, ...updater };
  state.guilds[guildId] = next;
  persist();
  return next;
}

function getGuildSettings(guildId) {
  return getGuild(guildId);
}

function updateGuildSettings(guildId, updater) {
  return updateGuild(guildId, updater);
}

function getMember(guildId, userId) {
  const guild = getGuild(guildId);
  return guild.members[userId] || {};
}

function updateMetric(guildId, userId, metric, amount = 1) {
  const allowed = ["invites", "messages", "voiceSeconds"];
  if (!allowed.includes(metric) || !Number.isFinite(amount)) throw new Error("Invalid metric update.");
  return updateMember(guildId, userId, (member) => ({
    ...member,
    metrics: { invites: 0, messages: 0, voiceSeconds: 0, ...(member.metrics || {}), [metric]: Math.max(0, (member.metrics?.[metric] || 0) + amount) },
  }));
}

function getMetric(guildId, userId, metric) {
  return getMember(guildId, userId).metrics?.[metric] || 0;
}

function listMetrics(guildId, metric, limit = 10) {
  return Object.entries(getGuild(guildId).members)
    .map(([userId, member]) => ({ userId, value: member.metrics?.[metric] || 0 }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function updateMember(guildId, userId, updater) {
  return updateGuild(guildId, (guild) => {
    guild.members[userId] = typeof updater === "function"
      ? updater({ ...getMember(guildId, userId) })
      : { ...getMember(guildId, userId), ...updater };
    return guild;
  }).members[userId];
}

function getAfk(guildId, userId) {
  return getMember(guildId, userId).afk || null;
}

function setAfk(guildId, userId, reason) {
  return updateMember(guildId, userId, (member) => ({ ...member, afk: { reason, startedAt: Date.now(), dmOnMention: true } }));
}

function clearAfk(guildId, userId) {
  updateMember(guildId, userId, (member) => { const next = { ...member }; delete next.afk; return next; });
}

function setAfkDmOnMention(guildId, userId, enabled) {
  return updateMember(guildId, userId, (member) => ({ ...member, afk: { ...(member.afk || {}), dmOnMention: enabled } }));
}

function getLevel(guildId, userId) {
  return getMember(guildId, userId).level || { xp: 0, level: 0, lastXpAt: 0 };
}

function setLevel(guildId, userId, level) {
  return updateMember(guildId, userId, (member) => ({ ...member, level }));
}

function getEconomy(guildId, userId) {
  return getMember(guildId, userId).economy || { coins: 0, lastDaily: 0 };
}

function updateEconomy(guildId, userId, economy) {
  return updateMember(guildId, userId, (member) => ({ ...member, economy }));
}

function addWarning(guildId, userId, moderatorId, reason) {
  const warning = { id: `${Date.now()}-${userId}`, userId, moderatorId, reason, createdAt: Date.now() };
  updateGuild(guildId, (guild) => ({ ...guild, members: { ...guild.members, warnings: [...guild.members.warnings, warning] } }));
  return warning;
}

function listWarnings(guildId, userId) {
  return getGuild(guildId).members.warnings.filter((warning) => warning.userId === userId);
}

function clearWarnings(guildId, userId) {
  const before = listWarnings(guildId, userId).length;
  updateGuild(guildId, (guild) => ({ ...guild, members: { ...guild.members, warnings: guild.members.warnings.filter((warning) => warning.userId !== userId) } }));
  return before;
}

function getGiveaways(guildId) {
  return getGuild(guildId).giveaways;
}

function saveGiveaway(guildId, giveaway) {
  return updateGuild(guildId, (guild) => ({
    ...guild,
    giveaways: [...guild.giveaways.filter((item) => item.id !== giveaway.id), giveaway],
  })).giveaways.find((item) => item.id === giveaway.id);
}

function removeGiveaway(guildId, giveawayId) {
  const current = getGuild(guildId).giveaways;
  const next = current.filter((giveaway) => giveaway.id !== giveawayId);
  updateGuild(guildId, (guild) => ({ ...guild, giveaways: next }));
  return current.length !== next.length;
}

module.exports = {
  defaults, getGuild, updateGuild, getGuildSettings, updateGuildSettings, persist,
  getAfk, setAfk, clearAfk, setAfkDmOnMention, getLevel, setLevel, getEconomy, updateEconomy,
  addWarning, listWarnings, clearWarnings, getGiveaways, saveGiveaway, removeGiveaway,
  getMember, updateMember, updateMetric, getMetric, listMetrics,
};
