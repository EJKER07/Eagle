const fs = require('node:fs/promises');
const path = require('node:path');

class JsonStore {
  constructor(filePath, defaults = {}) {
    this.filePath = filePath;
    this.defaults = structuredClone(defaults);
    this.data = structuredClone(defaults);
    this.loaded = false;
  }

  async load() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      this.data = { ...structuredClone(this.defaults), ...JSON.parse(raw) };
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error(`Could not load ${this.filePath}: ${error.message}`);
    }
    this.loaded = true;
    return this.data;
  }

  get(key, fallback) {
    if (!this.loaded) throw new Error('JsonStore must be loaded before use');
    return this.data[key] === undefined ? fallback : this.data[key];
  }

  set(key, value) {
    if (!this.loaded) throw new Error('JsonStore must be loaded before use');
    this.data[key] = value;
    return value;
  }

  snapshot() {
    return structuredClone(this.data);
  }

  async flush() {
    if (!this.loaded) throw new Error('JsonStore must be loaded before flush');
    const temporary = `${this.filePath}.${process.pid}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(this.data, null, 2)}\n`, 'utf8');
    await fs.rename(temporary, this.filePath);
  }
}

module.exports = { JsonStore };
