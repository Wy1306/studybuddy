// 弹窗逻辑 — 读取抓取状态、打开控制台、触发手动抓取

document.addEventListener('DOMContentLoaded', async () => {
  // 读取当前激活标签页的 URL，判断平台
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  const platformMap = {
    'chaoxing.com': '学习通',
    'zhihuishu.com': '知到（智慧树）',
    'xuexi.cn': '学习强国'
  };

  let detected = null;
  for (const [domain, name] of Object.entries(platformMap)) {
    if (url.includes(domain)) { detected = name; break; }
  }
  document.getElementById('currentPlatform').textContent = detected || '非学习平台';
  document.getElementById('currentPlatform').className = detected ? 'status-value success' : 'status-value idle';

  // 读取最近的抓取记录
  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (data) => {
    if (data && data.time > 0) {
      const time = new Date(data.time).toLocaleTimeString();
      document.getElementById('lastCapture').textContent = `${data.platform} · +${data.count}条 · ${time}`;
      document.getElementById('lastCapture').className = 'status-value success';
    }
  });

  // 读取 IndexedDB 统计
  try {
    const dbData = await getDBStats();
    document.getElementById('courseCount').textContent = dbData.courses || 0;
    document.getElementById('assignmentCount').textContent = dbData.assignments || 0;
  } catch (_) {}

  // 打开 PWA 控制台
  document.getElementById('openApp').addEventListener('click', (e) => {
    e.preventDefault();
    // PWA 部署地址（后续改为 Vercel 生产地址）
    chrome.tabs.create({ url: 'http://localhost:3000' });
  });

  // 手动抓取
  document.getElementById('manualCapture').addEventListener('click', async () => {
    const btn = document.getElementById('manualCapture');
    btn.textContent = '⏳ 正在抓取...';
    btn.disabled = true;
    try {
      await chrome.tabs.sendMessage(tab.id, { type: 'MANUAL_CAPTURE' });
      btn.textContent = '✅ 抓取完成';
      setTimeout(() => { btn.textContent = '🔄 手动抓取当前页面'; btn.disabled = false; }, 2000);
    } catch (_) {
      btn.textContent = '⚠️ 请在当前页面刷新后重试';
      setTimeout(() => { btn.textContent = '🔄 手动抓取当前页面'; btn.disabled = false; }, 2000);
    }
  });
});

function getDBStats() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('studybuddy', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const stats = {};
      let pending = 0;
      ['courses', 'assignments'].forEach(name => {
        if (db.objectStoreNames.contains(name)) {
          pending++;
          const tx = db.transaction(name, 'readonly');
          tx.objectStore(name).count().onsuccess = (e) => {
            stats[name] = e.target.result;
            pending--;
            if (pending === 0) { db.close(); resolve(stats); }
          };
        }
      });
      if (pending === 0) { db.close(); resolve(stats); }
    };
  });
}
