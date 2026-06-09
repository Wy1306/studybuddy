// 通用学习平台提取器 — 兜底方案
// 当页面不属于任何已知平台但有学习内容时自动启用

const GenericExtractor = {
  platform: 'generic',
  platformName: '通用识别',

  extract() {
    const pageText = document.body.innerText.slice(0, 10000);
    const result = {
      platform: 'generic',
      detectedContent: [],
      courses: [],
      assignments: []
    };

    // 检测学习关键词
    const patterns = [
      { regex: /课程[名称]?[：:]\s*(.+)/g, type: 'course', key: 'name' },
      { regex: /第[一二三四五六七八九十\d]+[章节课]\s*[：:]?\s*(.+)/g, type: 'chapter', key: 'title' },
      { regex: /作业[：:]\s*(.+)/g, type: 'assignment', key: 'title' },
      { regex: /截止[日期时间][：:]?\s*(.+)/g, type: 'deadline', key: 'date' },
      { regex: /考试[：:]?\s*(.+)/g, type: 'exam', key: 'title' },
      { regex: /成绩[：:]\s*([\d.]+)/g, type: 'score', key: 'value' },
      { regex: /教师[：:]\s*(.+)/g, type: 'teacher', key: 'name' }
    ];

    for (const pattern of patterns) {
      const matches = pageText.match(pattern.regex);
      if (matches) {
        result.detectedContent.push({
          type: pattern.type,
          matches: matches.slice(0, 10)
        });
      }
    }

    // 尝试提取课程名
    const coursePatterns = [
      /《(.+?)》/g,           // 《高等数学》
      /"(.+?)"/g,             // "课程名"
      /【(.+?)】/g,           // 【课程名】
      /课程[：:]\s*(.+)/g
    ];

    const foundCourses = new Set();
    for (const pattern of coursePatterns) {
      let match;
      while ((match = pattern.exec(pageText)) !== null) {
        const name = match[1].trim();
        if (name.length > 2 && name.length < 50) {
          foundCourses.add(name);
        }
      }
    }

    result.courses = Array.from(foundCourses).slice(0, 10).map(name => ({
      id: 'gen_' + hashStr(name),
      platform: 'generic',
      courseName: name,
      teacher: '',
      courseUrl: window.location.href,
      semester: '',
      materials: [],
      fetchedAt: Date.now()
    }));

    result.assignments = (result.detectedContent
      .filter(c => c.type === 'assignment')
      .flatMap(c => c.matches)
      .slice(0, 10)
      .map(title => ({
        id: 'gen_' + hashStr(title),
        courseId: '',
        title,
        deadline: '',
        status: 'pending',
        score: null,
        content: '',
        feedback: '',
        fetchedAt: Date.now()
      })));

    return result;
  }
};

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

if (typeof window !== 'undefined') {
  window.__genericExtractor = GenericExtractor;
}
