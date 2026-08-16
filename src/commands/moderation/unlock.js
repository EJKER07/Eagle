const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("unlock").setDescription("Unlock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(interaction) {
    try {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: null });
      await interaction.reply({ embeds: [embed("success", "Channel unlocked", "Members can send messages here again.")] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Unlock failed", error.message)] });
    }
  },
};
