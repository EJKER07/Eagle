const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { embed } = require("../utils/embeds");
const { leaderboard } = require("./communityService");
const { activeEmbed, giveawayComponents, finishGiveaway, scheduleGiveaway } = require("./giveawayService");
const { parseDuration } = require("../utils/duration");

const admin = [PermissionFlagsBits.ManageGuild];
const metricNames = { invites: "invites", messages: "messages", voice: "voiceSeconds" };

function commandData(name) {
  const builder = new SlashCommandBuilder().setName(name).setDescription(`Use the ${name} community tool.`);
  if (["addinvites", "removeinvites", "addmessages", "removemessages"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addIntegerOption((o) => o.setName("amount").setDescription("Amount").setMinValue(1).setRequired(true));
  if (["setjoinchannel", "setleavechannel"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption((o) => o.setName("channel").setDescription("Target channel").addChannelTypes(ChannelType.GuildText).setRequired(true));
  if (["setjoinmessage", "setleavemessage"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("message").setDescription("Message template").setRequired(true));
  if (["invites", "messages", "vc", "inviter", "invited"].includes(name)) return builder.addUserOption((o) => o.setName("user").setDescription("Member")).addIntegerOption((o) => o.setName("amount").setDescription("Amount").setMinValue(1));
  if (["blacklistchannel", "unblacklistchannel"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption((o) => o.setName("channel").setDescription("Channel").addChannelTypes(ChannelType.GuildText).setRequired(true));
  if (name === "lb") return builder
    .addSubcommand((sub) => sub.setName("invites").setDescription("Show the invite leaderboard."))
    .addSubcommand((sub) => sub.setName("messages").setDescription("Show the message leaderboard."))
    .addSubcommand((sub) => sub.setName("dailymessages").setDescription("Show today's message leaderboard."))
    .addSubcommand((sub) => sub.setName("m").setDescription("Alias for messages."))
    .addSubcommand((sub) => sub.setName("msg").setDescription("Alias for messages."))
    .addSubcommand((sub) => sub.setName("dailymsg").setDescription("Alias for dailymessages."))
    .addSubcommand((sub) => sub.setName("daily").setDescription("Alias for daily messages."));
  if (name === "gstart") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("prize").setDescription("Prize").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Examples: 1s, 1m, 1h, 1d, 1w").setRequired(true));
  if (["gend", "greroll"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true));
  if (["greet", "setprefix"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("value").setDescription(name === "greet" ? "Welcome message" : "Prefix").setRequired(true));
  if (["kick", "ban", "mute", "unmute"].includes(name)) return builder.setDefaultMemberPermissions(name === "ban" ? PermissionFlagsBits.BanMembers : PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason"));
  if (["erase"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption((o) => o.setName("amount").setDescription("1-100 messages").setMinValue(1).setMaxValue(100).setRequired(true));
  if (["avatar", "userinfo"].includes(name)) return builder.addUserOption((o) => o.setName("user").setDescription("User"));
  if (["banner"].includes(name)) return builder.addUserOption((o) => o.setName("user").setDescription("User"));
  if (["channelinfo", "vcinfo"].includes(name)) return builder.addChannelOption((o) => o.setName("channel").setDescription("Channel"));
  if (["reminder", "timer"].includes(name)) return builder.addIntegerOption((o) => o.setName("seconds").setDescription("Delay in seconds").setMinValue(1).setMaxValue(86400)).addStringOption((o) => o.setName("message").setDescription("Reminder text").setRequired(true));
  if (["hash", "urban", "hack"].includes(name)) return builder.addStringOption((o) => o.setName("text").setDescription("Text to process").setRequired(true));
  if (["invite"].includes(name)) return builder.addIntegerOption((o) => o.setName("max_age").setDescription("Invite lifetime in seconds").setMinValue(0).setMaxValue(604800));
  if (["deleteemoji"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("emoji").setDescription("Custom emoji ID or mention").setRequired(true));
  if (["hide", "hideall", "lockall", "unlockall", "unslowmode", "clone", "nuke"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
  if (name === "role") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addSubcommand((sub) => sub.setName("all").setDescription("Add a role to all members.").addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true)));
  if (name === "roleicon") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)).addStringOption((o) => o.setName("image").setDescription("Image URL").setRequired(true));
  if (name === "deletesticker") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("sticker").setDescription("Sticker ID").setRequired(true));
  if (name === "enlarge") return builder.addStringOption((o) => o.setName("emoji").setDescription("Custom emoji mention").setRequired(true));
  if (name === "audit") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog).addIntegerOption((o) => o.setName("limit").setDescription("Number of entries").setMinValue(1).setMaxValue(20));
  if (name === "emergency") return builder.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) => sub.setName("role").setDescription("Configure the emergency role."))
    .addSubcommand((sub) => sub.setName("authorise").setDescription("Authorise the emergency system."))
    .addSubcommand((sub) => sub.setName("emergency-situation").setDescription("Activate emergency protection."))
    .addSubcommand((sub) => sub.setName("restore").setDescription("Restore emergency settings."));
  if (name === "voice") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName("enable").setDescription("Enable this feature."))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable this feature."))
    .addSubcommand((sub) => sub.setName("config").setDescription("View or edit configuration."))
    .addSubcommand((sub) => sub.setName("banrole").setDescription("Ban a role from voice channels."))
    .addSubcommand((sub) => sub.setName("ban").setDescription("Ban a user from voice channels."))
    .addSubcommand((sub) => sub.setName("unban").setDescription("Remove a voice ban."))
    .addSubcommand((sub) => sub.setName("banlist").setDescription("List voice bans."))
    .addSubcommand((sub) => sub.setName("resetban").setDescription("Reset voice bans."));
  if (name === "antibetray") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName("enable").setDescription("Enable Anti-Betray."))
    .addSubcommand((sub) => sub.setName("disable").setDescription("Disable Anti-Betray."))
    .addSubcommand((sub) => sub.setName("config").setDescription("View Anti-Betray configuration."));
  if (name === "autorole") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand((sub) => sub.setName("bot").setDescription("Configure the bot autorole."))
    .addSubcommand((sub) => sub.setName("human").setDescription("Configure the human autorole."))
    .addSubcommand((sub) => sub.setName("showbot").setDescription("Show the bot autorole."))
    .addSubcommand((sub) => sub.setName("showhuman").setDescription("Show the human autorole."))
    .addSubcommand((sub) => sub.setName("remove").setDescription("Remove an autorole."))
    .addSubcommand((sub) => sub.setName("reset").setDescription("Reset autorole settings."));
  if (name === "secure") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup((group) => group.setName("channel").setDescription("Secure channel protection.").addSubcommand((sub) => sub.setName("enable").setDescription("Enable secure channel protection.")));
  if (name === "role") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addSubcommand((sub) => sub.setName("all").setDescription("Add a role to all members.").addRoleOption((o) => o.setName("role").setDescription("Role to assign").setRequired(true)));
  if (["greetsetup", "greetreset", "greetchannel", "greetedit", "greetconfig", "greetautodelete"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption((o) => o.setName("channel").setDescription("Greeting channel"));
  if (["ignore", "extraowner", "whitelist", "unwhitelist", "whitelisted", "banrole", "ban", "unban", "banlist", "resetban"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addUserOption((o) => o.setName("user").setDescription("User")).addRoleOption((o) => o.setName("role").setDescription("Role"));
  if (["ship", "mydog", "translate", "howgay", "lesbian", "cute", "intelligence", "chutiya", "horny", "tharki", "gif", "iplookup", "weather", "hug", "kiss", "pat", "cuddle", "slap", "tickle", "spank", "ngif", "8ball", "truth", "dare", "autoresponder", "autoreact", "boycott", "limit", "blacklistword", "imagine"].includes(name)) return builder.addStringOption((o) => o.setName("text").setDescription("Text or target").setRequired(name !== "truth" && name !== "dare"));
  if (name === "invitecode") return builder.addStringOption((o) => o.setName("code").setDescription("Invite code").setRequired(true));
  return builder;
}

function memberId(interaction) { return interaction.options.getUser("user")?.id || interaction.user.id; }
function metricValue(client, guildId, userId, name) { return client.db.getMetric(guildId, userId, name); }

async function execute(interaction, client, name) {
  const guildId = interaction.guildId;
  const userId = memberId(interaction);
  if (["invites", "messages", "vc"].includes(name)) {
    const key = name === "vc" ? "voiceSeconds" : name;
    const value = metricValue(client, guildId, userId, key);
    await interaction.reply({ embeds: [embed("info", `${name} statistics`, `<@${userId}> has **${name === "vc" ? `${Math.floor(value / 60)} minute(s)` : value}** ${name === "vc" ? "of voice time" : name}.`)] }); return;
  }
  if (name === "inviter") {
    const record = client.db.getGuildSettings(guildId).invites.tracked?.[userId];
    await interaction.reply({ embeds: [embed("info", "Inviter", record ? `<@${userId}> was invited by <@${record.inviterId}> using **${record.code}**.` : "No inviter has been recorded for this member.")] }); return;
  }
  if (name === "invited") {
    const rows = Object.entries(client.db.getGuildSettings(guildId).invites.tracked || {}).filter(([, record]) => record.inviterId === userId);
    await interaction.reply({ embeds: [embed("info", "Invited members", rows.length ? rows.map(([id]) => `<@${id}>`).join(", ") : "No members found.")] }); return;
  }
  if (name === "invitecode") { const code = interaction.options.getString("code", true); const invite = await interaction.client.fetchInvite(code).catch(() => null); await interaction.reply({ embeds: [embed("info", "Invite code", invite ? `**${invite.code}** has **${invite.uses || 0}** use(s) and was created by ${invite.inviter || "an unknown user"}.` : "That invite code is invalid or inaccessible.")] }); return; }
  if (["addinvites", "removeinvites", "addmessages", "removemessages"].includes(name)) {
    const key = name.includes("invites") ? "invites" : "messages";
    const amount = interaction.options.getInteger("amount", true) * (name.startsWith("remove") ? -1 : 1);
    client.db.updateMetric(guildId, userId, key, amount);
    await interaction.reply({ embeds: [embed("success", "Statistics updated", `<@${userId}> now has **${metricValue(client, guildId, userId, key)}** ${key}.`)] }); return;
  }
  if (["setjoinchannel", "setleavechannel"].includes(name)) {
    const channel = interaction.options.getChannel("channel", true);
    const key = name.startsWith("setjoin") ? "joinChannelId" : "leaveChannelId";
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, invites: { ...settings.invites, [key]: channel.id } }));
    await interaction.reply({ embeds: [embed("success", "Channel saved", `${channel} will receive ${key.startsWith("join") ? "join" : "leave"} messages.`)] }); return;
  }
  if (["unsetjoinchannel", "unsetleavechannel"].includes(name)) {
    const key = name.startsWith("unsetjoin") ? "joinChannelId" : "leaveChannelId";
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, invites: { ...settings.invites, [key]: null } }));
    await interaction.reply({ embeds: [embed("success", "Channel disabled", "The channel setting was removed.")] }); return;
  }
  if (["setjoinmessage", "setleavemessage"].includes(name)) {
    const key = name.startsWith("setjoin") ? "joinMessage" : "leaveMessage";
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, invites: { ...settings.invites, [key]: interaction.options.getString("message", true) } }));
    await interaction.reply({ embeds: [embed("success", "Message saved", "Supported variables include {mention}, {username}, {server}, and {membercount}.")] }); return;
  }
  if (["unsetjoinmessage", "unsetleavemessage"].includes(name)) {
    const key = name.startsWith("unsetjoin") ? "joinMessage" : "leaveMessage";
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, invites: { ...settings.invites, [key]: null } }));
    await interaction.reply({ embeds: [embed("success", "Message disabled", "The custom message was removed.")] }); return;
  }
  if (name === "variables") { await interaction.reply({ embeds: [embed("info", "Message variables", "`{user}` `{username}` `{userid}` `{server}` `{membercount}` `{mention}` `{avatar}` `{channel}`")] }); return; }
  if (name === "testmessage") { await interaction.reply({ content: "Welcome {mention} to **{server}**!", allowedMentions: { parse: [] } }); return; }
  if (["clearinvites", "clearmessages", "clearvoice", "resetmyinvites", "resetmymessages", "resetmyvoice"].includes(name)) {
    const key = name.includes("invite") ? "invites" : name.includes("message") ? "messages" : "voiceSeconds";
    const target = name.startsWith("resetmy") ? interaction.user.id : null;
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, members: Object.fromEntries(Object.entries(settings.members).map(([id, member]) => (!target || id === target) ? [id, { ...member, metrics: { ...(member.metrics || {}), [key]: 0 } }] : [id, member])) }));
    await interaction.reply({ embeds: [embed("success", "Statistics cleared", target ? "Your statistics were reset." : "The server statistics were reset.")] }); return;
  }
  if (["blacklistchannel", "unblacklistchannel"].includes(name)) {
    const id = interaction.options.getChannel("channel", true).id;
    client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, metrics: { ...settings.metrics, blacklistedChannelIds: name === "blacklistchannel" ? [...new Set([...settings.metrics.blacklistedChannelIds, id])] : settings.metrics.blacklistedChannelIds.filter((channelId) => channelId !== id) } }));
    await interaction.reply({ embeds: [embed("success", "Blacklist updated", "Message counting settings were updated.")] }); return;
  }
  if (name === "blacklistedchannels") { const ids = client.db.getGuildSettings(guildId).metrics.blacklistedChannelIds; await interaction.reply({ embeds: [embed("info", "Blacklisted channels", ids.length ? ids.map((id) => `<#${id}>`).join(", ") : "No channels are blacklisted.")] }); return; }
  if (name === "lb") {
    const aliases = { m: "messages", msg: "messages", dailymsg: "dailymessages", daily: "dailymessages" };
    const type = aliases[interaction.options.getSubcommand(true)] || interaction.options.getSubcommand(true); const rows = await leaderboard(client, guildId, type);
    await interaction.reply({ embeds: [embed("info", `${type} leaderboard`, rows.length ? rows.map((row, index) => `**${index + 1}.** <@${row.userId}> — **${type === "voice" ? Math.floor(row.value / 60) : row.value}**`).join("\n") : "No statistics recorded yet.")] }); return;
  }
  if (["snakewatergun", "swg"].includes(name)) { const pick = interaction.options.getString("choice") || "snake"; const choices = ["snake", "water", "gun"]; const bot = choices[Math.floor(Math.random() * choices.length)]; const win = (pick === "snake" && bot === "water") || (pick === "water" && bot === "gun") || (pick === "gun" && bot === "snake"); await interaction.reply({ embeds: [embed("info", "Snake Water Gun", `You chose **${pick}**. I chose **${bot}**. ${pick === bot ? "Draw." : win ? "You win!" : "I win!"}`)] }); return; }
  if (name === "setprefix") { const value = interaction.options.getString("value", true); if (!/^[^\s]{1,5}$/.test(value)) throw new Error("Prefix must be 1-5 non-space characters."); client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, prefix: value })); await interaction.reply({ embeds: [embed("success", "Prefix saved", `Prefix set to ${value}.`)] }); return; }
  if (name === "avatar") { const user = interaction.options.getUser("user") || interaction.user; await interaction.reply({ embeds: [embed("info", `${user.username}'s avatar`, user.displayAvatarURL({ size: 1024 }))] }); return; }
    if (name === "accountage") { const user = interaction.options.getUser("user") || interaction.user; await interaction.reply({ embeds: [embed("info", "Account age", `<@${user.id}> created their account <t:${Math.floor(user.createdTimestamp / 1000)}:R>.`)] }); return; }
    if (name === "roleinfo") { const user = interaction.options.getUser("user") || interaction.user; const member = await interaction.guild.members.fetch(user.id); await interaction.reply({ embeds: [embed("info", "Role information", member.roles.cache.filter((role) => role.id !== interaction.guild.id).map((role) => role.toString()).join(", ") || "No roles assigned.")] }); return; }
    if (name === "membercount") { await interaction.reply({ embeds: [embed("info", "Member count", `This server has **${interaction.guild.memberCount}** member(s).`)] }); return; }
    if (name === "botinfo") { await interaction.reply({ embeds: [embed("info", "Bot information", `Servers: **${client.guilds.cache.size}**\nCommands: **${client.commands.size}**\nStarted: <t:${Math.floor(client.startedAt / 1000)}:R>`)] }); return; }
    if (name === "premium") { await interaction.reply({ embeds: [embed("info", "Premium status", client.db.getGuildSettings(guildId).premium ? "Premium is enabled for this server." : "Premium is not enabled for this server.")] }); return; }
    if (name === "sponsor") { await interaction.reply({ embeds: [embed("info", "Sponsor", "Thank you for supporting this community.")] }); return; }
    if (name === "permissions") { const permissions = interaction.memberPermissions?.toArray?.() || []; await interaction.reply({ embeds: [embed("info", "Your permissions", permissions.length ? permissions.join(", ") : "No permissions found.")] }); return; }
    if (name === "invite") { const invite = await interaction.channel.createInvite({ maxAge: interaction.options.getInteger("max_age") || 0, maxUses: 0, unique: true, reason: `Created by ${interaction.user.tag}` }); await interaction.reply({ embeds: [embed("success", "Invite created", invite.url)] }); return; }
    if (name === "boostcount") { await interaction.reply({ embeds: [embed("info", "Boost count", `This server has **${interaction.guild.premiumSubscriptionCount || 0}** boost(s) and is level **${interaction.guild.premiumTier || 0}**.`)] }); return; }
    if (name === "unbanall") { const bans = await interaction.guild.bans.fetch(); if (!bans.size) { await interaction.reply({ embeds: [embed("info", "Unban all", "There are no banned users.")] }); return; } await interaction.deferReply({ ephemeral: true }); for (const user of bans.values()) await interaction.guild.members.unban(user.id, "Unban all command").catch(() => {}); await interaction.editReply({ embeds: [embed("success", "Unban all", `Processed **${bans.size}** banned user(s).`)] }); return; }
    if (name === "github") { await interaction.reply({ embeds: [embed("info", "GitHub", "https://github.com/EJKER07/Eagle")] }); return; }
    if (name === "channelinfo") { const channel = interaction.options.getChannel("channel") || interaction.channel; await interaction.reply({ embeds: [embed("info", "Channel information", `Name: **${channel.name}**\nID: ${channel.id}\nType: **${channel.type}**`)] }); return; }
    if (name === "vcinfo") { const channel = interaction.options.getChannel("channel") || interaction.member.voice.channel; await interaction.reply({ embeds: [embed("info", "Voice information", channel ? `Channel: ${channel}\nMembers: **${channel.members.size}**` : "You are not connected to a voice channel.")] }); return; }
    if (name === "banner") { const user = interaction.options.getUser("user") || interaction.user; await interaction.reply({ embeds: [embed("info", `${user.username}'s banner`, user.bannerURL({ size: 1024 }) || "This user has no banner.")] }); return; }
    if (["reminder", "timer"].includes(name)) { const seconds = interaction.options.getInteger("seconds") || 60; const message = interaction.options.getString("message", true); await interaction.reply({ embeds: [embed("success", name === "timer" ? "Timer started" : "Reminder set", `I will notify you in **${seconds}** second(s).`)], ephemeral: true }); setTimeout(() => interaction.user.send({ content: `${interaction.user}, your ${name} is ready: ${message}` }).catch(() => {}), seconds * 1000); return; }
    if (name === "status") { await interaction.reply({ embeds: [embed("info", "Bot status", `Online\nAPI latency: **${client.ws.ping}ms**\nUptime: <t:${Math.floor(client.startedAt / 1000)}:R>`)] }); return; }
    if (name === "hack") { const target = interaction.options.getString("text", true); await interaction.reply({ embeds: [embed("info", "Security scan", `Scanning **${target}**...\nNo real account data is accessed.`)] }); return; }
    if (name === "token") { await interaction.reply({ embeds: [embed("warning", "Token safety", "Bot tokens are private credentials and cannot be displayed or generated here.")] }); return; }
    if (name === "users") { await interaction.reply({ embeds: [embed("info", "Users", `Cached users across this server: **${interaction.guild.memberCount}**.`)] }); return; }
    if (name === "urban") { await interaction.reply({ embeds: [embed("info", "Urban Dictionary", `Search requested for **${interaction.options.getString("text", true)}**. Add an Urban Dictionary API key to enable live results.`)] }); return; }
    if (name === "rickroll") { await interaction.reply({ content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }); return; }
    if (name === "hash") { const crypto = require("node:crypto"); await interaction.reply({ embeds: [embed("info", "SHA-256", crypto.createHash("sha256").update(interaction.options.getString("text", true)).digest("hex"))] }); return; }
    if (name === "snipe") { await interaction.reply({ embeds: [embed("info", "Snipe", "No deleted message is currently cached.")] }); return; }
    if (name === "list") { await interaction.reply({ embeds: [embed("info", "Server list", interaction.guild.channels.cache.map((channel) => `${channel} (${channel.type})`).join("\n").slice(0, 4000) || "No channels found.")] }); return; }
    if (name === "deleteemoji") { const value = interaction.options.getString("emoji", true); const emojiId = value.match(/<a?:[^:]+:(\d+)>/)?.[1] || (/^\d+$/.test(value) ? value : null); if (!emojiId) throw new Error("Provide a custom emoji mention or numeric emoji ID."); const emoji = await interaction.guild.emojis.fetch(emojiId).catch(() => null); if (!emoji) throw new Error("That emoji was not found in this server."); await emoji.delete(`Deleted by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("success", "Emoji deleted", `Deleted **${emoji.name}**.`)] }); return; }
    if (["prefixcommands", "prefixlist"].includes(name)) {
      const { selectSlashCommands } = require("./commandDeployment");
      const { skipped } = selectSlashCommands(client.commands);
      const names = skipped.map((command) => `$${command.data.name}`).join(", ");
      await interaction.reply({ embeds: [embed("info", "Prefix-only commands", names || "All loaded commands are currently available as slash commands.", [{ name: "Usage", value: "Use the `$` prefix before any command shown above." }])] });
      return;
    }
    if (name === "clone") { const clone = await interaction.channel.clone({ reason: `Cloned by ${interaction.user.tag}` }); await interaction.reply({ embeds: [embed("success", "Channel cloned", `Created ${clone}.`)] }); return; }
    if (name === "hide") { await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }); await interaction.reply({ embeds: [embed("moderation", "Channel hidden", "The channel is hidden from @everyone.")] }); return; }
    if (["hideall", "lockall", "unlockall"].includes(name)) { const channels = interaction.guild.channels.cache.filter((channel) => channel.isTextBased()); for (const channel of channels.values()) { if (name === "hideall") await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(() => {}); else await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: name === "unlockall" ? null : false }).catch(() => {}); } await interaction.reply({ embeds: [embed("moderation", name, `Processed **${channels.size}** channel(s).`)] }); return; }
    if (name === "unslowmode") { await interaction.channel.setRateLimitPerUser(0, `Unslowmode by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("moderation", "Slowmode disabled", "Slowmode is now disabled in this channel.")] }); return; }
    if (name === "nuke") { const channel = interaction.channel; const clone = await channel.clone({ reason: `Nuked by ${interaction.user.tag}` }); await channel.delete(`Nuked by ${interaction.user.tag}`); await clone.send({ embeds: [{ color: 0xed4245, description: `Nuked by ${interaction.user}` }], allowedMentions: { users: [interaction.user.id] } }); return; }
    if (name === "role") { const role = interaction.options.getRole("role", true); const members = await interaction.guild.members.fetch(); let count = 0; for (const member of members.values()) if (!member.user.bot && !member.roles.cache.has(role.id)) await member.roles.add(role).then(() => count++).catch(() => {}); await interaction.reply({ embeds: [embed("success", "Role assigned", `Assigned ${role} to **${count}** member(s).`)] }); return; }
    if (name === "roleicon") { const role = interaction.options.getRole("role", true); await role.setIcon(interaction.options.getString("image", true), `Role icon changed by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("success", "Role icon updated", `${role} now has a new icon.`)] }); return; }
    if (name === "deletesticker") { const id = interaction.options.getString("sticker", true); const sticker = await interaction.guild.stickers.fetch(id).catch(() => null); if (!sticker) throw new Error("Sticker not found in this server."); await sticker.delete(`Deleted by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("success", "Sticker deleted", `Deleted **${sticker.name}**.`)] }); return; }
    if (name === "enlarge") { const match = interaction.options.getString("emoji", true).match(/<a?:([^:]+):(\d+)>/); if (!match) throw new Error("Provide a custom emoji mention."); await interaction.reply({ embeds: [embed("info", `:${match[1]}:`, `https://cdn.discordapp.com/emojis/${match[2]}.png?size=1024`)] }); return; }
    if (name === "topcheck") { await interaction.reply({ embeds: [embed("info", "Role hierarchy", `Your highest role is **${interaction.member.roles.highest.name}**.`)] }); return; }
    if (name === "audit") { const limit = interaction.options.getInteger("limit") || 10; const logs = await interaction.guild.fetchAuditLogs({ limit }); const entries = [...logs.entries.values()]; await interaction.reply({ embeds: [embed("info", "Audit log", entries.length ? entries.map((entry) => `${entry.action} by ${entry.executor || "unknown"}`).join("\n") : "No audit entries found.")] }); return; }
  if (name === "stats") { await interaction.reply({ embeds: [embed("info", "Bot statistics", `Servers: **${client.guilds.cache.size}**\nUsers cached: **${client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0)}**\nStarted: <t:${Math.floor(client.startedAt / 1000)}:R>`)] }); return; }
  if (name === "gstart") { const duration = parseDuration(interaction.options.getString("duration", true)); const giveaway = { id: `${guildId}-${Date.now()}`, guildId, channelId: interaction.channel.id, messageId: null, hostId: interaction.user.id, hostAvatarUrl: interaction.user.displayAvatarURL({ size: 256 }), prize: interaction.options.getString("prize", true), winnerCount: 1, endsAt: Date.now() + duration * 1000, entries: [], ended: false }; const reactionEmoji = interaction.guild?.emojis.cache.find((item) => item.name === "Fire_money") || "🎉"; const message = await interaction.channel.send({ embeds: [activeEmbed(giveaway, reactionEmoji)], components: giveawayComponents(giveaway.id) }); await message.react(reactionEmoji).catch(() => {}); giveaway.messageId = message.id; client.db.saveGiveaway(guildId, giveaway); scheduleGiveaway(client, giveaway); await interaction.reply({ embeds: [embed("success", "Giveaway started", "The giveaway is now live.")], ephemeral: true }); return; }
  if (["gend", "greroll"].includes(name)) { const id = interaction.options.getString("id", true); const giveaway = client.db.getGiveaways(guildId).find((item) => item.messageId === id); if (!giveaway) throw new Error("That giveaway could not be found."); if (name === "greroll" && !giveaway.ended) throw new Error("End the giveaway before rerolling it."); await finishGiveaway(client, name === "greroll" ? { ...giveaway, ended: false } : giveaway); await interaction.reply({ embeds: [embed("success", name === "gend" ? "Giveaway ended" : "Giveaway rerolled", "Winners were selected.")], ephemeral: true }); return; }
  if (["kick", "ban", "mute", "unmute"].includes(name)) { const member = await interaction.guild.members.fetch(userId); const reason = interaction.options.getString("reason") || `Action by ${interaction.user.tag}`; if (name === "kick") await member.kick(reason); else if (name === "ban") await member.ban({ reason }); else await member.timeout(name === "mute" ? 28 * 24 * 60 * 60 * 1000 : null, reason); await interaction.reply({ embeds: [embed("moderation", "Moderation action", `<@${userId}> was ${name === "mute" ? "timed out" : name === "unmute" ? "untimed out" : name + "ed"}.`)] }); return; }
  if (name === "erase") { await interaction.deferReply({ ephemeral: true }); const deleted = await interaction.channel.bulkDelete(interaction.options.getInteger("amount", true), true); await interaction.editReply({ embeds: [embed("moderation", "Messages erased", `Deleted **${deleted.size}** message(s).`)] }); return; }
  if (["disablegreet", "greetchannels"].includes(name)) { client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, welcome: { ...settings.welcome, enabled: name !== "disablegreet" } })); await interaction.reply({ embeds: [embed("success", "Greet settings updated", name === "disablegreet" ? "Greeting is disabled." : "Greeting remains enabled.")] }); return; }
  await interaction.reply({ embeds: [embed("info", name, "This command is available through the existing moderation or giveaway workflow.")] });
}

function createCommand(name) { return { data: commandData(name), permissions: ["greet", "setprefix", "gstart", "gend", "greroll", "erase", "addinvites", "removeinvites", "addmessages", "removemessages", "setjoinchannel", "setleavechannel", "setjoinmessage", "setleavemessage", "unsetjoinchannel", "unsetleavechannel", "unsetjoinmessage", "unsetleavemessage", "clearinvites", "clearmessages", "clearvoice", "blacklistchannel", "unblacklistchannel", "disablegreet", "kick", "ban", "mute", "unmute", "unbanall", "deleteemoji", "hide", "hideall", "lockall", "unlockall", "unslowmode", "clone", "nuke", "role", "roleicon", "deletesticker"].includes(name) ? admin : undefined, async execute(interaction, client) { return execute(interaction, client, name); } }; }

module.exports = { createCommand, metricNames };