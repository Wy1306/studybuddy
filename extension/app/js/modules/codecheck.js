// 代码项目体检模块 — AI 审查整个 GitHub 项目

const CodeCheck = {
  async render(container) {
    container.innerHTML = `
      <div class="page-header">
        <h2>🔬 代码项目体检</h2>
        <p class="text-dim">输入 GitHub 仓库地址，AI 扫描全项目出质量报告</p>
      </div>

      <div class="card">
        <h3>📥 输入项目</h3>
        <div class="form-group">
          <label>GitHub 仓库地址</label>
          <input id="codeCheckUrl" class="input-text" placeholder="https://github.com/用户名/仓库名">
        </div>
        <div class="form-group">
          <label>或直接粘贴代码</label>
          <textarea id="codeCheckManual" class="input-textarea" rows="12" placeholder="粘贴完整代码文件内容（可多个文件，用注释标注文件名）"></textarea>
        </div>
        <div class="form-group">
          <label>检查重点</label>
          <select id="codeCheckFocus">
            <option value="all">全面检查</option>
            <option value="security">安全漏洞</option>
            <option value="performance">性能问题</option>
            <option value="architecture">架构设计</option>
            <option value="bugs">Bug扫描</option>
          </select>
        </div>
        <button class="btn-primary" data-click="CodeCheck.analyze()">🔬 开始体检</button>
      </div>

      <div class="result-box" id="codeCheckResult"></div>
    `;
  },

  async analyze() {
    const url = document.getElementById('codeCheckUrl').value.trim();
    const manualCode = document.getElementById('codeCheckManual').value.trim();
    const focus = document.getElementById('codeCheckFocus').value;

    if (!url && !manualCode) { alert('请输入仓库地址或粘贴代码'); return; }

    const prompt = CodeCheckPrompts.build(url, manualCode, focus);
    showLoading('codeCheckResult');

    try {
      const result = await AI.aiAnalyze(prompt, { mode: 'code_check', maxTokens: 4000 });
      showResult('codeCheckResult', result);
      if (url) {
        await DB.put('projects', {
          name: url,
          githubUrl: url,
          aiReview: result,
          createdAt: Date.now()
        });
      }
    } catch (err) {
      showResult('codeCheckResult', `❌ ${err.message}`, true);
    }
  }
};

const CodeCheckPrompts = {
  build(url, manualCode, focus) {
    const focusGuide = {
      all: '全面检查代码质量、安全性、性能、架构',
      security: '重点检查安全漏洞：SQL注入、XSS、敏感信息泄露、权限问题',
      performance: '重点检查性能：冗余计算、内存泄漏、N+1查询、不必要的IO',
      architecture: '重点检查架构：模块耦合度、职责划分、设计模式使用',
      bugs: '重点检查Bug：边界条件、空指针、类型错误、逻辑错误'
    };

    return `你是资深代码审查专家。${focusGuide[focus] || focusGuide.all}

${url ? `项目地址：${url}\n请分析这个GitHub仓库的代码质量。如果能访问仓库结构，请分析文件组织和依赖关系。` : ''}
${manualCode ? `代码内容：\n\`\`\`\n${manualCode}\n\`\`\`` : ''}

请按以下结构输出：

## 📊 项目总览
（项目规模/代码行数估算/技术栈/整体评价）

## 🔴 严重问题
（会导致崩溃/安全漏洞/数据丢失的问题）

## 🟡 需要改进
（性能瓶颈/代码异味/不规范写法）

## 🟢 做得好的地方
（值得肯定的设计和实现）

## 💡 改进路线图
（按优先级排列的改进建议，每条标注预估工作量）

## 📈 质量评分
- 代码规范性：X/10
- 安全性：X/10
- 可维护性：X/10
- 性能：X/10

用中文回复，具体指出问题所在的行号/文件/函数。`;
  }
};

if (typeof App !== 'undefined') App.registerModule('codecheck', CodeCheck);
