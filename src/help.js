const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const categories = Object.freeze({
  General: { description: 'Everyday XJKER CM commands.', commands: ['help', 'ping'] },
  Configuration: { description: 'Guild administration and preferences.', commands: ['config', 'setlog', 'welcome', 'stealemoji'] },
  Moderation: { description: 'Tools for keeping your server safe.', commands: ['ban', 'unban', 'kick', 'timeout', 'untimeout', 'warn', 'warnings', 'clear', 'slowmode', 'lock', 'unlock', 'softban', 'nick'] },
  Community: { description: 'Member experience tools.', commands: ['afk', 'giveaway'] },
  Planned: { description: 'Systems reserved for upcoming feature phases.', commands: [] }
});

function themedEmbed(title, description) {
  return new EmbedBuilder()
    .setAuthor({ name: '🏆 XJKER CM | MANAGEMENT TOOLS' })
    .setTitle(String(title).toUpperCase())
    .setDescription(description)
    .setColor(0x0f172a)
    .setFooter({ text: 'XJKER CM | GIVEAWAYS • CHILL • HANGOUT' })
    .setTimestamp();
}

function homeEmbed() {
  return themedEmbed('XJKER CM Help', 'Choose a category to explore available commands.');
}

function categoryEmbed(name, commands) {
  const category = categories[name];
  const lines = commands.length ? commands.map(command => `• \`/${command}\``).join('\n') : 'No commands are enabled in this category yet.';
  return themedEmbed(`${name} commands`, `${category.description}\n\n${lines}`);
}

function components() {
  const select = new StringSelectMenuBuilder().setCustomId('help:category').setPlaceholder('Select a category').addOptions(
    Object.keys(categories).map(name => ({ label: name, value: name, description: categories[name].description }))
  );
  return [new ActionRowBuilder().addComponents(select)];
}

function navigation() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('help:home').setLabel('Home').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('help:back').setLabel('Back').setStyle(ButtonStyle.Secondary)
  )];
}

module.exports = { categories, homeEmbed, categoryEmbed, components, navigation };
