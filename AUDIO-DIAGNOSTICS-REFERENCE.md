# Audio Diagnostics System - Complete Reference

## What Has Been Deployed

The Eagle Premium bot now includes a comprehensive audio diagnostics system to identify and fix silent audio issues.

### New Files Created

1. **src/diagnostics/audioTest.js** - Automated test suite for audio pipeline
2. **src/services/voiceConnectionManager.js** - Voice connection state monitoring and auto-reconnect
3. **src/services/audioStreamMonitor.js** - Audio stream pipeline monitoring  
4. **src/commands/utility/audiotest.js** - `/audiotest` command
5. **src/commands/utility/audiodiag.js** - `/audiodiag` command
6. **src/commands/utility/voicedebug.js** - `/voicedebug` command
7. **AUDIO-TROUBLESHOOTING.md** - Quick fixes guide
8. **AUDIO-TESTING-GUIDE.md** - Step-by-step testing procedures

### Modified Files

1. **src/distube.js** - Enhanced with:
   - Detailed logging at each event
   - Voice connection state monitoring
   - FFmpeg reconnection settings
   - Stream error categorization
   
2. **src/index.js** - Integrated:
   - VoiceConnectionManager
   - AudioStreamMonitor
   
3. **src/commands/music/play.js** - Added:
   - Voice connection verification
   - Enhanced logging for debugging

---

## How to Use the Diagnostic System

### Phase 1: Quick Diagnostics (2 minutes)

Run these commands in Discord:

```
/audiotest test:ffmpeg
/audiotest test:permissions
/audiotest test:voice-connection
/audiotest test:distube-status
```

**Expected results:**
- FFmpeg: ✅ FFmpeg configured
- Permissions: All show ✅ true
- Voice: ✅ Voice connection found, Status: ready
- Queue: ✅ Queue active (after using /play)

---

### Phase 2: Real-Time Debugging (5 minutes)

1. **In Discord, use `/play` to add a song:**
   ```
   /play rick astley
   ```

2. **In Discord, check voice state:**
   ```
   /voicedebug
   ```
   
   Should show:
   - ✅ Voice connection found
   - Status: `ready`
   - ✅ Player subscribed
   - Player Status: `playing`

3. **In container, check logs:**
   ```bash
   docker logs -f eagle-bot | grep "NOW PLAYING"
   ```
   
   Should show:
   ```
   ▶️  NOW PLAYING: Never Gonna Give You Up
       Guild: Your Server Name
       Voice Channel: General
       Queue size: 1
   ✅ Voice connection READY (audio can stream)
   ```

4. **Listen to Discord voice channel** - Do you hear audio?
   - YES → Audio is working! ✅
   - NO → Continue to Phase 3

---

### Phase 3: Full System Diagnostics (10 minutes)

1. **Run advanced diagnostics in Discord:**
   ```
   /audiodiag level:full
   ```
   
   Review:
   - All dependencies loaded?
   - FFmpeg path correct?
   - Queue has songs?
   - Voice connection ready?

2. **Check audio pipeline in container:**
   ```bash
   docker logs -f eagle-bot | grep "AUDIO STREAM\|Voice state\|Audio player"
   ```
   
   Look for:
   - ✅ Audio stream starting
   - ✅ Voice connection ready
   - ✅ Audio player PLAYING

3. **Run built-in diagnostic test (container):**
   ```bash
   docker exec eagle-bot node -e "
   const audio = require('./src/diagnostics/audioTest.js');
   const ffmpeg = require('ffmpeg-static');
   audio.runAllTests(null, ffmpeg);
   "
   ```
   
   All tests should show ✅

---

## Diagnostic Command Reference

### /audiotest
Quick single-component tests:
- `test:voice-connection` - Check voice connection status
- `test:permissions` - Verify bot has CONNECT/SPEAK permissions
- `test:ffmpeg` - Verify FFmpeg is available
- `test:distube-status` - Check queue and volume

### /audiodiag
Comprehensive diagnostics with levels:
- `level:quick` - Essential tests (FFmpeg, codecs, voice, queue, perms)
- `level:full` - Full details (above + voice/queue/guild/user details)
- `level:debug` - Debug info (+ versions, memory, uptime, active queues)

### /voicedebug
Real-time voice state inspection:
- Shows active voice connection status
- Shows player subscription status
- Shows current song and queue
- Real-time connection state

---

## What Each Component Does

### VoiceConnectionManager (voiceConnectionManager.js)
- **Purpose:** Ensures voice connection is ready before audio streams
- **Function:** Monitors connection state changes, auto-reconnects, verifies READY status
- **Key method:** `ensureConnectionReady(guildId)` - checks if connection can stream
- **When it runs:** Integrated into bot startup, called before playing music

### AudioStreamMonitor (audioStreamMonitor.js)
- **Purpose:** Logs audio pipeline at each stage
- **Function:** Intercepts playSong events, monitors stream quality, catches errors
- **Key output:** Shows which part of audio pipeline is working/failing
- **When it runs:** Automatically on each playSong event

