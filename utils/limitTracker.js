// Rate limit tracker map
const tracker = new Map();

/**
 * Check if an executor has exceeded action limit
 * @param {string} executorId 
 * @param {string} actionType 
 * @param {number} limit 
 * @param {number} timeFrameMs 
 * @returns {boolean} true if limit exceeded
 */
function isLimitExceeded(executorId, actionType, limit, timeFrameMs = 10000) {
    const key = `${executorId}:${actionType}`;
    const now = Date.now();

    if (!tracker.has(key)) {
        tracker.set(key, []);
    }

    const timestamps = tracker.get(key).filter(time => now - time < timeFrameMs);
    timestamps.push(now);
    tracker.set(key, timestamps);

    return timestamps.length > limit;
}

module.exports = { isLimitExceeded };