const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { sendWelcome } = require('../welcome');

const builder = new SlashCommandBuilder().setName('welcome').setDescription('Configure welcome and goodbye messages.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
  .addSubcommand(sub => sub.setName('setup').setDescription('Set up welcome messages.')
    .addChannelOption(o => o.setName('channel').setDescription('Welcome channel').setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addChannelOption(o => o.setName('goodbye-channel').setDescription('Goodbye channel'))
    .addRoleOption(o => o.setName('auto-role').setDescription('Role assigned to new members'))
    .addStringOption(o => o.setName('message').setDescription('Use {user}, {username}, and {server}')))
  .addSubcommand(sub => sub.setName('config').setDescription('View welcome configuration.'))
  .addSubcommand(sub => sub.setName('disable').setDescription('Disable welcome messages.'))
  .addSubcommand(sub => sub.setName('test').setDescription('Send a test welcome message.'));

module.exports = {
  data: builder,
  permissions: ['ManageGuild'],
  async execute(interaction, context) {
    const guild = context.database.getGuild(interaction.guildId); const sub = interaction.options.getSubcommand();
    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel', true); const goodbye = interaction.options.getChannel('goodbye-channel'); const role = interaction.options.getRole('auto-role');
      const welcome = { ...guild.welcome, enabled: true, channelId: channel.id, goodbyeChannelId: goodbye?.id || null, autoRoleId: role?.id || null, message: interaction.options.getString('message') || 'Welcome {user} to {server}!', goodbyeMessage: guild.welcome.goodbyeMessage || '{username} left {server}.', color: guild.welcome.color || 0x22c55e };
      context.database.setGuild(interaction.guildId, { welcome }); await interaction.reply(`Welcome messages configured for ${channel}.`); return;
    }
    if (sub === 'disable') { context.database.setGuild(interaction.guildId, { welcome: { ...guild.welcome, enabled: false } }); await interaction.reply('Welcome messages disabled.'); return; }
    if (sub === 'test') { if (!guild.welcome.enabled) return interaction.reply({ content: 'Welcome messages are not configured.', ephemeral: true }); await sendWelcome(interaction.member, guild.welcome); await interaction.reply({ content: 'Test welcome sent.', ephemeral: true }); return; }
    await interaction.reply(`Welcome: \`${guild.welcome.enabled ? 'enabled' : 'disabled'}\` | Channel: ${guild.welcome.channelId ? `<#${guild.welcome.channelId}>` : 'not set'} | Auto role: ${guild.welcome.autoRoleId ? `<@&${guild.welcome.autoRoleId}>` : 'none'}`);
  }
};
