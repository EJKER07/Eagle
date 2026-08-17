const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { emoji, componentEmoji } = require("../../utils/emojis");
module.exports = {
  data: new SlashCommandBuilder().setName("ticketpanel").setDescription("Post a premium support ticket panel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption((o) => o.setName("channel").setDescription("Panel channel").setRequired(false)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    if (channel.type !== ChannelType.GuildText) throw new Error("Choose a text channel.");
    client.db.updateGuildSettings(interaction.guildId, (settings) => {
      const staffRoleIds = settings.tickets?.staffRoleIds?.length ? settings.tickets.staffRoleIds : (settings.tickets?.staffRoleId ? [settings.tickets.staffRoleId] : []);
      return {
        ...settings,
        tickets: {
          ...settings.tickets,
          enabled: true,
          staffRoleIds,
        },
      };
    });
    const categories = [
      ["Ltc rewards", "ltc", "ltc"],
      ["Nitro/Deco rewards", "nitro", "nitro-deco"],
      ["Robux rewards", "purchase", "robux"],
      ["Support", "support", "support"],
      ["General", "utility", "general"],
      ["Report", "report", "report"],
      ["Purchase", "purchase", "purchase"],
      ["Partnership", "partnership", "partnership"],
      ["Giveaway", "giveaway", "giveaway"],
    ];
    const menu = new StringSelectMenuBuilder().setCustomId("ticket:create").setPlaceholder(`${emoji("ticket")} Select a category to create a ticket...`).addOptions(
      categories.map(([name, icon, value]) => ({ label: name, value, emoji: componentEmoji(icon) })),
    );
    const panelEmbed = embed("ticket", "GENERAL SUPPORT TICKET", "Welcome to XJKER CM Support Network.\nOur active support team will assist you shortly.");
    if (client.config.ticket.panelImageUrl) panelEmbed.setThumbnail(client.config.ticket.panelImageUrl);
    await channel.send({ embeds: [panelEmbed], components: [new ActionRowBuilder().addComponents(menu)] });
    await interaction.reply({ embeds: [embed("success", "Ticket panel posted", `Panel sent to ${channel}.`)], ephemeral: true });
  },
};
