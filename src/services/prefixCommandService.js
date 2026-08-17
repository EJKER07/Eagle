const { PermissionFlagsBits, EmbedBuilder, Colors } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const { embed } = require("../utils/embeds");
const { getPromotionReport, evaluateRoleTarget, getRoleTarget, ROLE_TARGETS, getCheckinLeaderboard, getUserMetricsUpToDate } = require("./promoDemoService");

const LOG_CHANNEL_ID = "YOUR_LOG_CHANNEL_ID_HERE";

function tokenize(input) {
  return input.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((token) => token.replace(/^"|"$/g, "")) || [];
}

function optionDefinitions(commandData, tokens) {
  const rootOptions = commandData.options || [];
  const subcommandIndex = rootOptions.findIndex((option) => [1, 2].includes(option.type) && option.name === tokens[0]?.toLowerCase());
  if (subcommandIndex === -1) return { subcommand: null, definitions: rootOptions, valuesStart: 0 };
  const selected = rootOptions[subcommandIndex];
  if (selected.type === 2) {
    const nested = selected.options?.find((option) => option.type === 1 && option.name === tokens[1]?.toLowerCase());
    if (!nested) throw new Error(`Choose a subcommand for ${selected.name}.`);
    return { subcommand: nested.name, definitions: nested.options || [], valuesStart: 2 };
  }
  return { subcommand: selected.name, definitions: selected.options || [], valuesStart: 1 };
}

function mentionId(value, prefix) {
  const match = value.match(new RegExp(`^<@!?${prefix ? "&" : ""}(\\d+)>$`));
  return match?.[1] || (/^\d+$/.test(value) ? value : null);
}

function getRoleMention(guild, roleName) {
  const normalized = String(roleName || "").trim();
  if (!normalized) return "@Unknown";
  const match = guild?.roles?.cache?.find((role) => role.name.toLowerCase() === normalized.toLowerCase());
  return match ? `<@&${match.id}>` : `@${normalized}`;
}

function getNextRoleDisplay(status, row) {
  if (status === "demotion") return "Removed from staff";
  const nextRoleId = row?.nextRoleId || row?.nextRole?.roleId || null;
  if (!nextRoleId) return "Current rank";
  if (String(nextRoleId) === "Max Level achieved!") return "Max Level achieved!";
  return `<@&${nextRoleId}>`;
}

function getNextRoleName(currentRoleName, status) {
  if (status === "demotion") return "Removed from staff";
  const currentIndex = ROLE_TARGETS.findIndex((entry) => (entry.name || entry.role).toLowerCase() === String(currentRoleName || "").toLowerCase());
  if (currentIndex === -1) return String(currentRoleName || "Current rank");
  const nextIndex = Math.min(currentIndex + (status === "double-promotion" ? 2 : 1), ROLE_TARGETS.length - 1);
  return ROLE_TARGETS[nextIndex].name || ROLE_TARGETS[nextIndex].role;
}

function buildPromoLine(guild, row, member) {
  const status = row.status || row.legacyStatus || "stay";
  const currentRole = row.role || "Trial Staff";
  const nextRoleName = getNextRoleName(currentRole, status);
  const nextRoleText = status === "demotion" ? "Removed from staff" : getNextRoleDisplay(status, row) || getRoleMention(guild, nextRoleName);
  const suffix = status === "double-promotion" ? " (x2 skip!)" : "";
  const mention = member ? `<@${member.id}>` : `<@${row.userId}>`;
  return `${mention} — ${row.messages}/${row.targetMessages ?? row.messages} msgs (${row.messagesPercent}%), ${row.tickets}/${row.targetTickets ?? row.tickets} tickets (${row.ticketsPercent}%) ➡️ ${nextRoleText}${suffix}`;
}

function renderProgressBar(currentValue, targetValue, width = 12) {
  const current = Number(currentValue) || 0;
  const target = Number(targetValue) || 1;
  const ratio = Math.max(0, Math.min(current / Math.max(target, 1), 1));
  const filled = Math.round(ratio * width);
  const empty = Math.max(width - filled, 0);
  return `${"■".repeat(filled)}${"□".repeat(empty)}`;
}

