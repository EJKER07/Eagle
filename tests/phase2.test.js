const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/welcome');
const { clearAfk, setAfk } = require('../src/afk');

test('disablegoodbye resolves the shared embed utility', () => {
  const command = require('../src/commands/configuration/disablegoodbye');
  assert.equal(command.data.name, 'disablegoodbye');
  assert.equal(typeof command.execute, 'function');
});

test('welcome templates render supported member tokens', () => {
  const member = { id: 'u1', user: { username: 'nav' }, guild: { name: 'FirstLight' } };
  assert.equal(render('Hi {user} / {username} at {server}', member), 'Hi <@u1> / nav at FirstLight');
});

test('AFK state persists and clears cleanly', async () => {
  const database = { values: { guild: { afk: {} } }, getGuild() { return this.values.guild; }, setGuild(_, patch) { this.values.guild = { ...this.values.guild, ...patch }; } };
  await setAfk(database, 'guild', 'user', 'away');
  assert.equal(database.getGuild('guild').afk.user.reason, 'away');
  assert.equal(clearAfk(database, 'guild', 'user'), true);
  assert.equal(clearAfk(database, 'guild', 'user'), false);
});
