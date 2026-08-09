const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder().setName("help").setDescription("Browse Eagle Premium commands."),
  aliases: ["h"],
  async execute(interaction, client) {
    const groups = {};
    for (const command of client.commands.values()) {
      const group = command.category || "Utility";
      (groups[group] ||= []).push(`\`/${command.data.name}\` — ${command.data.description}`);
    }
    const fields = Object.entries(groups).map(([name, commands]) => ({ name, value: commands.join("\n").slice(0, 1024) }));
    await interaction.reply({ embeds: [embed("info", "Eagle Premium command center", "Premium tools, isolated per guild, with permission-safe execution.", fields)] });
  },
};
