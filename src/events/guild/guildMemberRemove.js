const { Events } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { sendMemberMessage } = require("../../services/communityService");

module.exports = {
  name: Events.GuildMemberRemove,
  once: false,
  async execute(client, member) {
    await sendMemberMessage(client, member, "leave");
    const settings = client.db.getGuildSettings(member.guild.id).goodbye;
    if (!settings.enabled || !settings.channelId) return;
    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel?.isTextBased()) return;
    const message = settings.message
      .replaceAll("{user}", member.user.tag)
      .replaceAll("{username}", member.user.username)
      .replaceAll("{userid}", member.id)
      .replaceAll("{server}", member.guild.name)
      .replaceAll("{membercount}", String(member.guild.memberCount))
      .replaceAll("{mention}", `<@${member.id}>`);
    const sent = await channel.send({ embeds: [embed("info", "Goodbye", message)] });
    if (settings.deleteAfter > 0) setTimeout(() => sent.delete().catch(() => {}), settings.deleteAfter * 1000);
  },
};
