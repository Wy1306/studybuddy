// 简历生成模块 — 基于用户真实数据 + AI 定制简历

const Resume = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>📄 简历生成器</h2>
        <p class="text-dim">基于你的课程、项目和技能，AI 为你定制简历</p>
      </div>

      <div class="card">
        <h3>👤 个人信息</h3>
        <div class="form-grid">
          <div class="form-group"><label>姓名</label><input id="resumeName" class="input-text" placeholder="你的名字"></div>
          <div class="form-group"><label>学校</label><input id="resumeSchool" class="input-text" placeholder="学校名称"></div>
          <div class="form-group"><label>专业</label><input id="resumeMajor" class="input-text" placeholder="专业"></div>
          <div class="form-group"><label>年级</label><input id="resumeGrade" class="input-text" placeholder="大一/大二/大三/大四"></div>
        </div>
        <div class="form-group">
          <label>技能（逗号分隔）</label>
          <input id="resumeSkills" class="input-text" placeholder="Python, Java, SQL, Git, ...">
        </div>
        <div class="form-group">
          <label>目标岗位</label>
          <input id="resumeTargetJob" class="input-text" placeholder="Java开发实习生 / 数据分析实习生 / ...">
        </div>
        <div class="form-group">
          <label>项目经历（可选，会从课程数据自动填充）</label>
          <textarea id="resumeProjects" class="input-textarea" rows="4" placeholder="描述你做过的项目..."></textarea>
        </div>
        <button class="btn-primary" onclick="Resume.generate()">✨ AI 生成简历</button>
      </div>

      <div class="result-box" id="resumeResult"></div>
    `;

    // 自动填充已有数据
    try {
      const [profile, courses] = await Promise.all([
        DB.getById('profile', 'main').catch(() => null),
        DB.getAll('courses').catch(() => [])
      ]);
      if (profile) {
        document.getElementById('resumeName').value = profile.name || '';
        document.getElementById('resumeSchool').value = profile.university || '';
        document.getElementById('resumeMajor').value = profile.major || '';
        document.getElementById('resumeSkills').value = (profile.skills || []).join(', ');
      }
      if (courses.length) {
        const courseNames = courses.map(c => c.courseName).join('、');
        document.getElementById('resumeProjects').placeholder = `已学课程: ${courseNames}\n\n在这里补充你的项目经历...`;
      }
    } catch (_) {}
  },

  async generate() {
    const name = document.getElementById('resumeName').value.trim();
    const school = document.getElementById('resumeSchool').value.trim();
    const major = document.getElementById('resumeMajor').value.trim();
    const grade = document.getElementById('resumeGrade').value.trim();
    const skills = document.getElementById('resumeSkills').value.trim();
    const targetJob = document.getElementById('resumeTargetJob').value.trim();
    const projects = document.getElementById('resumeProjects').value.trim();

    if (!name || !school || !targetJob) {
      alert('请至少填写姓名、学校和目标岗位');
      return;
    }

    const prompt = `你是专业的简历撰写顾问。请为以下学生定制一份简历。

个人信息：
- 姓名：${name}
- 学校：${school}
- 专业：${major}
- 年级：${grade}
- 技能：${skills || '未填写'}
- 目标岗位：${targetJob}
- 项目经历：${projects || '未填写'}

请按以下结构输出一份完整的简历（用Markdown格式）：

## ${name} | ${targetJob}

### 📋 个人信息
（姓名/学校/专业/联系方式模板）

### 💡 技能清单
（按类别整理技能，标注熟练度：精通/熟练/了解）

### 🚀 项目经历
（每个项目用STAR法则：背景-任务-行动-结果）

### 🎓 教育背景
（学校/专业/相关课程/GPA如果适用）

### 🏆 荣誉与证书
（如果有的话，没有就写"持续学习中"）

### 📝 自我评价
（2-3句话，突出与目标岗位的匹配度）

注意：
- 用中文，但技术术语保持英文
- 用STAR法则写项目经历
- 量化结果（如"提升性能30%"）即使估算也可以
- 不要编造不存在的经历`;

    showLoading('resumeResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'resume', maxTokens: 3000 });
      showResult('resumeResult', result);
      await DB.put('resume', {
        version: 1,
        content: result,
        targetJob,
        createdAt: Date.now()
      });
    } catch (err) {
      showResult('resumeResult', `❌ ${err.message}`, true);
    }
  }
};

if (typeof App !== 'undefined') App.registerModule('resume', Resume);
