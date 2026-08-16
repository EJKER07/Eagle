const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disablejoinping")
    .setDescription("Disable join notifications.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({
      ...settings,
      joinNotifications: { ...settings.joinNotifications, pingChannelId: null },
    }));
    await interaction.reply({
      embeds: [embed("success", "Join notifications disabled", "Members will no longer be announced when they join.")],
    });
  },
};
