# FirstLight Premium Discord Bot

FirstLight is a modular Discord.js v14 bot with guild-isolated configuration, persistent storage, permission-safe moderation, security controls, welcome/goodbye, tickets, leveling, economy, polls, and production health endpoints.

## Production structure

```text
config/
  config.json
  emojis.json
data/
  guildConfigs.json       # created on first run; do not commit production data
src/
  commands/
    configuration/        # setup, welcome, goodbye, logging
    economy/
    leveling/
    moderation/
    security/
    tickets/
    utility/
  events/
    client/
    guild/
  loaders/
  services/
  index.js
utils/
  logger.js
  theme.js
scripts/
  deploy-commands.js
```

Only `src/` is loaded by the production entry point. Commands and events are discovered recursively, and duplicate names/listeners fail fast during startup.

## Installation

Requirements: Node.js 20 or newer.

```bash
npm install
copy .env.example .env
```

Set `DISCORD_TOKEN` and `CLIENT_ID` in `.env`. Use `DEV_GUILD_ID` for fast development deployment; omit it for global production deployment. Enable the `Guild Members`, `Message Content`, and `Guild Moderation` privileged intents in the Discord Developer Portal. Invite attribution also requires the bot to have permission to manage/view invites.

## Community analytics and MongoDB

The community modules provide invite attribution, message and daily-message counts, voice duration, leaderboards, greet templates, giveaways, and their moderation/utility commands. The default local adapter persists these values atomically in `data/guildConfigs.json`, which keeps development and tests self-contained.

For MongoDB deployments, install dependencies with `npm install`, set `MONGODB_URI`, and use the exported `connectMongo` and `Guild` model from `src/persistence/mongooseSchema.js` in the deployment bootstrap. The schema has unique guild IDs, indexed guild lookups, bounded metric counters, invite attribution records, greet settings, and giveaway persistence.

### Custom UI emojis

The bot accepts either Unicode emojis or Discord custom emoji markup in `.env`. Use markup such as `<:falcon_ticket:123456789012345678>` or `<a:falcon_loading:123456789012345678>` for animated emojis. The configured values are used selectively in embeds, ticket categories, poll buttons, AFK controls, and music feedback, with built-in fallbacks when omitted.

Supported variables include `EMOJI_TICKET`, `EMOJI_SUPPORT`, `EMOJI_PURCHASE`, `EMOJI_REPORT`, `EMOJI_PARTNERSHIP`, `EMOJI_GIVEAWAY`, `EMOJI_NITRO`, `EMOJI_LTC`, `EMOJI_YES`, `EMOJI_NO`, `EMOJI_AFK`, and `EMOJI_MUSIC`.

## Start and deploy

```bash
npm start
```

Guild settings are stored atomically in `data/guildConfigs.json`; each guild has independent welcome, logging, ticket, AFK, leveling, economy, and anti-nuke settings.

Commands are synchronized once after the client becomes ready. For an explicit deployment:

```bash
npm run deploy
```

For container hosts, deploy from the repository root so the included `Dockerfile` is used. It copies the runtime `src/` tree into `/app/src` and starts the bot with `node src/index.js`. The `.dockerignore` excludes local secrets, logs, tests, and dependencies while retaining application code.

Never commit `.env`, `database/firstlight.json`, or bot tokens. If a token was previously exposed, revoke it in the Discord Developer Portal before using the bot.
