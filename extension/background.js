// 学伴后台 — 最简版

chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.local.set({ totalCourses: 0, totalAssignments: 0, lastCapture: null });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type === 'DATA_CAPTURED') {
    chrome.storage.local.get(['totalCourses', 'totalAssignments'], function (prev) {
      var c = (prev.totalCourses || 0) + (msg.courseCount || 0);
      var a = (prev.totalAssignments || 0) + (msg.assignmentCount || 0);
      chrome.storage.local.set({
        totalCourses: c,
        totalAssignments: a,
        lastCapture: { platform: msg.platform, count: (msg.courseCount || 0) + (msg.assignmentCount || 0), time: Date.now() }
      });
      if (c + a > 0) {
        chrome.action.setBadgeText({ text: String(Math.min(c + a, 99)) });
        chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
      }
    });
    sendResponse({ status: 'ok' });
    return true;
  }

  if (msg.type === 'GET_STATUS') {
    chrome.storage.local.get(['totalCourses', 'totalAssignments', 'lastCapture'], function (d) {
      sendResponse(d);
    });
    return true;
  }
});
