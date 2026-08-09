const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { requireVoice } = require("../../utils/music");
const { emoji } = require("../../utils/emojis");

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Play a song or playlist.").addStringOption((o) => o.setName("query").setDescription("URL or search").setRequired(true)),
  async execute(interaction, client) {
    if (!client.distube) throw new Error("Music is not available because the player failed to initialize.");
    const channel = requireVoice(interaction);
    await interaction.deferReply();
    await client.distube.play(channel, interaction.options.getString("query"), { member: interaction.member, textChannel: interaction.channel });
    await interaction.editReply({ embeds: [embed("success", "Added to queue", `${emoji("music")} Your request was added to the music queue.`)] });
  },
};
