// 课程管理模块 — 课表/DDL/进度总览

const Courses = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>📚 课程管理</h2>
        <p class="text-dim">从学习平台自动同步的课程、作业和考试安排</p>
      </div>
      <div id="coursesContent"><div class="loading-spinner">加载中...</div></div>
    `;

    try {
      const [courses, assignments, exams] = await Promise.all([
        DB.getAll('courses').catch(() => []),
        DB.getAll('assignments').catch(() => []),
        DB.getAll('exams').catch(() => [])
      ]);

      const content = document.getElementById('coursesContent');
      const pending = (assignments || []).filter(a => a.status === 'pending');
      const upcomingExams = (exams || []).filter(e => new Date(e.date) > new Date());

      content.innerHTML = `
        <div class="stats-bar">
          <div class="stat-card">
            <div class="stat-num">${(courses || []).length}</div>
            <div class="stat-label">总课程</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${pending.length}</div>
            <div class="stat-label">待完成作业</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">${upcomingExams.length}</div>
            <div class="stat-label">即将考试</div>
          </div>
        </div>

        ${pending.length > 0 ? `
          <div class="card">
            <h3>⏰ 待完成作业</h3>
            <div class="ddl-list">
              ${pending.slice(0, 10).map(a => `
                <div class="ddl-item">
                  <div>
                    <div class="ddl-title">${escapeHtml(a.title)}</div>
                    <div class="text-dim">${escapeHtml(a.deadline || '')}</div>
                  </div>
                  <span class="badge badge-warning">待提交</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div class="card">
          <h3>📋 全部课程</h3>
          ${(courses || []).length === 0
            ? '<p class="text-dim">暂无课程数据。安装学伴扩展后打开学习通，课程自动同步。</p>'
            : `<div class="course-grid">
                ${courses.map(c => `
                  <div class="course-card-full">
                    <div class="cc-header">
                      <span class="cc-icon">📚</span>
                      <div class="cc-title">${escapeHtml(c.courseName)}</div>
                    </div>
                    <div class="cc-body">
                      <div class="text-dim">👨‍🏫 ${escapeHtml(c.teacher || '未知教师')}</div>
                      <div class="text-dim">🏫 ${escapeHtml(c.platform || '未知平台')}</div>
                      <div class="text-dim">📄 ${(c.materials || []).length} 个课件</div>
                    </div>
                    <div class="cc-actions">
                      <button class="btn-small" data-click="App.navigate('notes')">📝 笔记</button>
                    </div>
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      `;
    } catch (err) {
      document.getElementById('coursesContent').innerHTML =
        `<div class="empty-state"><h3>加载失败</h3><p>${err.message}</p></div>`;
    }
  }
};

if (typeof App !== 'undefined') App.registerModule('courses', Courses);
