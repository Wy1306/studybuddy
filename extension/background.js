chrome.runtime.onInstalled.addListener(function() {
  console.log('[StudyBuddy] 扩展已安装');
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'DATA_CAPTURED') {
    var count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(Math.min(count, 99)) });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    }
    chrome.storage.local.set({
      lastCapture: { platform: message.platform, count: count, time: Date.now() }
    });
    sendResponse({ status: 'ok' });
  }
  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['lastCapture'], function(data) {
      sendResponse(data.lastCapture || { platform: '暂无', count: 0, time: 0 });
    });
    return true;
  }
});
