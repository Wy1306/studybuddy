// 学伴后台 Service Worker
// 管理消息路由、Badge 状态、数据统计

// 监听来自 content-script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DATA_CAPTURED') {
    // 更新扩展图标上的 Badge（显示今日抓取条数）
    const count = message.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: String(Math.min(count, 99)) });
      chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });
    }

    // 存储最近一次抓取信息（popup 会读取）
    chrome.storage.local.set({
      lastCapture: {
        platform: message.platform,
        count,
        time: Date.now()
      }
    });

    sendResponse({ status: 'ok' });
  }

  if (message.type === 'GET_STATUS') {
    chrome.storage.local.get(['lastCapture'], (data) => {
      sendResponse(data.lastCapture || { platform: '暂无', count: 0, time: 0 });
    });
    return true; // 保持消息通道开启（异步回调）
  }
});

// 扩展安装/更新时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    installDate: Date.now(),
    totalCaptures: 0
  });
  console.log('[StudyBuddy] 扩展已安装');
});
