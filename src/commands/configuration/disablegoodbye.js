const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("disablegoodbye").setDescription("Disable goodbye messages.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, goodbye: { ...settings.goodbye, enabled: false } }));
    await interaction.reply({ embeds: [embed("success", "Goodbye disabled", "Goodbye messages are disabled for this server.")] });
  },
};
