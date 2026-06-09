chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({ totalCourses: 0, totalAssignments: 0, lastCapture: null });
  console.log('[StudyBuddy] 扩展已安装');
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'DATA_CAPTURED') {
    chrome.storage.local.get(['totalCourses', 'totalAssignments'], function(data) {
      var newCourses = (data.totalCourses || 0) + (message.courseCount || 0);
      var newAssignments = (data.totalAssignments || 0) + (message.assignmentCount || 0);

      chrome.storage.local.set({
        totalCourses: newCourses,
        totalAssignments: newAssignments,
        lastCapture: {
          platform: message.platform,
          count: (message.courseCount || 0) + (message.assignmentCount || 0),
          time: Date.now()
        }
      });

      var total = newCourses + newAssignments;
      if (total > 0) {
        chrome.action.setBadgeText({ text: String(Math.min(total, 99)) });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      }
    });
    sendResponse({ status: 'ok' });
  }

  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['totalCourses', 'totalAssignments', 'lastCapture'], function(data) {
      sendResponse(data);
    });
    return true;
  }

  if (message.type === 'RESET_STATS') {
    chrome.storage.local.set({ totalCourses: 0, totalAssignments: 0, lastCapture: null });
    chrome.action.setBadgeText({ text: '' });
    sendResponse({ status: 'ok' });
  }
});
