const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure a FirstLight module for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) => option.setName("module").setDescription("Module to configure").setRequired(true).addChoices(
      { name: "Welcome", value: "welcome" }, { name: "Goodbye", value: "goodbye" }, { name: "Tickets", value: "tickets" },
      { name: "AutoMod", value: "automod" }, { name: "Anti-Nuke", value: "antinuke" }, { name: "Economy", value: "economy" }, { name: "Leveling", value: "leveling" },
    ))
    .addChannelOption((option) => option.setName("channel").setDescription("Channel used by the module").setRequired(false))
    .addRoleOption((option) => option.setName("role").setDescription("Staff role for tickets").setRequired(false)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const module = interaction.options.getString("module");
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("role");
    const settings = client.db.updateGuildSettings(interaction.guildId, (current) => {
      if (["welcome", "goodbye"].includes(module)) {
        current[module] = { ...current[module], enabled: true, channelId: channel?.id || current[module].channelId };
      } else if (module === "tickets") {
        current.tickets = { ...current.tickets, enabled: true, categoryId: channel?.id || current.tickets.categoryId, staffRoleId: role?.id || current.tickets.staffRoleId };
      } else if (module === "economy" || module === "leveling") current[module].enabled = true;
      else current[module].enabled = true;
      return current;
    });
    await interaction.reply({ embeds: [embed("success", "Setup saved", `**${module}** is now enabled for this server.${settings[module]?.channelId ? `\nChannel: <#${settings[module].channelId}>` : ""}`)] });
  },
};
