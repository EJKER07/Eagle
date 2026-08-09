const { PermissionFlagsBits } = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const { embed } = require("../utils/embeds");

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
    await message.reply({ embeds: [embed("error", "Permission denied", "You do not have permission to use this command.")] });
    return true;
  }
  const interaction = await createPrefixInteraction(client, message, command, input.slice(tokens[0].length).trim());
  await command.execute(interaction, client);
  return true;
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

async function runPrefixCommand(client, message, input) {
  const [rawCommand, ...args] = tokenize(input);
  if (!rawCommand) return false;
  const command = rawCommand.toLowerCase();
  const settings = client.db.getGuildSettings(message.guild.id).tickets;
  if (command === "ticket" || command === "tickets") {
    return message.reply({ embeds: [embed("ticket", "Ticket commands", "`$close` `$reopen` `$rename <name>` `$claim` `$add @user` `$remove @user` `$delete`\nUse these inside a ticket channel.")] });
  }
  if (![
    "close", "reopen", "rename", "claim", "add", "remove", "delete",
  ].includes(command)) return runLoadedPrefixCommand(client, message, input);
  if (!isTicket(message)) return message.reply({ embeds: [embed("error", "Ticket only", "This command can only be used inside a ticket channel.")] });
  const ownerId = ticketOwnerId(message.channel);
  const staff = isStaff(message, settings);
  if (!staff && message.author.id !== ownerId) return message.reply({ embeds: [embed("error", "Staff only", "Only the ticket owner or configured staff can use this command.")] });

  if (["reopen", "rename", "claim", "add", "remove", "delete"].includes(command) && !staff) {
    return message.reply({ embeds: [embed("error", "Staff only", "Only configured staff can use this ticket command.")] });
  }
  if (command === "close") {
    await message.channel.permissionOverwrites.edit(ownerId, { SendMessages: false });
    return message.reply({ embeds: [embed("warning", "Ticket closed", "This ticket is now read-only. Staff can use `$reopen` if needed.")] });
  }
  if (command === "reopen") {
    await message.channel.permissionOverwrites.edit(ownerId, { SendMessages: true });
    return message.reply({ embeds: [embed("success", "Ticket reopened", "The ticket is writable again.")] });
  }
  if (command === "rename") {
    const name = args.join("-").toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/-{2,}/g, "-").slice(0, 80);
    if (!name) return message.reply({ embeds: [embed("error", "Missing name", `Usage: \`${client.config.prefix}rename <name>\``)] });
    await message.channel.setName(name);
    return message.reply({ embeds: [embed("success", "Ticket renamed", `This ticket is now **${name}**.`)] });
  }
  if (command === "claim") {
    await message.channel.permissionOverwrites.edit(message.author.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
    return message.reply({ embeds: [embed("success", "Ticket claimed", `${message.author} is now handling this ticket.`)] });
  }
  if (command === "add" || command === "remove") {
    const member = message.mentions.members.first();
    if (!member) return message.reply({ embeds: [embed("error", "Missing member", `Usage: \`${client.config.prefix}${command} @user\``)] });
    await message.channel.permissionOverwrites.edit(member.id, command === "add"
      ? { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }
      : { ViewChannel: false });
    return message.reply({ embeds: [embed("success", `Member ${command === "add" ? "added" : "removed"}`, `${member} was ${command === "add" ? "added to" : "removed from"} this ticket.`)] });
  }
  const logId = settings.logChannelId || settings.logging?.tickets;
  const logChannel = logId ? message.guild.channels.cache.get(logId) : null;
  if (logChannel?.isTextBased()) await logChannel.send({ content: `Transcript for ${message.channel}:`, files: [await createTranscript(message.channel, { limit: -1, filename: `${message.channel.name}.html` })] });
  await message.reply({ embeds: [embed("error", "Deleting ticket", "This channel will be deleted in 5 seconds.")] });
  setTimeout(() => message.channel.delete().catch(() => {}), 5000);
  return true;
}

module.exports = { runPrefixCommand, ticketOwnerId };