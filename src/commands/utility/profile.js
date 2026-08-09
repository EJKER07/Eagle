const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View your economy profile.")
    .addUserOption((o) => o.setName("user").setDescription("User")),
  async execute(interaction, client) {
    const user = interaction.options.getUser("user") || interaction.user;
    const economy = client.db.getEconomy(interaction.guildId, user.id);
    const level = client.db.getLevel(interaction.guildId, user.id);
    await interaction.reply({
      embeds: [embed("economy", `${user.username}'s Profile`, `💰 **Balance:** ${economy.coins}\n📊 **Level:** ${level.level}\n⭐ **XP:** ${level.xp}`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))],
    });
  },
};
