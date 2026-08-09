const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { parseDuration } = require("../../utils/duration");
const { activeEmbed, giveawayComponents, finishGiveaway, scheduleGiveaway } = require("../../services/giveawayService");

module.exports = {
  data: new SlashCommandBuilder().setName("giveaway").setDescription("Create and manage server giveaways.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) => sub.setName("create").setDescription("Create a giveaway.")
      .addStringOption((option) => option.setName("prize").setDescription("What people can win").setRequired(true))
      .addStringOption((option) => option.setName("duration").setDescription("Examples: 1s, 1m, 1h, 1d, 1w").setRequired(true))
      .addIntegerOption((option) => option.setName("winners").setDescription("Number of winners").setMinValue(1).setMaxValue(20).setRequired(false))
      .addChannelOption((option) => option.setName("channel").setDescription("Giveaway channel").addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand((sub) => sub.setName("end").setDescription("End a giveaway immediately.").addStringOption((option) => option.setName("id").setDescription("Giveaway message ID").setRequired(true)))
    .addSubcommand((sub) => sub.setName("reroll").setDescription("Choose new winners for an ended giveaway.").addStringOption((option) => option.setName("id").setDescription("Giveaway message ID").setRequired(true))),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    const action = interaction.options.getSubcommand();
    const giveaways = client.db.getGiveaways(interaction.guildId);
    const id = interaction.options.getString("id");
    if (action === "create") {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      const duration = parseDuration(interaction.options.getString("duration", true));
      const giveaway = { id: `${interaction.guildId}-${Date.now()}`, guildId: interaction.guildId, channelId: channel.id, messageId: null, hostId: interaction.user.id, hostAvatarUrl: interaction.user.displayAvatarURL({ size: 256 }), prize: interaction.options.getString("prize", true), winnerCount: interaction.options.getInteger("winners") || 1, endsAt: Date.now() + duration * 1000, entries: [], ended: false };
      const customEmoji = interaction.guild?.emojis.cache.find((item) => item.name === "Fire_money");
      const prizeEmoji = interaction.guild?.emojis.cache.find((item) => item.name === "coleader") || "🎁";
      const reactionEmoji = customEmoji || "🎉";
      const announcementEmoji = interaction.guild?.emojis.cache.find((item) => item.name === "ANNOUNCE") || "🎉";
      const message = await channel.send({ embeds: [activeEmbed(giveaway, reactionEmoji, prizeEmoji, announcementEmoji)], components: giveawayComponents(giveaway.id) });
      await message.react(reactionEmoji).catch(() => {});
      giveaway.messageId = message.id;
      client.db.saveGiveaway(interaction.guildId, giveaway);
      scheduleGiveaway(client, giveaway);
      await interaction.reply({ embeds: [embed("success", "Giveaway created", `Your giveaway is live in ${channel}.`)], ephemeral: true });
      return;
    }
    const giveaway = giveaways.find((item) => item.messageId === id);
    if (!giveaway) throw new Error("That giveaway could not be found.");
    if (action === "end") {
      if (giveaway.ended) throw new Error("That giveaway has already ended.");
      await finishGiveaway(client, giveaway);
      await interaction.reply({ embeds: [embed("success", "Giveaway ended", "New winners were selected.")], ephemeral: true });
      return;
    }
    if (!giveaway.ended) throw new Error("End the giveaway before rerolling it.");
    await finishGiveaway(client, { ...giveaway, ended: false });
    await interaction.reply({ embeds: [embed("success", "Giveaway rerolled", "New winners were selected.")], ephemeral: true });
  },
};