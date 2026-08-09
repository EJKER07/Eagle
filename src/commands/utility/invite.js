const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("invite")
    .setDescription("Get a bot invite link or create a server invite."),
  async execute(interaction) {
    await interaction.reply({
      embeds: [embed("info", "Invite", `🤖 **Bot:** https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands\n\n🔗 **Support:** https://discord.gg/eagle`)],
      ephemeral: true,
    });
  },
};
