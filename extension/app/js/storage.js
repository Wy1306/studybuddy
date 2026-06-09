// 扩展版存储层 — 封装 chrome.storage.local
// 替代 db.js，所有数据由扩展统一管理

const DB = {
  async get(store, id) {
    return new Promise((resolve) => {
      const key = `data_${store}`;
      chrome.storage.local.get([key], (result) => {
        const records = result[key] || [];
        if (id) {
          resolve(records.find(r => r.id === id) || null);
        } else {
          resolve(records);
        }
      });
    });
  },

  async put(store, record) {
    const key = `data_${store}`;
    const current = await this.get(store);
    const idx = current.findIndex(r => r.id === record.id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...record };
    } else {
      current.push(record);
    }
    await chrome.storage.local.set({ [key]: current });
    return record.id;
  },

  async remove(store, id) {
    const key = `data_${store}`;
    const current = await this.get(store);
    const filtered = current.filter(r => r.id !== id);
    await chrome.storage.local.set({ [key]: filtered });
  },

  async clear(store) {
    await chrome.storage.local.set({ [`data_${store}`]: [] });
  },

  async count(store) {
    const records = await this.get(store);
    return records.length;
  },

  // 保持与旧 API 兼容
  async getAll(store) { return this.get(store); },
  async getById(store, id) { return this.get(store, id); },
  async putAll(store, records) {
    const key = `data_${store}`;
    await chrome.storage.local.set({ [key]: records });
  }
};
