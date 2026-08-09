const path = require("node:path");

const root = path.resolve(__dirname, "../..");

module.exports = {
  brand: {
    name: "Eagle Premium",
    color: 0xf4df1b,
    colors: { success: 0xf4df1b, error: 0xed4245, warning: 0xf4df1b, neutral: 0xf4df1b },
  },
  prefix: process.env.BOT_PREFIX || "$",
  ticket: {
    imageUrl: process.env.TICKET_IMAGE_URL || null,
    panelImageUrl: process.env.TICKET_PANEL_IMAGE_URL || "https://cdn.discordapp.com/attachments/1535593621158363206/1535617681703829565/eagle.png?ex=6a786ae9&is=6a771969&hm=4df5c6b3a8f9cb5cbfe13cad61c2820789a9a5e2987bfc8d71b9a7f2466138ed&",
  },
  paths: {
    root,
    commands: path.join(__dirname, "..", "commands"),
    events: path.join(__dirname, "..", "events"),
    dataFile: path.join(root, "data", "guildConfigs.json"),
    logFile: path.join(root, "logs", "bot.log"),
  },
  deployment: {
    clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID,
    guildId: process.env.DISCORD_GUILD_ID || process.env.DEV_GUILD_ID || null,
    token: process.env.DISCORD_TOKEN || process.env.TOKEN,
  },
  emojis: {
    success: process.env.EMOJI_SUCCESS || "✅",
    error: process.env.EMOJI_ERROR || "❌",
    warning: process.env.EMOJI_WARNING || "⚠️",
    loading: process.env.EMOJI_LOADING || "⏳",
    security: process.env.EMOJI_SECURITY || "🛡️",
    utility: process.env.EMOJI_UTILITY || "🛠️",
    info: process.env.EMOJI_INFO || "💠",
    moderation: process.env.EMOJI_MODERATION || "🛡️",
    music: process.env.EMOJI_MUSIC || "🎵",
    ticket: process.env.EMOJI_TICKET || "🎫",
    economy: process.env.EMOJI_ECONOMY || "💰",
    leveling: process.env.EMOJI_LEVELING || "📈",
    support: process.env.EMOJI_SUPPORT || "🪽",
    purchase: process.env.EMOJI_PURCHASE || "🛒",
    report: process.env.EMOJI_REPORT || "🚩",
    partnership: process.env.EMOJI_PARTNERSHIP || "🤝",
    giveaway: process.env.EMOJI_GIVEAWAY || "🎁",
    nitro: process.env.EMOJI_NITRO || "✨",
    ltc: process.env.EMOJI_LTC || "💳",
    yes: process.env.EMOJI_YES || "✅",
    no: process.env.EMOJI_NO || "❌",
    afk: process.env.EMOJI_AFK || "💤",
  },
};
