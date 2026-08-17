const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Create a private support ticket.")
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Optional reason for opening the ticket")
        .setRequired(false),
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "This command can only be used in a server.",
        ephemeral: true,
      });
    }

    const reason = interaction.options.getString("reason") || "No reason provided.";
    const STAFF_ROLE_ID = "1534099901976416257";
    const supportRole = interaction.guild.roles.cache.get(STAFF_ROLE_ID);
    const rolesToGrantAccess = [supportRole].filter(Boolean);

    if (rolesToGrantAccess.length === 0) {
      return interaction.reply({
        content: "The configured Staff role could not be found in this server.",
        ephemeral: true,
      });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      topic: `Ticket created by ${interaction.user.id}`,
      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        },
        ...rolesToGrantAccess.map((role) => ({
          id: role.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
          ],
        })),
      ],
    });

    const staffMention = rolesToGrantAccess.map((role) => role.toString()).join(" ");

    const welcomeEmbed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Support Ticket")
      .setDescription(
        `Thanks for contacting support, ${interaction.user}.\n\n` +
          `Reason: ${reason}\n\n` +
          `${staffMention} will assist you shortly.`,
      )
      .setTimestamp();

    await channel.send({
      content: `Welcome ${interaction.user}! ${staffMention} will be with you shortly.`,
      embeds: [welcomeEmbed],
    });

    await interaction.reply({
      content: `Your ticket has been created: ${channel}`,
      ephemeral: true,
    });
  },
};
