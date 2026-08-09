const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mods")
    .setDescription("List server moderators."),
  async execute(interaction) {
    const members = await interaction.guild.members.fetch();
    const mods = members.filter((m) => m.permissions.has("ModerateMembers") && !m.user.bot);
    const list = mods.map((m) => m.user.username).join(", ") || "None";
    await interaction.reply({ embeds: [embed("info", "Moderators", list)] });
  },
};
