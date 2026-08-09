const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member.").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addIntegerOption((o) => o.setName("minutes").setDescription("Duration in minutes").setRequired(true).setMinValue(1).setMaxValue(40320)).addStringOption((o) => o.setName("reason").setDescription("Reason")),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) { const member = await interaction.guild.members.fetch(interaction.options.getUser("user").id); if (!member.moderatable) throw new Error("I cannot timeout this member because of role hierarchy."); await member.timeout(interaction.options.getInteger("minutes") * 60000, interaction.options.getString("reason") || `Timeout by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("moderation", "Member timed out", `${member} was timed out.`)] }); },
};
