const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/welcome');
const { clearAfk, setAfk } = require('../src/afk');
const { evaluatePromoDemo, getCheckinState, getCheckinLeaderboard, registerTicketCheckin, getRoleTarget } = require('../src/services/promoDemoService');
const { buildPersonalPromoRequestEmbed } = require('../src/services/prefixCommandService');

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

test('promoreq builds a personal promo-progress embed using the author metrics and active role target', () => {
  const member = {
    id: 'u-99',
    user: { id: 'u-99', username: 'xjker' },
    roles: { cache: [{ id: 'r-trial', name: 'Trial Staff' }] },
  };
  const guild = { id: 'g-1', name: 'XJKER CM' };
  const metrics = { messages: 600, tickets: 5 };
  const target = getRoleTarget(member);
  const result = buildPersonalPromoRequestEmbed(guild, member, metrics);

  assert.equal(target.role, 'Trial Staff');
  assert.equal(result.data.title, '❤️ XJKER CM Promo-demo ❤️');
  assert.match(result.data.description, /@Trial Staff/);
  assert.match(result.data.fields[0].value, /Your Progress/);
  assert.match(result.data.fields[0].value, /600\/700/);
  assert.match(result.data.fields[1].value, /Current Est. Verdict/);
  assert.match(result.data.fields[2].value, /Promotion/);
});

test('first staff check-in records a ticket and marks the member as checked in', () => {
  const state = { ticketOwner: 'user-1', staffMembers: new Set(), ticketTotals: { 'user-1': 0 } };
  const next = getCheckinState(state, { userId: 'user-2', roleId: '1534099901976416257' }, 'ticket-42');
  assert.equal(next.ticketTotals['user-2'], 1);
  assert.equal(next.checkins['ticket-42'], 'user-2');
});

test('custom staff roles also count as a valid ticket check-in', () => {
  const state = { ticketOwner: 'user-1', staffMembers: new Set(), ticketTotals: { 'user-1': 0 } };
  const next = getCheckinState(state, { userId: 'user-3', roleId: 'custom-role-999' }, 'ticket-99');
  assert.equal(next.ticketTotals['user-3'], 1);
  assert.equal(next.checkins['ticket-99'], 'user-3');
});

test('check-in leaderboard ranks staff by approved check-ins and caps at top 10', () => {
  const totals = {
    'user-1': 5,
    'user-2': 11,
    'user-3': 7,
    'user-4': 2,
    'user-5': 9,
    'user-6': 1,
    'user-7': 13,
    'user-8': 4,
    'user-9': 6,
    'user-10': 8,
    'user-11': 10,
  };
  const leaderboard = getCheckinLeaderboard(totals, 10);
  assert.deepEqual(leaderboard.map((entry) => entry.userId), ['user-7', 'user-2', 'user-11', 'user-5', 'user-10', 'user-3', 'user-9', 'user-1', 'user-8', 'user-4']);
});

test('check-in leaderboard shows empty state when no check-ins exist', () => {
  const leaderboard = getCheckinLeaderboard({});
  assert.deepEqual(leaderboard, []);
});

test('ticket claims only count once per ticket channel and keep the first staff claim', () => {
  const initial = { ticketTotals: {}, checkins: {}, staffMembers: new Set() };
  const first = registerTicketCheckin(initial, { userId: 'u-1', roleId: '1534099901976416257' }, 'ticket-999');
  const second = registerTicketCheckin(first, { userId: 'u-2', roleId: '1534099901976416257' }, 'ticket-999');
  assert.equal(first.ticketTotals['u-1'], 1);
  assert.equal(second.ticketTotals['u-2'], undefined);
  assert.equal(second.checkins['ticket-999'], 'u-1');
});
