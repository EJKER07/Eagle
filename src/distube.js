const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");
const { SpotifyPlugin } = require("@distube/spotify");
const { EmbedBuilder } = require("discord.js");
const ffmpeg = require("ffmpeg-static");

module.exports = (client) => {
    if (client.distube) return client.distube;

    const distube = new DisTube(client, {
        emitNewSongOnly: true,
        ffmpeg: {
            path: ffmpeg
        },
        plugins: [
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

        queue.textChannel?.send({ embeds: [playEmbed] });
    });

    // Error Logging
    distube.on("error", (channel, e) => {
        console.error("DisTube Audio Error:", e);
    });

    client.distube = distube;
    return distube;
};