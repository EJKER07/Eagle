function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

function seededInt(seed, min, max) {
  const safeSeed = String(seed ?? "default");
  const value = hashString(safeSeed);
  return min + (value % (max - min + 1));
}

function getLevelThreshold(level, seed) {
  if (level <= 0) return 0;
  if (level === 1) return 50;
  const base = (level - 1) * 100;
  const range = seededInt(`${seed}:${level}`, 0, 50);
  return base + range;
}

function getCumulativeThreshold(level, seed) {
  let total = 0;
  for (let current = 1; current <= level; current += 1) {
    total += getLevelThreshold(current, seed);
  }
  return total;
}

function getLevelInfo(totalXp, seed) {
  let xp = 0;
  let currentLevel = 0;

  for (let level = 1; ; level += 1) {
    const threshold = getLevelThreshold(level, seed);
    const nextTotal = xp + threshold;
    if (totalXp < nextTotal) {
      return {
        level: currentLevel,
        xp: totalXp - xp,
        requiredXp: threshold,
        nextLevelAt: nextTotal,
      };
    }
    xp = nextTotal;
    currentLevel = level;
  }
}

function addXpToUser(guildId, userId, amount, options = {}) {
  const seed = `${guildId}:${userId}`;
  const current = options.current || { xp: 0, level: 0 };
  const nextXp = (current.xp || 0) + Math.max(0, Number(amount) || 0);
  const info = getLevelInfo(nextXp, seed);
  return {
    xp: nextXp,
    level: info.level,
    requiredXp: info.requiredXp,
    nextLevelAt: info.nextLevelAt,
    previousLevel: current.level || 0,
  };
}

function getVoiceXpForSeconds(seconds, seed) {
  const minutes = Math.max(0, Math.floor(seconds / 60));
  if (minutes <= 0) return 0;
  const perMinute = seededInt(`${seed}:voice`, 8, 15);
  return minutes * perMinute;
}

module.exports = {
  hashString,
  seededInt,
  getLevelThreshold,
  getCumulativeThreshold,
  getLevelInfo,
  addXpToUser,
  getVoiceXpForSeconds,
};
