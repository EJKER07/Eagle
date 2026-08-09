const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("automod").setDescription("Enable or disable baseline AutoMod protection.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addBooleanOption((o) => o.setName("enabled").setDescription("Enable AutoMod").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) { const enabled = interaction.options.getBoolean("enabled"); client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, automod: { ...settings.automod, enabled } })); await interaction.reply({ embeds: [embed("security", "AutoMod updated", `Baseline anti-spam and bilingual word filtering are **${enabled ? "enabled" : "disabled"}**.`)] }); },
};
