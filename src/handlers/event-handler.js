const fs = require("node:fs");
const path = require("node:path");

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(file) : [file];
  });
}

function loadEvents(client, directory) {
  const files = filesIn(directory).filter((file) => file.endsWith(".js")).sort();
  const registered = new Set();
  for (const file of files) {
    const event = require(file);
    if (!event.name || typeof event.once !== "boolean" || typeof event.execute !== "function") {
      throw new Error(`Invalid event module: ${file}`);
    }
    if (registered.has(event.name)) throw new Error(`Duplicate event listener: ${event.name}`);
    registered.add(event.name);
    client[event.once ? "once" : "on"](event.name, async (...args) => {
      try {
        await event.execute(client, ...args);
      } catch (error) {
        console.error(`Event ${event.name} failed`, error);
      }
    });
  }
  console.log(`Loaded ${registered.size} event listener(s).`);
}

module.exports = { loadEvents };
