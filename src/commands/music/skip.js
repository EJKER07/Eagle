const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
module.exports = { data: new SlashCommandBuilder().setName("skip").setDescription("Skip the current song."), async execute(interaction, client) { await requireQueue(client, interaction).skip(); await interaction.reply("Skipped."); } };
