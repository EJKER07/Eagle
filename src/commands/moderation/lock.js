const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("lock").setDescription("Lock the current channel.").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  permissions: [PermissionFlagsBits.ManageChannels],
  async execute(interaction) { await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false }); await interaction.reply({ embeds: [embed("moderation", "Channel locked", "Members can no longer send messages here.")] }); },
};
