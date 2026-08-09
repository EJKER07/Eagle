const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Show server statistics."),
  aliases: ["si", "guildinfo"],
  async execute(interaction) { const guild = interaction.guild; await interaction.reply({ embeds: [embed("info", guild.name, `Owner: <@${guild.ownerId}>\nMembers: **${guild.memberCount}**\nChannels: **${guild.channels.cache.size}**\nRoles: **${guild.roles.cache.size}**\nCreated: <t:${Math.floor(guild.createdTimestamp / 1000)}:D>`)] }); },
};
