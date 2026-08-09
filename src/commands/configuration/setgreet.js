const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("setgreet").setDescription("Configure the welcome message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Welcome channel").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Optional message; supports {mention}, {server}, {username}, {membercount}"))
    .addIntegerOption((o) => o.setName("delete_after").setDescription("Delete after 1 second (default)").setMinValue(0).setMaxValue(1)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message") || "Welcome {mention} to **{server}**!";
    const deleteAfter = interaction.options.getInteger("delete_after") ?? 1;
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, welcome: { ...settings.welcome, enabled: true, channelId: channel.id, message, deleteAfter } }));
    await interaction.reply({ embeds: [embed("success", "Welcome configured", `Messages will be sent in ${channel}. Use /testgreet to preview it or /disablegreet to turn it off.`)] });
  },
};
