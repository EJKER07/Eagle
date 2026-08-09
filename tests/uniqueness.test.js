const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadCommands, loadEvents } = require('../src/loaders');

test('all Phase 2 command and event names are unique', async () => {
  const commands = await loadCommands(path.join(__dirname, '..', 'src', 'commands'));
  const events = await loadEvents(path.join(__dirname, '..', 'src', 'events'));
  assert.equal(new Set(commands.keys()).size, commands.size);
  assert.equal(new Set(events.map(event => event.name)).size, events.length);
});
