const test = require('node:test');
const assert = require('node:assert/strict');
const help = require('../src/help');

test('help exposes categories and navigation views', () => {
  assert.deepEqual(help.categories.General.commands, ['help', 'ping']);
  assert.equal(help.homeEmbed().data.title, 'Eagle Premium Help');
  assert.equal(help.categoryEmbed('General', ['help']).data.title, 'General commands');
  assert.equal(help.navigation()[0].components.length, 2);
});
