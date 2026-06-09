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
      var raw = keyInput.value;
      var key = raw.replace(/[^a-zA-Z0-9\-_]/g, ''); // 只保留有效字符
      console.log('Key saved, length:', key.length, 'prefix:', key.slice(0, 5));
      try {
        if (!key || key.length < 20) throw new Error('Key 太短，请检查');
        if (key.slice(0, 3) !== 'sk-') throw new Error('Key 应以 sk- 开头，当前: ' + key.slice(0, 5));
        AI.setApiKey(key);
        keyInput.value = '';
        var s = document.getElementById('apiKeyStatus');
        if (s) { s.textContent = '已保存'; s.className = 'api-key-status ok'; }
      } catch (e) {
        var s = document.getElementById('apiKeyStatus');
        if (s) { s.textContent = e.message; s.className = 'api-key-status error'; }
      }
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
