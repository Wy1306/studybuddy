// 错题诊断模块 — AI 分析错因 + 生成同类巩固题

const Errors = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>🎯 错题诊断</h2>
        <p class="text-dim">选一道错题，AI 帮你找出真正的薄弱点，然后出题练到会为止</p>
      </div>

      <div class="card">
        <h3>📥 选择错题来源</h3>
        <div class="errors-source-tabs">
          <button class="source-tab active" data-click="Errors.switchSource('assignment')">从作业错题</button>
          <button class="source-tab" data-click="Errors.switchSource('manual')">手动输入</button>
          <button class="source-tab" data-click="Errors.switchSource('practice')">练习记录</button>
        </div>

        <div id="errorsSourceAssignment" class="errors-source-panel">
          <div id="errorAssignmentList"><p class="text-dim">加载中...</p></div>
        </div>

        <div id="errorsSourceManual" class="errors-source-panel" style="display:none">
          <div class="form-group">
            <label>题目</label>
            <textarea id="errorManualQuestion" class="input-textarea" placeholder="粘贴原题" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>你的错误答案（可选）</label>
            <textarea id="errorManualWrong" class="input-textarea" placeholder="你当时写的答案" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>正确答案（可选）</label>
            <textarea id="errorManualCorrect" class="input-textarea" placeholder="正确答案" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>学科</label>
            <select id="errorSubject">
              <option value="programming">编程</option>
              <option value="math">数学</option>
              <option value="english">英语</option>
              <option value="other">其他</option>
            </select>
          </div>
          <button class="btn-primary" data-click="Errors.diagnoseManual()">🔍 诊断错因</button>
        </div>

        <div id="errorsSourcePractice" class="errors-source-panel" style="display:none">
          <div id="practiceHistory"><p class="text-dim">暂无练习记录</p></div>
        </div>
      </div>

      <div class="result-box" id="errorsResult"></div>
    `;

    await this.loadAssignments();
  },

  switchSource(source) {
    document.querySelectorAll('.errors-source-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.errors-source-tabs .source-tab').forEach(t => t.classList.remove('active'));
    const panel = document.getElementById(`errorsSource${source.charAt(0).toUpperCase() + source.slice(1)}`);
    if (panel) panel.style.display = 'block';
  },

  async loadAssignments() {
    const container = document.getElementById('errorAssignmentList');
    try {
      const assignments = await DB.getAll('assignments');
      const withErrors = (assignments || []).filter(a => a.status === 'graded' && a.score !== null && parseFloat(a.score) < 80);
      if (!withErrors.length) {
        container.innerHTML = '<p class="text-dim">暂无错题。作业分数低于80分的会自动出现在这里。</p>';
        return;
      }
      container.innerHTML = withErrors.map(a => `
        <div class="error-assignment-card" data-click="Errors.diagnoseAssignment('${a.id}')">
          <div class="ea-title">${escapeHtml(a.title || '未命名作业')}</div>
          <div class="ea-meta">得分: ${a.score || '-'} · ${escapeHtml(a.feedback || '')}</div>
          <span class="ea-action">诊断 →</span>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-dim">加载失败: ${err.message}</p>`;
    }
  },

  async diagnoseAssignment(assignmentId) {
    const assignment = await DB.getById('assignments', assignmentId);
    if (!assignment) return;

    const prompt = ErrorPrompts.fromAssignment(assignment);
    showLoading('errorsResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'error_diagnosis' });
      showResult('errorsResult', result);
      await DB.put('errors', {
        assignmentId,
        question: assignment.title,
        wrongAnswer: assignment.content || '未知',
        correctAnswer: assignment.feedback || '未知',
        diagnosis: result,
        createdAt: Date.now()
      });
    } catch (err) {
      showResult('errorsResult', `❌ ${err.message}`, true);
    }
  },

  async diagnoseManual() {
    const question = document.getElementById('errorManualQuestion').value.trim();
    const wrong = document.getElementById('errorManualWrong').value.trim();
    const correct = document.getElementById('errorManualCorrect').value.trim();
    const subject = document.getElementById('errorSubject').value;

    if (!question) { alert('请输入题目'); return; }

    const prompt = ErrorPrompts.fromManual(question, wrong, correct, subject);
    showLoading('errorsResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'error_diagnosis' });
      showResult('errorsResult', result);
      await DB.put('errors', {
        question,
        wrongAnswer: wrong,
        correctAnswer: correct,
        diagnosis: result,
        createdAt: Date.now()
      });
    } catch (err) {
      showResult('errorsResult', `❌ ${err.message}`, true);
    }
  }
};

const ErrorPrompts = {
  fromAssignment(assignment) {
    return `你是一个专业的错题诊断老师。学生做了一道作业，请分析他的问题出在哪。

作业题目：${assignment.title || '未知'}
学生得分：${assignment.score || '未知'}
学生答案/内容：${assignment.content || '未提供'}
老师反馈：${assignment.feedback || '无'}

请严格按以下结构输出：

## 🔍 错因分析
（分析学生答错是因为哪个知识点没掌握，不要只说"粗心"）

## 📖 知识点补强
（用通俗语言把涉及的知识点讲清楚，举例说明）

## ✏️ 同类巩固题（3道）
（根据错因，出3道类似但不同的题）
1. ...
2. ...
3. ...

## ✅ 正确答案与解析
（给出原题的正确答案和详细解析）

用中文回复，语气鼓励但直接。`
  },

  fromManual(question, wrong, correct, subject) {
    return `你是一个错题诊断老师。请分析这道题。

题目：${question}
学生错误答案：${wrong || '未提供'}
正确答案：${correct || '未提供'}
学科：${subject}

请按以下结构输出：

## 🔍 错因分析
## 📖 知识点补强
## ✏️ 同类巩固题（3道）
## ✅ 答案解析

用中文回复。`
  }
};

if (typeof App !== 'undefined') App.registerModule('errors', Errors);
