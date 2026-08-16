const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setjoinping")
    .setDescription("Set a channel to receive join notifications for new members.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Join ping channel").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const channel = interaction.options.getChannel("channel");
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({
      ...settings,
      joinNotifications: { ...settings.joinNotifications, pingChannelId: channel.id },
    }));
    await interaction.reply({
      embeds: [embed("success", "Join notifications configured", `New member pings will be sent in ${channel}.`)],
    });
  },
};
