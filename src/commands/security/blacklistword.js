const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("blacklistword").setDescription("Add or remove a word from AutoMod filtering.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((o) => o.setName("action").setDescription("Add or remove").setRequired(true).addChoices({ name: "Add", value: "add" }, { name: "Remove", value: "remove" }))
    .addStringOption((o) => o.setName("word").setDescription("Word to filter").setRequired(true)),
  permissions: [PermissionFlagsBits.ManageGuild],
  async execute(interaction, client) {
    try {
      const word = interaction.options.getString("word", true).trim().toLowerCase();
      if (!/^[\p{L}\p{N}_-]{2,40}$/u.test(word)) return interaction.reply({ embeds: [embed("error", "Invalid word", "Use a single word or safe word pattern.")] });
      const action = interaction.options.getString("action", true);
      const settings = client.db.updateGuildSettings(interaction.guildId, (current) => {
        const words = new Set(current.automod.blacklistWords || []);
        if (action === "add") words.add(word); else words.delete(word);
        return { ...current, automod: { ...current.automod, blacklistWords: [...words] } };
      });
      await interaction.reply({ embeds: [embed("security", "Automod Words Updated", `Filtering list contains **${settings.automod.blacklistWords.length}** word(s).`)] });
    } catch (error) {
      await interaction.reply({ embeds: [embed("error", "Blacklist update failed", error.message)] });
    }
  },
};