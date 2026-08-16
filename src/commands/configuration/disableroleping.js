const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disableroleping")
    .setDescription("Disable role notifications.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({
      ...settings,
      roleNotifications: { pingRoleId: null, pingChannelId: null },
    }));
    await interaction.reply({
      embeds: [embed("success", "Role ping disabled", "No more role assignment notifications.")],
    });
  },
};
