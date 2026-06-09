// 学伴 PWA 应用入口
// 路由管理、模块加载、全局状态

const App = {
  currentModule: 'dashboard',
  currentParams: null,
  modules: {},

  async init() {
    this.registerModule('dashboard', Dashboard);
    this.setupNavigation();
    this.setupApiKeyUI();
    await this.navigate('dashboard');
  },

  registerModule(name, module) {
    this.modules[name] = module;
  },

  async navigate(name, params) {
    this.currentModule = name;
    this.currentParams = params;

    // 更新侧边栏激活状态
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.nav === name);
    });

    const container = document.getElementById('mainContent');
    if (!container) return;

    const module = this.modules[name];
    if (module && module.render) {
      await module.render(container, params);
    } else {
      container.innerHTML = `<div class="empty-state"><h3>${name}</h3><p>模块开发中...</p></div>`;
    }
  },

  setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const nav = el.dataset.nav;
        if (nav) this.navigate(nav);
      });
    });
  },

  setupApiKeyUI() {
    const keyInput = document.getElementById('apiKeyInput');
    const saveBtn = document.getElementById('btnSaveKey');
    const statusEl = document.getElementById('apiKeyStatus');
    const showBtn = document.getElementById('btnShowKey');

    if (!keyInput) return;

    // 恢复已保存的 Key 状态
    if (AI.hasApiKey()) {
      if (statusEl) {
        statusEl.textContent = '已设置 ✓';
        statusEl.className = 'api-key-status ok';
      }
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        try {
          AI.setApiKey(keyInput.value.trim());
          keyInput.value = '';
          if (statusEl) {
            statusEl.textContent = '已保存 ✓';
            statusEl.className = 'api-key-status ok';
          }
          setTimeout(() => {
            if (statusEl && AI.hasApiKey()) {
              statusEl.textContent = '已设置';
              statusEl.className = 'api-key-status idle';
            }
          }, 3000);
        } catch (e) {
          if (statusEl) {
            statusEl.textContent = e.message;
            statusEl.className = 'api-key-status error';
          }
        }
      });
    }

    if (showBtn) {
      showBtn.addEventListener('click', () => {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
      });
    }
  }
};

// 启动应用
document.addEventListener('DOMContentLoaded', () => App.init());
