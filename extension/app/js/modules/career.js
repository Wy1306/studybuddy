// 就业分析模块 — AI 结合用户专业/技能分析市场趋势

const Career = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>💼 就业分析</h2>
        <p class="text-dim">结合你的专业和技能，AI 分析市场趋势 + 推荐方向</p>
      </div>

      <div class="card">
        <h3>📊 你的画像</h3>
        <div class="form-grid">
          <div class="form-group"><label>专业</label><input id="careerMajor" class="input-text" placeholder="软件技术"></div>
          <div class="form-group"><label>年级</label><input id="careerGrade" class="input-text" placeholder="大一"></div>
          <div class="form-group"><label>意向城市</label><input id="careerCity" class="input-text" placeholder="合肥/南京/上海"></div>
        </div>
        <div class="form-group">
          <label>已掌握的技能（逗号分隔）</label>
          <input id="careerSkills" class="input-text" placeholder="Java, Python, MySQL, HTML/CSS">
        </div>
        <div class="form-group">
          <label>感兴趣的领域</label>
          <select id="careerField" multiple style="height:80px">
            <option value="backend">后端开发</option>
            <option value="frontend">前端开发</option>
            <option value="mobile">移动开发</option>
            <option value="data">数据分析/AI</option>
            <option value="devops">运维/DevOps</option>
            <option value="embedded">嵌入式/物联网</option>
            <option value="game">游戏开发</option>
          </select>
        </div>
        <div class="form-group">
          <label>其他信息（竞赛/证书/实习等）</label>
          <textarea id="careerExtra" class="input-textarea" rows="3" placeholder="智能汽车竞赛 / ROS2学习 / 有GitHub项目 / ..."></textarea>
        </div>
        <button class="btn-primary" data-click="Career.analyze()">📊 AI 分析就业前景</button>
      </div>

      <div class="result-box" id="careerResult"></div>
    `;

    // 自动填充
    try {
      const profile = await DB.getById('profile', 'main').catch(() => null);
      if (profile) {
        document.getElementById('careerMajor').value = profile.major || '';
        document.getElementById('careerSkills').value = (profile.skills || []).join(', ');
      }
    } catch (_) {}
  },

  async analyze() {
    const major = document.getElementById('careerMajor').value.trim();
    const grade = document.getElementById('careerGrade').value.trim();
    const city = document.getElementById('careerCity').value.trim();
    const skills = document.getElementById('careerSkills').value.trim();
    const fields = Array.from(document.getElementById('careerField').selectedOptions).map(o => o.value);
    const extra = document.getElementById('careerExtra').value.trim();

    if (!major) { alert('请至少填写专业'); return; }

    const prompt = `你是资深职业规划顾问。请为以下学生分析就业前景。

基本信息：
- 专业：${major}
- 年级：${grade || '未知'}
- 意向城市：${city || '未指定'}
- 已掌握技能：${skills || '未填写'}
- 感兴趣领域：${fields.length ? fields.join('、') : '未选择'}
- 其他：${extra || '无'}

请按以下结构输出：

## 📊 市场概况
（当前IT就业市场对这类背景学生的整体情况，2026年趋势）

## 🎯 推荐方向（3个）
（每个方向包含：岗位名称、薪资范围、需求趋势、匹配度分析）

## 🗺 技能提升路线图
（按时间线：短期/中期/长期，各阶段该学什么）

## 🏢 目标城市分析
（${city || '主要城市'}的就业机会和竞争情况）

## ⚡ 立即可以做的3件事
（具体的行动建议，今天就能开始）

## 📈 职业发展路径
（毕业后1-3-5年的发展可能性）

用中文，数据要具体（薪资范围/企业数量），语气像学长给你分析。`;

    showLoading('careerResult');
    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'career', maxTokens: 3500 });
      showResult('careerResult', result);
      await DB.put('career', {
        targetIndustry: fields.join(', '),
        marketData: result,
        recommendations: fields,
        savedAt: Date.now()
      });
    } catch (err) {
      showResult('careerResult', `❌ ${err.message}`, true);
    }
  }
};

if (typeof App !== 'undefined') App.registerModule('career', Career);
