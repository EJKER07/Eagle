const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("warn").setDescription("Issue or clear a persistent warning.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((sub) => sub.setName("add").setDescription("Warn a member").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true)))
    .addSubcommand((sub) => sub.setName("clear").setDescription("Clear warnings").addUserOption((o) => o.setName("user").setDescription("Member").setRequired(true))),
  permissions: [PermissionFlagsBits.ModerateMembers],
  async execute(interaction, client) {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser("user");
    if (subcommand === "clear") {
      const count = client.db.clearWarnings(interaction.guildId, user.id);
      await interaction.reply({ embeds: [embed("success", "Warnings cleared", `Cleared **${count}** warning(s) for ${user}.`)] });
      return;
    }
    const warning = client.db.addWarning(interaction.guildId, user.id, interaction.user.id, interaction.options.getString("reason"));
    const settings = client.db.getGuildSettings(interaction.guildId);
    const count = client.db.listWarnings(interaction.guildId, user.id).length;
    const escalation = settings.moderation.escalation[String(count)];
    let action = "No automatic escalation.";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (member && escalation === "timeout") await member.timeout(10 * 60 * 1000, `Warning escalation: ${warning.reason}`).then(() => { action = "10 minute timeout applied."; }).catch(() => {});
    if (member && escalation === "kick") await member.kick(`Warning escalation: ${warning.reason}`).then(() => { action = "Member kicked."; }).catch(() => {});
    if (escalation === "ban") await interaction.guild.members.ban(user.id, { reason: `Warning escalation: ${warning.reason}` }).then(() => { action = "Member banned."; }).catch(() => {});
    await interaction.reply({ embeds: [embed("moderation", "Warning issued", `${user} now has **${count}** warning(s).\nReason: ${warning.reason}\n${action}`)] });
  },
};
