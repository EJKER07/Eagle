# Audio Testing & Debugging Guide

## Overview

The audio system has been enhanced with comprehensive diagnostics and state monitoring. If the bot is still silent after these changes, follow this guide systematically.

---

## Step 1: Quick Tests (Run These First)

### Test 1.1: Voice Connection
```
/audiotest test:voice-connection
```

**Expected Result:**
```
✅ Voice connection found
Status: ready
```

**If you see:**
- `❌ No voice connection found` → Bot is not in voice. Use `/play` to make it join.
- Any status other than `ready` → Wait 5 seconds and test again

---

### Test 1.2: Permissions
```
/audiotest test:permissions
```

**Expected Result:**
```
Channel: General
✅ CONNECT: true
✅ SPEAK: true
✅ USE_VAD: true
```

**If permissions show `false`:**
1. Go to Discord Server Settings → Roles
2. Find the bot's role
3. Check Voice Permissions section
4. Enable: `Connect`, `Speak`, `Use Voice Activity`
5. Click Save
6. Restart bot
7. Test again

---

### Test 1.3: FFmpeg
```
/audiotest test:ffmpeg
```

**Expected Result:**
```
FFmpeg path: C:\path\to\ffmpeg.exe
✅ FFmpeg configured
```

**If you see error:**
```
❌ FFmpeg not found
```

Run in terminal:
```bash
npm install --save ffmpeg-static
npm rebuild
```

Then restart bot.

---

### Test 1.4: Queue Status
```
/audiotest test:distube-status
```

**Expected Result:**
```
✅ Queue active
Songs: 1
Volume: 100
```

**If you see `❌ No active queue`:**
1. Use `/play` to add a song
2. Test again immediately

---

## Step 2: Full Diagnostic Test

Run comprehensive diagnostics:

### Option A: Via Node (Container)
```bash
cd /app
node -e "const audio = require('./src/diagnostics/audioTest'); const ffmpeg = require('ffmpeg-static'); audio.runAllTests(null, ffmpeg);"
```

### Option B: Check Docker Logs
```bash
docker logs -f eagle-bot | grep -i "audio\|distube\|voice"
```

**Look for these lines:**
```
✅ DisTube fully initialized
✅ Voice connection ready and stable
▶️  NOW PLAYING: [song name]
```

---

## Step 3: Verify Audio Streaming

### Test 3.1: Play a Simple Song
```
/play rick astley
```

**Expected bot response:**
```
✅ Added to queue
🎶 Playing Now: Never Gonna Give You Up
```

**Expected server logs (check with `docker logs eagle-bot`):**
```
▶️  NOW PLAYING: Never Gonna Give You Up by Rick Astley
    URL: https://www.youtube.com/watch?v=...
    Duration: 3:32
    Guild: Your Server Name
    Voice Channel: General
    Queue size: 1
✅ Voice connection READY (audio can stream)
```

---

### Test 3.2: Verify Discord Audio Settings

