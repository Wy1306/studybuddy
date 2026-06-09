// 学伴内容脚本 — 注入到学习平台页面，自动提取数据
// 每个平台页面加载完成后自动执行

(async function () {
  const platform = detectPlatform();
  if (!platform) return; // 非学习平台页面，跳过

  console.log(`[StudyBuddy] 检测到平台: ${platform.name}`);

  // 动态注入平台适配器
  if (platform.adapter) {
    try {
      await injectScript(`platforms/${platform.adapter}`);
    } catch (e) {
      console.warn(`[StudyBuddy] 适配器注入失败: ${platform.adapter}`, e);
    }
  }

  // 等待页面完全渲染（SPA 平台可能需要更长时间）
  await sleep(1500);

  // 提取数据
  let data = { platform: platform.key, platformName: platform.name, url: window.location.href, title: document.title, timestamp: Date.now() };

  switch (platform.key) {
    case 'chaoxing':
      if (window.__chaoxingExtractor) {
        const ex = window.__chaoxingExtractor;
        data.courses = ex.extractCourses();
        data.assignments = ex.extractAssignments();
        data.materials = ex.extractMaterials();
        data.scores = ex.extractScores();
      }
      break;
    case 'zhidao':
      if (window.__zhidaoExtractor) {
        const ex = window.__zhidaoExtractor;
        data.courses = ex.extractCourses();
        data.assignments = ex.extractAssignments();
      }
      break;
    case 'generic':
      const generic = await getGenericData();
      data = { ...data, ...generic };
      break;
  }

  // 将数据存入 IndexedDB（扩展和 PWA 共享同一个数据库）
  try {
    await saveToDB(data);
    // 更新扩展 Badge
    chrome.runtime.sendMessage({ type: 'DATA_CAPTURED', platform: platform.name, count: (data.courses || []).length + (data.assignments || []).length });
  } catch (e) {
    console.warn('[StudyBuddy] 数据写入失败（可能 PWA 未打开过）', e.message);
  }
})();

// 通用数据提取器（兜底方案）
async function getGenericData() {
  const pageText = document.body.innerText.slice(0, 8000);
  const eduPatterns = [
    { regex: /第[一二三四五六七八九十\d]+章\s*.+/g, type: 'chapter' },
    { regex: /作业[：:]\s*.+/g, type: 'assignment' },
    { regex: /截止[日期时间]：?\s*.+/g, type: 'deadline' },
    { regex: /成绩[：:]\s*[\d.]+/g, type: 'score' },
    { regex: /课程[名称]?[：:]\s*.+/g, type: 'course' }
  ];

  const extracted = {};
  for (const pattern of eduPatterns) {
    const matches = pageText.match(pattern.regex);
    if (matches) extracted[pattern.type] = matches.slice(0, 20);
  }
  return { generic: extracted };
}

async function saveToDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('studybuddy', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      saveRecords(db, 'courses', (data.courses || []).map(c => ({ ...c, _capturedAt: data.timestamp })));
      saveRecords(db, 'assignments', (data.assignments || []).map(a => ({ ...a, _capturedAt: data.timestamp })));
      db.close();
      resolve();
    };
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('courses')) db.createObjectStore('courses', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('assignments')) db.createObjectStore('assignments', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('errors')) db.createObjectStore('errors', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('exams')) db.createObjectStore('exams', { keyPath: 'id', autoIncrement: true });
    };
  });
}

function saveRecords(db, storeName, records) {
  if (!records.length) return;
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  records.forEach(r => {
    try { store.put(r); } catch (_) {}
  });
}

function injectScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = chrome.runtime.getURL(src);
    s.onload = resolve;
    s.onerror = reject;
    (document.head || document.documentElement).appendChild(s);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
