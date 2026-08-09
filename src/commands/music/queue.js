const { SlashCommandBuilder } = require("discord.js");
const { requireQueue } = require("../../utils/music");
module.exports = { data: new SlashCommandBuilder().setName("queue").setDescription("Show the current music queue."), async execute(interaction, client) { const queue = requireQueue(client, interaction); const songs = queue.songs.slice(0, 10).map((song, index) => `${index + 1}. ${song.name} (${song.formattedDuration})`).join("\n"); await interaction.reply(`**Queue**\n${songs || "The queue is empty."}`); } };
