const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a rule violation.")
    .addUserOption((o) => o.setName("user").setDescription("User to report").setRequired(true))
    .addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const dmChannel = await interaction.client.users.fetch(interaction.client.config.ownerId).then((u) => u.createDM()).catch(() => null);
    if (dmChannel) await dmChannel.send({ embeds: [embed("warning", "⚠️ Report", `Reported User: ${user}\nReporter: ${interaction.user}\nServer: ${interaction.guild.name}\n\nReason: ${reason}`)] });
    await interaction.reply({ embeds: [embed("success", "Report submitted", "Thank you for keeping the server safe!")] });
  },
};
