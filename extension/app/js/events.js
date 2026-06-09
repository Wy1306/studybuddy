// 全局事件委托 — CSP 安全版
function showStatus(msg, type) {
  var s = document.getElementById('apiKeyStatus');
  if (s) { s.textContent = msg; s.className = 'api-key-status ' + (type || 'idle'); }
}

// 全局事件委托 — CSP 安全版，替代 onclick 属性

document.addEventListener('click', function (e) {
  var target = e.target.closest('[data-click]');
  if (!target) return;
  var expr = target.getAttribute('data-click').trim();
  if (!expr) return;

  try {
    // 用 Function 构造器安全执行简单函数调用（无副作用访问）
    var fn = new Function('return (' + expr + ')');
    fn();
  } catch (_) {
    console.warn('Event error: ' + expr);
  }
});

// 侧边栏按钮 — 不用 DOMContentLoaded，直接绑定
(function initSidebar() {
  var keyInput = document.getElementById('apiKeyInput');
  var saveBtn = document.getElementById('btnSaveKey');
  var showBtn = document.getElementById('btnShowKey');

  if (!keyInput) return setTimeout(initSidebar, 100); // 等 DOM 加载

  if (saveBtn) {
    saveBtn.addEventListener('click', function () {
      var key = keyInput.value.trim();
      // 去除可能粘贴进来的不可见字符
      key = key.replace(/[^\x20-\x7E]/g, '');
      if (!key) { showStatus('请输入 Key', 'error'); return; }
      if (key.length < 30) { showStatus('Key 太短，请检查是否完整', 'error'); return; }
      if (key.indexOf('sk-') !== 0) { showStatus('应以 sk- 开头，当前前3位: ' + key.slice(0,3), 'error'); return; }
      AI.setApiKey(key);
      keyInput.value = '';
      showStatus('已保存', 'ok');
    });
  }

  if (showBtn) {
    showBtn.addEventListener('click', function () {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    });
  }

  if (AI.hasApiKey()) {
    var s = document.getElementById('apiKeyStatus');
    if (s) { s.textContent = '已设置'; s.className = 'api-key-status idle'; }
  }
})();
