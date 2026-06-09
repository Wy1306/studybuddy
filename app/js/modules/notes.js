// 智能笔记模块 — 从课件/PPT/网课内容生成结构化笔记和思维导图

const Notes = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>📝 智能笔记</h2>
        <p class="text-dim">选中课件内容，AI 帮你整理成结构化笔记和思维导图</p>
      </div>

      <div class="card">
        <h3>📥 内容来源</h3>
        <div class="notes-source-tabs">
          <button class="source-tab active" onclick="Notes.switchSource('course')">从课程资料</button>
          <button class="source-tab" onclick="Notes.switchSource('manual')">手动输入</button>
          <button class="source-tab" onclick="Notes.switchSource('history')">历史笔记</button>
        </div>

        <div id="notesSourceCourse" class="notes-source-panel">
          <div id="courseMaterialList"><p class="text-dim">加载课程资料中...</p></div>
        </div>

        <div id="notesSourceManual" class="notes-source-panel" style="display:none">
          <textarea id="notesManualInput" class="input-textarea" placeholder="粘贴课件内容、PPT文字、或者老师讲的重点..." rows="8"></textarea>
          <div class="notes-options">
            <label><input type="checkbox" id="notesGenMindmap" checked> 同时生成思维导图</label>
            <label>风格：
              <select id="notesStyle">
                <option value="detailed">详细版（适合复习）</option>
                <option value="concise">精简版（适合速览）</option>
                <option value="qa">问答版（适合自测）</option>
              </select>
            </label>
          </div>
          <button class="btn-primary" onclick="Notes.generateFromManual()">✨ AI 生成笔记</button>
        </div>

        <div id="notesSourceHistory" class="notes-source-panel" style="display:none">
          <div id="notesHistoryList"><p class="text-dim">加载历史笔记中...</p></div>
        </div>
      </div>

      <div class="result-box" id="notesResult"></div>
    `;

    await this.loadCourseMaterials();
    await this.loadHistory();
  },

  async switchSource(source) {
    document.querySelectorAll('.source-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.notes-source-panel').forEach(p => p.style.display = 'none');
    const panel = document.getElementById(`notesSource${source.charAt(0).toUpperCase() + source.slice(1)}`);
    if (panel) panel.style.display = 'block';

    if (source === 'history') await this.loadHistory();
  },

  async loadCourseMaterials() {
    const container = document.getElementById('courseMaterialList');
    try {
      const courses = await DB.getAll('courses');
      if (!courses.length) {
        container.innerHTML = '<p class="text-dim">暂无课程数据。安装扩展后打开学习通，数据会自动同步。</p>';
        return;
      }

      container.innerHTML = courses.map(c => `
        <div class="material-course-card">
          <div class="material-course-name">📚 ${escapeHtml(c.courseName)}</div>
          <div class="material-course-meta">${escapeHtml(c.teacher || '')} · ${escapeHtml(c.platform || '')}</div>
          ${(c.materials || []).length > 0
            ? c.materials.slice(0, 5).map(m => `
                <div class="material-item" onclick="Notes.generateFromMaterial('${c.id}', '${escapeHtml(m.title)}')">
                  📄 ${escapeHtml(m.title)}
                  <span class="material-action">生成笔记 →</span>
                </div>
              `).join('')
            : '<p class="text-dim">该课程暂无课件数据</p>'
          }
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-dim">加载失败: ${err.message}</p>`;
    }
  },

  async generateFromMaterial(courseId, materialTitle) {
    const course = await DB.getById('courses', courseId);
    if (!course) return;

    const material = (course.materials || []).find(m => m.title === materialTitle);
    const prompt = NotesPrompts.fromMaterial(course.courseName, materialTitle, material?.url || '');

    showLoading('notesResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'notes' });
      showResult('notesResult', result);

      // 保存到历史
      await DB.put('notes', {
        courseId,
        sourceType: 'material',
        rawContent: materialTitle,
        aiSummary: result,
        createdAt: Date.now()
      });
    } catch (err) {
      showResult('notesResult', `❌ ${err.message}`, true);
    }
  },

  async generateFromManual() {
    const input = document.getElementById('notesManualInput').value.trim();
    if (!input) { alert('请先输入内容'); return; }

    const genMindmap = document.getElementById('notesGenMindmap').checked;
    const style = document.getElementById('notesStyle').value;
    const prompt = NotesPrompts.fromManual(input, style, genMindmap);

    showLoading('notesResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'notes' });
      showResult('notesResult', result);

      await DB.put('notes', {
        sourceType: 'manual',
        rawContent: input.slice(0, 500),
        aiSummary: result,
        createdAt: Date.now()
      });
    } catch (err) {
      showResult('notesResult', `❌ ${err.message}`, true);
    }
  },

  async loadHistory() {
    const container = document.getElementById('notesHistoryList');
    try {
      const notes = await DB.getAll('notes');
      if (!notes.length) {
        container.innerHTML = '<p class="text-dim">还没有笔记，去生成第一篇吧</p>';
        return;
      }
      container.innerHTML = notes
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .map(n => `
          <div class="history-item" onclick="Notes.viewHistory('${n.id}')">
            <div class="history-title">${escapeHtml((n.rawContent || '无标题').slice(0, 80))}</div>
            <div class="history-time">${new Date(n.createdAt).toLocaleString()}</div>
          </div>
        `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-dim">加载失败: ${err.message}</p>`;
    }
  },

  viewHistory(id) {
    DB.getById('notes', parseInt(id)).then(note => {
      if (note) showResult('notesResult', note.aiSummary);
    });
  }
};

const NotesPrompts = {
  fromMaterial(courseName, materialTitle, url) {
    return `你是一个专业的课程笔记整理助手。请为以下课件内容生成学习笔记。

课程：${courseName}
课件：${materialTitle}
${url ? `链接：${url}` : ''}

请按以下结构输出：

## 📋 本课核心知识点
（列出3-5个最重要的知识点，每个用一句话概括）

## 📝 详细笔记
（按逻辑结构整理，使用层级标题。重点内容用**粗体**标注）

## 🧠 思维导图
（用文本缩进形式表示层级结构）
- 主题
  - 子主题1
    - 要点a
    - 要点b
  - 子主题2
    - 要点c

## ❓ 自测题
（出3道简答题，帮助检验是否理解）
1. ...
2. ...
3. ...

## 📌 易混淆点
（标注本课最容易理解错的概念）

用中文回复，语言简洁但覆盖完整。`
  },

  fromManual(content, style, genMindmap) {
    const styleGuide = {
      detailed: '尽量详细，包含背景知识',
      concise: '精简到核心要点，适合快速复习',
      qa: '以问答形式组织，方便自测'
    };

    return `你是一个专业的课程笔记整理助手。请为以下内容生成学习笔记。

内容：
${content}

风格要求：${styleGuide[style] || styleGuide.detailed}

${genMindmap ? '请生成思维导图（文本缩进形式）。' : ''}

请按以下结构输出：
## 📝 笔记
（结构化整理）
${genMindmap ? '\n## 🧠 思维导图\n（文本缩进形式）' : ''}
## ❓ 自测题
（3道简答题）

用中文回复。`
  }
};

// 注册模块
if (typeof App !== 'undefined') App.registerModule('notes', Notes);
