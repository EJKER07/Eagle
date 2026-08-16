const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setroleping")
    .setDescription("Set a role and channel for notifications when members get that role.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption((o) => o.setName("role").setDescription("Role to monitor").setRequired(true))
    .addChannelOption((o) => o.setName("channel").setDescription("Notification channel").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const role = interaction.options.getRole("role");
    const channel = interaction.options.getChannel("channel");
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({
      ...settings,
      roleNotifications: { pingRoleId: role.id, pingChannelId: channel.id },
    }));
    await interaction.reply({
      embeds: [embed("success", "Role ping configured", `When members get ${role}, a notification will be sent in ${channel}.`)],
    });
  },
};
