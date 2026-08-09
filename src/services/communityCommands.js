const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { embed } = require("../utils/embeds");
const { leaderboard } = require("./communityService");
const { activeEmbed, giveawayComponents, finishGiveaway, scheduleGiveaway } = require("./giveawayService");

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
  if (name === "gstart") return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("prize").setDescription("Prize").setRequired(true)).addIntegerOption((o) => o.setName("duration").setDescription("Seconds").setMinValue(10).setMaxValue(2592000).setRequired(true));
  if (["gend", "greroll"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("id").setDescription("Giveaway message ID").setRequired(true));
  if (["greet", "setprefix"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("value").setDescription(name === "greet" ? "Welcome message" : "Prefix").setRequired(true));
  if (["kick", "ban", "mute", "unmute"].includes(name)) return builder.setDefaultMemberPermissions(name === "ban" ? PermissionFlagsBits.BanMembers : PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason"));
  if (["erase"].includes(name)) return builder.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption((o) => o.setName("amount").setDescription("1-100 messages").setMinValue(1).setMaxValue(100).setRequired(true));
  if (["avatar", "userinfo"].includes(name)) return builder.addUserOption((o) => o.setName("user").setDescription("User"));
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
  if (name === "stats") { await interaction.reply({ embeds: [embed("info", "Bot statistics", `Servers: **${client.guilds.cache.size}**\nUsers cached: **${client.guilds.cache.reduce((total, guild) => total + guild.memberCount, 0)}**\nStarted: <t:${Math.floor(client.startedAt / 1000)}:R>`)] }); return; }
  if (name === "gstart") { const giveaway = { id: `${guildId}-${Date.now()}`, guildId, channelId: interaction.channel.id, messageId: null, hostId: interaction.user.id, prize: interaction.options.getString("prize", true), winnerCount: 1, endsAt: Date.now() + interaction.options.getInteger("duration", true) * 1000, entries: [], ended: false }; const message = await interaction.channel.send({ embeds: [activeEmbed(giveaway)], components: giveawayComponents(giveaway.id) }); giveaway.messageId = message.id; client.db.saveGiveaway(guildId, giveaway); scheduleGiveaway(client, giveaway); await interaction.reply({ embeds: [embed("success", "Giveaway started", "The giveaway is now live.")], ephemeral: true }); return; }
  if (["gend", "greroll"].includes(name)) { const id = interaction.options.getString("id", true); const giveaway = client.db.getGiveaways(guildId).find((item) => item.messageId === id); if (!giveaway) throw new Error("That giveaway could not be found."); if (name === "greroll" && !giveaway.ended) throw new Error("End the giveaway before rerolling it."); await finishGiveaway(client, name === "greroll" ? { ...giveaway, ended: false } : giveaway); await interaction.reply({ embeds: [embed("success", name === "gend" ? "Giveaway ended" : "Giveaway rerolled", "Winners were selected.")], ephemeral: true }); return; }
  if (["kick", "ban", "mute", "unmute"].includes(name)) { const member = await interaction.guild.members.fetch(userId); const reason = interaction.options.getString("reason") || `Action by ${interaction.user.tag}`; if (name === "kick") await member.kick(reason); else if (name === "ban") await member.ban({ reason }); else await member.timeout(name === "mute" ? 28 * 24 * 60 * 60 * 1000 : null, reason); await interaction.reply({ embeds: [embed("moderation", "Moderation action", `<@${userId}> was ${name === "mute" ? "timed out" : name === "unmute" ? "untimed out" : name + "ed"}.`)] }); return; }
  if (name === "erase") { await interaction.deferReply({ ephemeral: true }); const deleted = await interaction.channel.bulkDelete(interaction.options.getInteger("amount", true), true); await interaction.editReply({ embeds: [embed("moderation", "Messages erased", `Deleted **${deleted.size}** message(s).`)] }); return; }
  if (["disablegreet", "greetchannels"].includes(name)) { client.db.updateGuildSettings(guildId, (settings) => ({ ...settings, welcome: { ...settings.welcome, enabled: name !== "disablegreet" } })); await interaction.reply({ embeds: [embed("success", "Greet settings updated", name === "disablegreet" ? "Greeting is disabled." : "Greeting remains enabled.")] }); return; }
  await interaction.reply({ embeds: [embed("info", name, "This command is available through the existing moderation or giveaway workflow.")] });
}

function createCommand(name) { return { data: commandData(name), permissions: ["greet", "setprefix", "gstart", "gend", "greroll", "erase", "addinvites", "removeinvites", "addmessages", "removemessages", "setjoinchannel", "setleavechannel", "setjoinmessage", "setleavemessage", "unsetjoinchannel", "unsetleavechannel", "unsetjoinmessage", "unsetleavemessage", "clearinvites", "clearmessages", "clearvoice", "blacklistchannel", "unblacklistchannel", "disablegreet", "kick", "ban", "mute", "unmute"].includes(name) ? admin : undefined, async execute(interaction, client) { return execute(interaction, client, name); } }; }

module.exports = { createCommand, metricNames };