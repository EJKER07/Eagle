const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { componentEmoji } = require("../../utils/emojis");
module.exports = {
  data: new SlashCommandBuilder().setName("afk").setDescription("Set your server-specific AFK status.").addStringOption((o) => o.setName("reason").setDescription("Reason").setRequired(false)),
  async execute(interaction, client) { const reason = interaction.options.getString("reason") || "AFK"; client.db.setAfk(interaction.guildId, interaction.user.id, reason); await interaction.reply({ embeds: [embed("info", "AFK enabled", `I will let members know you are AFK: **${reason}**`)], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`afk:dm-toggle:${interaction.user.id}`).setLabel("Toggle mention DMs").setEmoji(componentEmoji("afk")).setStyle(ButtonStyle.Secondary))] }); },
};
