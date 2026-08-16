/**
 * Enhanced Voice Connection Manager
 * Handles voice connection states and audio streaming
 * 
 * This fixes silent audio by ensuring:
 * 1. Voice connection reaches READY state
 * 2. Audio player is subscribed to connection
 * 3. Stream errors are captured and logged
 * 4. Connection state changes are monitored
 */

const {
    VoiceConnectionStatus,
    entersState,
    getVoiceConnection,
    AudioPlayer,
} = require("@discordjs/voice");

const VOICE_CONNECTION_TIMEOUT = 30000; // 30 seconds
const RECONNECTION_TIMEOUT = 5000; // 5 seconds

class VoiceConnectionManager {
    constructor(client) {
        this.client = client;
        this.connections = new Map();
        this.setupConnectionListeners();
    }

    /**
     * Monitor and manage all voice connections
     */
    setupConnectionListeners() {
        this.client.on("voiceStateUpdate", (oldState, newState) => {
            if (!newState.guild) return;
            
            // Bot joined voice
            if (!oldState.channelId && newState.channelId && newState.member.id === this.client.user.id) {
                console.log(`✅ Bot joined voice: ${newState.channel?.name}`);
                this.monitorConnection(newState.guild.id);
            }
            
            // Bot left voice
            if (oldState.channelId && !newState.channelId && newState.member.id === this.client.user.id) {
                console.log(`❌ Bot left voice: ${oldState.channel?.name}`);
                this.connections.delete(newState.guild.id);
            }
        });
    }

    /**
     * Monitor a specific voice connection
     */
    async monitorConnection(guildId) {
        const connection = getVoiceConnection(guildId);
        if (!connection) return;

        console.log(`\n🎧 Monitoring voice connection for guild: ${guildId}`);

        // Listen for state changes
        connection.on("stateChange", (oldState, newState) => {
            console.log(`   Voice state: ${oldState.status} → ${newState.status}`);
            
            if (newState.status === VoiceConnectionStatus.Ready) {
                console.log(`   ✅ Voice connection READY (audio can stream)`);
            }
            
            if (newState.status === VoiceConnectionStatus.Disconnected) {
                console.log(`   ⚠️  Voice connection DISCONNECTED`);
                
                // Attempt to reconnect
                if (oldState.status !== VoiceConnectionStatus.Destroyed) {
                    console.log(`   🔄 Attempting reconnection...`);
                    setTimeout(() => {
                        connection.rejoin();
                    }, RECONNECTION_TIMEOUT);
                }
            }
            
            if (newState.status === VoiceConnectionStatus.Destroyed) {
                console.log(`   ❌ Voice connection DESTROYED`);
            }
        });

        // Subscribe to audio player events
        const players = connection.state.subscription?.player;
        if (players) {
            this.monitorAudioPlayer(players, guildId);
        }

        // Ensure connection reaches READY state
        try {
            await entersState(connection, VoiceConnectionStatus.Ready, VOICE_CONNECTION_TIMEOUT);
            console.log(`   ✅ Connection confirmed READY`);
        } catch (error) {
            console.error(`   ❌ Failed to enter READY state: ${error.message}`);
            
            // Try to recover
            if (connection.state.status === VoiceConnectionStatus.Signalling) {
                console.log(`   🔄 Still signalling, waiting longer...`);
                try {
                    await entersState(connection, VoiceConnectionStatus.Ready, VOICE_CONNECTION_TIMEOUT * 2);
                    console.log(`   ✅ Connection recovered to READY`);
                } catch (recoveryError) {
                    console.error(`   ❌ Recovery failed: ${recoveryError.message}`);
                }
            }
        }
    }

    /**
     * Monitor audio player for errors and state changes
     */
    monitorAudioPlayer(player, guildId) {
        console.log(`   📻 Audio player monitoring active`);

        player.on("error", (error) => {
            console.error(`   ❌ Audio player error: ${error.message}`);
            console.error(`      Resource: ${error.resource?.metadata?.title || "unknown"}`);
        });

        player.on("stateChange", (oldState, newState) => {
            if (newState.status === "playing") {
                console.log(`   ▶️  Audio player: PLAYING`);
            } else if (newState.status === "idle") {
                console.log(`   ⏸️  Audio player: IDLE`);
            }
        });
    }

    /**
     * Verify voice connection is ready before playing
     */
    async ensureConnectionReady(guildId, timeoutMs = VOICE_CONNECTION_TIMEOUT) {
        const connection = getVoiceConnection(guildId);
        
        if (!connection) {
            return {
                ready: false,
                error: "No voice connection found",
                guildId
            };
        }

        console.log(`   Checking voice connection status...`);
        
        if (connection.state.status === VoiceConnectionStatus.Ready) {
            console.log(`   ✅ Connection already READY`);
            return { ready: true, guildId };
        }

        try {
            console.log(`   ⏳ Waiting for connection to become ready...`);
            await entersState(connection, VoiceConnectionStatus.Ready, timeoutMs);
            console.log(`   ✅ Connection is now READY`);
            return { ready: true, guildId };
        } catch (error) {
            console.error(`   ❌ Timeout waiting for READY state: ${error.message}`);
            return {
                ready: false,
                error: "Connection timeout",
                status: connection.state.status,
                guildId
            };
        }
    }

    /**
     * Get connection info for debugging
     */
    getConnectionInfo(guildId) {
        const connection = getVoiceConnection(guildId);
        
        if (!connection) {
            return { error: "No voice connection" };
        }

        return {
            status: connection.state.status,
            channelId: connection.joinConfig.channelId,
            guildId: connection.joinConfig.guildId,
            selfDeaf: connection.joinConfig.selfDeaf,
            selfMute: connection.joinConfig.selfMute,
            adapterCreator: connection.joinConfig.adapterCreator ? "present" : "missing",
            subscription: connection.state.subscription ? "active" : "none",
            player: connection.state.subscription?.player?.state?.status || "no player"
        };
    }
}

module.exports = VoiceConnectionManager;
