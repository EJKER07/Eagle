const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getVoiceConnection, VoiceConnectionStatus } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("voicedebug")
    .setDescription("Debug voice connection state"),
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      
      const voiceConnection = getVoiceConnection(interaction.guildId);
      
      let description = "**Voice Connection Status**\n\n";
      
      if (!voiceConnection) {
        description += "❌ No active voice connection\n";
        description += "Bot is not in any voice channel";
      } else {
        // Connection exists
        description += `✅ Voice connection found\n\n`;
        description += `**Status:** \`${voiceConnection.state.status}\`\n`;
        description += `**Channel ID:** \`${voiceConnection.joinConfig.channelId}\`\n`;
        description += `**Self Deaf:** \`${voiceConnection.joinConfig.selfDeaf}\`\n`;
        description += `**Self Mute:** \`${voiceConnection.joinConfig.selfMute}\`\n`;
        
        // Subscription
        if (voiceConnection.state.subscription) {
          description += `\n**Audio Player:**\n`;
          description += `✅ Player subscribed\n`;
          
          if (voiceConnection.state.subscription.player) {
            const playerState = voiceConnection.state.subscription.player.state;
            description += `Status: \`${playerState.status}\`\n`;
            
            if (playerState.resource) {
              description += `Resource: \`${playerState.resource.metadata?.title || "Unknown"}\`\n`;
              description += `Duration: \`${playerState.resource.playbackDuration}ms\`\n`;
            }
          }
        } else {
          description += `\n**Audio Player:**\n`;
          description += `❌ No player subscribed\n`;
        }
        
        // State details
        description += `\n**Connection State Details:**\n`;
        const state = voiceConnection.state;
        if (state.adapter) {
          description += `✅ Adapter ready\n`;
        }
        
        // Reconnection attempts
        if (state.status === VoiceConnectionStatus.Connecting) {
          description += `⏳ Currently connecting...\n`;
        } else if (state.status === VoiceConnectionStatus.Ready) {
          description += `✅ Ready to stream audio\n`;
        } else if (state.status === VoiceConnectionStatus.Disconnected) {
          description += `⚠️ Disconnected (will attempt to reconnect)\n`;
        } else if (state.status === VoiceConnectionStatus.Destroyed) {
          description += `❌ Connection destroyed\n`;
        }
      }
      
      // Queue status
      const queue = client.distube?.getQueue(interaction.guildId);
      if (queue) {
        description += `\n**Queue Status:**\n`;
        description += `✅ Queue active\n`;
        description += `Songs: \`${queue.songs.length}\`\n`;
        if (queue.songs.length > 0) {
          description += `Now Playing: \`${queue.songs[0].name}\`\n`;
        }
      }
      
      const embed = new EmbedBuilder()
        .setColor(voiceConnection ? 0x00ff00 : 0xff0000)
        .setTitle("🎧 Voice Debug Info")
        .setDescription(description)
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply(`❌ Debug failed: ${error.message}`);
    }
  },
};
