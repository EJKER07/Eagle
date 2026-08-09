const units = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

function parseDuration(value, { minSeconds = 10, maxSeconds = 2592000 } = {}) {
  const input = String(value || "").trim().toLowerCase();
  const match = input.match(/^(\d+(?:\.\d+)?)(s|m|h|d|w)$/) || input.match(/^(\d+)$/);
  if (!match) throw new Error("Duration must look like 10s, 5m, 2h, 1d, or 1w.");
  const amount = Number(match[1]);
  const multiplier = match[2] ? units[match[2]] : 1;
  const seconds = Math.floor(amount * multiplier);
  if (!Number.isInteger(seconds) || seconds < minSeconds || seconds > maxSeconds) {
    throw new Error(`Duration must be between ${minSeconds} seconds and ${maxSeconds} seconds.`);
  }
  return seconds;
}

module.exports = { parseDuration };
