const path = require('node:path');
const { JsonStore } = require('./jsonStore');

class Database {
  constructor(dataDir) {
    this.guilds = new JsonStore(path.join(dataDir, 'guilds.json'), { guilds: {} });
    this.runtime = new JsonStore(path.join(dataDir, 'runtime.json'), { schemaVersion: 1 });
  }

  async load() {
    await Promise.all([this.guilds.load(), this.runtime.load()]);
    return this;
  }

  getGuild(guildId) {
    return {
      prefix: '!',
      locale: 'en-US',
      premium: false,
      logging: {},
      warnings: [],
      cases: [],
      afk: {},
      welcome: {},
      ...this.guilds.get('guilds', {})[guildId]
    };
  }

  addCase(guildId, entry) {
    const guild = this.getGuild(guildId);
    const record = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...entry };
    this.setGuild(guildId, { cases: [...guild.cases, record] });
    return record;
  }

  addWarning(guildId, userId, entry) {
    const guild = this.getGuild(guildId);
    const warning = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), ...entry };
    const warnings = [...guild.warnings, { ...warning, userId }];
    this.setGuild(guildId, { warnings });
    return warning;
  }

  getWarnings(guildId, userId) {
    return this.getGuild(guildId).warnings.filter(warning => warning.userId === userId);
  }

  setGuild(guildId, patch) {
    const guilds = this.guilds.get('guilds', {});
    guilds[guildId] = { ...this.getGuild(guildId), ...patch };
    this.guilds.set('guilds', guilds);
    return guilds[guildId];
  }

  async flush() {
    await Promise.all([this.guilds.flush(), this.runtime.flush()]);
  }
}

module.exports = { Database };
