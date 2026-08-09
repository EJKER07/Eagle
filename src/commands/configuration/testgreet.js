const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { render } = require("../../services/communityService");

module.exports = {
  data: new SlashCommandBuilder().setName("testgreet").setDescription("Test the configured welcome message.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  aliases: ["greettest", "testwelcome"],
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const settings = client.db.getGuildSettings(interaction.guildId).welcome;
    if (!settings.enabled || !settings.channelId) throw new Error("Configure a greet channel with /setgreet first.");
    const channel = interaction.guild.channels.cache.get(settings.channelId);
    if (!channel?.isTextBased()) throw new Error("The configured greet channel is unavailable.");
    const message = render(settings.message, interaction.member, channel);
    const sent = await channel.send({
      content: message,
      embeds: [embed("success", "Welcome", message)],
      allowedMentions: { users: [interaction.user.id] },
    });
    setTimeout(() => sent.delete().catch(() => {}), Math.min(settings.deleteAfter ?? 1, 1) * 1000);
    await interaction.reply({ embeds: [embed("success", "Greet tested", `Preview sent to ${channel} and scheduled for deletion.`)], ephemeral: true });
  },
};