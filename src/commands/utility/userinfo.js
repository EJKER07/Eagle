const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("userinfo").setDescription("Show member information.").addUserOption((o) => o.setName("user").setDescription("Member")),
  aliases: ["ui", "whois"],
  async execute(interaction) { const user = interaction.options.getUser("user") || interaction.user; const member = await interaction.guild.members.fetch(user.id); await interaction.reply({ embeds: [embed("info", user.tag, `User ID: \`${user.id}\`\nJoined: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\nAccount: <t:${Math.floor(user.createdTimestamp / 1000)}:R>`).setThumbnail(user.displayAvatarURL({ size: 256 }))] }); },
};
