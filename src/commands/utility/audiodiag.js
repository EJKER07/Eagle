const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("audiodiag")
    .setDescription("Run complete audio system diagnostics")
    .addStringOption(o => o
      .setName("level")
      .setDescription("Diagnostic level")
      .setRequired(false)
      .addChoices(
        { name: "quick", value: "quick" },
        { name: "full", value: "full" },
        { name: "debug", value: "debug" }
      )
    ),
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      
      const level = interaction.options.getString("level") || "quick";
      let diagnostics = "";

      if (level === "quick" || level === "full" || level === "debug") {
        diagnostics = await runQuickDiagnostics(client, interaction);
      }

      if (level === "full" || level === "debug") {
        diagnostics += "\n" + (await runFullDiagnostics(client, interaction));
      }

      if (level === "debug") {
        diagnostics += "\n" + (await runDebugDiagnostics(client, interaction));
      }

      // Split if too long
      if (diagnostics.length > 4096) {
        const chunks = diagnostics.match(/[\s\S]{1,4090}/g) || [];
        for (const chunk of chunks.slice(0, 10)) {
          const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle("AUDIO DIAGNOSTICS")
            .setDescription(`\`\`\`\n${chunk}\n\`\`\``);
          
          if (chunks.indexOf(chunk) === 0) {
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.followUp({ embeds: [embed] });
          }
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("AUDIO DIAGNOSTICS")
          .setDescription(`\`\`\`\n${diagnostics}\n\`\`\``);
        
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      await interaction.editReply(`❌ Diagnostics failed: ${error.message}`);
    }
  },
};

async function runQuickDiagnostics(client, interaction) {
  let output = "QUICK DIAGNOSTICS\n";
  output += "=".repeat(40) + "\n\n";

  // FFmpeg
  try {
    const ffmpeg = require("ffmpeg-static");
    output += `✅ FFmpeg: ${ffmpeg?.slice(-20)}\n`;
  } catch {
    output += `❌ FFmpeg: Not found\n`;
  }

  // Opus
  try {
    require("opusscript");
    output += `✅ Opusscript: Loaded\n`;
  } catch {
    output += `❌ Opusscript: Missing\n`;
  }

  // Sodium
  try {
    require("sodium-native");
    output += `✅ Sodium-native: Loaded\n`;
  } catch {
    output += `❌ Sodium-native: Missing\n`;
  }

  // Voice connection
  const voiceConnection = getVoiceConnection(interaction.guildId);
  if (voiceConnection) {
    output += `✅ Voice Connection: ${voiceConnection.state.status}\n`;
  } else {
    output += `❌ Voice Connection: Not found\n`;
  }

  // Queue
  const queue = client.distube?.getQueue(interaction.guildId);
  if (queue) {
    output += `✅ Queue: ${queue.songs.length} songs\n`;
  } else {
    output += `❌ Queue: Not found\n`;
  }

  // Permissions
  const channel = interaction.member?.voice?.channel;
  if (channel) {
    const botMember = interaction.guild.members.me;
    const hasConnect = botMember.permissionsIn(channel).has("Connect");
    const hasSpeak = botMember.permissionsIn(channel).has("Speak");
    output += `✅ Permissions: ${hasConnect ? "C" : "-"}${hasSpeak ? "S" : "-"}\n`;
  } else {
    output += `❌ Permissions: Not in VC\n`;
  }

  return output;
}

async function runFullDiagnostics(client, interaction) {
  let output = "\nFULL DIAGNOSTICS\n";
  output += "=".repeat(40) + "\n\n";

  // Voice Connection Details
  const voiceConnection = getVoiceConnection(interaction.guildId);
  if (voiceConnection) {
    output += `Voice Connection:\n`;
    output += `  Status: ${voiceConnection.state.status}\n`;
    output += `  Channel ID: ${voiceConnection.joinConfig.channelId}\n`;
    output += `  Self Deaf: ${voiceConnection.joinConfig.selfDeaf}\n`;
    output += `  Self Mute: ${voiceConnection.joinConfig.selfMute}\n`;
    output += `  Subscription: ${voiceConnection.state.subscription ? "Active" : "None"}\n`;
    if (voiceConnection.state.subscription?.player) {
      output += `  Player Status: ${voiceConnection.state.subscription.player.state.status}\n`;
    }
  }

  // Queue Details
  const queue = client.distube?.getQueue(interaction.guildId);
  if (queue) {
    output += `\nQueue:\n`;
    output += `  Songs: ${queue.songs.length}\n`;
    output += `  Volume: ${queue.volume}\n`;
    output += `  Loop: ${queue.repeatMode}\n`;
    output += `  Autoplay: ${queue.autoplay}\n`;
    if (queue.songs[0]) {
      output += `  Current: ${queue.songs[0].name}\n`;
    }
  }

  // Guild Details
  output += `\nGuild:\n`;
  output += `  ID: ${interaction.guildId}\n`;
  output += `  Name: ${interaction.guild.name}\n`;
  output += `  Channels: ${interaction.guild.channels.cache.size}\n`;
  output += `  Voice Channels: ${interaction.guild.channels.cache.filter(c => c.isVoiceBased()).size}\n`;

  // User Details
  output += `\nUser:\n`;
  output += `  ID: ${interaction.user.id}\n`;
  output += `  In Voice: ${interaction.member?.voice?.channel ? "Yes" : "No"}\n`;
  if (interaction.member?.voice?.channel) {
    output += `  Channel: ${interaction.member.voice.channel.name}\n`;
  }

  return output;
}

async function runDebugDiagnostics(client, interaction) {
  let output = "\nDEBUG DIAGNOSTICS\n";
  output += "=".repeat(40) + "\n\n";

  // Node version
  output += `Node: ${process.version}\n`;
  output += `Platform: ${process.platform}\n`;

  // Dependency versions
  try {
    const dj = require("discord.js");
    output += `discord.js: ${dj.version}\n`;
  } catch {}

  try {
    const distube = require("distube");
    output += `distube: ${require("distube/package.json").version}\n`;
  } catch {}

  try {
    const voice = require("@discordjs/voice");
    output += `@discordjs/voice: ${require("@discordjs/voice/package.json").version}\n`;
  } catch {}

  // Memory usage
  const mem = process.memoryUsage();
  output += `\nMemory:\n`;
  output += `  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\n`;
  output += `  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB\n`;

  // Uptime
  const uptime = Date.now() - client.startedAt;
  const hours = Math.floor(uptime / 3600000);
  const minutes = Math.floor((uptime % 3600000) / 60000);
  output += `\nBot Uptime: ${hours}h ${minutes}m\n`;

  // Distube queue status
  const queues = client.distube?.queues?.cache?.size || 0;
  output += `Active Queues: ${queues}\n`;

  return output;
}
