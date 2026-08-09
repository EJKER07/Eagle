const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("setgoodbye").setDescription("Configure goodbye messages.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Goodbye channel").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Supports {username}, {server}, {membercount}").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, goodbye: { ...settings.goodbye, enabled: true, channelId: channel.id, message } }));
    await interaction.reply({ embeds: [embed("success", "Goodbye configured", `Messages will be sent in ${channel}.`)] });
  },
};
