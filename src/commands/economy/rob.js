const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rob")
    .setDescription("Try to rob another user's coins.")
    .addUserOption((o) => o.setName("user").setDescription("Target").setRequired(true)),
  async execute(interaction, client) {
    const target = interaction.options.getUser("user");
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [embed("error", "Cannot rob self", "You can't rob yourself.")] });
    if (target.bot) return interaction.reply({ embeds: [embed("error", "Cannot rob bots", "You can't rob bots.")] });
    const success = Math.random() > 0.5;
    const amount = Math.floor(Math.random() * 50) + 10;
    const robber = client.db.getEconomy(interaction.guildId, interaction.user.id);
    const targetEcon = client.db.getEconomy(interaction.guildId, target.id);
    if (success && targetEcon.coins >= amount) {
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: robber.coins + amount, lastDaily: robber.lastDaily });
      client.db.updateEconomy(interaction.guildId, target.id, { coins: targetEcon.coins - amount, lastDaily: targetEcon.lastDaily });
      await interaction.reply({ embeds: [embed("success", "Rob successful", `You stole **${amount}** coins from ${target}!`)] });
    } else {
      await interaction.reply({ embeds: [embed("error", "Rob failed", `You failed to rob ${target}. You got caught!`)] });
    }
  },
};
