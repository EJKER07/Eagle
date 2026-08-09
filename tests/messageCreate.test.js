const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldReactToEnter, isGiveawayEntryMessage } = require('../src/events/guild/messageCreate');

test('detects enter-related messages for reactions', () => {
  assert.equal(shouldReactToEnter('enter'), true);
  assert.equal(shouldReactToEnter('please enter now'), true);
  assert.equal(shouldReactToEnter('entry for the giveaway'), true);
  assert.equal(shouldReactToEnter('typing something else'), false);
  assert.equal(shouldReactToEnter('   '), false);
});

test('detects giveaway entry messages', () => {
  assert.equal(isGiveawayEntryMessage('enter giveaway'), true);
  assert.equal(isGiveawayEntryMessage('join'), true);
  assert.equal(isGiveawayEntryMessage('join giveaway'), true);
  assert.equal(isGiveawayEntryMessage('please enter now'), false);
});
