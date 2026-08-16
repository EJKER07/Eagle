const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a member timeout.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      if (!member) {
        return interaction.reply({ embeds: [embed("error", "Member not found", "That member could not be found in this server.")] });
      }
      if (!member.moderatable) {
        return interaction.reply({ embeds: [embed("error", "Cannot modify member", "I cannot modify this member because of role hierarchy.")] });
      }
      const reason = `Timeout removed by ${interaction.user.tag}`;
      await member.timeout(null, reason);
      await interaction.reply({ embeds: [embed("success", "Timeout removed", `${member} can speak again.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Failed to remove timeout", error.message || "Could not remove timeout.")] });
    }
  },
};
