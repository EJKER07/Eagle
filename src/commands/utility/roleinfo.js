const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("roleinfo")
    .setDescription("Show role information.")
    .addRoleOption((o) => o.setName("role").setDescription("Role").setRequired(true)),
  async execute(interaction) {
    const role = interaction.options.getRole("role");
    const members = interaction.guild.members.cache.filter((m) => m.roles.cache.has(role.id));
    await interaction.reply({
      embeds: [embed("info", `${role.name}`, `🎯 **ID:** ${role.id}\n👥 **Members:** ${members.size}\n🎨 **Color:** ${role.hexColor}\n📅 **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:D>`)],
    });
  },
};
