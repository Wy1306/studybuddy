chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.set({ data_courses: [], data_assignments: [], lastCapture: null });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'DATA_CAPTURED') {
    // 合并课程数据（去重）
    chrome.storage.local.get(['data_courses', 'data_assignments'], function (prev) {
      var existingCourses = prev.data_courses || [];
      var existingAssignments = prev.data_assignments || [];
      var newCourses = msg.courses || [];
      var newAssignments = msg.assignments || [];

      // 按 id 去重合并
      var courseMap = {};
      existingCourses.concat(newCourses).forEach(function (c) { courseMap[c.id] = c; });
      var mergedCourses = Object.values(courseMap);

      var assignMap = {};
      existingAssignments.concat(newAssignments).forEach(function (a) { assignMap[a.id] = a; });
      var mergedAssignments = Object.values(assignMap);

      chrome.storage.local.set({
        data_courses: mergedCourses,
        data_assignments: mergedAssignments,
        lastCapture: { platform: msg.platform, count: newCourses.length + newAssignments.length, time: Date.now() }
      });

      var total = mergedCourses.length + mergedAssignments.length;
      if (total > 0) {
        try {
          chrome.action.setBadgeText({ text: String(Math.min(total, 99)) });
          chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
        } catch (_) {}
      }
    });
    sendResponse({ status: 'ok' });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get(['data_courses', 'data_assignments', 'lastCapture'], function (d) {
      sendResponse({ data_courses: d.data_courses, data_assignments: d.data_assignments, lastCapture: d.lastCapture });
    });
    return true;
  }
});
