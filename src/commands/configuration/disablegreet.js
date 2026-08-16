const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("disablegreet").setDescription("Disable welcome messages.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  aliases: ["disablewelcome", "ungreet"],
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    try {
      client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, welcome: { ...settings.welcome, enabled: false } }));
      await interaction.reply({ embeds: [embed("success", "Welcome disabled", "Welcome messages are disabled for this server.")] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Configuration error", error.message)] });
    }
  },
};
