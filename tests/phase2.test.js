const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/welcome');
const { clearAfk, setAfk } = require('../src/afk');
const { evaluatePromoDemo, getCheckinState } = require('../src/services/promoDemoService');

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

test('promo demo awards promotion when both metrics clear 50% of the target', () => {
  const result = evaluatePromoDemo({ messages: 600, tickets: 3 }, { requiredMessages: 1000, requiredTickets: 6 });
  assert.equal(result.status, 'promo');
  assert.equal(result.messagesPercent, 60);
  assert.equal(result.ticketsPercent, 50);
});

test('first staff check-in records a ticket and marks the member as checked in', () => {
  const state = { ticketOwner: 'user-1', staffMembers: new Set(), ticketTotals: { 'user-1': 0 } };
  const next = getCheckinState(state, { userId: 'user-2', roleId: '1534099901976416257' }, 'ticket-42');
  assert.equal(next.ticketTotals['user-2'], 1);
  assert.equal(next.checkins['ticket-42'], 'user-2');
});
