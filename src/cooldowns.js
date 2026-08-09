class Cooldowns {
  constructor() {
    this.entries = new Map();
  }

  remaining(key, durationMs) {
    const expires = this.entries.get(key) || 0;
    return Math.max(0, expires - Date.now());
  }

  set(key, durationMs) {
    this.entries.set(key, Date.now() + durationMs);
  }

  clear(key) {
    this.entries.delete(key);
  }
}

module.exports = { Cooldowns };
