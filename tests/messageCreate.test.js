const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldReactToEnter } = require('../src/events/guild/messageCreate');

test('detects enter-related messages for reactions', () => {
  assert.equal(shouldReactToEnter('enter'), true);
  assert.equal(shouldReactToEnter('please enter now'), true);
  assert.equal(shouldReactToEnter('entry for the giveaway'), true);
  assert.equal(shouldReactToEnter('typing something else'), false);
  assert.equal(shouldReactToEnter('   '), false);
});
