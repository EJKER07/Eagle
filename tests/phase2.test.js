const test = require('node:test');
const assert = require('node:assert/strict');
const { render } = require('../src/welcome');
const { clearAfk, setAfk } = require('../src/afk');
const { evaluatePromoDemo, getCheckinState, getCheckinLeaderboard, registerTicketCheckin, getRoleTarget, ROLE_TARGETS, getUserMetricsUpToDate } = require('../src/services/promoDemoService');
const { buildPersonalPromoRequestEmbed, resetStaffCheckinStats, resetAllStaffCheckins, triggerPromoCycleReset } = require('../src/services/prefixCommandService');

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
    roles: { cache: [{ id: '1534099901976416257', name: 'Trial Staff' }] },
  };
  const guild = { id: 'g-1', name: 'XJKER CM' };
  const metrics = { messages: 600, tickets: 5 };
  const target = getRoleTarget(member);
  const result = buildPersonalPromoRequestEmbed(guild, member, metrics);

  assert.equal(target.role, 'Trial Staff');
  assert.equal(result.data.title, '❤️ XJKER CM Promo-demo ❤️');
  assert.match(result.data.description, /<@&1534099901976416257>/);
  assert.match(result.data.description, /<@&1534099902022549517>/);
  assert.match(result.data.fields[0].value, /Your Progress/);
  assert.match(result.data.fields[0].value, /600\/700/);
  assert.match(result.data.fields[1].value, /Current Est. Verdict/);
  assert.match(result.data.fields[1].value, /Next Role/i);
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

test('role targets include all seven custom staff roles in the exact hierarchy', () => {
  assert.equal(ROLE_TARGETS.length, 7);
  assert.deepEqual(ROLE_TARGETS.map((entry) => entry.roleId), [
    '1534099901976416257',
    '1534099902022549517',
    '1534099902022549518',
    '1534099902022549519',
    '1538763624158470164',
    '1538763818497478726',
    '1534099902051647616',
  ]);
  assert.equal(ROLE_TARGETS[0].name, 'Trial Staff');
  assert.equal(ROLE_TARGETS[6].name, 'Manager');
  assert.equal(ROLE_TARGETS[6].nextRoleId, 'Max Level achieved!');
});

test('promoreq and promotion verdicts render the next role using role mentions and max-level wording', () => {
  const member = {
    id: 'u-99',
    user: { id: 'u-99', username: 'xjker' },
    roles: { cache: [{ id: '1534099901976416257', name: 'Trial Staff' }] },
  };
  const result = buildPersonalPromoRequestEmbed({ id: 'g-1', name: 'XJKER CM' }, member, { messages: 900, tickets: 11 });

  assert.match(result.data.description, /<@&1534099901976416257>/);
  assert.match(result.data.description, /<@&1534099902022549517>/);
  assert.match(result.data.description, /<@&1534099902051647616>/);
  assert.match(result.data.fields[1].value, /Next Role/i);
  assert.match(result.data.fields[1].value, /<@&1534099902022549517>/);
});

test('promo totals prefer the check-in leaderboard ticket count over raw ticket metric rows', () => {
  const guildMembers = {
    'u-1': { metrics: { messages: 500, tickets: 1 } },
    'u-1:2026-08-17': { metrics: { messages: 100, tickets: 1 } },
  };

  const totals = getUserMetricsUpToDate(guildMembers, 'u-1', new Date('2026-08-17T00:00:00Z'), { 'u-1': 7 });

  assert.equal(totals.messages, 600);
  assert.equal(totals.tickets, 7);
});

test('resetstaff clears a single member promotion record and metric totals', () => {
  const state = {
    promotion: {
      checkins: { 'ticket-1': 'u-1', 'ticket-2': 'u-2' },
      ticketTotals: { 'u-1': 4, 'u-2': 2 },
    },
    members: {
      'u-1': { metrics: { tickets: 4, checkins: 4 } },
      'u-2': { metrics: { tickets: 2, checkins: 2 } },
      'u-1:2026-08-17': { metrics: { tickets: 1, checkins: 1 } },
    },
  };

  const next = resetStaffCheckinStats(state, 'u-1');

  assert.equal(next.promotion.ticketTotals['u-1'], undefined);
  assert.equal(next.promotion.checkins['ticket-1'], undefined);
  assert.equal(next.members['u-1'].metrics.tickets, 0);
  assert.equal(next.members['u-1'].metrics.checkins, 0);
  assert.equal(next.members['u-1:2026-08-17'], undefined);
});

test('resetallstaff wipes out all promotion check-ins and ticket totals for the guild', () => {
  const state = {
    promotion: {
      checkins: { 'ticket-1': 'u-1', 'ticket-2': 'u-2' },
      ticketTotals: { 'u-1': 4, 'u-2': 2 },
    },
    members: {
      'u-1': { metrics: { tickets: 4, checkins: 4 } },
      'u-2': { metrics: { tickets: 2, checkins: 2 } },
    },
  };

  const next = resetAllStaffCheckins(state);

  assert.deepEqual(next.promotion.checkins, {});
  assert.deepEqual(next.promotion.ticketTotals, {});
  assert.equal(next.members['u-1'].metrics.tickets, 0);
  assert.equal(next.members['u-2'].metrics.checkins, 0);
});

test('promo cycle reset clears all tracked message and ticket counters after the report is sent', () => {
  const guildState = {
    promotion: { checkins: { 'ticket-1': 'u-1' }, ticketTotals: { 'u-1': 4, 'u-2': 2 } },
    members: {
      'u-1': { metrics: { messages: 120, tickets: 4, checkins: 4 } },
      'u-2': { metrics: { messages: 90, tickets: 2, checkins: 2 } },
      'u-1:2026-08-17': { metrics: { messages: 55, tickets: 1, checkins: 1 } },
    },
  };

  const client = {
    db: {
      getGuildSettings: () => guildState,
      updateGuildSettings: (_guildId, updater) => {
        const next = updater(guildState);
        Object.keys(guildState).forEach((key) => delete guildState[key]);
        Object.assign(guildState, next);
        return next;
      },
    },
  };

  const next = triggerPromoCycleReset(client, { id: 'g-1', name: 'XJKER CM' });

  assert.deepEqual(next.promotion.checkins, {});
  assert.deepEqual(next.promotion.ticketTotals, {});
  assert.equal(next.members['u-1'].metrics.messages, 0);
  assert.equal(next.members['u-2'].metrics.tickets, 0);
  assert.equal(next.members['u-1:2026-08-17'].metrics.messages, 0);
});
