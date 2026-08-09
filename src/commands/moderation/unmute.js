const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute a member.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ embeds: [embed("error", "Member not found", "That user is not in this server.")] });
    await member.disableCommunicationUntil(null).catch(() => {});
    await interaction.reply({ embeds: [embed("moderation", "Member unmuted", `${user} has been unmuted.`)] });
  },
};
