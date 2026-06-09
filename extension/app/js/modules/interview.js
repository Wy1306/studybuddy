// 面试模拟模块 — AI 模拟面试官追问 + 打分

const Interview = {
  state: {
    type: 'tech',
    history: [],
    score: 0,
    currentQuestion: ''
  },

  async render(container) {
    this.container = container;
    container.innerHTML = `
      <div class="page-header">
        <h2>🎤 面试模拟</h2>
        <p class="text-dim">AI 当面试官，根据你的回答实时追问，模拟真实面试场景</p>
      </div>

      <div class="card">
        <h3>🎯 面试设置</h3>
        <div class="form-grid">
          <div class="form-group">
            <label>面试类型</label>
            <select id="interviewType" onchange="Interview.updateType()">
              <option value="tech">技术面试</option>
              <option value="hr">HR面试</option>
              <option value="defense">毕业答辩模拟</option>
              <option value="english">英文面试</option>
            </select>
          </div>
          <div class="form-group">
            <label>目标岗位/主题</label>
            <input id="interviewTopic" class="input-text" placeholder="Java后端实习生 / 毕业设计答辩 / ...">
          </div>
          <div class="form-group">
            <label>难度</label>
            <select id="interviewLevel">
              <option value="junior">初级（适合大一/大二）</option>
              <option value="mid" selected>中级</option>
              <option value="senior">高级（压力面）</option>
            </select>
          </div>
        </div>
        <button class="btn-primary" onclick="Interview.start()" id="interviewStartBtn">▶ 开始面试</button>
      </div>

      <div id="interviewSession" style="display:none">
        <div class="card" id="interviewQuestionCard">
          <h3>🤔 面试官提问</h3>
          <div id="interviewQuestion" class="interview-question">准备开始...</div>
        </div>

        <div class="card">
          <h3>✏️ 你的回答</h3>
          <textarea id="interviewAnswer" class="input-textarea" rows="6" placeholder="在这里输入你的回答..."></textarea>
          <div class="interview-actions">
            <button class="btn-primary" onclick="Interview.submit()">📤 提交回答</button>
            <button class="btn-small btn-ghost" onclick="Interview.skip()">跳过此题</button>
            <button class="btn-small btn-ghost" onclick="Interview.end()">结束面试</button>
          </div>
        </div>

        <div class="result-box" id="interviewFeedback" style="display:none"></div>

        <div class="card" style="display:none" id="interviewSummary">
          <h3>📊 面试总结</h3>
          <div id="interviewSummaryContent"></div>
        </div>
      </div>
    `;
  },

  updateType() {
    this.state.type = document.getElementById('interviewType').value;
  },

  async start() {
    const topic = document.getElementById('interviewTopic').value.trim();
    if (!topic) { alert('请输入目标岗位或主题'); return; }

    this.state.type = document.getElementById('interviewType').value;
    this.state.level = document.getElementById('interviewLevel').value;
    this.state.topic = topic;
    this.state.history = [];
    this.state.score = 0;

    document.getElementById('interviewSession').style.display = 'block';
    document.getElementById('interviewStartBtn').textContent = '🔄 重新开始';
    document.getElementById('interviewFeedback').style.display = 'none';
    document.getElementById('interviewSummary').style.display = 'none';

    await this.askNext();
  },

  async askNext() {
    const prompt = InterviewPrompts.nextQuestion(this.state);
    document.getElementById('interviewQuestion').textContent = '⏳ 生成问题中...';

    try {
      const question = await AI.aiAnalyze(prompt, { mode: 'interview', maxTokens: 500, temperature: 0.7 });
      this.state.currentQuestion = question;
      document.getElementById('interviewQuestion').textContent = question;
      document.getElementById('interviewAnswer').value = '';
      document.getElementById('interviewAnswer').focus();
    } catch (err) {
      document.getElementById('interviewQuestion').textContent = '生成问题失败，请重试';
    }
  },

  async submit() {
    const answer = document.getElementById('interviewAnswer').value.trim();
    if (!answer) { alert('请输入你的回答'); return; }

    this.state.history.push({ question: this.state.currentQuestion, answer });

    const feedback = await AI.aiAnalyze(
      InterviewPrompts.feedback(this.state.currentQuestion, answer),
      { mode: 'interview_feedback', maxTokens: 1000 }
    );

    document.getElementById('interviewFeedback').style.display = 'block';
    document.getElementById('interviewFeedback').innerHTML = `
      <h3>📝 回答评估</h3>
      ${markdownToHtml(feedback)}
    `;

    if (this.state.history.length >= 5) {
      await this.showSummary();
    } else {
      setTimeout(() => this.askNext(), 2000);
    }
  },

  async skip() {
    this.state.history.push({ question: this.state.currentQuestion, answer: '(跳过)' });
    if (this.state.history.length >= 5) {
      await this.showSummary();
    } else {
      await this.askNext();
    }
  },

  async end() {
    if (this.state.history.length === 0) { alert('至少回答一个问题'); return; }
    await this.showSummary();
  },

  async showSummary() {
    const summary = await AI.aiAnalyze(
      InterviewPrompts.summary(this.state),
      { mode: 'interview_summary', maxTokens: 2000 }
    );
    document.getElementById('interviewSummary').style.display = 'block';
    document.getElementById('interviewSummaryContent').innerHTML = markdownToHtml(summary);
  }
};

const InterviewPrompts = {
  nextQuestion(state) {
    const typeGuides = {
      tech: `你是${state.topic}岗位的技术面试官。问一个技术问题，难度${state.level}。`,
      hr: '你是HR面试官。问一个行为面试题（团队协作/冲突处理/职业规划）。',
      defense: `你是毕业答辩评委。针对"${state.topic}"问一个答辩问题。`,
      english: `You are an English interviewer for a ${state.topic} position. Ask one question in English. Difficulty: ${state.level}.`
    };

    const historyText = state.history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n\n');

    return `${typeGuides[state.type] || typeGuides.tech}

已问过的问题：
${historyText || '这是第一个问题'}

根据候选人的回答质量决定下一个问题（追问薄弱点或深入考察）。
只输出问题本身，不要加任何说明。问题简洁，30字以内。`;
  },

  feedback(question, answer) {
    return `你是面试官。对以下回答评分并给反馈。

你的提问：${question}
候选人回答：${answer}

请输出：
**评分**：X/10
**优点**：（1-2个做得好的地方）
**改进建议**：（1-2个可以更好的地方）
**追问点**：（如果有的话，下一题可以深挖什么）

语气直接但鼓励。用中文。`;
  },

  summary(state) {
    return `你是面试教练。以下是一场模拟面试的记录。请给总体评价。

岗位：${state.topic}
类型：${state.type}
难度：${state.level}

面试记录：
${state.history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer}`).join('\n\n')}

请输出：
## 📊 总体评分
（X/10）

## 🎯 亮点
（候选人的突出优势）

## ⚠️ 薄弱环节
（需要重点提升的方向）

## 💪 提升建议
（3条具体的练习建议，每条可执行）

用中文。语气像朋友给建议，直接但不打击人。`;
  }
};

if (typeof App !== 'undefined') App.registerModule('interview', Interview);
