const fs = require("node:fs");
const path = require("node:path");

function filesIn(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(fullPath) : [fullPath];
  });
}

function loadEvents(client) {
  const names = new Set();
  const directory = path.join(__dirname, "..", "events");
  for (const file of filesIn(directory).filter((item) => item.endsWith(".js"))) {
    const event = require(file);
    if (!event?.name || typeof event.execute !== "function") {
      throw new Error(`Invalid event module: ${file}`);
    }
    if (names.has(event.name)) throw new Error(`Duplicate event name: ${event.name}`);
    names.add(event.name);
    const handler = async (...args) => {
      try {
        await event.execute(client, ...args);
      } catch (error) {
        console.error(`Event ${event.name} failed: ${error.stack || error}`);
        const interaction = args.find((arg) => arg?.isRepliable?.());
        if (interaction && !interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: "Something went wrong while processing that action.", ephemeral: true }).catch(() => {});
        }
      }
    };
    client[event.once ? "once" : "on"](event.name, handler);
  }
  console.log(`Loaded ${names.size} production event(s).`);
}

module.exports = { loadEvents };
