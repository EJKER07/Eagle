const fs = require("fs");
const path = require("path");

const afkFilePath = path.join(__dirname, "..", "data", "afk.json");

function ensureAFKFile() {
    const dir = path.dirname(afkFilePath);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    if (!fs.existsSync(afkFilePath)) {
        fs.writeFileSync(afkFilePath, JSON.stringify({}, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(afkFilePath, "utf8"));
    } catch {
        fs.writeFileSync(afkFilePath, JSON.stringify({}, null, 2));
        return {};
    }
}

function readAFKData() {
    return ensureAFKFile();
}

function saveAFKData(data) {
    fs.writeFileSync(afkFilePath, JSON.stringify(data, null, 2));
}

function getAFKData(userId, guildId) {
    const data = readAFKData();

    if (!data[guildId]) return null;
    if (!data[guildId][userId]) return null;

    return data[guildId][userId];
}

function setAFKUser(userId, guildId, details = {}) {

    console.log("========== setAFKUser CALLED ==========");
    console.log(details);

    const data = readAFKData();

    if (!data[guildId]) {
        data[guildId] = {};
    }

    data[guildId][userId] = {
        reason: details.reason || "No reason provided",
        startedAt: details.startedAt || Date.now(),
        guildId,
        userId,
        enabled: Boolean(details.enabled),
        pending: Boolean(details.pending),
        dmOnMention: Boolean(details.dmOnMention),
    };

    console.log("Saving:");

    console.log(data[guildId][userId]);

    saveAFKData(data);

    console.log("Saved File:");

    console.log(JSON.stringify(readAFKData(), null, 2));

    return data[guildId][userId];
}

function removeAFKUser(userId, guildId) {
    const data = readAFKData();

    if (!data[guildId]) return;

    delete data[guildId][userId];

    if (Object.keys(data[guildId]).length === 0) {
        delete data[guildId];
    }

    saveAFKData(data);
}

module.exports = {
    afkFilePath,
    ensureAFKFile,
    readAFKData,
    saveAFKData,
    getAFKData,
    setAFKUser,
    removeAFKUser,
};