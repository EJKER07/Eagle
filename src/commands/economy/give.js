const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give coins to another user.")
    .addUserOption((o) => o.setName("user").setDescription("Recipient").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setDescription("Coins to give").setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    try {
      const target = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");
      
      if (target.id === interaction.user.id) return interaction.reply({ embeds: [embed("error", "Cannot give to self", "You can't give coins to yourself.")] });
      if (target.bot) return interaction.reply({ embeds: [embed("error", "Cannot give to bot", "You can't give coins to bots.")] });
      if (amount <= 0) return interaction.reply({ embeds: [embed("error", "Invalid amount", "Amount must be greater than 0.")] });
      
      const sender = client.db.getEconomy(interaction.guildId, interaction.user.id) || { coins: 0 };
      if (sender.coins < amount) return interaction.reply({ embeds: [embed("error", "Insufficient funds", "You don't have enough coins.")] });
      
      const receiver = client.db.getEconomy(interaction.guildId, target.id) || { coins: 0 };
      client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: Math.max(0, sender.coins - amount), lastDaily: sender.lastDaily });
      client.db.updateEconomy(interaction.guildId, target.id, { coins: receiver.coins + amount, lastDaily: receiver.lastDaily });
      
      await interaction.reply({ embeds: [embed("success", "Transfer complete", `You gave **${amount}** coins to ${target}.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Transfer failed", error.message)] });
    }
  },
};
