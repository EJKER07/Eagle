const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Database } = require('../src/persistence/database');

test('legacy database exports load with initialized config paths', () => {
  const database = require('../src/database');
  assert.equal(typeof database.getGuildSettings, 'function');
});

test('persists guild configuration without native dependencies', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'firstlight-'));
  const first = await new Database(dir).load();
  first.setGuild('guild-1', { locale: 'en-GB', premium: true });
  first.addWarning('guild-1', 'user-1', { moderatorId: 'mod-1', reason: 'testing' });
  await first.flush();
  const second = await new Database(dir).load();
  assert.equal(second.getWarnings('guild-1', 'user-1')[0].reason, 'testing');
  assert.equal(second.getGuild('guild-1').premium, true);
});
