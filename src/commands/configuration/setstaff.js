const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setstaff")
    .setDescription("Configure the roles allowed to manage tickets.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addRoleOption((option) => option.setName("role").setDescription("Staff role").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const role = interaction.options.getRole("role");
    client.db.updateGuildSettings(interaction.guildId, (settings) => ({
      ...settings,
      tickets: { ...settings.tickets, staffRoleIds: [...new Set([...(settings.tickets.staffRoleIds || []), role.id])] },
    }));
    await interaction.reply({ embeds: [embed("success", "Staff role configured", `${role} can now manage tickets.`)] });
  },
};