1. **Check your volume:**
   - Discord app → Voice settings
   - Ensure bot channel volume is NOT muted (it won't show as muted even if at 0%)
   - Slide bot volume to 100%

2. **Check Discord output device:**
   - Discord app → Voice settings
   - Output Device should be your speakers/headphones
   - Test with Discord's Test Output sound to verify device works

3. **Check Windows volume:**
   - Windows System Tray → Volume mixer
   - Find Discord
   - Ensure Discord volume is 100%
   - Ensure Discord output device is correct (speakers/headphones, not display/HDMI if that's not where you hear sound)

---

## Step 4: Server/Guild Diagnostics

### Check Server Voice State

```
/audiotest test:voice-connection
```

If the status shows something other than `ready`, one of these is likely:

1. **Bot got disconnected** → Bot will auto-reconnect, just wait
2. **Voice server unreachable** → Rare, contact Discord support
3. **Connection not yet established** → Wait 10 seconds and test again

---

## Step 5: Audio Stream Verification

If all tests pass but you still hear no audio, the issue is in the audio stream pipeline.

### Check FFmpeg is actually being called

Enable verbose FFmpeg logging by modifying `src/distube.js`:

Find this section:
```javascript
ffmpeg: {
    path: ffmpeg,
    args: [
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
    ]
}
```

Add this argument to enable verbose logging:
```javascript
ffmpeg: {
    path: ffmpeg,
    args: [
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-loglevel", "verbose",  // Add this line
    ]
}
```

Then restart bot and check logs:
```bash
docker logs eagle-bot | grep -i "ffmpeg\|Stream"
```

---

## Step 6: Common Issues & Fixes

### Issue: "Bot joins but no audio"

**Checklist:**
- [ ] `/audiotest test:permissions` shows all ✅
- [ ] `/audiotest test:ffmpeg` shows ✅
- [ ] Server logs show `▶️ NOW PLAYING:`
- [ ] Server logs show `✅ Voice connection READY`
- [ ] Discord volume for bot channel is 100%
- [ ] Discord output device is set to speakers
- [ ] Windows volume is 100%

If ALL are checked:
1. Stop bot: `docker stop eagle-bot`
2. Restart bot: `docker start eagle-bot`
3. Add song: `/play rick astley`
4. Wait 5 seconds
5. Listen

---

### Issue: "Connection timeout" error

```
❌ Failed to enter READY state: Connection timed out
```

**Solutions (in order):**
1. Check bot has CONNECT permission (see Step 1.2)
2. Try a different voice channel
3. Restart bot
4. Check Discord server status (rare)

---

### Issue: "Cannot connect to voice channel"

```
❌ DisTube Error: Cannot connect
```

**Check:**
1. Voice channel exists and is not full
2. Bot has CONNECT permission in that channel
3. Voice channel doesn't have special restrictions
4. Bot role is higher than any channel-specific deny roles

To fix:
1. Ensure bot role has no "Deny" permissions in voice channels
2. Go to Server Settings → Roles → Bot Role
3. Remove any permission denies
4. Restart bot

---

### Issue: "youtube bot detection"

```
❌ YouTube bot detection / 403 error
```

**This is NOT an audio problem - it's a content access issue**

Solutions:
1. Use `/play rick astley` (search by name, not URL)
2. Use Spotify links instead of YouTube
3. Wait 10 minutes and try again (YouTube temporarily blocks)
4. Try a different song

This does NOT prevent audio streaming - the issue is the content can't be accessed.

---

## Step 7: Emergency Recovery

If audio still isn't working after all tests:

### Full Reset
```bash
# Stop bot
docker stop eagle-bot

# Remove and recreate container
docker rm eagle-bot
docker image prune -a

# Rebuild and restart
docker-compose up -d --build
```

### Clear Cache
```bash
# Clear bot cache
rm -rf data/cache
docker restart eagle-bot
```

### Reinstall Dependencies
```bash
# In bot container
npm install --force
npm rebuild

# Then restart
docker restart eagle-bot
```

---

## Step 8: Collecting Debug Information

If you still need help, collect this information:

1. **Full diagnostic output:**
   ```bash
   node src/diagnostics/audioTest.js > diagnostic-output.log 2>&1
   ```

2. **Bot startup logs:**
   ```bash
   docker logs eagle-bot > bot-startup.log 2>&1
   ```

3. **Music playback logs:**
   ```bash
   # While playing music
   docker logs -f eagle-bot | tee music-session.log
   # Let it run for 30 seconds, then Ctrl+C
   ```

4. **System information:**
   ```bash
   # In bot container
   node -e "console.log('Node:', process.version); console.log('Platform:', process.platform); console.log('Arch:', process.arch);"
   ```

Share these files for detailed troubleshooting.

---

## Expected Behavior Summary

### When you use `/play rick astley`:

1. **Immediately:** Bot responds "✅ Added to queue"
2. **Within 2 seconds:** Server logs show "▶️ NOW PLAYING: Never Gonna Give You Up"
3. **Bot joins voice channel** (if not already there)
4. **Server logs show:**
   - `✅ Voice connection READY`
   - `Queue size: 1`
5. **You hear audio** starting to play in Discord

If you see steps 1-4 but NOT step 5 (hearing audio), the problem is in the audio output chain:
- Try restarting bot
- Check Discord volume settings
- Check Windows audio device
- Verify FFmpeg installation

---

## Monitoring Commands

Use these commands to monitor audio in real-time:

```bash
# Watch all voice-related logs
docker logs -f eagle-bot | grep -i "voice\|connection\|audio\|stream"

# Watch DisTube events
docker logs -f eagle-bot | grep -i "distube\|playing\|queue"

# Watch all music commands
docker logs -f eagle-bot | grep "🎵\|▶️\|❌"
```

---

## Next Steps

1. Run through all tests in Step 1
2. Report any failures
3. If all pass, test audio playback
4. If silent, proceed to Step 5
5. If still no luck, collect debug info from Step 8 and provide output
