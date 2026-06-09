// 学伴内容脚本 — 所有适配器在同作用域中，直接调用
// 每个学习平台页面加载完成后自动执行

(async function () {
  const platform = detectPlatform();
  if (!platform) return;

  console.log(`[StudyBuddy] 检测到平台: ${platform.name}`);
  await sleep(1500); // 等待页面完全渲染

  let data = {
    platform: platform.key,
    platformName: platform.name,
    url: window.location.href,
    title: document.title,
    timestamp: Date.now()
  };

  switch (platform.key) {
    case 'chaoxing':
      if (typeof ChaoxingExtractor !== 'undefined') {
        const ex = ChaoxingExtractor;
        data.courses = ex.extractCourses();
        data.assignments = ex.extractAssignments();
        data.materials = ex.extractMaterials();
        data.scores = ex.extractScores();
      }
      break;
    case 'zhidao':
      if (typeof ZhidaoExtractor !== 'undefined') {
        const ex = ZhidaoExtractor;
        data.courses = ex.extractCourses();
        data.assignments = ex.extractAssignments();
      }
      break;
    case 'xuexiqiangguo':
      if (typeof XuexiqiangguoExtractor !== 'undefined') {
        const ex = XuexiqiangguoExtractor;
        data.courses = ex.extractArticles().map((a, i) => ({
          id: 'xx_' + i, platform: 'xuexiqiangguo', courseName: a.title, courseUrl: a.url, teacher: '', semester: '', materials: [], fetchedAt: Date.now()
        }));
      }
      break;
    case 'generic':
      if (typeof GenericExtractor !== 'undefined') {
        const gen = GenericExtractor.extract();
        data.courses = gen.courses || [];
        data.assignments = gen.assignments || [];
        data.detectedContent = gen.detectedContent || [];
      }
      break;
  }

  const totalItems = (data.courses || []).length + (data.assignments || []).length;
  if (totalItems === 0) {
    console.log('[StudyBuddy] 未检测到可提取的学习内容（页面可能需要登录后才有数据）');
    return;
  }

  try {
    await saveToDB(data);
    chrome.runtime.sendMessage({
      type: 'DATA_CAPTURED',
      platform: platform.name,
      count: totalItems
    });
    console.log(`[StudyBuddy] 数据已写入: ${(data.courses || []).length}门课程, ${(data.assignments || []).length}份作业`);
  } catch (e) {
    console.warn('[StudyBuddy] 数据写入失败', e.message);
  }
})();

async function saveToDB(data) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('studybuddy', 2);
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
      const stores = ['courses', 'assignments', 'notes', 'profile', 'errors', 'exams', 'projects', 'resume', 'interviews', 'career'];
      stores.forEach(name => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'id', autoIncrement: ['notes','errors','exams','projects','resume','interviews','career'].includes(name) });
        }
      });
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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
