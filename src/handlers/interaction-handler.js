const { executeCommand } = require("./command-handler");

async function handleInteraction(interaction, client) {
  if (interaction.isChatInputCommand()) return executeCommand(client, interaction);
  if (interaction.isStringSelectMenu() && interaction.customId === "firstlight-help-category") {
    await interaction.update({
      content: `Category selected: **${interaction.values[0]}**`,
      components: interaction.message.components,
    });
  }
}

module.exports = { handleInteraction };
