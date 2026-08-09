const { Events } = require("discord.js");
const { deployCommands } = require("../../services/commandDeployment");
const { scheduleAll } = require("../../services/giveawayService");
const { refreshInviteSnapshot } = require("../../services/communityService");
const { formatDeploymentError } = require("../../services/commandDeployment");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`Logged in as ${client.user.tag}.`);
    scheduleAll(client);
    await Promise.all([...client.guilds.cache.values()].map((guild) => refreshInviteSnapshot(client, guild)));
    try {
      await deployCommands(client);
    } catch (error) {
      console.error("Slash command deployment failed:");
      console.error(formatDeploymentError(error));
    }
  },
};