async function resolveOptionValue(definition, value, message) {
  if (value === undefined) return undefined;
  if (definition.type === 4) {
    const number = Number.parseInt(value, 10);
    if (!Number.isInteger(number)) throw new Error(`${definition.name} must be a whole number.`);
    return number;
  }
  if (definition.type === 5) {
    if (["true", "yes", "on"].includes(value.toLowerCase())) return true;
    if (["false", "no", "off"].includes(value.toLowerCase())) return false;
    throw new Error(`${definition.name} must be true or false.`);
  }
  if (definition.type === 6) {
    const id = mentionId(value, false);
    const user = id ? message.client.users.cache.get(id) : message.guild.members.cache.find((member) => member.user.username.toLowerCase() === value.toLowerCase())?.user;
    if (!user) throw new Error(`Could not find user for ${definition.name}.`);
    return user;
  }
  if (definition.type === 7) {
    const id = value.match(/^<#(\d+)>$/)?.[1] || value;
    const channel = message.guild.channels.cache.get(id);
    if (!channel) throw new Error(`Could not find channel for ${definition.name}.`);
    return channel;
  }
  if (definition.type === 8) {
    const id = mentionId(value, true);
    const role = id ? message.guild.roles.cache.get(id) : message.guild.roles.cache.find((item) => item.name.toLowerCase() === value.toLowerCase());
    if (!role) throw new Error(`Could not find role for ${definition.name}.`);
    return role;
  }
  return value;
}

async function createPrefixInteraction(client, message, command, input) {
  const tokens = tokenize(input);
  const parsed = optionDefinitions(command.data.toJSON(), tokens);
  const values = new Map();
  let tokenIndex = parsed.valuesStart;
  for (const definition of parsed.definitions) {
    if (definition.type >= 1 && definition.type <= 2) continue;
    let rawValue;
    if (definition.type === 3 && definition === parsed.definitions.at(-1)) rawValue = tokens.slice(tokenIndex).join(" ") || undefined;
    else rawValue = tokens[tokenIndex++];
    const value = await resolveOptionValue(definition, rawValue, message);
    if (value === undefined && definition.required) throw new Error(`Missing required option: ${definition.name}.`);
    if (value !== undefined) values.set(definition.name, value);
  }
  const get = (name, required, type) => {
    const value = values.get(name);
    if (value === undefined && required) throw new Error(`Missing required option: ${name}.`);
    if (value === undefined) return undefined;
    return type ? type(value) : value;
  };
  let replied = false;
  let deferred = false;
  const send = async (payload) => { replied = true; return message.reply(payload); };
  return {
    guild: message.guild,
    guildId: message.guild.id,
    channel: message.channel,
    member: message.member,
    memberPermissions: message.member.permissions,
    user: message.author,
    client,
    options: {
      getSubcommand: (required = true) => { if (parsed.subcommand) return parsed.subcommand; if (required) throw new Error("This command requires a subcommand."); return null; },
      getString: (name, required = false) => get(name, required),
      getInteger: (name, required = false) => get(name, required, (value) => Number(value)),
      getNumber: (name, required = false) => get(name, required, (value) => Number(value)),
      getBoolean: (name, required = false) => get(name, required),
      getUser: (name, required = false) => get(name, required),
      getMember: (name, required = false) => { const user = get(name, required); return user ? message.guild.members.cache.get(user.id) : null; },
      getChannel: (name, required = false) => get(name, required),
      getRole: (name, required = false) => get(name, required),
    },
    get replied() { return replied; },
    get deferred() { return deferred; },
    reply: send,
    followUp: send,
    deferReply: async () => { deferred = true; },
    editReply: async (payload) => { replied = true; return message.channel.send(payload); },
  };
}

async function runLoadedPrefixCommand(client, message, input) {
  const tokens = tokenize(input);
  const command = client.commands.get(tokens[0]?.toLowerCase());
  if (!command) return false;
  if (command.permissions?.length && !message.member.permissions.has(command.permissions)) {
    const reply = await message.reply({ embeds: [embed("error", "Permission denied", "You do not have permission to use this command.")] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return true;
  }
  try {
    const interaction = await createPrefixInteraction(client, message, command, input.slice(tokens[0].length).trim());
    await command.execute(interaction, client);
    return true;
  } catch (error) {
    const reply = await message.reply({ embeds: [embed("error", "Command failed", error.message || "Something went wrong.")] }).catch(() => null);
    if (reply) setTimeout(() => reply.delete().catch(() => {}), 3000);
    return true;
  }
}

function ticketOwnerId(channel) {
  return channel.topic?.match(/^ticket-owner:(\d+)$/)?.[1] || null;
}

function staffRoleIds(settings) {
  return settings.staffRoleIds?.length ? settings.staffRoleIds : settings.staffRoleId ? [settings.staffRoleId] : [];
}

function isStaff(message, settings) {
  return message.member.permissions.has(PermissionFlagsBits.ManageChannels)
    || staffRoleIds(settings).some((roleId) => message.member.roles.cache.has(roleId));
}

function isTicket(message) {
  return Boolean(ticketOwnerId(message.channel));
}

function parseTicketTargets(message) {
  const ids = new Set();
  for (const user of message.mentions?.users?.values?.() || []) ids.add(user.id);
  for (const role of message.mentions?.roles?.values?.() || []) ids.add(role.id);
  return [...ids];
}

function buildPersonalPromoRequestEmbed(guild, member, metrics = { messages: 0, tickets: 0 }) {
  const authorMember = member || { id: "unknown", roles: { cache: [] } };
  const target = getRoleTarget(authorMember);
  const result = evaluateRoleTarget({ messages: Number(metrics.messages || 0), tickets: Number(metrics.tickets || 0) }, authorMember);
  const statusText = {
    "double-promotion": "✨ Double Promotion",
    promotion: "✅ Promotion",
    stay: "⚠️ Stay",
    demotion: "❌ Demotion",
  }[result.status] || "⚠️ Stay";

  const nextRoleText = result.nextRoleId === "Max Level achieved!"
    ? "Max Level achieved!"
    : `<@&${result.nextRoleId}>`;

  const roleBreakdown = [
    "<@&1534099901976416257> — 350 messages or 5 tickets",
    "<@&1534099902022549517> — 500 messages or 6 tickets",
    "<@&1534099902022549518> — 750 messages or 7 tickets",
    "<@&1534099902022549519> — 1000 messages or 8 tickets",
    "<@&1538763624158470164> — 1250 messages or 9 tickets",
    "<@&1538763818497478726> — 1500 messages or 10 tickets",
    "<@&1534099902051647616> — 2000 messages or 13 tickets",
  ].join("\n");

  const title = `❤️ ${guild?.name || "XJKER CM"} Promo-demo ❤️`;
  const messageBar = renderProgressBar(result.messages, target.messages || 1);
  const ticketBar = renderProgressBar(result.tickets, target.tickets || 1);

  return new EmbedBuilder()
    .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
    .setTitle(title)
    .setDescription(roleBreakdown)
    .setColor(0x0f172a)
    .addFields(
      {
        name: "Your Progress",
        value: `Your Progress: ${result.messages}/${target.messages} Messages [${messageBar}] ${result.messagesPercent}%\n${result.tickets}/${target.tickets} Tickets [${ticketBar}] ${result.ticketsPercent}%`,
        inline: false,
      },
      {
        name: "Current Est. Verdict",
        value: `Current Est. Verdict: ${statusText}\nNext Role: ${result.status === "promotion" || result.status === "double-promotion" ? nextRoleText : "Current rank"}`,
        inline: false,
      },
      {
        name: "How it works",
        value: [
          "✅ Promotion — reach 100% of either requirement (or clear 50% on both messages and tickets)",
          "ℹ️ Double Promotion — reach 200% of either requirement to skip a rank",
          "⚠️ Stay — reach at least 50% of either requirement",
          "❌ Demotion — fall below 50% on both",
        ].join("\n"),
        inline: false,
      },
    )
    .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
    .setTimestamp();
}

function resetStaffCheckinStats(state, userId) {
  const nextState = JSON.parse(JSON.stringify(state || { promotion: { checkins: {}, ticketTotals: {} }, members: {} }));
  nextState.promotion = {
    ...(nextState.promotion || {}),
    checkins: { ...(nextState.promotion?.checkins || {}) },
    ticketTotals: { ...(nextState.promotion?.ticketTotals || {}) },
  };

  if (Object.prototype.hasOwnProperty.call(nextState.promotion.ticketTotals, userId)) {
    delete nextState.promotion.ticketTotals[userId];
  }

  Object.entries(nextState.promotion.checkins || {}).forEach(([channelId, ownerId]) => {
    if (ownerId === userId) delete nextState.promotion.checkins[channelId];
  });

  if (nextState.members && typeof nextState.members === "object") {
    const memberEntry = nextState.members[userId] || {};
    const metrics = { ...(memberEntry.metrics || {}) };
    if (Object.prototype.hasOwnProperty.call(metrics, "tickets")) metrics.tickets = 0;
    if (Object.prototype.hasOwnProperty.call(metrics, "checkins")) metrics.checkins = 0;
    nextState.members[userId] = { ...memberEntry, metrics };

    Object.keys(nextState.members).forEach((memberKey) => {
      if (!memberKey.startsWith(`${userId}:`)) return;
      if (nextState.members[memberKey] && nextState.members[memberKey].metrics) {
        nextState.members[memberKey] = { ...nextState.members[memberKey], metrics: { ...nextState.members[memberKey].metrics, tickets: 0, checkins: 0 } };
      }
      if (memberKey.startsWith(`${userId}:`)) {
        delete nextState.members[memberKey];
      }
    });
  }

  return nextState;
}

function resetAllStaffCheckins(state) {
  const nextState = JSON.parse(JSON.stringify(state || { promotion: { checkins: {}, ticketTotals: {} }, members: {} }));
  nextState.promotion = {
    ...(nextState.promotion || {}),
    checkins: {},
    ticketTotals: {},
  };

  if (nextState.members && typeof nextState.members === "object") {
    Object.keys(nextState.members).forEach((memberKey) => {
      const member = nextState.members[memberKey] || {};
      const metrics = { ...(member.metrics || {}) };
      if (Object.prototype.hasOwnProperty.call(metrics, "tickets")) metrics.tickets = 0;
      if (Object.prototype.hasOwnProperty.call(metrics, "checkins")) metrics.checkins = 0;
      if (Object.prototype.hasOwnProperty.call(metrics, "messages")) metrics.messages = 0;
      nextState.members[memberKey] = { ...member, metrics };
    });
  }

  return nextState;
}

function triggerPromoCycleReset(client, guild) {
  const guildId = guild?.id || guild;
  if (!guildId || !client?.db?.updateGuildSettings) return null;
  const guildSettings = client.db.getGuildSettings(guildId);
  const nextSettings = resetAllStaffCheckins(guildSettings);
  client.db.updateGuildSettings(guildId, () => nextSettings);
  client.db.persist?.();
  return nextSettings;
}

async function relayPromoDemoLog(guild, promoEmbed, roleUpdateStatus = []) {
  if (!guild || !guild.channels || !guild.channels.cache) return;
  const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID) || guild.channels.resolve(LOG_CHANNEL_ID);
  if (!logChannel || !logChannel.isTextBased?.()) return;

  const statusText = roleUpdateStatus.length ? roleUpdateStatus.slice(0, 10).join("\n") : "No staff role changes were needed.";
  const roleStatusEmbed = new EmbedBuilder()
    .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
    .setTitle("📝 Promotion Audit Log")
    .setDescription(`**Role updates:**\n${statusText}`)
    .setColor(0x0f172a)
    .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
    .setTimestamp();

  await logChannel.send({ embeds: [promoEmbed, roleStatusEmbed] }).catch(() => {});
}

function getCurrentTierIndex(member) {
  if (!member || !member.roles || !member.roles.cache) return 0;
  const roleIds = new Set(member.roles.cache.map((role) => String(role.id || "")));
  for (let index = ROLE_TARGETS.length - 1; index >= 0; index -= 1) {
    if (roleIds.has(String(ROLE_TARGETS[index].roleId))) return index;
  }
  return 0;
}

async function applyPromotionRoleChanges(guild, evaluatedRows = []) {
  if (!guild?.members?.cache) return [];
  const statusLines = [];

  for (const row of evaluatedRows) {
    const member = guild.members.cache.get(row.userId) || null;
    if (!member || !member.roles || !member.roles.add || !member.roles.remove) continue;

    const verdict = String(row.status || row.legacyStatus || "stay").toLowerCase();
    const currentTier = getCurrentTierIndex(member);
    let targetTier = currentTier;
    let targetRoleId = ROLE_TARGETS[currentTier]?.roleId || ROLE_TARGETS[0].roleId;

    try {
      if (verdict === "double-promotion") {
        targetTier = Math.min(currentTier + 2, ROLE_TARGETS.length - 1);
        targetRoleId = ROLE_TARGETS[targetTier].roleId;
        await member.roles.add(targetRoleId);
        if (currentTier >= 0 && currentTier < ROLE_TARGETS.length) {
          await member.roles.remove(ROLE_TARGETS[currentTier].roleId);
        }
        statusLines.push(`${member.user?.tag || row.userId}: ${ROLE_TARGETS[currentTier]?.name || "Current rank"} → ${ROLE_TARGETS[targetTier].name}`);
      } else if (verdict === "promotion") {
        targetTier = Math.min(currentTier + 1, ROLE_TARGETS.length - 1);
        targetRoleId = ROLE_TARGETS[targetTier].roleId;
        await member.roles.add(targetRoleId);
        if (currentTier >= 0 && currentTier < ROLE_TARGETS.length) {
          await member.roles.remove(ROLE_TARGETS[currentTier].roleId);
        }
        statusLines.push(`${member.user?.tag || row.userId}: ${ROLE_TARGETS[currentTier]?.name || "Current rank"} → ${ROLE_TARGETS[targetTier].name}`);
      } else if (verdict === "demotion") {
        if (currentTier === 0) {
          await member.roles.remove("1534099901976416257");
          statusLines.push(`${member.user?.tag || row.userId}: Trial Staff → Removed from staff`);
        } else {
          targetTier = Math.max(currentTier - 1, 0);
          targetRoleId = ROLE_TARGETS[targetTier].roleId;
          await member.roles.add(targetRoleId);
          await member.roles.remove(ROLE_TARGETS[currentTier].roleId);
          statusLines.push(`${member.user?.tag || row.userId}: ${ROLE_TARGETS[currentTier]?.name || "Current rank"} → ${ROLE_TARGETS[targetTier].name}`);
        }
      } else {
        statusLines.push(`${member.user?.tag || row.userId}: stay (${ROLE_TARGETS[currentTier]?.name || "Current rank"})`);
      }
    } catch (error) {
      console.error(`Failed to update role for ${row.userId}:`, error);
      statusLines.push(`${member.user?.tag || row.userId}: role update failed`);
    }
  }

  return statusLines;
}

async function runPrefixCommand(client, message, input) {
  const [rawCommand, ...args] = tokenize(input);
  if (!rawCommand) return false;
  const command = rawCommand.toLowerCase();
  const settings = client.db.getGuildSettings(message.guild.id).tickets;
  if (command === "ticket" || command === "tickets") {
    return message.reply({ embeds: [embed("ticket", "Ticket commands", "`$close` `$reopen` `$rename <name>` `$claim` `$add @user @role` `$remove @user @role` `$delete`\nUse these inside a ticket channel.")] });
  }
  if (command === "promoreq") {
    const member = message.member || message.guild.members.cache.get(message.author.id) || { id: message.author.id, roles: { cache: [] } };
    const freshGuildSettings = client.db.getGuildSettings(message.guild.id);
    const metrics = getUserMetricsUpToDate(
      freshGuildSettings.members || {},
      message.author.id,
      new Date(),
      freshGuildSettings.promotion?.ticketTotals || {}
    );
    const embed = buildPersonalPromoRequestEmbed(message.guild, member, metrics);
    return message.reply({ embeds: [embed] });
  }
  if (command === "checkinlb") {
    const leaderboard = getCheckinLeaderboard(client.db.getGuildSettings(message.guild.id).promotion?.ticketTotals || {}, 10);
    const title = "🏆 Check-in Leaderboard — XJKER CM | GIVEAWAYS • CHILL • HANGOUT";
    if (!leaderboard.length) {
      const emptyEmbed = new EmbedBuilder()
        .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
        .setTitle(title)
        .setDescription("No approved check-ins recorded yet.")
        .setColor(0x0f172a)
        .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
        .setTimestamp();
      return message.reply({ embeds: [emptyEmbed] });
    }

    const medalMap = { 0: "🥇", 1: "🥈", 2: "🥉" };
    const lines = leaderboard.map((entry, index) => {
      const rank = medalMap[index] || `#${index + 1}`;
      return `${rank} <@${entry.userId}> — ${entry.checkins} approved check-ins`;
    }).join("\n");

    const leaderboardEmbed = new EmbedBuilder()
      .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
      .setTitle(title)
      .setDescription(lines)
      .setColor(0x0f172a)
      .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
      .setTimestamp();

    return message.reply({ embeds: [leaderboardEmbed] });
  }
  if (command === "resetstaff") {
    if (!message.member || (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !message.member.permissions.has(PermissionFlagsBits.Administrator))) {
      return message.reply({ embeds: [embed("error", "Permission denied", "Only staff with Manage Channels or Administrator can reset check-in stats.")] });
    }

    const targetToken = args[0];
    const targetId = targetToken ? (targetToken.match(/^<@!?(\d+)>$/)?.[1] || (/^\d+$/.test(targetToken) ? targetToken : null)) : null;
    if (!targetId) {
      return message.reply({ embeds: [embed("error", "Missing user", "Usage: `$resetstaff @User` or `$resetstaff <userId>`")] });
    }

    const guildSettings = client.db.getGuildSettings(message.guild.id);
    const nextSettings = resetStaffCheckinStats(guildSettings, targetId);
    client.db.updateGuildSettings(message.guild.id, () => nextSettings);
    client.db.persist?.();

    const resetEmbed = new EmbedBuilder()
      .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
      .setTitle("✅ Staff Check-in Reset")
      .setDescription(`✅ Successfully reset check-in stats for <@${targetId}>.`)
      .setColor(0x0f172a)
      .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
      .setTimestamp();

    return message.reply({ embeds: [resetEmbed] });
  }
  if (command === "resetallstaff") {
    if (!message.member || (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !message.member.permissions.has(PermissionFlagsBits.Administrator))) {
      return message.reply({ embeds: [embed("error", "Permission denied", "Only staff with Manage Channels or Administrator can perform a global reset.")] });
    }

    const guildSettings = client.db.getGuildSettings(message.guild.id);
    const nextSettings = resetAllStaffCheckins(guildSettings);
    client.db.updateGuildSettings(message.guild.id, () => nextSettings);
    client.db.persist?.();

    const resetAllEmbed = new EmbedBuilder()
      .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
      .setTitle("⚠️ Global Reset Complete")
      .setDescription("⚠️ **Global Reset Complete:** All staff ticket check-ins and message evaluation tracking metrics have been wiped clean for the new session.")
      .setColor(0x0f172a)
      .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
      .setTimestamp();

    return message.reply({ embeds: [resetAllEmbed] });
  }
  if (["promodemo", "promo", "checkin"].includes(command)) {
    const rangeInput = args.join(" ") || "17/8/26 to 24/8/26";
    const report = getPromotionReport(client, message.guild.id, rangeInput);
    const diffDays = (report.end - report.start) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      const reply = await message.reply({ embeds: [embed("error", "Range too large", "❌ Evaluations can only be done under a 7-day range.")] });
      setTimeout(() => reply.delete().catch(() => {}), 5000);
      return true;
    }

    const evaluatedRows = report.rows.map((row) => {
      const member = message.guild.members.cache.get(row.userId) || null;
      const result = evaluateRoleTarget(row, member);
      return { ...row, ...result };
    });

    const grouped = {
      promotions: evaluatedRows.filter((row) => ["promotion", "promo", "double-promotion", "double-promo"].includes(row.status || row.legacyStatus)),
      stay: evaluatedRows.filter((row) => ["stay"].includes(row.status || row.legacyStatus)),
      demotions: evaluatedRows.filter((row) => ["demotion", "demote"].includes(row.status || row.legacyStatus)),
    };

    const buildSection = (label, icon, rowsList) => {
      const lines = rowsList.length
        ? rowsList.slice(0, 10).map((row) => {
            const member = message.guild.members.cache.get(row.userId) || null;
            return `${icon} ${buildPromoLine(message.guild, row, member)}`;
          }).join("\n")
        : "No members in this section.";
      return { name: `${icon} ${label} (${rowsList.length})`, value: lines, inline: false };
    };

    const promoEmbed = new EmbedBuilder()
      .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
      .setTitle("XJKER CM • Staff Promotion Report")
      .setDescription(`Period: ${report.startText} — ${report.endText} • ${evaluatedRows.length} member(s) evaluated`)
      .setColor(0x0f172a)
      .addFields(
        buildSection("Promotions", "🟢", grouped.promotions),
        buildSection("Stay", "⚠️", grouped.stay),
        buildSection("Demotions", "❌", grouped.demotions)
      )
      .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
      .setTimestamp();

    const reply = await message.reply({ embeds: [promoEmbed] });
    const roleUpdateStatus = await applyPromotionRoleChanges(message.guild, evaluatedRows);
    await relayPromoDemoLog(message.guild, promoEmbed, roleUpdateStatus);
    triggerPromoCycleReset(client, message.guild);
    await message.channel.send({
      embeds: [new EmbedBuilder()
        .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
        .setTitle("⚠️ System Notice")
        .setDescription([
          "⚠️ **System Notice:** All staff message counters and ticket check-ins have been automatically reset to 0 for the start of the next evaluation period.",
          "",
          roleUpdateStatus.length ? `**Role updates:**\n${roleUpdateStatus.slice(0, 10).join("\n")}` : "**Role updates:** No staff role changes were needed.",
        ].join("\n"))
        .setColor(0x0f172a)
        .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
        .setTimestamp()],
    }).catch(() => {});
    setTimeout(() => reply.delete().catch(() => {}), 15000);
    return true;
  }
  if (command === "staffalert") {
    if (!message.member || (!message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !message.member.permissions.has(PermissionFlagsBits.Administrator))) {
      return message.reply({ embeds: [embed("error", "Permission denied", "Only managers can trigger the mid-week staff activity alert.")] });
    }

    const guildSettings = client.db.getGuildSettings(message.guild.id);
    const memberMetrics = guildSettings.members || {};
    const ticketTotals = guildSettings.promotion?.ticketTotals || {};
    const staffRoleIds = new Set(ROLE_TARGETS.map((entry) => String(entry.roleId)));
    const alerts = [];

    for (const [memberId, member] of message.guild.members.cache) {
      if (!member || member.user.bot) continue;
      const hasStaffRole = member.roles.cache.some((role) => staffRoleIds.has(String(role.id)));
      if (!hasStaffRole) continue;
      const metrics = getUserMetricsUpToDate(memberMetrics, memberId, new Date(), ticketTotals);
      if (Number(metrics.messages || 0) < 300) {
        try {
          await member.send({ embeds: [embed("warning", "Staff activity check", "⚠️ Your current promo-demo activity is below the weekly minimum. Please catch up before the next evaluation window closes.")] }).catch(() => {});
          alerts.push(`<@${memberId}>`);
        } catch (error) {
          console.warn(`Unable to DM staff alert to ${memberId}: ${error.message}`);
        }
      }
    }

    const alertEmbed = new EmbedBuilder()
      .setAuthor({ name: "🏆 XJKER CM | MANAGEMENT TOOLS" })
      .setTitle("📣 Mid-week Staff Alert")
      .setDescription(alerts.length ? `Sent low-activity warnings to: ${alerts.join(", ")}` : "No staff members currently need a warning alert.")
      .setColor(0x0f172a)
      .setFooter({ text: "XJKER CM | GIVEAWAYS • CHILL • HANGOUT" })
      .setTimestamp();

    return message.reply({ embeds: [alertEmbed] });
  }
  if (!["close", "reopen", "rename", "claim", "add", "remove", "delete"].includes(command)) return runLoadedPrefixCommand(client, message, input);
  if (!isTicket(message)) {
    const reply = await message.reply({ embeds: [embed("error", "Ticket only", "This command can only be used inside a ticket channel.")] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return true;
  }
  const ownerId = ticketOwnerId(message.channel);
  const staff = isStaff(message, settings);
  if (!staff && message.author.id !== ownerId) {
    const reply = await message.reply({ embeds: [embed("error", "Staff only", "Only the ticket owner or configured staff can use this command.")] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return true;
  }

  if (["reopen", "rename", "claim", "add", "remove", "delete"].includes(command) && !staff) {
    const reply = await message.reply({ embeds: [embed("error", "Staff only", "Only configured staff can use this ticket command.")] });
    setTimeout(() => reply.delete().catch(() => {}), 3000);
    return true;
  }

  if (command === "rename") {
    const name = args.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").slice(0, 80);
    if (!name) {
      const reply = await message.reply({ embeds: [embed("error", "Missing name", `Usage: \`${client.config.prefix}rename <name>\``)] });
      setTimeout(() => reply.delete().catch(() => {}), 3000);
      return true;
    }
    await message.channel.setName(name);
    return message.reply({ embeds: [embed("success", "Ticket renamed", `This ticket is now **${name}**.`)] });
  }
  if (command === "close") {
    await message.channel.permissionOverwrites.edit(ownerId, { SendMessages: false });
    return message.reply({ embeds: [embed("warning", "Ticket closed", "This ticket is now read-only. Staff can use `$reopen` if needed.")] });
  }
  if (command === "reopen") {
    await message.channel.permissionOverwrites.edit(ownerId, { SendMessages: true });
    return message.reply({ embeds: [embed("success", "Ticket reopened", "The ticket is writable again.")] });
  }
  if (command === "claim") {
    await message.channel.permissionOverwrites.edit(message.author.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    return message.reply({ embeds: [embed("success", "Ticket claimed", `${message.author} is now handling this ticket.`)] });
  }
  if (command === "add" || command === "remove") {
    const targetIds = parseTicketTargets(message);
    if (!targetIds.length) {
      const reply = await message.reply({ embeds: [embed("error", "Missing mention", `Usage: \`${client.config.prefix}${command} @user @role\``)] });
      setTimeout(() => reply.delete().catch(() => {}), 3000);
      return true;
    }
    const action = command === "add"
      ? { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }
      : { ViewChannel: false };
    for (const targetId of targetIds) {
      await message.channel.permissionOverwrites.edit(targetId, action).catch(() => {});
    }
    const summary = targetIds.map((targetId) => `<@${targetId}>`).join(", ");
    return message.reply({ embeds: [embed("success", `Member ${command === "add" ? "added" : "removed"}`, `${summary} was ${command === "add" ? "added to" : "removed from"} this ticket.`)] });
  }
  const logId = settings.logChannelId || settings.logging?.tickets;
  const logChannel = logId ? message.guild.channels.cache.get(logId) : null;
  if (logChannel?.isTextBased()) await logChannel.send({ content: `Transcript for ${message.channel}:`, files: [await createTranscript(message.channel, { limit: -1, filename: `${message.channel.name}.html` })] });
  await message.reply({ embeds: [embed("error", "Deleting ticket", "This channel will be deleted in 5 seconds.")] });
  setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  return true;
}

module.exports = {
  runPrefixCommand,
  ticketOwnerId,
  parseTicketTargets,
  buildPersonalPromoRequestEmbed,
  resetStaffCheckinStats,
  resetAllStaffCheckins,
  triggerPromoCycleReset,
  applyPromotionRoleChanges,
};