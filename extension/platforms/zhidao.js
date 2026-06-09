// 知到（智慧树）数据提取器
// 提取课程、网课进度、章节测验等

const ZhidaoExtractor = {
  platform: 'zhidao',
  platformName: '知到',

  extractCourses() {
    const courses = [];
    const selectors = ['.course-item', '.course-card', '.my-course-item', '[class*="courseItem"]', '.course-list li'];

    for (const sel of selectors) {
      const elements = document.querySelectorAll(sel);
      if (elements.length > 0) {
        elements.forEach(el => {
          const name = el.querySelector('.course-name, .course-title, h3, h4, a')?.textContent?.trim();
          const teacher = el.querySelector('.teacher-name, .instructor, .teacher')?.textContent?.trim();
          const progress = el.querySelector('.progress-text, .study-progress, [class*="progress"]')?.textContent?.trim();
          const courseUrl = el.querySelector('a')?.href || '';

          if (name && name.length > 1) {
            courses.push({
              id: 'zd_' + hashStr(courseUrl || name),
              platform: 'zhidao',
              courseName: name,
              teacher: teacher || '',
              courseUrl,
              semester: progress ? `学习进度: ${progress}` : '',
              materials: [],
              fetchedAt: Date.now()
            });
          }
        });
        break;
      }
    }
    return courses;
  },

  extractAssignments() {
    const assignments = [];
    const selectors = ['.exam-item', '.test-item', '.homework-item', '.task-item', 'a[href*="exam"]', 'a[href*="test"]'];

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        const title = el.querySelector('.title, .exam-title, a')?.textContent?.trim() || el.textContent?.trim();
        const deadline = el.querySelector('.deadline, .end-time, .endTime')?.textContent?.trim() || '';
        const status = el.textContent?.includes('已完成') ? 'submitted' :
                       el.textContent?.includes('未开始') ? 'pending' : 'pending';

        if (title && title.length > 2) {
          assignments.push({
            id: 'zd_' + hashStr(title),
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
  window.__zhidaoExtractor = ZhidaoExtractor;
}
