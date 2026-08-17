const test = require('node:test');
const assert = require('node:assert/strict');
const help = require('../src/help');
const { embed } = require('../src/utils/embeds');
const { getLevelThreshold, getLevelInfo } = require('../src/services/levelingService');

test('help exposes categories and navigation views', () => {
  assert.deepEqual(help.categories.General.commands, ['help', 'ping']);
  assert.equal(help.homeEmbed().data.title, 'XJKER CM HELP');
  assert.equal(help.categoryEmbed('General', ['help']).data.title, 'GENERAL COMMANDS');
  assert.equal(help.navigation()[0].components.length, 2);
});

test('command embed headings use title case', () => {
  assert.equal(embed('info', 'Snipe', 'No deleted message is currently cached.').data.title, 'Snipe');
});

test('shared embeds use the XJKER CM branding theme', () => {
  const rendered = embed('info', 'Snipe', 'No deleted message is currently cached.');
  assert.equal(rendered.data.author.name, '🏆 XJKER CM | MANAGEMENT TOOLS');
  assert.equal(rendered.data.footer.text, 'XJKER CM | GIVEAWAYS • CHILL • HANGOUT');
  assert.equal(rendered.data.color, 0x0f172a);
});

test('level progression uses the requested random thresholds', () => {
  const levelOne = getLevelThreshold(1, 'user-1');
  assert.equal(levelOne, 50);

  const levelTwo = getLevelThreshold(2, 'user-1');
  assert.ok(levelTwo >= 100 && levelTwo <= 150);

  const levelThree = getLevelThreshold(3, 'user-1');
  assert.ok(levelThree >= 200 && levelThree <= 250);

  const info = getLevelInfo(180, 'user-1');
  assert.equal(info.level, 2);
  assert.ok(info.xp >= 0 && info.xp < info.requiredXp);
});
