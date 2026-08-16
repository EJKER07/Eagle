const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder } = require("discord.js");
const ffmpeg = require("ffmpeg-static");

module.exports = (client) => {
    if (client.distube) return client.distube;

    console.log(`🎵 Initializing DisTube with FFmpeg at: ${ffmpeg}`);

    const distube = new DisTube(client, {
        emitNewSongOnly: true,
        ffmpeg: {
            path: ffmpeg
        },
        plugins: [
            new YtDlpPlugin({
                update: false
            }),
            new YouTubePlugin(),
            new SpotifyPlugin()
        ]
    });

    // Track Start Event
    distube.on("playSong", (queue, song) => {
        const playEmbed = new EmbedBuilder()
            .setColor("#FEE75C")
            .setTitle("🎶 Playing Now")
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
        console.log(`✅ Queue created for guild: ${queue.guild?.name}`);
    });

    // Queue End Event
    distube.on("finish", (queue) => {
        queue.textChannel?.send("✅ Music queue finished.").catch(() => {});
    });

    // Voice State Update
    distube.on("connectionCreate", (message, queue) => {
        console.log(`✅ Voice connection established in ${queue.voiceChannel?.name}`);
    });

    // Error Events
    distube.on("error", (channel, e) => {
        const error = String(e.message || e);
        console.error("❌ DisTube Error:", error);
        
        // Provide helpful diagnostics
        if (error.includes("Cannot connect") || error.includes("timeout")) {
            console.error("⚠️  VOICE CONNECTION ISSUE:");
            console.error("   - Check bot has CONNECT & SPEAK permissions");
            console.error("   - Check voice channel is not full");
            console.error("   - Restart bot if permissions were just added");
        }
        
        if (error.includes("bot") || error.includes("captcha")) {
            console.error("⚠️  YOUTUBE BOT DETECTION:");
            console.error("   - Try searching by name instead of URL");
            console.error("   - Use Spotify links if available");
            console.error("   - YouTube may be blocking automated access");
        }

        if (channel?.send) {
            const msg = error.length > 100 ? error.slice(0, 97) + "..." : error;
            channel.send(`⚠️ **Music Error**\n\`\`\`\n${msg}\n\`\`\``).catch(() => {});
        }
    });

    client.distube = distube;
    console.log("✅ DisTube fully initialized with YtDlp support");
    return distube;
};