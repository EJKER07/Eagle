const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settings")
    .setDescription("View server settings.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction, client) {
    const settings = client.db.getGuildSettings(interaction.guildId);
    await interaction.reply({
      embeds: [embed("info", "Server Settings", `📨 **Greeting:** ${settings.welcomeChannelId ? "<#" + settings.welcomeChannelId + ">" : "Not set"}\n👋 **Goodbye:** ${settings.goodbyeChannelId ? "<#" + settings.goodbyeChannelId + ">" : "Not set"}\n🎫 **Tickets:** ${settings.ticketChannelId ? "<#" + settings.ticketChannelId + ">" : "Not set"}\n📊 **Logs:** ${settings.logChannelId ? "<#" + settings.logChannelId + ">" : "Not set"}`)],
    });
  },
};
