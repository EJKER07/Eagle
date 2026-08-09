const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("give")
    .setDescription("Give coins to another user.")
    .addUserOption((o) => o.setName("user").setDescription("Recipient").setRequired(true))
    .addIntegerOption((o) => o.setName("amount").setDescription("Coins to give").setRequired(true).setMinValue(1)),
  async execute(interaction, client) {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    if (target.id === interaction.user.id) return interaction.reply({ embeds: [embed("error", "Cannot give to self", "You can't give coins to yourself.")] });
    const sender = client.db.getEconomy(interaction.guildId, interaction.user.id);
    if (sender.coins < amount) return interaction.reply({ embeds: [embed("error", "Insufficient funds", "You don't have enough coins.")] });
    const receiver = client.db.getEconomy(interaction.guildId, target.id);
    client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: sender.coins - amount, lastDaily: sender.lastDaily });
    client.db.updateEconomy(interaction.guildId, target.id, { coins: receiver.coins + amount, lastDaily: receiver.lastDaily });
    await interaction.reply({ embeds: [embed("success", "Transfer complete", `You gave **${amount}** coins to ${target}.`)] });
  },
};
