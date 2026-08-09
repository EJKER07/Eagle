const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("setgreet").setDescription("Configure the welcome message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Welcome channel").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Supports {mention}, {server}, {username}, {membercount}").setRequired(true))
    .addIntegerOption((o) => o.setName("delete_after").setDescription("Delete after N seconds, or 0").setMinValue(0).setMaxValue(86400)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    const deleteAfter = interaction.options.getInteger("delete_after") || 0;
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, welcome: { ...settings.welcome, enabled: true, channelId: channel.id, message, deleteAfter } }));
    await interaction.reply({ embeds: [embed("success", "Welcome configured", `Messages will be sent in ${channel}.`)] });
  },
};
