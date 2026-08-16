const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

function parseEmoji(value) {
  const match = value.match(/^<(a?):([\w~]+):(\d+)>$/);
  if (match) return { name: match[2], url: `https://cdn.discordapp.com/emojis/${match[3]}.${match[1] ? "gif" : "png"}` };
  if (/^https?:\/\//i.test(value)) return { name: null, url: value };
  return null;
}

module.exports = {
  data: new SlashCommandBuilder().setName("stealemoji").setDescription("Copy a custom emoji into this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
    .addStringOption((option) => option.setName("emoji").setDescription("Custom emoji markup or image URL").setRequired(true))
    .addStringOption((option) => option.setName("name").setDescription("Name for the copied emoji").setRequired(false)),
  permissions: [PermissionFlagsBits.ManageEmojisAndStickers],
  async execute(interaction) {
    try {
      const source = parseEmoji(interaction.options.getString("emoji", true));
      if (!source) return interaction.reply({ embeds: [embed("error", "Invalid emoji", "Provide a custom emoji such as `<:name:id>` or a direct emoji image URL.")] });
      const name = (interaction.options.getString("name") || source.name || "stolen_emoji").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 32);
      const emoji = await interaction.guild.emojis.create({ attachment: source.url, name, reason: `Copied by ${interaction.user.tag}` });
      await interaction.reply({ embeds: [embed("success", "EMOJI ADDED", `${emoji} **${emoji.name}** is now available in this server.`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Emoji copy failed", error.message)] });
    }
  },
};