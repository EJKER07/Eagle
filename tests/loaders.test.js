const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadCommands } = require('../src/loaders');

test('recursively loads and sorts command modules', async () => {
  const commands = await loadCommands(path.join(__dirname, '..', 'src', 'commands'));
  assert.ok(commands.size >= 43);
  for (const name of ['invites', 'messages', 'vc', 'lb', 'gstart', 'greet', 'stats', 'setprefix']) assert.ok(commands.has(name), `Missing command: ${name}`);
});
