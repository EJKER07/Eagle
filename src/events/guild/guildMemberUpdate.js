const { Events } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  name: Events.GuildMemberUpdate,
  once: false,
  async execute(client, oldMember, newMember) {
    const settings = client.db.getGuildSettings(newMember.guild.id).roleNotifications || {};
    
    if (!settings.pingRoleId || !settings.pingChannelId) return;
    
    // Check if the role was added (new member has it, old member doesn't)
    const hadRole = oldMember.roles.cache.has(settings.pingRoleId);
    const hasRole = newMember.roles.cache.has(settings.pingRoleId);
    
    if (!hadRole && hasRole) {
      // Role was just added
      const pingChannel = newMember.guild.channels.cache.get(settings.pingChannelId) || await newMember.guild.channels.fetch(settings.pingChannelId).catch(() => null);
      if (pingChannel?.isTextBased()) {
        const pingMsg = await pingChannel.send({
          content: `<@${newMember.user.id}>`,
          embeds: [embed("success", "ROLE ASSIGNED", `**${newMember.user.username}** got a role!`)],
          allowedMentions: { users: [newMember.user.id] },
        }).catch(() => {});
        // Auto-delete after 1 second
        if (pingMsg) setTimeout(() => pingMsg.delete().catch(() => {}), 1000);
      }
    }
  },
};
