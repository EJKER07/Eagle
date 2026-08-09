const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { embed } = require("../../utils/embeds");
const { componentEmoji, emoji } = require("../../utils/emojis");
module.exports = {
  data: new SlashCommandBuilder().setName("poll").setDescription("Create a simple button poll.").addStringOption((o) => o.setName("question").setDescription("Question").setRequired(true)),
  aliases: ["cpoll", "createpoll", "endpoll", "epoll"],
  async execute(interaction) { const question = interaction.options.getString("question"); await interaction.reply({ embeds: [embed("info", "Poll", question, [{ name: "Results", value: `${emoji("yes")} 0 yes\n${emoji("no")} 0 no` }])], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("poll:yes").setLabel("Yes").setEmoji(componentEmoji("yes")).setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("poll:no").setLabel("No").setEmoji(componentEmoji("no")).setStyle(ButtonStyle.Danger))] }); },
};
