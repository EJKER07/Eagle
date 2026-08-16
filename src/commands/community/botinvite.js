const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bi")
    .setDescription("Owner-only: create an OAuth2 install link for a bot application.")
    .addStringOption((option) => option.setName("client_id").setDescription("Target bot application ID").setRequired(true))
    .addStringOption((option) => option.setName("permissions").setDescription("Discord permission integer, default 0")),
  hidden: true,
  slashDeploy: false,
  async execute(interaction, client) {
    try {
      if (!client.config.ownerId || interaction.user.id !== client.config.ownerId) {
        return interaction.reply({ embeds: [embed("error", "Owner only", "This owner-only command is not available to you.")], ephemeral: true });
      }
      const clientId = interaction.options.getString("client_id", true).trim();
      const permissions = interaction.options.getString("permissions")?.trim() || "0";
      if (!/^\d{15,25}$/.test(clientId)) return interaction.reply({ embeds: [embed("error", "Invalid ID", "client_id must be a valid Discord application ID.")], ephemeral: true });
      if (!/^\d+$/.test(permissions)) return interaction.reply({ embeds: [embed("error", "Invalid permissions", "permissions must be a Discord permission integer.")], ephemeral: true });
      const url = new URL("https://discord.com/oauth2/authorize");
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("scope", "bot applications.commands");
      url.searchParams.set("permissions", permissions);
      await interaction.reply({ content: `Owner-only bot install link:\n${url.toString()}`, ephemeral: true });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Bot invite failed", error.message)], ephemeral: true });
    }
  },
};