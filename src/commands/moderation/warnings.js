const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("warnings").setDescription("View a member's warnings.").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction, client) {
    const user = interaction.options.getUser("user");
    const warnings = client.db.listWarnings(interaction.guildId, user.id);
    const text = warnings.length ? warnings.map((warning, index) => `**${index + 1}.** ${warning.reason} — <@${warning.moderator_id}> <t:${Math.floor(warning.created_at / 1000)}:R>`).join("\n") : "No warnings found.";
    await interaction.reply({ embeds: [embed("moderation", `WARNINGS FOR ${user.username.toUpperCase()}`, text)] });
  },
};
