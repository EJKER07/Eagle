const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
module.exports = { data: new SlashCommandBuilder().setName("stop").setDescription("Stop music and leave the voice channel."), async execute(interaction, client) { requireQueue(client, interaction).stop(); await interaction.reply("Stopped."); } };