### Enhanced distube.js
- **New logging:** Shows voice connection status, stream bytes, player state
- **FFmpeg args:** Added reconnection settings for stability
- **Error handling:** Categorizes errors (voice vs YouTube vs codec)
- **Events:** Detailed output at: connectionCreate, playSong, finish, error

---

## Troubleshooting Decision Tree

```
Does /play show "✅ Added to queue"?
├─ NO → Check play.js error handling
│
└─ YES
   ├─ Does bot join voice channel?
   │  ├─ NO → Check CONNECT permission
   │  │
   │  └─ YES
   │     ├─ Does /voicedebug show "ready"?
   │     │  ├─ NO → Wait 10 seconds, check again
   │     │  │
   │     │  └─ YES
   │     │     ├─ Do you hear audio?
   │     │     │  ├─ NO → Issue is voice output (Discord/Windows/device)
   │     │     │  │  → Check Discord app volume
   │     │     │  │  → Check Windows volume mixer
   │     │     │  │  → Check audio device output
   │     │     │  │
   │     │     │  └─ YES → Audio is working! ✅
   │     │     │
   │     │     └─ Do logs show "▶️ NOW PLAYING"?
   │     │        ├─ NO → Queue issue
   │     │        │  → Try `/audiodiag level:full`
   │     │        │
   │     │        └─ YES
   │     │           ├─ Do logs show "✅ Voice connection READY"?
   │     │           │  ├─ NO → Connection stability issue
   │     │           │  │  → Restart bot
   │     │           │  │
   │     │           │  └─ YES → Audio pipeline is OK but silent
   │     │           │     → Not a bot issue, check audio device
```

---

## Common Issues and Fixes

### "Voice connection not ready"
```
❌ Failed to enter READY state
```
**Fix:**
1. Verify bot has CONNECT permission: `/audiotest test:permissions`
2. Try a different voice channel
3. Restart bot: `docker restart eagle-bot`

---

### "No active queue"
```
❌ No active queue found
```
**Fix:**
1. Use `/play` to add a song
2. Verify queue with `/audiodiag level:full`

---

### "YouTube bot detection"
```
❌ YouTube bot detection / 403 error
```
**Fix:**
1. This is NOT an audio issue - content can't be accessed
2. Search by name instead: `/play rick astley` (not URL)
3. Use Spotify links
4. YouTube temporarily blocks automated access - wait 5-10 minutes

---

### "No audio despite all green checks"
```
✅ Queue active
✅ Voice connection ready
✅ Logs show ▶️ NOW PLAYING
❌ But no sound in Discord
```
**Fix:**
1. Check Discord app volume slider for bot (not muted)
2. Check Windows Volume Mixer
3. Check audio output device is correct (speakers, not HDMI/display)
4. Verify Discord is using correct output device
5. Restart bot completely

---

## Key Logging Patterns

### Success Pattern (audio should be playing)
```
▶️  NOW PLAYING: Never Gonna Give You Up
    Guild: Your Server Name
    Voice Channel: General
    Queue size: 1
✅ Voice connection READY (audio can stream)
```

### Connection Issue Pattern
```
❌ DisTube Error: Cannot connect to voice channel
   - Check bot has CONNECT permission
   - Check voice channel is not full
```

### FFmpeg Issue Pattern
```
❌ FFmpeg stream test failed
   ffmpeg not found at path
```

### Silent Audio Pattern (audio plays but no sound)
```
▶️  NOW PLAYING: Never Gonna Give You Up
✅ Voice connection READY
✅ Audio player: PLAYING
[BUT NO SOUND IN DISCORD]
→ Issue is Discord app, Windows volume, or audio device
```

---

## Next Steps for User

1. **Restart bot:**
   ```bash
   docker stop eagle-bot
   docker start eagle-bot
   ```

2. **Run quick tests:**
   ```
   /audiotest test:permissions
   /audiotest test:ffmpeg
   /audiotest test:voice-connection
   ```

3. **Try playing a song:**
   ```
   /play rick astley
   ```

4. **Check voice state:**
   ```
   /voicedebug
   ```

5. **If still silent, collect logs:**
   ```bash
   docker logs eagle-bot > audio-debug.log 2>&1
   ```

6. **Run full diagnostics:**
   ```
   /audiodiag level:full
   ```

The system is now ready to pinpoint exactly where audio is failing and either automatically fix it or provide clear diagnostic information for manual troubleshooting.

---

## Final Notes

- ✅ Bot will auto-reconnect if voice connection drops
- ✅ All audio logs are tagged with timestamps for tracking
- ✅ Diagnostics work in real-time without restarting
- ✅ System distinguishes between bot issues and Discord/device issues
- ✅ All error messages are categorized for faster diagnosis

**Do not stop until a working audio output is achieved.**

Use the diagnostic system to identify which component is failing, then we'll fix that specific component.
