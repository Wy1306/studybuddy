// StudyBuddy 扩展自动化测试
// 启动带扩展的 Chromium → 访问模拟学习通页面 → 验证数据抓取

import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '..', 'extension');
const mockPage = path.resolve(__dirname, 'mock-chaoxing.html');

const TEST_TIMEOUT = 30000;

async function main() {
  console.log('=== StudyBuddy 扩展自动化测试 ===\n');

  // 验证扩展目录存在
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    console.error('❌ 扩展目录不存在: ' + extensionPath);
    process.exit(1);
  }
  console.log('✅ 扩展目录: ' + extensionPath);

  // 验证测试页面存在
  if (!fs.existsSync(mockPage)) {
    console.error('❌ 测试页面不存在: ' + mockPage);
    process.exit(1);
  }
  console.log('✅ 测试页面: ' + mockPage);

  let browser;
  try {
    // 启动 Chromium，加载扩展
    console.log('\n🚀 启动 Chromium + 加载扩展...');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // 获取扩展 ID
    const serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    const extensionId = serviceWorker.url().split('/')[2];
    console.log('✅ 扩展ID: ' + extensionId);
    console.log('✅ Service Worker URL: ' + serviceWorker.url());

    // 等待扩展完全加载
    await new Promise(r => setTimeout(r, 2000));

    // 打开模拟学习通页面
    console.log('\n📄 打开模拟学习通页面...');
    const page = await context.newPage();

    // 收集 Console 日志
    const logs = [];
    page.on('console', msg => {
      if (msg.text().includes('[StudyBuddy]') || msg.text().includes('Error')) {
        logs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });

    await page.goto('file:///' + mockPage.replace(/\\/g, '/'), { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('✅ 页面加载完成');

    // 等待内容脚本执行
    await new Promise(r => setTimeout(r, 3000));

    // 输出来自扩展的 Console 日志
    console.log('\n📋 扩展日志:');
    logs.forEach(l => console.log('  ' + l));
    if (logs.length === 0) {
      console.log('  ⚠️ 没有检测到 [StudyBuddy] 日志!');
      console.log('  可能是 Service Worker 未正常加载');
    }

    // 截图
    await page.screenshot({ path: 'tests/screenshots/page.png', fullPage: true });
    console.log('\n📸 页面截图: tests/screenshots/page.png');

    // 检查 chrome.storage.local
    console.log('\n🔍 检查扩展存储...');
    const extPage = await context.newPage();
    // 通过扩展页面注入检查 storage
    const storageResult = await extPage.evaluate(async () => {
      try {
        // 尝试通过 chrome.storage 检查（需要扩展上下文）
        return { note: '需要在扩展页面中检查，这里无法直接访问 chrome.storage' };
      } catch (e) {
        return { error: e.message };
      }
    });
    console.log('  存储状态: ' + JSON.stringify(storageResult));

    // 尝试打开扩展 popup
    console.log('\n📋 打开扩展弹窗...');
    const popup = await context.newPage();
    await popup.setViewportSize({ width: 340, height: 500 });

    try {
      await popup.goto(`chrome-extension://${extensionId}/popup/popup.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 5000
      });
      // 等待弹窗逻辑执行
      await new Promise(r => setTimeout(r, 1000));
      const popupContent = await popup.textContent('body');
      console.log('  弹窗内容: ' + popupContent.slice(0, 500));
      await popup.screenshot({ path: 'tests/screenshots/popup.png' });
      console.log('  📸 弹窗截图: tests/screenshots/popup.png');
    } catch (e) {
      console.log('  ⚠️ 无法打开弹窗: ' + e.message);
    }

    // Open extension management page to check status
    console.log('\n🔧 检查扩展状态...');
    const extMgmt = await context.newPage();
    await extMgmt.goto('chrome://extensions/', { waitUntil: 'domcontentloaded', timeout: 5000 });
    await extMgmt.screenshot({ path: 'tests/screenshots/extensions.png' });
    console.log('  📸 扩展管理页截图: tests/screenshots/extensions.png');

    // Summary
    const studyBuddyLogs = logs.filter(l => l.includes('[StudyBuddy]'));
    if (studyBuddyLogs.length > 0) {
      console.log('\n✅ 测试通过! 扩展成功运行并输出了日志。');
    } else {
      console.log('\n❌ 测试失败! 扩展未输出 [StudyBuddy] 日志。');
      console.log('  可能原因: Service Worker 加载失败 / 内容脚本未注入');
    }

    // 保持浏览器打开 30 秒以便手动检查
    console.log('\n⏳ 浏览器保持打开 5 秒后关闭...');
    await new Promise(r => setTimeout(r, 5000));

    await context.close();
    console.log('✅ 测试完成');
  } catch (err) {
    console.error('\n❌ 测试失败: ' + err.message);
    if (browser) await browser.close();
    process.exit(1);
  }
}

// 创建截图目录
fs.mkdirSync('tests/screenshots', { recursive: true });

main();
