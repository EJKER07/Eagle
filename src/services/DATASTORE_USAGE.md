/**
 * COMMAND DATASTORE USAGE GUIDE
 * 
 * The CommandDataStore provides a centralized way to store and manage
 * configuration for all commands across the bot.
 * 
 * Access via: interaction.client.dataStore
 */

// ============================================================================
// BASIC EXAMPLES
// ============================================================================

// 1. Get all settings for a command
const antiNukeSettings = interaction.client.dataStore.getCommandData(
  interaction.guildId,
  "antinuke"
);

// 2. Set entire command settings
interaction.client.dataStore.setCommandData(interaction.guildId, "antinuke", {
  enabled: true,
  punishment: "ban",
  windowMs: 15000,
  whitelistUsers: [],
  limits: { channelDelete: 5, roleDelete: 5, ban: 5 },
});

// 3. Update settings (functional approach - safer!)
interaction.client.dataStore.updateCommandData(
  interaction.guildId,
  "antinuke",
  (current) => ({
    ...current,
    enabled: !current.enabled,
  })
);

// ============================================================================
// PROPERTY-LEVEL OPERATIONS
// ============================================================================

// Get a single property with default value
const isEnabled = interaction.client.dataStore.getProperty(
  interaction.guildId,
  "antinuke",
  "enabled",
  false
);

// Set a single property
interaction.client.dataStore.setProperty(
  interaction.guildId,
  "antinuke",
  "enabled",
  true
);

// ============================================================================
// LIST MANAGEMENT (for whitelists, blacklists, etc.)
// ============================================================================

// Add user to whitelist
interaction.client.dataStore.addToList(
  interaction.guildId,
  "antinuke",
  userId,
  "whitelistUsers"
);

// Remove user from whitelist
interaction.client.dataStore.removeFromList(
  interaction.guildId,
  "antinuke",
  userId,
  "whitelistUsers"
);

// Check if user is in whitelist
const isWhitelisted = interaction.client.dataStore.isInList(
  interaction.guildId,
  "antinuke",
  userId,
  "whitelistUsers"
);

// ============================================================================
// COMMAND-LEVEL OPERATIONS
// ============================================================================

// Check if command is enabled
const antiNukeEnabled = interaction.client.dataStore.isCommandEnabled(
  interaction.guildId,
  "antinuke"
);

// Enable/disable command
interaction.client.dataStore.setCommandEnabled(
  interaction.guildId,
  "antinuke",
  true
);

// Get all commands' settings for a guild
const allSettings = interaction.client.dataStore.getAllCommandData(
  interaction.guildId
);

// Reset command to defaults
interaction.client.dataStore.resetCommand(interaction.guildId, "antinuke");

// ============================================================================
// AVAILABLE COMMANDS FOR DATASTORE
// ============================================================================

const commandNames = [
  "antinuke",         // Anti-nuke protection
  "welcome",          // Welcome messages
  "goodbye",          // Goodbye messages
  "tickets",          // Ticket system
  "leveling",         // Level system
  "moderation",       // Moderation features
  "automod",          // Auto-moderation
  "giveaway",         // Giveaway system
  "invites",          // Invite tracking
  "music",            // Music player
  "economy",          // Economy system
  "logs",             // Logging system
  "autorole",         // Auto-role assignment
  "autoresponder",    // Auto-responder
];

// ============================================================================
// DEFAULT SCHEMAS FOR EACH COMMAND
// ============================================================================

const schemas = {
  antinuke: {
    enabled: false,
    punishment: "clear_roles",     // "clear_roles", "ban", "kick", "timeout"
    windowMs: 10000,               // Time window for detecting attacks
    roleSnapshot: null,            // Saved roles for recovery
    whitelistUsers: [],            // Trusted users
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
    leaderboardChannelId: null,
  },

  moderation: {
    enabled: true,
    escalation: {},
    autoModChannelId: null,
  },

  automod: {
    enabled: false,
    blacklistWords: [],
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

// ============================================================================
// REAL-WORLD USAGE EXAMPLE: Anti-Nuke Command
// ============================================================================

/*
Example: Enable anti-nuke protection
*/

async function enableAntiNuke(interaction) {
  // Update using functional approach
  const updated = interaction.client.dataStore.updateCommandData(
    interaction.guildId,
    "antinuke",
    (current) => ({
      ...current,
      enabled: true,
      punishment: "ban",
      windowMs: 15000,
      whitelistUsers: [],
      limits: { channelDelete: 5, roleDelete: 5, ban: 5 },
    })
  );

  return interaction.reply({
    embeds: [
      {
        title: "✅ Anti-Nuke Enabled",
        description: `Settings:\n• Punishment: ${updated.punishment}\n• Window: ${updated.windowMs}ms\n• Whitelisted: ${updated.whitelistUsers.length}`,
        color: 0x00ff00,
      },
    ],
  });
}

/*
Example: Add user to whitelist
*/

async function whitelistUser(interaction, userId) {
  const list = interaction.client.dataStore.addToList(
    interaction.guildId,
    "antinuke",
    userId,
    "whitelistUsers"
  );

  return interaction.reply(
    `✅ User <@${userId}> added to whitelist. Total whitelisted: ${list.length}`
  );
}

/*
Example: Check anti-nuke status
*/

async function checkStatus(interaction) {
  const settings = interaction.client.dataStore.getCommandData(
    interaction.guildId,
    "antinuke"
  );

  const embed = {
    title: "Anti-Nuke Status",
    fields: [
      { name: "Enabled", value: settings.enabled ? "✅ Yes" : "❌ No" },
      { name: "Punishment", value: settings.punishment },
      { name: "Window", value: `${settings.windowMs}ms` },
      { name: "Whitelisted Users", value: settings.whitelistUsers.length.toString() },
    ],
  };

  return interaction.reply({ embeds: [embed] });
}

// ============================================================================
// NOTES
// ============================================================================

/*
✅ BENEFITS:
- Centralized configuration management
- Consistent API across all commands
- Easy to add new command settings
- Functional updates prevent data corruption
- Automatic persistence (saves to JSON)

📝 BEST PRACTICES:
- Always use updateCommandData() for changes, not setCommandData()
- Use addToList/removeFromList for array management
- Always provide default values when getting properties
- Reset to defaults if user asks for "reset"
- Log when settings change for audit trails

⚠️ IMPORTANT:
- All data is automatically persisted to disk
- Use client.dataStore, not direct database access
- Each guild has its own independent settings
- Commands default to disabled, enable as needed
*/
