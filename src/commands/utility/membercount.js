const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Show server member statistics."),
  async execute(interaction) {
    const guild = interaction.guild;
    const members = await guild.members.fetch();
    const bots = members.filter((m) => m.user.bot).size;
    const humans = members.size - bots;
    await interaction.reply({
      embeds: [embed("info", "Member Statistics", `👥 **Total:** ${members.size}\n👤 **Humans:** ${humans}\n🤖 **Bots:** ${bots}`)],
    });
  },
};
