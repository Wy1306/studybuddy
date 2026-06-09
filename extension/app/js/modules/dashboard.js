// 仪表盘 — 简洁总览，不堆空卡片

const Dashboard = {
  async render(container) {
    container.innerHTML = '<div class="loading-spinner">加载中...</div>';

    try {
      const [courses, assignments, notes] = await Promise.all([
        DB.getAll('courses').catch(() => []),
        DB.getAll('assignments').catch(() => []),
        DB.getAll('notes').catch(() => [])
      ]);

      const pending = (assignments || []).filter(a => a.status === 'pending')
        .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''));
      const hasData = (courses || []).length > 0 || pending.length > 0 || (notes || []).length > 0;

      container.innerHTML = `
        <div class="stats-bar">
          <div class="stat-card"><div class="stat-num">${(courses||[]).length}</div><div class="stat-label">课程</div></div>
          <div class="stat-card"><div class="stat-num">${pending.length}</div><div class="stat-label">待交作业</div></div>
          <div class="stat-card"><div class="stat-num">${(notes||[]).length}</div><div class="stat-label">笔记</div></div>
        </div>

        ${hasData ? `
          ${(courses||[]).length > 0 ? this.coursesCompact(courses) : ''}
          ${pending.length > 0 ? this.ddlCompact(pending) : ''}
        ` : this.emptyGuide()}

        <div class="quick-bar">
          <button class="quick-chip" onclick="App.navigate('notes')">📝 生成笔记</button>
          <button class="quick-chip" onclick="App.navigate('errors')">🎯 错题诊断</button>
          <button class="quick-chip" onclick="App.navigate('resume')">📄 写简历</button>
          <button class="quick-chip" onclick="App.navigate('interview')">🎤 模拟面试</button>
          <button class="quick-chip" onclick="App.navigate('career')">💼 就业分析</button>
        </div>
      `;

    } catch (err) {
      container.innerHTML = `<div class="empty-state"><p>加载失败: ${err.message}</p></div>`;
    }
  },

  coursesCompact(courses) {
    return `
      <div class="card">
        <h3>📚 课程</h3>
        <div class="course-chips">
          ${courses.slice(0, 5).map(c => `
            <span class="chip" onclick="App.navigate('courses')">${escapeHtml(c.courseName)}</span>
          `).join('')}
          ${courses.length > 5 ? `<span class="chip">+${courses.length-5}</span>` : ''}
        </div>
      </div>`;
  },

  ddlCompact(pending) {
    return `
      <div class="card">
        <h3>⏰ 即将截止</h3>
        <div class="ddl-list">
          ${pending.slice(0, 4).map(a => `
            <div class="ddl-item"><span>${escapeHtml(a.title)}</span><span class="text-dim">${escapeHtml(a.deadline||'')}</span></div>
          `).join('')}
        </div>
      </div>`;
  },

  emptyGuide() {
    return `
      <div class="empty-state">
        <div class="empty-icon">🦉</div>
        <h3>欢迎使用学伴</h3>
        <p>安装扩展后，打开学习通 / 知到，<br>课程和作业会自动同步到这里。</p>
        <p class="text-dim" style="font-size:12px;margin-top:8px">
          扩展位置：<code>C:\\Users\\44986\\Desktop\\studybuddy\\extension</code><br>
          Chrome → chrome://extensions → 加载已解压的扩展程序
        </p>
      </div>`;
  }
};
