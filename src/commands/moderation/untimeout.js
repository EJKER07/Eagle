const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("untimeout").setDescription("Remove a member timeout.").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) { const member = await interaction.guild.members.fetch(interaction.options.getUser("user").id); if (!member.moderatable) throw new Error("I cannot modify this member because of role hierarchy."); await member.timeout(null, `Timeout removed by ${interaction.user.tag}`); await interaction.reply({ embeds: [embed("success", "Timeout removed", `${member} can speak again.`)] }); },
};
