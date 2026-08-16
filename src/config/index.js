const path = require("node:path");

const root = path.resolve(__dirname, "../..");

module.exports = {
  brand: {
    name: "Eagle Premium",
    color: 0xf4df1b,
    colors: { success: 0xf4df1b, error: 0xed4245, warning: 0xf4df1b, neutral: 0xf4df1b },
  },
  prefix: process.env.BOT_PREFIX || "$",
  ownerId: process.env.BOT_OWNER_ID || process.env.OWNER_ID || "1496490310589481030",
  ticket: {
    imageUrl: process.env.TICKET_IMAGE_URL || "https://i.ibb.co/BVsB4CS4/382ad2dd02dd701a813c189ec01be1d3.jpg",
    panelImageUrl: process.env.TICKET_PANEL_IMAGE_URL || "https://cdn.discordapp.com/attachments/1536749083912306690/1538405479590531162/eagle.png?ex=6a828f40&is=6a813dc0&hm=0c74e9ab9a3da10f3c614ed2d08008c36cf472606041377e7d276a1e7b640e8e&",
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
    greenver: process.env.EMOJI_GREENVER || "<:greenver:1538390862440964126>",
    crossmark: process.env.EMOJI_CROSSMARK || "<:crossmark:1538388096155123733>",
  },
};
