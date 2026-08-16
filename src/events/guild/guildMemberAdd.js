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
    const settings = client.db.getGuildSettings(member.guild.id);
    
    // Send join ping notification
    const joinNotifications = settings.joinNotifications || {};
    if (joinNotifications.pingChannelId) {
      const pingChannel = member.guild.channels.cache.get(joinNotifications.pingChannelId) || await member.guild.channels.fetch(joinNotifications.pingChannelId).catch(() => null);
      if (pingChannel?.isTextBased()) {
        const pingMsg = await pingChannel.send({
          embeds: [embed("info", "MEMBER JOINED", `${member} **${member.user.username}** joined the server!`)],
        }).catch(() => {});
        // Auto-delete after 1 second
        if (pingMsg) setTimeout(() => pingMsg.delete().catch(() => {}), 1000);
      }
    }
    
    // Send welcome message
    const welcomeSettings = settings.welcome;
    if (!welcomeSettings.enabled || !welcomeSettings.channelId) return;
    const channel = member.guild.channels.cache.get(welcomeSettings.channelId);
    if (!channel?.isTextBased()) return;
    const message = render(welcomeSettings.message, member, channel);
    const sent = await channel.send({
      content: message,
      embeds: [embed("success", "Welcome", message)],
      allowedMentions: { users: [member.id] },
    });
    if (welcomeSettings.deleteAfter >= 0) setTimeout(() => sent.delete().catch(() => {}), Math.min(welcomeSettings.deleteAfter, 1) * 1000);
  },
};
