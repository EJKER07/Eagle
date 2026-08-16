# Audio Troubleshooting Guide

## Issue: Bot joins voice but no audio is heard

### Diagnostics Checklist

#### 1. Check Voice Connection
```bash
/audiotest test:voice-connection
```
Expected: `✅ Voice connection found` with status `ready`

**If failed:**
- Bot doesn't have CONNECT permission → grant it
- Voice channel is full → make space
- Voice channel has restrictions → remove them
- Try: Restart bot and retry

---

#### 2. Check Queue Status
```bash
/audiotest test:distube-status
```
Expected: `✅ Queue active` with at least 1 song

**If failed:**
- No songs added to queue → use `/play` command
- Queue was cleared → add new songs

---

#### 3. Check Bot Permissions
```bash
/audiotest test:permissions
```
Expected: All three permissions show `✅ true`
- CONNECT: Bot can join voice
- SPEAK: Bot can play audio
- USE_VAD: Voice activity detection

**If failed:**
- Missing CONNECT → Add permission to role
- Missing SPEAK → Add permission to role
- Restart bot after permission changes

---

#### 4. Check FFmpeg
```bash
/audiotest test:ffmpeg
```
Expected: FFmpeg path displayed and `✅ FFmpeg configured`

**If failed:**
- FFmpeg not installed → `npm install ffmpeg-static`
- Invalid path → Reinstall `ffmpeg-static`

---

### Automatic Diagnostics

Run full diagnostic suite:
```bash
node src/diagnostics/audioTest.js
```

This tests:
- FFmpeg availability
- Opus codec support
- Audio resource creation
- Audio player functionality
- Voice connection state

---

### Common Audio Issues

#### Issue: "Cannot connect to voice"
```
❌ Failed with: Cannot connect to voice channel
```

**Solutions:**
1. Check bot has CONNECT permission
2. Check voice channel isn't full
3. Try a different voice channel
4. Restart bot

---

#### Issue: YouTube links don't work
```
❌ YouTube bot detection / 403 error
```

**Solutions:**
1. Use `/play` with song name instead of URL
2. Try Spotify links instead
3. YouTube temporarily blocks automated access
4. Wait 5-10 minutes and try again

---

#### Issue: Silent audio / No sound at all
```
✅ Queue active, ✅ Voice connected, ❌ NO AUDIO
```

**Solutions:**
1. Check FFmpeg is working: `/audiotest test:ffmpeg`
2. Verify permissions: `/audiotest test:permissions`
3. Check Discord volume is not muted
4. Try simple search: `/play test`
5. Restart bot completely
6. Check container logs for errors

---

### Debug Logging

Enable full debug logging in container:
```bash
docker logs -f eagle-bot
```

Look for:
- `▶️ NOW PLAYING:` (song detected)
- `✅ Voice connection ready` (connection established)
- `❌ DisTube Error:` (actual errors)

---

### FFmpeg Verification

Test FFmpeg directly:
```bash
ffmpeg -f lavfi -i sine=frequency=1000:duration=2 -f s16le -ar 48000 -ac 2 output.wav
```

If this works, FFmpeg is fine. If it fails, reinstall:
```bash
npm install --save ffmpeg-static
```

---

### Permission Verification

In Discord server settings → Roles → Bot role:
- Text: `Send Messages`, `Embed Links`
- Voice: `Connect`, `Speak`, `Use Voice Activity`

Make sure these are NOT overridden at channel level with denies.

---

### Recovery Steps (in order)

1. **Stop bot**
   ```bash
   docker stop eagle-bot
   ```

2. **Verify permissions in Discord**
   - Server Settings → Roles → [@Eagle] 
   - Check all voice permissions are ✅

3. **Restart bot**
   ```bash
   docker start eagle-bot
   ```

4. **Test voice channel**
   ```
   /audiotest test:voice-connection
   /audiotest test:permissions
   ```

5. **Add and play a song**
   ```
   /play rick astley
   ```

6. **Check container logs**
   ```bash
   docker logs eagle-bot | tail -50
   ```

---

### If All Else Fails

Enable verbose logging and capture output:
```bash
docker logs eagle-bot > audio-debug.log 2>&1
```

Then provide logs showing:
1. Bot startup (should see "✅ DisTube fully initialized")
2. Song addition (should see "➕ Song added")
3. Song playing (should see "▶️ NOW PLAYING")

Audio system is working if you see all three in logs, but no audio in Discord = likely codec issue.
