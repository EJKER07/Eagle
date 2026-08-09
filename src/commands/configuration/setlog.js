const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("setlog").setDescription("Set a logging channel for a category.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption((o) => o.setName("category").setDescription("Log category").setRequired(true).addChoices({ name: "Moderation", value: "moderation" }, { name: "Security", value: "security" }, { name: "Member", value: "member" })).addChannelOption((o) => o.setName("channel").setDescription("Destination").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) { const category = interaction.options.getString("category"); const channel = interaction.options.getChannel("channel"); client.db.updateGuildSettings(interaction.guildId, (settings) => ({ ...settings, logging: { ...settings.logging, [category]: channel.id } })); await interaction.reply({ embeds: [embed("success", "Logging configured", `${category} logs will be sent to ${channel}.`)] }); },
};
