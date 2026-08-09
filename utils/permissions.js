const { PermissionsBitField } = require('discord.js');

function normalizePermissions(input) {
    if (!input) return [];
    if (Array.isArray(input)) return input.map((permission) => String(permission));
    return [String(input)];
}

const checkPermissions = (member, permissions) => {
    if (!member || !member.permissions) return false;
    const required = normalizePermissions(permissions);
    return required.every((permission) => member.permissions.has(permission));
};

const checkBotPermissions = (member, permissions) => {
    if (!member || !member.permissions) return false;
    const required = normalizePermissions(permissions);
    return required.every((permission) => member.permissions.has(permission));
};

const hasAdminRole = (member) => {
    return !!member && !!member.roles && member.roles.cache.some(role => role.name === 'Admin');
};

const isBotHigher = (member, bot) => {
    return !!member && !!bot && member.roles.highest.position < bot.roles.highest.position;
};

const isOwner = (member, guild) => {
    return !!member && !!guild && member.id === guild.ownerId;
};

module.exports = {
    checkPermissions,
    checkBotPermissions,
    hasAdminRole,
    isBotHigher,
    isOwner,
    PermissionsBitField,
};