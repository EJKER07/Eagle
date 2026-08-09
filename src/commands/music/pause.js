const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
module.exports = { data: new SlashCommandBuilder().setName("pause").setDescription("Pause music."), async execute(interaction, client) { requireQueue(client, interaction).pause(); await interaction.reply("Paused."); } };
