// 学习强国数据提取器
// 提取文章阅读记录、视频学习、积分等

const XuexiqiangguoExtractor = {
  platform: 'xuexiqiangguo',
  platformName: '学习强国',

  extractArticles() {
    const articles = [];
    const selectors = ['.article-item', '.news-item', '.text-wrap', 'a[href*="article"]'];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
      const title = el.querySelector('.title, h3, h4')?.textContent?.trim() || el.textContent?.trim();
      if (title && title.length > 3) {
        articles.push({ title: title.slice(0, 100), url: el.querySelector('a')?.href || '' });
      }
    });
    return articles.slice(0, 20);
  },

  extractVideos() {
    const videos = [];
    document.querySelectorAll('[class*="video"], [class*="Video"], a[href*="video"]').forEach(el => {
      const title = el.querySelector('.title')?.textContent?.trim() || el.getAttribute('title') || '';
      if (title && title.length > 2) {
        videos.push({ title: title.slice(0, 100), url: el.querySelector('a')?.href || '' });
      }
    });
    return videos.slice(0, 10);
  },

  extractScores() {
    const scores = {};
    const scoreEl = document.querySelector('.points, .my-points, .score, [class*="score"]');
    if (scoreEl) {
      const text = scoreEl.textContent || '';
      const match = text.match(/(\d+)/);
      if (match) scores.totalPoints = match[1];
    }
    return scores;
  }
};

if (typeof window !== 'undefined') {
  window.__xuexiqiangguoExtractor = XuexiqiangguoExtractor;
}
