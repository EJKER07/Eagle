function isValidUserId(userId) {
    return typeof userId === 'string' && userId.match(/^\d{17,19}$/);
}

function isValidChannelId(channelId) {
    return typeof channelId === 'string' && channelId.match(/^\d{17,19}$/);
}

function isValidRoleId(roleId) {
    return typeof roleId === 'string' && roleId.match(/^\d{17,19}$/);
}

function isValidReason(reason) {
    return typeof reason === 'string' && reason.length <= 512;
}

function isValidTime(time) {
    return !isNaN(new Date(time).getTime());
}

module.exports = {
    isValidUserId,
    isValidChannelId,
    isValidRoleId,
    isValidReason,
    isValidTime,
};