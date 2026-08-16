/**
 * Audio Streaming Diagnostics
 * Tests voice connection, audio stream, and codec support
 */

const { AudioPlayer, AudioPlayerStatus, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require("@discordjs/voice");
const { createReadStream } = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function testFFmpeg(ffmpegPath) {
    console.log("\n🔍 [TEST 1] FFmpeg Availability");
    try {
        const { stdout, stderr } = await execAsync(`${ffmpegPath} -version`);
        console.log("✅ FFmpeg found:");
        console.log(stdout.split("\n")[0]);
        return true;
    } catch (error) {
        console.error("❌ FFmpeg not found or not executable:", error.message);
        return false;
    }
}

async function testOpusSupport() {
    console.log("\n🔍 [TEST 2] Opus Codec Support");
    try {
        const opusscript = require("opusscript");
        console.log("✅ Opusscript loaded");
        
        const sodium = require("sodium-native");
        console.log("✅ Sodium-native loaded (for encryption)");
        
        return true;
    } catch (error) {
        console.error("❌ Codec support missing:", error.message);
        console.error("   Run: npm install opusscript sodium-native");
        return false;
    }
}

async function testAudioResourceCreation(ffmpegPath) {
    console.log("\n🔍 [TEST 3] Audio Resource Creation");
    try {
        // Try creating a simple audio resource from FFmpeg
        const testResource = createAudioResource("silence", {
            inputType: "silence",
            silencePaddingFrames: 0,
        });
        
        console.log("✅ Audio resource created successfully");
        console.log("   Resource playback duration:", testResource.playbackDuration);
        
        return true;
    } catch (error) {
        console.error("❌ Failed to create audio resource:", error.message);
        return false;
    }
}

async function testAudioPlayer() {
    console.log("\n🔍 [TEST 4] Audio Player Creation");
    try {
        const player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play,
            },
        });
        
        console.log("✅ Audio player created successfully");
        console.log("   Player status:", player.state.status);
        
        // Test state changes
        player.on(AudioPlayerStatus.Playing, () => {
            console.log("   ✅ Player state: PLAYING");
        });
        
        player.on(AudioPlayerStatus.Idle, () => {
            console.log("   ✅ Player state: IDLE");
        });
        
        player.on("error", (error) => {
            console.error("   ❌ Player error:", error.message);
        });
        
        return true;
    } catch (error) {
        console.error("❌ Failed to create audio player:", error.message);
        return false;
    }
}

async function testFFmpegAudioStream(ffmpegPath) {
    console.log("\n🔍 [TEST 5] FFmpeg Audio Stream");
    try {
        // Test FFmpeg output format
        const { stdout, stderr } = await execAsync(
            `${ffmpegPath} -f lavfi -i sine=frequency=1000:duration=1 -f s16le -ar 48000 -ac 2 -loglevel quiet - | head -c 1024`
        );
        
        console.log("✅ FFmpeg audio stream generated");
        console.log("   Output size:", Buffer.byteLength(stdout), "bytes");
        
        return true;
    } catch (error) {
        console.error("❌ FFmpeg stream test failed:", error.message);
        return false;
    }
}

async function testVoiceConnection(client, guildId, channelId) {
    console.log("\n🔍 [TEST 6] Voice Connection State");
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) throw new Error("Guild not found");
        
        const channel = guild.channels.cache.get(channelId);
        if (!channel) throw new Error("Channel not found");
        
        const me = guild.members.me;
        if (!me) throw new Error("Bot member not found");
        
        console.log("✅ Guild and channel found");
        console.log("   Channel:", channel.name, `(${channel.id})`);
        console.log("   Bot member:", me.user.tag);
        
        // Check permissions
        const permissions = me.permissionsIn(channel);
        console.log("   Bot permissions:");
        console.log("     - CONNECT:", permissions.has("CONNECT") ? "✅" : "❌");
        console.log("     - SPEAK:", permissions.has("SPEAK") ? "✅" : "❌");
        console.log("     - USE_VAD:", permissions.has("USE_VAD") ? "✅" : "❌");
        
        return permissions.has("CONNECT") && permissions.has("SPEAK");
    } catch (error) {
        console.error("❌ Voice connection test failed:", error.message);
        return false;
    }
}

async function testDistubeMusicStream(distube, guildId) {
    console.log("\n🔍 [TEST 7] DisTube Music Stream");
    try {
        const queue = distube.getQueue(guildId);
        if (!queue) {
            console.error("❌ No active queue found");
            return false;
        }
        
        console.log("✅ Queue found");
        console.log("   Songs in queue:", queue.songs.length);
        console.log("   Currently playing:", queue.songs[0]?.name);
        console.log("   Volume:", queue.volume);
        
        return true;
    } catch (error) {
        console.error("❌ DisTube stream test failed:", error.message);
        return false;
    }
}

async function runAllTests(client, ffmpegPath, guildId = null, channelId = null) {
    console.log("╔════════════════════════════════════════╗");
    console.log("║     EAGLE BOT AUDIO DIAGNOSTICS       ║");
    console.log("╚════════════════════════════════════════╝");
    
    const results = [];
    
    results.push(["FFmpeg Availability", await testFFmpeg(ffmpegPath)]);
    results.push(["Opus Codec Support", await testOpusSupport()]);
    results.push(["Audio Resource Creation", await testAudioResourceCreation(ffmpegPath)]);
    results.push(["Audio Player Creation", await testAudioPlayer()]);
    results.push(["FFmpeg Audio Stream", await testFFmpegAudioStream(ffmpegPath)]);
    
    if (guildId && channelId) {
        results.push(["Voice Connection State", await testVoiceConnection(client, guildId, channelId)]);
    }
    
    if (client.distube) {
        results.push(["DisTube Music Stream", await testDistubeMusicStream(client.distube, guildId)]);
    }
    
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║           TEST SUMMARY                ║");
    console.log("╚════════════════════════════════════════╝");
    
    results.forEach(([test, passed]) => {
        console.log(`${passed ? "✅" : "❌"} ${test}`);
    });
    
    const passed = results.filter(r => r[1]).length;
    const total = results.length;
    console.log(`\nPassed: ${passed}/${total}`);
    
    return passed === total;
}

module.exports = { runAllTests, testFFmpeg, testOpusSupport, testAudioResourceCreation, testAudioPlayer };
