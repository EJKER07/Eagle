const { Events } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { findUsedInvite, metric, sendMemberMessage, render } = require("../../services/communityService");

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(client, member) {
    const invite = await findUsedInvite(client, member);
    if (invite?.inviter?.id) {
      const settings = client.db.getGuildSettings(member.guild.id);
      const tracked = { ...(settings.invites.tracked || {}), [member.id]: { inviterId: invite.inviter.id, code: invite.code, joinedAt: Date.now() } };
      client.db.updateGuildSettings(member.guild.id, (current) => ({ ...current, invites: { ...current.invites, tracked } }));
      await metric(client, member.guild.id, invite.inviter.id, "invites");
    }
    await sendMemberMessage(client, member, "join");
    const settings = client.db.getGuildSettings(member.guild.id).welcome;
    if (!settings.enabled || !settings.channelId) return;
    const channel = member.guild.channels.cache.get(settings.channelId);
    if (!channel?.isTextBased()) return;
    const message = render(settings.message, member, channel);
    const sent = await channel.send({
      content: message,
      embeds: [embed("success", "Welcome", message)],
      allowedMentions: { users: [member.id] },
    });
    if (settings.deleteAfter >= 0) setTimeout(() => sent.delete().catch(() => {}), Math.min(settings.deleteAfter, 1) * 1000);
  },
};
