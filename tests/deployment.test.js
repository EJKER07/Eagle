const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCommandPayload } = require('../src/deploy');

test('deployment payload contains every loaded slash command', async () => {
  const payload = await buildCommandPayload();
  assert.ok(payload.length >= 43);
  assert.ok(payload.some(command => command.name === 'ban'));
  assert.ok(payload.some(command => command.name === 'invites'));
  assert.ok(payload.some(command => command.name === 'lb'));
  assert.ok(payload.every(command => command.description));
});
