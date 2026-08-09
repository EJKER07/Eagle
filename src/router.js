const { hasPermission } = require('./permissions');
const help = require('./help');

class InteractionRouter {
  constructor(commands, context) {
    this.commands = commands;
    this.context = context;
  }

  async handle(interaction) {
    try {
      if (interaction.isChatInputCommand()) return this.command(interaction);
      if (interaction.isStringSelectMenu() && interaction.customId === 'help:category') return this.category(interaction);
      if (interaction.isButton() && ['help:home', 'help:back'].includes(interaction.customId)) return this.home(interaction);
    } catch (error) {
      console.error('Interaction failed', error);
      if (!interaction.replied && !interaction.deferred) await interaction.reply({ content: 'Something went wrong while processing that interaction.', ephemeral: true });
    }
  }

  async command(interaction) {
    const command = this.commands.get(interaction.commandName);
    if (!command) return interaction.reply({ content: 'That command is not available.', ephemeral: true });
    if (command.permissions && !hasPermission(interaction, command.permissions)) return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
    const key = `${interaction.user.id}:${command.data.name}`;
    const remaining = this.context.cooldowns.remaining(key, command.cooldown || 0);
    if (remaining) return interaction.reply({ content: `Please wait ${Math.ceil(remaining / 1000)}s before using this again.`, ephemeral: true });
    this.context.cooldowns.set(key, command.cooldown || 0);
    await command.execute(interaction, this.context);
  }

  async category(interaction) {
    const name = interaction.values[0];
    if (!help.categories[name]) return interaction.reply({ content: 'That help category is unavailable.', ephemeral: true });
    await interaction.update({ embeds: [help.categoryEmbed(name, help.categories[name].commands)], components: [...help.components(), ...help.navigation()] });
  }

  async home(interaction) {
    await interaction.update({ embeds: [help.homeEmbed()], components: help.components() });
  }
}

module.exports = { InteractionRouter };
