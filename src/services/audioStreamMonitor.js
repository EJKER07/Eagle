/**
 * Audio Stream Error Handler
 * Intercepts and logs audio stream errors at each pipeline stage
 * 
 * This helps identify exactly where audio is being lost:
 * - FFmpeg stream creation
 * - Opus encoding
 * - Audio resource creation
 * - Audio player errors
 * - Voice connection issues
 */

const { AudioPlayer, StreamType } = require("@discordjs/voice");

class AudioStreamMonitor {
    constructor(client) {
        this.client = client;
        this.activeStreams = new Map();
        this.setupDiTubeStreamMonitoring();
    }

    /**
     * Intercept DisTube's audio streaming pipeline
     */
    setupDiTubeStreamMonitoring() {
        const originalPlay = this.client.distube.play;
        
        this.client.distube.play = async function(voiceChannel, query, options) {
            const guildId = voiceChannel.guild.id;
            console.log(`\n📊 [AUDIO STREAM] Starting audio pipeline for guild ${guildId}`);
            console.log(`   Query: ${query}`);
            
            try {
                // Call original play
                const result = await originalPlay.call(this, voiceChannel, query, options);
                console.log(`   ✅ Play command returned successfully`);
                return result;
            } catch (error) {
                console.error(`   ❌ Play command failed:`, error.message);
                throw error;
            }
        };

        // Monitor playSong event - actual audio stream creation
        this.client.distube.on("playSong", (queue, song) => {
            const guildId = queue.guild?.id;
            console.log(`\n📊 [AUDIO STREAM] Audio stream starting`);
            console.log(`   Song: ${song.name}`);
            console.log(`   URL: ${song.url}`);
            console.log(`   Duration: ${song.formattedDuration}`);
            console.log(`   Guild: ${guildId}`);
            
            // Monitor stream quality
            this.monitorStreamQuality(queue, song);
            
            // Check audio player state
            if (queue.currentPlayingMessage) {
                console.log(`   ✅ Audio resource created`);
            } else {
                console.log(`   ⚠️  No current playing message (stream may not be active)`);
            }
        });

        // Catch song finish
        this.client.distube.on("finish", (queue) => {
            console.log(`\n📊 [AUDIO STREAM] Stream finished for guild ${queue.guild?.id}`);
        });

        // Catch any exceptions
        this.client.distube.on("exception", (queue, error) => {
            console.error(`\n❌ [AUDIO STREAM] Exception in guild ${queue.guild?.id}`);
            console.error(`   Error: ${error.message}`);
            console.error(`   Stack:`, error.stack?.split('\n').slice(0, 5).join('\n'));
        });
    }

    /**
     * Monitor active stream quality
     */
    monitorStreamQuality(queue, song) {
        if (!queue.connection) {
            console.error(`   ❌ No voice connection found`);
            return;
        }

        const voiceConnection = queue.connection.joinConfig?.voiceConnection;
        if (!voiceConnection) {
            console.error(`   ❌ No voice connection object`);
            return;
        }

        console.log(`   Voice connection status: ${voiceConnection.state.status}`);

        if (voiceConnection.state.status === "ready") {
            console.log(`   ✅ Voice connection READY for streaming`);
            
            // Check if player is subscribed
            if (voiceConnection.state.subscription) {
                console.log(`   ✅ Audio player subscribed to connection`);
            } else {
                console.log(`   ❌ Audio player NOT subscribed (critical issue)`);
            }
        } else {
            console.log(`   ⚠️  Voice connection not ready (status: ${voiceConnection.state.status})`);
        }
    }

    /**
     * Create monitored audio stream wrapper
     */
    createMonitoredStream(originalStream, songName) {
        let bytesReceived = 0;
        let lastLogTime = Date.now();

        const monitoredStream = originalStream.on("data", (chunk) => {
            bytesReceived += chunk.length;
            
            // Log every 1 second
            if (Date.now() - lastLogTime > 1000) {
                console.log(`   📡 Stream bytes: ${bytesReceived} (${(bytesReceived / 1024).toFixed(1)} KB)`);
                lastLogTime = Date.now();
            }
        });

        monitoredStream.on("error", (error) => {
            console.error(`   ❌ Stream error: ${error.message}`);
            console.error(`   Error type: ${error.code || error.name}`);
        });

        monitoredStream.on("end", () => {
            console.log(`   ✅ Stream ended normally (${(bytesReceived / 1024 / 1024).toFixed(2)} MB total)`);
        });

        return monitoredStream;
    }

    /**
     * Verify audio player subscription
     */
    verifyPlayerSubscription(connection) {
        if (!connection) {
            return { subscribed: false, reason: "No connection" };
        }

        if (!connection.state.subscription) {
            return { subscribed: false, reason: "No subscription" };
        }

        const player = connection.state.subscription.player;
        if (!player) {
            return { subscribed: false, reason: "No player" };
        }

        return {
            subscribed: true,
            playerStatus: player.state?.status,
            volume: player.state?.volume
        };
    }

    /**
     * Diagnose audio pipeline
     */
    diagnoseAudioPipeline(guildId) {
        console.log(`\n🔍 [AUDIO DIAGNOSTICS] Guild: ${guildId}`);
        
        const queue = this.client.distube?.getQueue(guildId);
        if (!queue) {
            console.error(`   ❌ No queue found`);
            return;
        }

        console.log(`   ✅ Queue exists (${queue.songs.length} songs)`);

        // Check voice connection
        if (!queue.connection) {
            console.error(`   ❌ No voice connection`);
            return;
        }

        console.log(`   ✅ Voice connection exists`);

        // Check connection status
        const voiceConnection = queue.connection.joinConfig?.voiceConnection;
        if (!voiceConnection) {
            console.error(`   ❌ No Discord voice connection object`);
            return;
        }

        console.log(`   ✅ Discord connection object exists`);
        console.log(`      Status: ${voiceConnection.state.status}`);

        // Check subscription
        const subscription = this.verifyPlayerSubscription(voiceConnection);
        console.log(`   Subscription: ${subscription.subscribed ? "✅ Active" : `❌ ${subscription.reason}`}`);
        
        if (subscription.playerStatus) {
            console.log(`      Player status: ${subscription.playerStatus}`);
        }

        // Check current song
        if (queue.songs.length > 0) {
            const currentSong = queue.songs[0];
            console.log(`   ✅ Current song: ${currentSong.name}`);
        } else {
            console.log(`   ❌ No songs in queue`);
        }

        // Summary
        const pipelineReady = 
            voiceConnection.state.status === "ready" && 
            subscription.subscribed && 
            queue.songs.length > 0;

        if (pipelineReady) {
            console.log(`\n   ✅ AUDIO PIPELINE READY - Audio should be playing`);
            console.log(`   If no audio is heard, issue is external (Discord app, volume, device)`);
        } else {
            console.log(`\n   ❌ AUDIO PIPELINE NOT READY`);
            if (voiceConnection.state.status !== "ready") {
                console.log(`   → Waiting for voice connection to stabilize...`);
            }
            if (!subscription.subscribed) {
                console.log(`   → Audio player not subscribed to connection`);
            }
            if (queue.songs.length === 0) {
                console.log(`   → No songs in queue`);
            }
        }
    }
}

module.exports = AudioStreamMonitor;
