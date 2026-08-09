const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Display or set server rules.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName("rules").setDescription("Server rules text").setRequired(false)),
  async execute(interaction, client) {
    const rules = interaction.options.getString("rules");
    if (rules) {
      client.db.updateGuildSettings(interaction.guildId, (s) => ({ ...s, rules }));
      await interaction.reply({ embeds: [embed("success", "Rules updated", "Server rules have been set.")] });
    } else {
      const settings = client.db.getGuildSettings(interaction.guildId);
      await interaction.reply({ embeds: [embed("info", "Server Rules", settings.rules || "No rules set yet.")] });
    }
  },
};
