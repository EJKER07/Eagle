const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder } = require("discord.js");
const { VoiceConnectionStatus, entersState } = require("@discordjs/voice");
const ffmpeg = require("ffmpeg-static");

module.exports = (client) => {
    if (client.distube) return client.distube;

    console.log(`🎵 Initializing DisTube with FFmpeg at: ${ffmpeg}`);

    const distube = new DisTube(client, {
        emitNewSongOnly: true,
        ffmpeg: {
            path: ffmpeg,
            args: [
                "-reconnect", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",
            ]
        },
        plugins: [
            new YouTubePlugin(),
            new SpotifyPlugin(),
            new YtDlpPlugin({
                update: false
            })
        ]
    });

    // Voice Connection State Monitoring
    distube.on("connectionCreate", async (message, queue) => {
        console.log(`✅ Voice connection created for guild: ${queue.textChannel?.guild?.name}`);
        console.log(`   Voice channel: ${queue.voiceChannel?.name}`);
        console.log(`   Text channel: ${queue.textChannel?.name}`);
        
        try {
            if (queue.connection?.joinConfig?.voiceConnection) {
                await entersState(queue.connection.joinConfig.voiceConnection, VoiceConnectionStatus.Ready, 30000);
                console.log(`✅ Voice connection ready and stable`);
            }
        } catch (error) {
            console.error(`❌ Voice connection ready state:`, error.message);
        }
    });

    // Track Start Event - Detailed Logging
    distube.on("playSong", (queue, song) => {
        console.log(`\n▶️  NOW PLAYING: ${song.name}`);
        console.log(`    URL: ${song.url}`);
        console.log(`    Duration: ${song.formattedDuration}`);
        console.log(`    Guild: ${queue.textChannel?.guild?.name}`);
        console.log(`    Voice Channel: ${queue.voiceChannel?.name}`);
        console.log(`    Queue size: ${queue.songs.length}`);
        
        const playEmbed = new EmbedBuilder()
            .setColor("#FEE75C")
            .setTitle("🎶 PLAYING NOW")
            .setDescription(`[${song.name}](${song.url})`)
            .addFields(
                { name: "⏱️ Duration", value: `\`${song.formattedDuration}\``, inline: true },
                { name: "👤 Requested By", value: `${song.user}`, inline: true }
            )
            .setThumbnail(song.thumbnail)
            .setFooter({ text: "Eagle • Music Player" });

        queue.textChannel?.send({ embeds: [playEmbed] }).catch(() => {});
    });

    // Queue Created
    distube.on("initQueue", (queue) => {
        const guildName = queue.textChannel?.guild?.name || "unknown";
        console.log(`✅ Queue initialized for guild: ${guildName}`);
    });

    // Song Changed
    distube.on("songChanged", (queue, song) => {
        console.log(`⏭️  Song changed to: ${song.name}`);
    });

    // No Song
    distube.on("noSong", (queue) => {
        const guildName = queue.textChannel?.guild?.name || "unknown";
        console.log(`⚠️  Queue ended: no more songs in ${guildName}`);
    });

    // Queue End Event
    distube.on("finish", (queue) => {
        console.log(`✅ Music queue finished`);
        queue.textChannel?.send("✅ Music queue finished.").catch(() => {});
    });

    // Add Song Event
    distube.on("addSong", (queue, song) => {
        console.log(`➕ Song added to queue: ${song.name}`);
    });

    // Error Events - Comprehensive
    distube.on("error", (channel, e) => {
        let errorMsg = "Unknown error";
        if (e instanceof Error) {
            errorMsg = e.message || String(e);
        } else if (typeof e === "object") {
            errorMsg = JSON.stringify(e, null, 2);
        } else {
            errorMsg = String(e);
        }
        
        console.error("\n❌ DISTUBE ERROR:");
        console.error("   Message:", errorMsg);
        if (e?.stack) console.error("   Stack:", e.stack);
        
        if (errorMsg.includes("Cannot connect") || errorMsg.includes("timeout")) {
            console.error("\n⚠️  VOICE CONNECTION ISSUE");
        }
        
        if (errorMsg.includes("bot") || errorMsg.includes("captcha") || errorMsg.includes("403")) {
            console.error("\n⚠️  YOUTUBE AUTHENTICATION ISSUE");
        }

        if (channel?.send) {
            const msg = errorMsg.length > 100 ? errorMsg.slice(0, 97) + "..." : errorMsg;
            channel.send(`⚠️ **Music Error**\n\`\`\`\n${msg}\n\`\`\``).catch(() => {});
        }
    });

    client.distube = distube;
    console.log("✅ DisTube fully initialized");
    return distube;
};