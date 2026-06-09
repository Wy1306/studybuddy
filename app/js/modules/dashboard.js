// 仪表盘模块 — 学习数据总览
// 显示课程卡片、作业DDL、最近活动、快速入口

const Dashboard = {
  async render(container) {
    container.innerHTML = '<div class="loading-spinner">加载中...</div>';

    try {
      const [courses, assignments, notes] = await Promise.all([
        DB.getAll('courses').catch(() => []),
        DB.getAll('assignments').catch(() => []),
        DB.getAll('notes').catch(() => [])
      ]);

      const pendingAssignments = (assignments || [])
        .filter(a => a.status === 'pending')
        .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));

      const recentNotes = (notes || [])
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);

      container.innerHTML = `
        <div class="dashboard-grid">
          ${this.renderStats(courses, assignments, notes)}
          ${this.renderCourses(courses)}
          ${this.renderDDL(pendingAssignments)}
          ${this.renderRecentNotes(recentNotes)}
          ${this.renderQuickActions()}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>还没有数据</h3>
          <p>安装学伴浏览器扩展后，打开学习通/知到等平台，数据会自动同步到这里。</p>
          <div class="action-buttons">
            <button class="btn-primary" onclick="App.navigate('settings')">🔧 设置指南</button>
          </div>
        </div>
      `;
    }
  },

  renderStats(courses, assignments, notes) {
    const pending = (assignments || []).filter(a => a.status === 'pending').length;
    return `
      <div class="stats-bar">
        <div class="stat-card">
          <div class="stat-num">${(courses || []).length}</div>
          <div class="stat-label">课程</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${pending}</div>
          <div class="stat-label">待完成作业</div>
        </div>
        <div class="stat-card">
          <div class="stat-num">${(notes || []).length}</div>
          <div class="stat-label">笔记</div>
        </div>
      </div>
    `;
  },

  renderCourses(courses) {
    if (!courses || !courses.length) return '<div class="card"><h3>📋 课程</h3><p class="text-dim">暂无课程数据</p></div>';
    return `
      <div class="card">
        <h3>📋 我的课程</h3>
        <div class="course-list">
          ${courses.slice(0, 6).map(c => `
            <div class="course-item" onclick="App.navigate('courses', '${c.id}')">
              <div class="course-name">${escapeHtml(c.courseName || '未命名课程')}</div>
              <div class="course-meta">${escapeHtml(c.teacher || '')} · ${escapeHtml(c.platform || '')}</div>
            </div>
          `).join('')}
        </div>
        ${courses.length > 6 ? `<p class="text-dim">还有 ${courses.length - 6} 门课程...</p>` : ''}
      </div>
    `;
  },

  renderDDL(assignments) {
    return `
      <div class="card">
        <h3>⏰ 即将截止</h3>
        ${assignments.length === 0
          ? '<p class="text-dim">暂无待完成作业 🎉</p>'
          : `<div class="ddl-list">
              ${assignments.slice(0, 5).map(a => `
                <div class="ddl-item">
                  <div class="ddl-title">${escapeHtml(a.title || '未命名作业')}</div>
                  <div class="ddl-deadline">⏰ ${escapeHtml(a.deadline || '截止日期未设置')}</div>
                </div>
              `).join('')}
            </div>`
        }
      </div>
    `;
  },

  renderRecentNotes(notes) {
    if (!notes.length) return '';
    return `
      <div class="card">
        <h3>📝 最近笔记</h3>
        <div class="note-list">
          ${notes.map(n => `
            <div class="note-item" onclick="App.navigate('notes', '${n.id}')">
              <div class="note-preview">${escapeHtml((n.aiSummary || n.rawContent || '').slice(0, 100))}</div>
              <div class="note-time">${new Date(n.createdAt).toLocaleDateString()}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderQuickActions() {
    const actions = [
      { icon: '📝', label: '生成笔记', desc: '从课件一键生成', nav: 'notes' },
      { icon: '🐛', label: '错题诊断', desc: '分析错因+同类题', nav: 'errors' },
      { icon: '📄', label: '简历生成', desc: 'AI定制简历', nav: 'resume' },
      { icon: '🎤', label: '面试模拟', desc: 'AI模拟面试官', nav: 'interview' }
    ];
    return `
      <div class="card">
        <h3>🚀 快速开始</h3>
        <div class="quick-actions">
          ${actions.map(a => `
            <button class="quick-action-btn" onclick="App.navigate('${a.nav}')">
              <span class="qa-icon">${a.icon}</span>
              <span class="qa-label">${a.label}</span>
              <span class="qa-desc">${a.desc}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }
};
