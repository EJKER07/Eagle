const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send a server announcement.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((o) => o.setName("channel").setDescription("Announcement channel").setRequired(true))
    .addStringOption((o) => o.setName("message").setDescription("Announcement message").setRequired(true)),
  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const message = interaction.options.getString("message");
    await channel.send({ embeds: [embed("info", "📢 Announcement", message)] });
    await interaction.reply({ embeds: [embed("success", "Announcement sent", `Posted to ${channel}.`)], ephemeral: true });
  },
};
