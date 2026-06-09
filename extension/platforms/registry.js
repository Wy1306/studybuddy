// 平台注册表 — 根据 URL 自动检测当前页面属于哪个学习平台
// 每个平台适配器返回 { name, version } 标识自己

const PLATFORMS = {
  chaoxing: {
    name: '学习通（超星）',
    domain: 'chaoxing.com',
    detect() {
      return !!document.querySelector('.course-list, .chapter-list, #courseList, .catalog_tb, .workBtn, .examBtn');
    },
    // 适配器文件需通过 importScripts 或动态注入加载
    adapter: 'chaoxing.js'
  },
  zhidao: {
    name: '知到（智慧树）',
    domain: 'zhihuishu.com',
    detect() {
      return !!document.querySelector('.courseItem, .videoList, .chapterList, .exam-paper');
    },
    adapter: 'zhidao.js'
  },
  xuexiqiangguo: {
    name: '学习强国',
    domain: 'xuexi.cn',
    detect() {
      return !!document.querySelector('.article, .video, .points, .my-points');
    },
    adapter: 'xuexiqiangguo.js'
  }
};

function detectPlatform() {
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (window.location.hostname.includes(platform.domain) && platform.detect()) {
      return { key, ...platform };
    }
  }
  // 通用检测：页面里有没有任何学习相关的内容
  return detectGeneric();
}

function detectGeneric() {
  const eduKeywords = ['课程', '作业', '考试', '成绩', '课件', '第一章', '第二章', '学习任务', '我的课程'];
  const pageText = document.body.innerText.slice(0, 5000);
  const matchCount = eduKeywords.filter(k => pageText.includes(k)).length;

  if (matchCount >= 2) {
    return {
      key: 'generic',
      name: '未知学习平台（通用模式）',
      domain: window.location.hostname,
      detect: () => true,
      adapter: 'generic.js'
    };
  }
  return null;
}
