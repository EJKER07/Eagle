const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("botinvite")
    .setDescription("Owner-only: create an OAuth2 install link for a bot application.")
    .addStringOption((option) => option.setName("client_id").setDescription("Target bot application ID").setRequired(true))
    .addStringOption((option) => option.setName("permissions").setDescription("Discord permission integer, default 0")),
  hidden: true,
  slashDeploy: false,
  async execute(interaction, client) {
    if (!client.config.ownerId || interaction.user.id !== client.config.ownerId) {
      throw new Error("This owner-only command is not available to you.");
    }
    const clientId = interaction.options.getString("client_id", true).trim();
    const permissions = interaction.options.getString("permissions")?.trim() || "0";
    if (!/^\d{15,25}$/.test(clientId)) throw new Error("client_id must be a valid Discord application ID.");
    if (!/^\d+$/.test(permissions)) throw new Error("permissions must be a Discord permission integer.");
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("scope", "bot applications.commands");
    url.searchParams.set("permissions", permissions);
    await interaction.reply({ content: `Owner-only bot install link:\n${url.toString()}`, ephemeral: true });
  },
};