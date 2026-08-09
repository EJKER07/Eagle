const { Events, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { executeInteraction } = require("../../services/interactionService");
const { embed } = require("../../utils/embeds");
const { createTranscript } = require("discord-html-transcripts");
const { activeEmbed } = require("../../services/giveawayService");

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      await executeInteraction(client, interaction);
      return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket:create") {
      const settings = client.db.getGuildSettings(interaction.guildId).tickets;
      if (!settings.enabled) throw new Error("Tickets are disabled in this server.");
      const existing = interaction.guild.channels.cache.find((channel) => channel.topic === `ticket-owner:${interaction.user.id}`);
      if (existing) return interaction.reply({ embeds: [embed("warning", "Ticket already open", `You already have ${existing}.`)], ephemeral: true });
      const overwrites = [
        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ];
      for (const roleId of settings.staffRoleIds?.length ? settings.staffRoleIds : [settings.staffRoleId]) {
        if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
      }
      const channel = await interaction.guild.channels.create({ name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90), type: ChannelType.GuildText, topic: `ticket-owner:${interaction.user.id}`, parent: settings.categoryId || undefined, permissionOverwrites: overwrites });
      const staffRoleIds = settings.staffRoleIds?.length ? settings.staffRoleIds : (settings.staffRoleId ? [settings.staffRoleId] : []);
      const categoryName = interaction.values[0].replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
      const ticketEmbed = embed("ticket", `${categoryName} Ticket`, `**Welcome** ${interaction.user}\n**Category:** ${categoryName}\n\nOur support team will assist you shortly.`)
        .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));
      if (client.config.ticket.imageUrl) ticketEmbed.setImage(client.config.ticket.imageUrl);
      const ticketButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket:claim").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ticket:close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger),
      );
      await channel.send({ content: `${interaction.user}${staffRoleIds.map((id) => ` <@&${id}>`).join("")}`, embeds: [ticketEmbed], components: [ticketButtons], allowedMentions: { users: [interaction.user.id], roles: staffRoleIds } });
      await interaction.reply({ embeds: [embed("success", "Ticket created", `Your private ticket is ${channel}.`)], ephemeral: true });
    }
    if (interaction.isButton() && ["ticket:claim", "ticket:close", "ticket:reopen", "ticket:delete"].includes(interaction.customId)) {
      const settings = client.db.getGuildSettings(interaction.guildId).tickets;
      const staffRoleIds = settings.staffRoleIds?.length ? settings.staffRoleIds : (settings.staffRoleId ? [settings.staffRoleId] : []);
      const isStaff = interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)
        || staffRoleIds.some((roleId) => interaction.member.roles.cache.has(roleId));
      if (!isStaff) return interaction.reply({ embeds: [embed("error", "Staff only", "Only configured staff can manage tickets.")], ephemeral: true });
      if (interaction.customId === "ticket:claim") {
        await interaction.reply({ embeds: [embed("success", "Ticket claimed", `${interaction.user} is now handling this ticket.`)] });
        return;
      }
      if (interaction.customId === "ticket:close") {
        await interaction.channel.permissionOverwrites.edit(interaction.channel.topic?.match(/ticket-owner:(\d+)/)?.[1] || interaction.user.id, { SendMessages: false });
        return interaction.update({ embeds: [embed("warning", "Ticket closed", "This ticket is now read-only.")], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:reopen").setLabel("Reopen").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("ticket:delete").setLabel("Delete").setStyle(ButtonStyle.Danger))] });
      }
      if (interaction.customId === "ticket:reopen") {
        const ownerId = interaction.channel.topic?.match(/ticket-owner:(\d+)/)?.[1];
        if (ownerId) await interaction.channel.permissionOverwrites.edit(ownerId, { SendMessages: true });
        return interaction.update({ embeds: [embed("success", "Ticket reopened", "The ticket is writable again.")], components: [] });
      }
      const logId = settings.logChannelId || settings.logging?.tickets;
      const logChannel = logId ? interaction.guild.channels.cache.get(logId) : null;
      if (logChannel?.isTextBased()) await logChannel.send({ content: `Transcript for ${interaction.channel}:`, files: [await createTranscript(interaction.channel, { limit: -1, filename: `${interaction.channel.name}.html` })] });
      await interaction.reply({ embeds: [embed("error", "Deleting ticket", "This channel will be deleted in 5 seconds.")], components: [] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    }
    if (interaction.isButton() && interaction.customId.startsWith("afk:dm-toggle:")) {
      const ownerId = interaction.customId.split(":")[2];
      if (ownerId !== interaction.user.id) return interaction.reply({ content: "Only the AFK owner can change this setting.", ephemeral: true });
      const current = client.db.getAfk(interaction.guildId, ownerId);
      if (!current) return interaction.reply({ content: "Your AFK status has already been cleared.", ephemeral: true });
      client.db.setAfkDmOnMention(interaction.guildId, ownerId, !current.dmOnMention);
      await interaction.reply({ content: `Mention DMs ${current.dmOnMention ? "disabled" : "enabled"}.`, ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith("giveaway:join:")) {
      const giveawayId = interaction.customId.split(":")[2];
      const giveaway = client.db.getGiveaways(interaction.guildId).find((item) => item.id === giveawayId);
      if (!giveaway || giveaway.ended || giveaway.endsAt <= Date.now()) {
        return interaction.reply({ embeds: [embed("warning", "Giveaway ended", "This giveaway is no longer accepting entries.")], ephemeral: true });
      }
      if (giveaway.entries.includes(interaction.user.id)) {
        return interaction.reply({ embeds: [embed("info", "Already entered", "You are already entered in this giveaway.")], ephemeral: true });
      }
      giveaway.entries.push(interaction.user.id);
      client.db.saveGiveaway(interaction.guildId, giveaway);
      await interaction.reply({ embeds: [embed("success", "Entry added", "You are now entered in the giveaway.")], ephemeral: true });
    }
    if (interaction.isButton() && interaction.customId.startsWith("poll:")) {
      await interaction.reply({ embeds: [embed("success", "Vote recorded", "Your vote has been recorded.")], ephemeral: true });
    }
  },
};
