document.addEventListener('DOMContentLoaded', async () => {
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

  // 从 chrome.storage.local 读数据
  chrome.storage.local.get(['data_courses', 'data_assignments', 'lastCapture'], (data) => {
    var courses = data.data_courses || [];
    var assignments = data.data_assignments || [];
    document.getElementById('courseCount').textContent = courses.length;
    document.getElementById('assignmentCount').textContent = assignments.length;

    const last = data.lastCapture;
    if (last && last.time > 0) {
      const time = new Date(last.time).toLocaleTimeString();
      document.getElementById('lastCapture').textContent = `${last.platform} · +${last.count}条 · ${time}`;
      document.getElementById('lastCapture').className = 'status-value success';
    }
  });

  // 打开 PWA 控制台
  document.getElementById('openApp').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('app/index.html') });
  });

  // 手动刷新
  document.getElementById('manualCapture').addEventListener('click', () => {
    const btn = document.getElementById('manualCapture');
    btn.textContent = '⏳ 刷新中...';
    btn.disabled = true;
    chrome.storage.local.get(['data_courses', 'data_assignments', 'lastCapture'], (data) => {
      var courses = data.data_courses || [];
      var assignments = data.data_assignments || [];
      document.getElementById('courseCount').textContent = courses.length;
      document.getElementById('assignmentCount').textContent = assignments.length;
      const last = data.lastCapture;
      if (last) {
        document.getElementById('lastCapture').textContent = `${last.platform} · +${last.count}条 · ${new Date(last.time).toLocaleTimeString()}`;
        document.getElementById('lastCapture').className = 'status-value success';
      }
      btn.textContent = '✅ 已刷新';
      setTimeout(() => { btn.textContent = '🔄 刷新统计'; btn.disabled = false; }, 2000);
    });
  });
});
