const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { requireVoice } = require("../../utils/music");
const { emoji } = require("../../utils/emojis");

module.exports = {
  data: new SlashCommandBuilder().setName("play").setDescription("Play a song or playlist.").addStringOption((o) => o.setName("query").setDescription("URL or search").setRequired(true)),
  async execute(interaction, client) {
    try {
      if (!client.distube) throw new Error("Music is not available because the player failed to initialize.");
      
      const channel = requireVoice(interaction);
      
      // Check bot permissions
      const botMember = interaction.guild.members.me;
      if (!botMember.permissionsIn(channel).has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) {
        throw new Error("I need `CONNECT` and `SPEAK` permissions in this voice channel.");
      }
      
      await interaction.deferReply();
      
      const query = interaction.options.getString("query");
      console.log(`🎵 Playing: ${query} in ${interaction.guild.name}`);
      
      await client.distube.play(channel, query, { 
        member: interaction.member, 
        textChannel: interaction.channel,
        skip: 0
      });
      
      await interaction.editReply({ 
        embeds: [embed("success", "Added to queue", `${emoji("music")} Your request was added to the music queue.`)] 
      });
    } catch (error) {
      console.error("Play command error:", error);
      const payload = { embeds: [embed("error", "Music error", error.message || "Failed to play music.")] };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  },
};
