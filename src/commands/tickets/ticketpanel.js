const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { emoji, componentEmoji } = require("../../utils/emojis");
module.exports = {
  data: new SlashCommandBuilder().setName("ticketpanel").setDescription("Post a premium support ticket panel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addChannelOption((o) => o.setName("channel").setDescription("Panel channel").setRequired(false)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel") || interaction.channel;
    if (channel.type !== ChannelType.GuildText) throw new Error("Choose a text channel.");
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, tickets: { ...settings.tickets, enabled: true } }));
    const categories = [
      ["Support", "support"], ["General", "utility"], ["Purchase", "purchase"], ["Report", "report"],
      ["Partnership", "partnership"], ["Giveaway", "giveaway"], ["Nitro", "nitro"], ["Deco", "utility"], ["LTC", "ltc"],
    ];
    const menu = new StringSelectMenuBuilder().setCustomId("ticket:create").setPlaceholder(`${emoji("ticket")} Choose a ticket category`).addOptions(
      categories.map(([name, icon]) => ({ label: name, value: name.toLowerCase(), emoji: componentEmoji(icon) })),
    );
    const panelEmbed = embed("ticket", "Support Tickets", "Select a category to create a support ticket");
    if (client.config.ticket.panelImageUrl) panelEmbed.setThumbnail(client.config.ticket.panelImageUrl);
    await channel.send({ embeds: [panelEmbed], components: [new ActionRowBuilder().addComponents(menu)] });
    await interaction.reply({ embeds: [embed("success", "Ticket panel posted", `Panel sent to ${channel}.`)], ephemeral: true });
  },
};
