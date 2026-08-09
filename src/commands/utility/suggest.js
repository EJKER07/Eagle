const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Submit a feature suggestion.")
    .addStringOption((o) => o.setName("idea").setDescription("Your suggestion").setRequired(true)),
  async execute(interaction) {
    const idea = interaction.options.getString("idea");
    const dmChannel = await interaction.client.users.fetch(interaction.client.config.ownerId).then((u) => u.createDM()).catch(() => null);
    if (dmChannel) await dmChannel.send({ embeds: [embed("info", "💡 New Suggestion", `From: ${interaction.user}\nServer: ${interaction.guild.name}\n\n${idea}`)] });
    await interaction.reply({ embeds: [embed("success", "Suggestion sent", "Thank you for your feedback!")] });
  },
};
