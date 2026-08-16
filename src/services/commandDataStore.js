/**
 * Command DataStore Service
 * Centralized system for storing and retrieving command-specific configuration
 * 
 * Usage:
 * - dataStore.getCommandData(guildId, "antinuke")
 * - dataStore.setCommandData(guildId, "antinuke", { enabled: true, ... })
 * - dataStore.updateCommandData(guildId, "antinuke", (current) => ({ ...current, enabled: false }))
 */

class CommandDataStore {
  constructor(db) {
    this.db = db;
  }

  /**
   * Get all data for a specific command in a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name (e.g., "antinuke", "welcome", "tickets")
   * @returns {object} Command configuration object
   */
  getCommandData(guildId, commandName) {
    const guild = this.db.getGuildSettings(guildId);
    return guild.commands?.[commandName] || this.getDefaultCommandData(commandName);
  }

  /**
   * Set all data for a specific command in a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {object} data - Command configuration data
   * @returns {object} Updated command data
   */
  setCommandData(guildId, commandName, data) {
    return this.db.updateGuildSettings(guildId, (current) => ({
      ...current,
      commands: {
        ...current.commands,
        [commandName]: data,
      },
    })).commands[commandName];
  }

  /**
   * Update data for a specific command (functional update)
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {function} updater - Function that takes current data and returns new data
   * @returns {object} Updated command data
   */
  updateCommandData(guildId, commandName, updater) {
    const current = this.getCommandData(guildId, commandName);
    const updated = updater(current);
    return this.setCommandData(guildId, commandName, updated);
  }

  /**
   * Get a specific property from command data
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {string} property - Property name
   * @param {*} defaultValue - Default value if property doesn't exist
   * @returns {*} Property value
   */
  getProperty(guildId, commandName, property, defaultValue = null) {
    const data = this.getCommandData(guildId, commandName);
    return data[property] !== undefined ? data[property] : defaultValue;
  }

  /**
   * Set a specific property in command data
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {string} property - Property name
   * @param {*} value - Value to set
   * @returns {*} Updated value
   */
  setProperty(guildId, commandName, property, value) {
    return this.updateCommandData(guildId, commandName, (current) => ({
      ...current,
      [property]: value,
    }))[property];
  }

  /**
   * Get default command data template
   * @param {string} commandName - Command name
   * @returns {object} Default configuration
   */
  getDefaultCommandData(commandName) {
    const defaults = {
      antinuke: {
        enabled: false,
        punishment: "clear_roles",
        windowMs: 10000,
        roleSnapshot: null,
        whitelistUsers: [],
        limits: { channelDelete: 3, roleDelete: 3, ban: 3 },
      },
      welcome: {
        enabled: false,
        channelId: null,
        message: "Welcome {mention} to **{server}**!",
      },
      goodbye: {
        enabled: false,
        channelId: null,
        message: "Goodbye **{username}**.",
      },
      tickets: {
        enabled: false,
        categoryId: null,
        staffRoleId: null,
        staffRoleIds: [],
        logChannelId: null,
      },
      leveling: {
        enabled: false,
        xpPerMessage: 10,
        cooldownMs: 60000,
        announcementChannelId: process.env.LEVELING_ANNOUNCEMENT_CHANNEL_ID || "1534099905210089492",
        leaderboardChannelId: null,
      },
      moderation: {
        enabled: true,
        escalation: {},
        autoModChannelId: null,
      },
      automod: {
        enabled: false,
        blacklistWords: ["fuck", "shit", "bitch", "asshole", "dick", "piss", "chutiya", "gandu", "harami", "kamina", "kutta", "bakwass", "madarchod", "bhenchod"],
        spamThreshold: 5,
        spamWindowMs: 5000,
      },
      giveaway: {
        enabled: false,
        channelId: null,
        giveaways: [],
      },
      invites: {
        enabled: false,
        joinChannelId: null,
        leaveChannelId: null,
        joinMessage: "Welcome {mention} to **{server}**!",
        leaveMessage: "Goodbye **{username}**.",
        tracked: {},
      },
      music: {
        enabled: false,
        defaultVolume: 80,
        maxQueueSize: 100,
        autoPlaylist: null,
      },
      economy: {
        enabled: false,
        currencyName: "credits",
        currencySymbol: "🪙",
        dailyReward: 100,
        minimumBalance: 0,
      },
      logs: {
        enabled: false,
        moderation: null,
        security: null,
        member: null,
        message: null,
      },
      autorole: {
        enabled: false,
        roleIds: [],
      },
      autoresponder: {
        enabled: false,
        triggers: {},
      },
    };

    return defaults[commandName] || { enabled: false };
  }

  /**
   * Check if a command is enabled in a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @returns {boolean} Whether command is enabled
   */
  isCommandEnabled(guildId, commandName) {
    return this.getProperty(guildId, commandName, "enabled", false);
  }

  /**
   * Enable/disable a command
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {boolean} enabled - Enable or disable
   * @returns {boolean} New enabled state
   */
  setCommandEnabled(guildId, commandName, enabled) {
    return this.setProperty(guildId, commandName, "enabled", enabled);
  }

  /**
   * Add a user to a whitelist/blacklist
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {string} userId - User ID to add
   * @param {string} listName - List name (e.g., "whitelistUsers", "blacklistedUsers")
   * @returns {array} Updated list
   */
  addToList(guildId, commandName, userId, listName = "whitelistUsers") {
    return this.updateCommandData(guildId, commandName, (current) => {
      const list = current[listName] || [];
      if (!list.includes(userId)) {
        list.push(userId);
      }
      return { ...current, [listName]: list };
    })[listName];
  }

  /**
   * Remove a user from a whitelist/blacklist
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {string} userId - User ID to remove
   * @param {string} listName - List name
   * @returns {array} Updated list
   */
  removeFromList(guildId, commandName, userId, listName = "whitelistUsers") {
    return this.updateCommandData(guildId, commandName, (current) => {
      const list = current[listName] || [];
      return {
        ...current,
        [listName]: list.filter((id) => id !== userId),
      };
    })[listName];
  }

  /**
   * Check if user is in a list
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @param {string} userId - User ID to check
   * @param {string} listName - List name
   * @returns {boolean} Whether user is in list
   */
  isInList(guildId, commandName, userId, listName = "whitelistUsers") {
    const list = this.getProperty(guildId, commandName, listName, []);
    return list.includes(userId);
  }

  /**
   * Get all command settings for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {object} All command configurations
   */
  getAllCommandData(guildId) {
    return this.db.getGuildSettings(guildId).commands || {};
  }

  /**
   * Reset a command to default settings
   * @param {string} guildId - Discord guild ID
   * @param {string} commandName - Command name
   * @returns {object} Default command data
   */
  resetCommand(guildId, commandName) {
    const defaults = this.getDefaultCommandData(commandName);
    return this.setCommandData(guildId, commandName, defaults);
  }
}

module.exports = CommandDataStore;
