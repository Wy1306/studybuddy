// 学习通（超星）数据提取器
// 在用户已登录的页面上提取课程、作业、成绩等结构化数据

const ChaoxingExtractor = {
  platform: 'chaoxing',
  platformName: '学习通',

  // 从首页提取课程列表
  extractCourses() {
    const courses = [];
    // 学习通课程卡片选择器（可能因版本而异，提供多个备选）
    const selectors = [
      '.course-card', '.courseItem', '.catalog_list li', '.course-list-item',
      '[class*="course"]', '[class*="Course"]'
    ];

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      if (elements.length > 0) {
        elements.forEach(el => {
          const name = el.querySelector('.course-name, .courseName, .catalog_title, h3, a')?.textContent?.trim();
          const teacher = el.querySelector('.teacher, .instructor, .teacher-name')?.textContent?.trim();
          const courseUrl = el.querySelector('a')?.href || '';

          if (name && name.length > 1) {
            courses.push({
              id: hashStr(courseUrl || name),
              platform: 'chaoxing',
              courseName: name,
              teacher: teacher || '',
              courseUrl,
              semester: '',
              materials: [],
              fetchedAt: Date.now()
            });
          }
        });
        break; // 用第一个匹配到的选择器
      }
    }
    return courses;
  },

  // 从课程内页提取课件/章节
  extractMaterials() {
    const materials = [];
    const chapterSelectors = ['.chapter_item', '.catalog_list li', '.chapter', '.unit'];
    const elements = document.querySelectorAll(chapterSelectors.join(','));

    elements.forEach(el => {
      const title = el.querySelector('.chapter_name, .catalog_title, a')?.textContent?.trim();
      const url = el.querySelector('a')?.href || '';
      if (title && title.length > 1) {
        materials.push({ title, url, type: 'chapter' });
      }
    });
    return materials;
  },

  // 从课程页面提取作业列表
  extractAssignments() {
    const assignments = [];
    const workSelectors = ['.workItem', '.homework-item', '.assignment-item', '.exam-item', 'li a[href*="work"]', 'li a[href*="homework"]'];

    for (const sel of workSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        const title = el.querySelector('.title, .work-title, a')?.textContent?.trim() || el.textContent?.trim();
        const deadline = el.querySelector('.deadline, .endTime, .time')?.textContent?.trim() || '';
        const status = el.textContent?.includes('已提交') ? 'submitted' :
                       el.textContent?.includes('已批改') ? 'graded' : 'pending';

        if (title && title.length > 2) {
          assignments.push({
            id: hashStr(title),
            courseId: '',
            title,
            deadline,
            status,
            score: null,
            content: '',
            feedback: '',
            fetchedAt: Date.now()
          });
        }
      });
      if (assignments.length > 0) break;
    }
    return assignments;
  },

  // 提取成绩/考试信息
  extractScores() {
    const scores = [];
    const scoreRows = document.querySelectorAll('.score-item, .grade-item, table tr[class*="score"], table tr[class*="grade"]');
    scoreRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        scores.push({
          courseName: cells[0]?.textContent?.trim() || '',
          score: cells[1]?.textContent?.trim() || '',
          type: 'exam'
        });
      }
    });
    return scores;
  }
};

function hashStr(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return 'cx_' + Math.abs(hash).toString(36);
}

// 为 content-script 暴露提取器引用
if (typeof window !== 'undefined') {
  window.__chaoxingExtractor = ChaoxingExtractor;
}
