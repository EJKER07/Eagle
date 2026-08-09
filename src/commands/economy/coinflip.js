const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("coinflip")
    .setDescription("Flip a coin and guess heads or tails.")
    .addStringOption((o) => o.setName("guess").setDescription("Your guess").setRequired(true).addChoices({ name: "Heads", value: "heads" }, { name: "Tails", value: "tails" }))
    .addIntegerOption((o) => o.setName("amount").setDescription("Coins to wager").setRequired(true).setMinValue(10)),
  async execute(interaction, client) {
    const guess = interaction.options.getString("guess");
    const wager = interaction.options.getInteger("amount");
    const economy = client.db.getEconomy(interaction.guildId, interaction.user.id);
    if (economy.coins < wager) return interaction.reply({ embeds: [embed("error", "Insufficient funds", "You don't have enough coins.")] });
    const result = Math.random() > 0.5 ? "heads" : "tails";
    const won = guess === result;
    const newCoins = won ? economy.coins + wager : economy.coins - wager;
    client.db.updateEconomy(interaction.guildId, interaction.user.id, { coins: newCoins, lastDaily: economy.lastDaily });
    await interaction.reply({ embeds: [embed(won ? "success" : "error", "Coinflip", `The coin landed on **${result}**. You ${won ? `won **${wager}** coins!` : `lost **${wager}** coins.`}`)] });
  },
};
