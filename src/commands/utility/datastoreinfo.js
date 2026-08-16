const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { emoji } = require("../../utils/emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("datastoreinfo")
    .setDescription("View and analyze command datastore settings for your guild")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((s) =>
      s
        .setName("all")
        .setDescription("View all command settings")
    )
    .addSubcommand((s) =>
      s
        .setName("command")
        .setDescription("View settings for a specific command")
        .addStringOption((o) =>
          o
            .setName("name")
            .setDescription("Command name")
            .setRequired(true)
            .addChoices(
              { name: "Anti-Nuke", value: "antinuke" },
              { name: "Welcome", value: "welcome" },
              { name: "Goodbye", value: "goodbye" },
              { name: "Tickets", value: "tickets" },
              { name: "Leveling", value: "leveling" },
              { name: "Moderation", value: "moderation" },
              { name: "Auto-Mod", value: "automod" },
              { name: "Giveaway", value: "giveaway" },
              { name: "Invites", value: "invites" },
              { name: "Music", value: "music" },
              { name: "Economy", value: "economy" },
              { name: "Logs", value: "logs" },
              { name: "Auto-Role", value: "autorole" },
              { name: "Auto-Responder", value: "autoresponder" }
            )
        )
    )
    .addSubcommand((s) =>
      s
        .setName("stats")
        .setDescription("View datastore statistics")
    ),

  permissions: [PermissionFlagsBits.Administrator],

  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    try {
      await interaction.deferReply();

      if (subcommand === "all") {
        await showAllData(interaction, client, guildId);
      } else if (subcommand === "command") {
        const commandName = interaction.options.getString("name");
        await showCommandData(interaction, client, guildId, commandName);
      } else if (subcommand === "stats") {
        await showStats(interaction, client, guildId);
      }
    } catch (error) {
      console.error("[DATASTOREINFO]", error);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xed4245)
            .setTitle("❌ ERROR")
            .setDescription(error.message || "Failed to retrieve datastore information"),
        ],
      });
    }
  },
};

async function showAllData(interaction, client, guildId) {
  const allData = client.dataStore.getAllCommandData(guildId);
  const commandNames = Object.keys(allData);

  if (commandNames.length === 0) {
    return interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf4df1b)
          .setTitle("📊 GUILD DATASTORE - ALL COMMANDS")
          .setDescription("No command settings configured yet. All commands are using defaults."),
      ],
    });
  }

  const embeds = [];
  let currentEmbed = new EmbedBuilder()
    .setColor(0xf4df1b)
    .setTitle("📊 GUILD DATASTORE - ALL COMMANDS")
    .setDescription(`Total configured: **${commandNames.length}** commands`);

  let fieldCount = 0;

  for (const cmdName of commandNames) {
    const data = allData[cmdName];
    const isEnabled = data.enabled ? "✅" : "❌";
    const summary = getSummary(cmdName, data);

    currentEmbed.addFields({
      name: `${isEnabled} ${cmdName}`,
      value: summary,
      inline: false,
    });

    fieldCount++;

    if (fieldCount === 15) {
      embeds.push(currentEmbed);
      currentEmbed = new EmbedBuilder().setColor(0xf4df1b);
      fieldCount = 0;
    }
  }

  if (fieldCount > 0) {
    embeds.push(currentEmbed);
  }

  embeds[embeds.length - 1].setFooter({
    text: `Page ${embeds.length} of ${embeds.length} | ${new Date().toLocaleString()}`,
  });

  await interaction.editReply({ embeds: [embeds[0]] });
}

async function showCommandData(interaction, client, guildId, commandName) {
  const data = client.dataStore.getCommandData(guildId, commandName);

  const embed = new EmbedBuilder()
    .setColor(0xf4df1b)
    .setTitle(`⚙️ ${commandName} Settings`)
    .setDescription(
      `Guild: <@&${interaction.guild.id}> (${interaction.guild.name})`
    );

  // Add all properties as fields
  const keys = Object.keys(data).sort();
  for (const key of keys) {
    const value = data[key];
    let displayValue = "";

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        displayValue =
          value.length === 0
            ? "Empty"
            : value.slice(0, 5).join(", ") +
              (value.length > 5 ? `... (+${value.length - 5} more)` : "");
      } else {
        displayValue = JSON.stringify(value, null, 2).slice(0, 1024);
      }
    } else if (typeof value === "boolean") {
      displayValue = value ? "✅ Yes" : "❌ No";
    } else if (value === null) {
      displayValue = "∅ None";
    } else {
      displayValue = String(value);
    }

    embed.addFields({
      name: key,
      value: `\`\`\`${displayValue.slice(0, 1016)}\`\`\``,
      inline: false,
    });
  }

  embed.setFooter({
    text: `Last updated: ${new Date().toLocaleString()}`,
  });

  await interaction.editReply({ embeds: [embed] });
}

