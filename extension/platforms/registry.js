// 平台注册表 — 根据 URL 自动检测当前页面属于哪个学习平台
// 已知平台按域名匹配（不挑DOM），未知平台用通用关键词检测

const PLATFORMS = {
  chaoxing: {
    name: '学习通（超星）',
    domain: 'chaoxing.com'
  },
  zhidao: {
    name: '知到（智慧树）',
    domain: 'zhihuishu.com'
  },
  xuexiqiangguo: {
    name: '学习强国',
    domain: 'xuexi.cn'
  }
};

function detectPlatform() {
  const host = window.location.hostname;

  // 已知平台：域名匹配就算
  for (const [key, platform] of Object.entries(PLATFORMS)) {
    if (host.includes(platform.domain)) {
      return { key, ...platform };
    }
  }

  // 未知平台：检测页面内容中是否有学习关键词
  const eduKeywords = ['课程', '作业', '考试', '成绩', '课件'];
  const pageText = document.body.innerText.slice(0, 5000);
  const matchCount = eduKeywords.filter(k => pageText.includes(k)).length;

  if (matchCount >= 2) {
    return {
      key: 'generic',
      name: '未知学习平台（通用模式）',
      domain: host
    };
  }

  return null;
}
