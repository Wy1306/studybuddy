chrome.runtime.onInstalled.addListener(function () {
  console.log('StudyBuddy installed');
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'DATA_CAPTURED') {
    chrome.storage.local.set({
      totalCourses: msg.courseCount || 0,
      totalAssignments: msg.assignmentCount || 0,
      lastCapture: { platform: msg.platform, count: (msg.courseCount || 0) + (msg.assignmentCount || 0), time: Date.now() }
    });
    sendResponse({ status: 'ok' });
  }
  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get(['totalCourses', 'totalAssignments', 'lastCapture'], function (d) {
      sendResponse(d);
    });
    return true;
  }
});
