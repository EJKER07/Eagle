const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admins")
    .setDescription("List server administrators."),
  async execute(interaction) {
    const members = await interaction.guild.members.fetch();
    const admins = members.filter((m) => m.permissions.has("Administrator") && !m.user.bot);
    const list = admins.map((m) => m.user.username).join(", ") || "None";
    await interaction.reply({ embeds: [embed("info", "Administrators", list)] });
  },
};