async function showStats(interaction, client, guildId) {
  const allData = client.dataStore.getAllCommandData(guildId);
  const allDefaultData = client.dataStore.getDefaultCommandData("antinuke"); // Get a sample default

  const enabledCount = Object.values(allData).filter((d) => d.enabled).length;
  const disabledCount = Object.values(allData).filter((d) => !d.enabled).length;

  let totalWhitelisted = 0;
  let totalBlacklisted = 0;

  for (const data of Object.values(allData)) {
    if (Array.isArray(data.whitelistUsers)) {
      totalWhitelisted += data.whitelistUsers.length;
    }
    if (Array.isArray(data.blacklistedUsers)) {
      totalBlacklisted += data.blacklistedUsers.length;
    }
  }

  const statsEmbed = new EmbedBuilder()
    .setColor(0xf4df1b)
    .setTitle("📈 DATASTORE STATISTICS")
    .addFields(
      {
        name: "Command Breakdown",
        value: `✅ Enabled: **${enabledCount}**\n❌ Disabled: **${disabledCount}**\n📊 Total: **${enabledCount + disabledCount}**`,
        inline: true,
      },
      {
        name: "User Lists",
        value: `👤 Whitelisted: **${totalWhitelisted}**\n🚫 Blacklisted: **${totalBlacklisted}**`,
        inline: true,
      },
      {
        name: "Storage Info",
        value: `📦 Guild ID: \`${guildId}\`\n💾 DB File: \`data/guildConfigs.json\`\n⏰ Synced: Every 50ms`,
        inline: false,
      }
    )
    .setFooter({
      text: `Report generated: ${new Date().toLocaleString()}`,
    });

  await interaction.editReply({ embeds: [statsEmbed] });
}

function getSummary(cmdName, data) {
  const status = data.enabled ? "✅ Enabled" : "❌ Disabled";

  switch (cmdName) {
    case "antinuke":
      return `${status}\n• Punishment: ${data.punishment || "N/A"}\n• Window: ${data.windowMs || 0}ms\n• Whitelisted: ${data.whitelistUsers?.length || 0}`;
    case "welcome":
    case "goodbye":
      return `${status}\n• Channel: ${data.channelId ? `<#${data.channelId}>` : "Not set"}\n• Message: ${data.message?.slice(0, 50) || "N/A"}...`;
    case "tickets":
      return `${status}\n• Category: ${data.categoryId ? `\`${data.categoryId}\`` : "Not set"}\n• Staff Role: ${data.staffRoleId ? `<@&${data.staffRoleId}>` : "Not set"}`;
    case "leveling":
      return `${status}\n• XP/Msg: ${data.xpPerMessage || 0}\n• Cooldown: ${data.cooldownMs || 0}ms`;
    case "automod":
      return `${status}\n• Blacklist Words: ${data.blacklistWords?.length || 0}\n• Spam Threshold: ${data.spamThreshold || 5}`;
    case "music":
      return `${status}\n• Volume: ${data.defaultVolume || 80}%\n• Max Queue: ${data.maxQueueSize || 100}`;
    case "economy":
      return `${status}\n• Currency: ${data.currencyName || "credits"}\n• Daily Reward: ${data.dailyReward || 100}`;
    case "invites":
      return `${status}\n• Join Channel: ${data.joinChannelId ? `<#${data.joinChannelId}>` : "Not set"}\n• Tracked Invites: ${Object.keys(data.tracked || {}).length}`;
    case "giveaway":
      return `${status}\n• Active Giveaways: ${data.giveaways?.length || 0}`;
    default:
      return status;
  }
}
