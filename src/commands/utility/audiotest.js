const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("audiotest")
    .setDescription("Run audio system diagnostics")
    .addStringOption(o => o
      .setName("test")
      .setDescription("Test to run")
      .setRequired(true)
      .addChoices(
        { name: "voice-connection", value: "voice" },
        { name: "distube-status", value: "distube" },
        { name: "permissions", value: "perms" },
        { name: "ffmpeg", value: "ffmpeg" }
      )
    ),
  async execute(interaction, client) {
    const test = interaction.options.getString("test");
    
    try {
      await interaction.deferReply();
      
      let result = "";
      
      if (test === "voice") {
        const voiceConnection = getVoiceConnection(interaction.guildId);
        if (!voiceConnection) {
          result = "❌ No voice connection found";
        } else {
          result = `✅ Voice connection found\nStatus: ${voiceConnection.state.status}`;
        }
      }
      
      if (test === "distube") {
        const queue = client.distube?.getQueue(interaction.guildId);
        if (!queue) {
          result = "❌ No active queue";
        } else {
          result = `✅ Queue active\nSongs: ${queue.songs.length}\nVolume: ${queue.volume}`;
        }
      }
      
      if (test === "perms") {
        const channel = interaction.member?.voice?.channel;
        if (!channel) {
          result = "❌ You are not in a voice channel";
        } else {
          const botMember = interaction.guild.members.me;
          const perms = botMember.permissionsIn(channel);
          result = `Channel: ${channel.name}\n`;
          result += `✅ CONNECT: ${perms.has("Connect")}\n`;
          result += `✅ SPEAK: ${perms.has("Speak")}\n`;
          result += `✅ USE_VAD: ${perms.has("UseVad")}`;
        }
      }
      
      if (test === "ffmpeg") {
        const ffmpegPath = require("ffmpeg-static");
        result = `FFmpeg path: ${ffmpegPath}\n`;
        result += `✅ FFmpeg configured`;
      }
      
      const embed = new EmbedBuilder()
        .setColor(result.includes("❌") ? 0xed4245 : 0xf4df1b)
        .setTitle("Audio Test Results")
        .setDescription(result);
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply(`❌ Test failed: ${error.message}`);
    }
  },
};
