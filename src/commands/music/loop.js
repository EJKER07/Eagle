const { SlashCommandBuilder } = require("discord.js");
const { embed } = require("../../utils/embeds");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Toggle queue loop mode.")
    .addStringOption((o) => o.setName("mode").setDescription("Loop mode").setRequired(false).addChoices(
      { name: "Off", value: "0" },
      { name: "Song", value: "1" },
      { name: "Queue", value: "2" }
    )),
  async execute(interaction, client) {
    const queue = client.distube.getQueue(interaction.guildId);
    if (!queue) return interaction.reply({ embeds: [embed("error", "No queue", "Nothing is playing.")] });
    const mode = parseInt(interaction.options.getString("mode") || queue.repeatMode === 2 ? "0" : queue.repeatMode + 1);
    queue.setRepeatMode(mode);
    const modes = ["Off", "Song", "Queue"];
    await interaction.reply({ embeds: [embed("info", "Loop Mode", `🔁 Loop: ${modes[mode]}`)] });
  },
};
