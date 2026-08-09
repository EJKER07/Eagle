const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "data", "antiNuke.json");

function ensureFile() {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify({}, null, 2));
    }

    try {
        return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch {
        fs.writeFileSync(file, JSON.stringify({}, null, 2));
        return {};
    }
}

function save(data) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function getGuild(guildId) {
    const data = ensureFile();

    if (!data[guildId]) {
        data[guildId] = {
            enabled: false,
            punishment: "ban",
            whitelist: [],
            limits: {
                channelDelete: 3,
                channelCreate: 5,
                roleDelete: 3,
                roleCreate: 5,
                roleUpdate: 5,
                memberBan: 3,
                memberKick: 3,
                webhookCreate: 2,
                emojiDelete: 5
            }
        };

        save(data);
    }

    return data[guildId];
}

function setGuild(guildId, config) {
    const data = ensureFile();

    data[guildId] = {
        ...getGuild(guildId),
        ...config
    };

    save(data);
}

function addWhitelist(guildId, userId) {
    const guild = getGuild(guildId);

    if (!guild.whitelist.includes(userId)) {
        guild.whitelist.push(userId);
    }

    setGuild(guildId, guild);
}

function removeWhitelist(guildId, userId) {
    const guild = getGuild(guildId);

    guild.whitelist = guild.whitelist.filter(id => id !== userId);

    setGuild(guildId, guild);
}

function isWhitelisted(guildId, userId) {
    return getGuild(guildId).whitelist.includes(userId);
}

module.exports = {
    getGuild,
    setGuild,
    addWhitelist,
    removeWhitelist,
    isWhitelisted
};