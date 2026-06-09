// 扩展版存储层 — 直接从 chrome.storage.local 读写
// 数据由 content-script 抓取、background 合并去重

const DB = {
  async get(store) {
    var key = 'data_' + store;
    return new Promise(function (resolve) {
      chrome.storage.local.get([key], function (result) {
        resolve(result[key] || []);
      });
    });
  },

  async put(store, records) {
    var key = 'data_' + store;
    return new Promise(function (resolve) {
      var obj = {};
      obj[key] = records;
      chrome.storage.local.set(obj, function () { resolve(); });
    });
  },

  async remove(store, id) {
    var records = await this.get(store);
    records = records.filter(function (r) { return r.id !== id; });
    await this.put(store, records);
  },

  async count(store) {
    var records = await this.get(store);
    return records.length;
  },

  // 兼容旧 API
  getAll: async function (store) { return this.get(store); },
  getById: async function (store, id) {
    var records = await this.get(store);
    return records.find(function (r) { return r.id === id; }) || null;
  }
};
