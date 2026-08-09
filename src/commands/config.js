const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('config').setDescription('View or update guild configuration.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild.toString())
    .addSubcommand(sub => sub.setName('view').setDescription('View current configuration.'))
    .addSubcommand(sub => sub.setName('premium').setDescription('Set premium status.')
      .addBooleanOption(option => option.setName('enabled').setDescription('Premium enabled').setRequired(true))),
  permissions: ['ManageGuild'],
  async execute(interaction, context) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'premium') {
      const enabled = interaction.options.getBoolean('enabled', true);
      context.database.setGuild(interaction.guildId, { premium: enabled });
      await interaction.reply(`Premium mode ${enabled ? 'enabled' : 'disabled'}.`);
      return;
    }
    const guild = context.database.getGuild(interaction.guildId);
    await interaction.reply(`Locale: \`${guild.locale}\` | Premium: \`${guild.premium ? 'enabled' : 'disabled'}\``);
  }
};
