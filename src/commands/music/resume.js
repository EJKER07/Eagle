const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
module.exports = { data: new SlashCommandBuilder().setName("resume").setDescription("Resume music."), async execute(interaction, client) { requireQueue(client, interaction).resume(); await interaction.reply("Resumed."); } };
