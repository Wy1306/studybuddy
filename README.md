# 🦉 学伴 StudyBuddy

> 大学生的 AI 全能管家 | B站 AI创造公开赛 参赛项目

AI 聊天框不认识你。学伴认识你。

通过浏览器扩展获取你在各学习平台的数据，存入本地浏览器，结合 AI 提供个性化辅导。**数据全程不出你的浏览器。**

## ✨ 功能

| 模块 | 说明 |
|------|------|
| 📊 仪表盘 | 学习数据总览：课程/作业DDL/笔记 |
| 📚 课程管理 | 从学习通/知到自动同步，统一管理 |
| 📝 智能笔记 | 课件 → AI 生成结构化笔记 + 思维导图 |
| 🎯 错题诊断 | 错题 → AI 分析错因 → 生成同类巩固题 |
| 📄 简历生成 | 基于你的真实履历 → AI 定制简历 |
| 🎤 面试模拟 | AI 模拟面试官，追问 + 打分 |
| 💼 就业分析 | 结合专业/技能 → 市场趋势 + 方向建议 |

## 🛠 架构

```
浏览器扩展(数据采集) → IndexedDB(本地存储) → PWA(用户界面) → DeepSeek API(用户自带Key)
```

- **数据安全**：所有数据只存浏览器 IndexedDB，不上传任何服务器
- **成本**：用户自带 DeepSeek Key（免费额度够用几千次）
- **部署**：Vercel 免费托管（仅做 API 转发代理）

## 🚀 本地开发

```bash
git clone https://github.com/Wy1306/studybuddy.git
cd studybuddy
node server.js
# → http://localhost:3000
```

### 加载浏览器扩展
1. Chrome → `chrome://extensions`
2. 开启「开发者模式」
3. 「加载已解压的扩展程序」→ 选择 `extension/` 目录

## 📂 项目结构

```
studybuddy/
├── extension/        # Chrome/Edge 浏览器扩展
│   ├── platforms/    # 平台适配器(学习通/知到/学习强国)
│   ├── content-script.js  # 页面注入+数据提取
│   ├── background.js # Service Worker
│   └── popup/        # 扩展弹窗
├── app/              # PWA 网页应用
│   ├── js/modules/   # 功能模块
│   └── css/          # 暗色主题样式
├── api/              # Vercel Serverless
└── vercel.json
```

## 📺 B站视频系列

| 期数 | 内容 |
|------|------|
| 1 | 我让AI入侵了我的学习通 |
| 2 | AI把我的网课变成了笔记 |
| 3 | AI分析了我的所有错题 |
| 4 | AI帮我做了一份简历 |
| 5 | 让AI模拟一场面试 |
| 6 | AI分析就业市场趋势 |
| 7 | 同学试用反馈 |
| 8 | 8周全记录+参赛提交 |

## ⚠️ 隐私声明

- 你的账号密码由学习平台自己验证，学伴不会接触
- 所有课件/作业/成绩只存在你的浏览器本地
- API Key 你自己提供，存在你的浏览器里
- 扩展开源，任何人都能审查代码

---

Built by [Wy1306](https://github.com/Wy1306) for #B站AI创造公开赛
