const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
module.exports = {
  data: new SlashCommandBuilder().setName("greetvariables").setDescription("List welcome and goodbye message variables."),
  async execute(interaction) { await interaction.reply({ embeds: [embed("info", "Message variables", "`{user}` `{username}` `{userid}` `{server}` `{membercount}` `{mention}` `{avatar}` `{channel}`")] }); },
};
