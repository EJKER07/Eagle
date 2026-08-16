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
            new YouTubePlugin(),
            new SpotifyPlugin(),
            new YtDlpPlugin({
                update: false
            })
        ]
    });

    // Track Start Event
    distube.on("playSong", (queue, song) => {
        console.log(`▶️ Now playing: ${song.name} in ${queue.guild?.name}`);
        
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
        const guildName = queue.guild?.name || queue.textChannel?.guild?.name || "unknown";
        console.log(`✅ Queue created for guild: ${guildName}`);
    });

    // No Song
    distube.on("noSong", (queue) => {
        const guildName = queue.guild?.name || queue.textChannel?.guild?.name || "unknown";
        console.log(`⚠️ Queue ended: no more songs in ${guildName}`);
    });

    // Queue End Event
    distube.on("finish", (queue) => {
        queue.textChannel?.send("✅ Music queue finished.").catch(() => {});
    });

    // Voice State Update
    distube.on("connectionCreate", (message, queue) => {
        console.log(`✅ Voice connection established in ${queue.voiceChannel?.name}`);
    });

    // Add Song Event
    distube.on("addSong", (queue, song) => {
        console.log(`➕ Song added: ${song.name}`);
    });

    // Error Events - Better logging
    distube.on("error", (channel, e) => {
        // Get proper error message
        let errorMsg = "Unknown error";
        if (e instanceof Error) {
            errorMsg = e.message || String(e);
        } else if (typeof e === "object") {
            errorMsg = JSON.stringify(e, null, 2);
        } else {
            errorMsg = String(e);
        }
        
        console.error("❌ DisTube Error:", errorMsg);
        console.error("Stack:", e?.stack || "No stack trace");
        
        // Provide helpful diagnostics
        if (errorMsg.includes("Cannot connect") || errorMsg.includes("timeout")) {
            console.error("⚠️  VOICE CONNECTION ISSUE:");
            console.error("   - Check bot has CONNECT & SPEAK permissions");
            console.error("   - Check voice channel is not full");
            console.error("   - Restart bot if permissions were just added");
        }
        
        if (errorMsg.includes("bot") || errorMsg.includes("captcha")) {
            console.error("⚠️  YOUTUBE BOT DETECTION:");
            console.error("   - Try searching by name instead of URL");
            console.error("   - Use Spotify links if available");
            console.error("   - YouTube may be blocking automated access");
        }

        if (channel?.send) {
            const msg = errorMsg.length > 100 ? errorMsg.slice(0, 97) + "..." : errorMsg;
            channel.send(`⚠️ **Music Error**\n\`\`\`\n${msg}\n\`\`\``).catch(() => {});
        }
    });

    client.distube = distube;
    console.log("✅ DisTube fully initialized with YtDlp support");
    return distube;
};