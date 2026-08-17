const { Events, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { executeInteraction } = require("../../services/interactionService");
const { embed } = require("../../utils/embeds");
const { createTranscript } = require("discord-html-transcripts");
const { activeEmbed } = require("../../services/giveawayService");
const { getCheckinState } = require("../../services/promoDemoService");

const DEFAULT_STAFF_ROLE_ID = "1534099901976416257";

module.exports = {
  name: Events.InteractionCreate,
  once: false,
  async execute(client, interaction) {
    if (interaction.isChatInputCommand()) {
      await executeInteraction(client, interaction);
      return;
    }
    if (interaction.isStringSelectMenu() && interaction.customId === "ticket:create") {
      try {
        await interaction.deferReply({ ephemeral: true });
        const rawSettings = client.db.getGuildSettings(interaction.guildId).tickets;
        const configuredRoleIds = rawSettings.staffRoleIds?.length ? rawSettings.staffRoleIds : (rawSettings.staffRoleId ? [rawSettings.staffRoleId] : []);
        const roleIds = [...new Set([DEFAULT_STAFF_ROLE_ID, ...configuredRoleIds.filter(Boolean)])];
        const settings = {
          ...rawSettings,
          enabled: rawSettings.enabled || roleIds.length > 0,
          staffRoleIds: roleIds,
        };
        if (!settings.enabled) {
          return interaction.editReply({ embeds: [embed("error", "Tickets disabled", `Tickets are disabled in this server. Staff role ID required: ${roleIds.length ? roleIds.join(", ") : "not configured"}.`)] });
        }
        const existing = interaction.guild.channels.cache.find((channel) => channel.topic === `ticket-owner:${interaction.user.id}`);
        if (existing) {
          return interaction.editReply({ embeds: [embed("warning", "Ticket already open", `You already have ${existing}.`)] });
        }
        const overwrites = [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        ];
        for (const roleId of settings.staffRoleIds) {
          if (roleId) overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
        }
        const selectedValue = interaction.values[0];
        const categoryName = selectedValue.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
        const ticketTypeSlug = selectedValue.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const usernameSlug = interaction.user.username.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "user";
        const channelName = `${ticketTypeSlug}-${usernameSlug}`.slice(0, 90);
        const channel = await interaction.guild.channels.create({ name: channelName, type: ChannelType.GuildText, topic: `ticket-owner:${interaction.user.id}`, parent: settings.categoryId || undefined, permissionOverwrites: overwrites });
        const ticketImageUrl = client.config.ticket.imageUrl || "https://i.ibb.co/BVsB4CS4/382ad2dd02dd701a813c189ec01be1d3.jpg";
        const ticketEmbed = new EmbedBuilder()
          .setColor(0x0f172a)
          .setAuthor({ name: "Eagle Premium", iconURL: "https://cdn.discordapp.com/attachments/1536749083912306690/1538405479590531162/eagle.png?ex=6a828f40&is=6a813dc0&hm=0c74e9ab9a3da10f3c614ed2d08008c36cf472606041377e7d276a1e7b640e8e&" })
          .setTitle(`${categoryName.toUpperCase()} TICKET`)
          .setDescription(`Welcome ${interaction.user}\nCategory: ${categoryName}\n\nOur support team will assist you shortly.`)
          .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
          .setImage(ticketImageUrl)
          .setFooter({ text: "Eagle Premium • server tools" })
          .setTimestamp();
        const ticketButtons = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket:claim").setLabel("Claim Ticket").setStyle(ButtonStyle.Primary).setEmoji("🎟️"),
          new ButtonBuilder().setCustomId("ticket:close").setLabel("Close Ticket").setStyle(ButtonStyle.Danger).setEmoji("🔒"),
        );
        await channel.send({ content: `${interaction.user}${settings.staffRoleIds.map((id) => ` <@&${id}>`).join("")}`, embeds: [ticketEmbed], components: [ticketButtons], allowedMentions: { users: [interaction.user.id], roles: settings.staffRoleIds } });
        await interaction.editReply({ embeds: [embed("success", "Ticket created", `Your private ticket is ${channel}.`)] });
      } catch (error) {
        console.error("Ticket creation error:", error);
        await interaction.editReply({ embeds: [embed("error", "Ticket error", error.message || "Failed to create ticket. Try again.")] });
      }
    }
    if (interaction.isButton() && ["ticket:claim", "Claim Ticket", "ticket:close", "ticket:reopen", "ticket:delete"].includes(interaction.customId)) {
      try {
        const settings = client.db.getGuildSettings(interaction.guildId).tickets;
        const staffRoleIds = settings.staffRoleIds?.length ? settings.staffRoleIds : (settings.staffRoleId ? [settings.staffRoleId] : []);
        const effectiveStaffRoleIds = [...new Set([DEFAULT_STAFF_ROLE_ID, ...staffRoleIds.filter(Boolean)])];
        const isStaff = interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)
          || effectiveStaffRoleIds.some((roleId) => interaction.member?.roles?.cache?.has(roleId));
        if (!isStaff) return interaction.reply({ embeds: [embed("error", "Staff only", "Only configured staff can manage tickets.")], ephemeral: true });
        if (interaction.customId === "ticket:claim" || interaction.customId === "Claim Ticket") {
          const guildSettings = client.db.getGuildSettings(interaction.guildId);
          const promotionState = guildSettings.promotion || { checkins: {}, ticketTotals: {} };
          const previousCheckin = promotionState.checkins?.[interaction.channel.id];
          if (!previousCheckin) {
            if (!guildSettings.promotion) guildSettings.promotion = { checkins: {}, ticketTotals: {} };
            if (!guildSettings.promotion.ticketTotals) guildSettings.promotion.ticketTotals = {};
            if (!guildSettings.promotion.ticketTotals[interaction.user.id]) guildSettings.promotion.ticketTotals[interaction.user.id] = 0;
            guildSettings.promotion.ticketTotals[interaction.user.id] += 1;

            const nextState = getCheckinState({
              ...promotionState,
              staffMembers: new Set(promotionState.staffMembers || []),
            }, { userId: interaction.user.id, roleId: effectiveStaffRoleIds[0] || DEFAULT_STAFF_ROLE_ID }, interaction.channel.id);

            client.db.updateGuildSettings(interaction.guildId, (guildSettingsNext) => ({
              ...guildSettingsNext,
              promotion: {
                ...(guildSettingsNext.promotion || {}),
                checkins: nextState.checkins,
                ticketTotals: nextState.ticketTotals,
              },
            }));
            client.db.updateMetric(interaction.guildId, interaction.user.id, "tickets", 1);
            const day = new Date().toISOString().slice(0, 10);
            client.db.updateMetric(interaction.guildId, `${interaction.user.id}:${day}`, "tickets", 1);
            await interaction.deferUpdate().catch(() => {});
            const confirmation = await interaction.channel.send({
              content: `✅ <@${interaction.user.id}>, you got check-in!`,
              allowedMentions: { repliedUser: false },
            }).catch(() => null);
            if (confirmation) setTimeout(() => confirmation.delete().catch(() => {}), 1000);
            return;
          }

          await interaction.deferUpdate().catch(() => {});
          return;
        }
        if (interaction.customId === "ticket:close") {
          await interaction.channel.permissionOverwrites.edit(interaction.channel.topic?.match(/ticket-owner:(\d+)/)?.[1] || interaction.user.id, { SendMessages: false });
          return interaction.update({ embeds: [embed("warning", "Ticket closed", "This ticket is now read-only.")], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("ticket:reopen").setLabel("Reopen").setStyle(ButtonStyle.Success).setEmoji("🔓"), new ButtonBuilder().setCustomId("ticket:delete").setLabel("Delete").setStyle(ButtonStyle.Danger).setEmoji("🗑️"))] });
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
      } catch (error) {
        console.error("Ticket button error:", error);
        const response = { embeds: [embed("error", "Error", error.message || "An error occurred.")], ephemeral: true };
        if (interaction.replied || interaction.deferred) await interaction.followUp(response).catch(() => {});
        else await interaction.reply(response).catch(() => {});
      }
    }
    if (interaction.isButton() && interaction.customId.startsWith("afk:dm-toggle:")) {
      try {
        const ownerId = interaction.customId.split(":")[2];
        if (ownerId !== interaction.user.id) return interaction.reply({ content: "Only the AFK owner can change this setting.", ephemeral: true });
        const current = client.db.getAfk(interaction.guildId, ownerId);
        if (!current) return interaction.reply({ content: "Your AFK status has already been cleared.", ephemeral: true });
        client.db.setAfkDmOnMention(interaction.guildId, ownerId, !current.dmOnMention);
        await interaction.reply({ content: `Mention DMs ${current.dmOnMention ? "disabled" : "enabled"}.`, ephemeral: true });
      } catch (error) {
        console.error("AFK toggle error:", error);
        await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => {});
      }
    }
    if (interaction.isButton() && interaction.customId.startsWith("poll:")) {
      try {
        await interaction.reply({ embeds: [embed("success", "Vote recorded", "Your vote has been recorded.")], ephemeral: true });
      } catch (error) {
        console.error("Poll button error:", error);
        await interaction.reply({ content: "An error occurred.", ephemeral: true }).catch(() => {});
      }
    }
  },
};
