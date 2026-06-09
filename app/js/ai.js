// AI 调用统一接口 — 封装 DeepSeek API 请求
// 通过 Vercel Serverless 转发，Key 从浏览器 localStorage 读取

const AI_CONFIG = {
  apiEndpoint: '/api/analyze',
  keyPrefix: 'sb_ds_key'
};

function getApiKey() {
  return localStorage.getItem(AI_CONFIG.keyPrefix) || '';
}

function setApiKey(key) {
  if (!key || !key.startsWith('sk-')) {
    throw new Error('API Key 格式错误，应以 sk- 开头');
  }
  localStorage.setItem(AI_CONFIG.keyPrefix, key);
}

function hasApiKey() {
  return !!getApiKey();
}

async function aiAnalyze(prompt, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('请先设置 DeepSeek API Key');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || 60000);

  try {
    const response = await fetch(AI_CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify({
        prompt,
        mode: options.mode || 'general',
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 4096
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('API Key 无效，请检查后在设置中更新');
      }
      if (response.status === 429) {
        throw new Error('请求太频繁，请稍后再试');
      }
      throw new Error(err.error || `请求失败 (${response.status})`);
    }

    const data = await response.json();
    return data.result;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('请求超时，请检查网络连接');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// 缓存层 — 避免重复分析相同内容
const analysisCache = new Map();

async function aiAnalyzeWithCache(key, prompt, options = {}) {
  if (analysisCache.has(key)) {
    return analysisCache.get(key);
  }
  const result = await aiAnalyze(prompt, options);
  analysisCache.set(key, result);
  // 限制缓存大小
  if (analysisCache.size > 50) {
    const firstKey = analysisCache.keys().next().value;
    analysisCache.delete(firstKey);
  }
  return result;
}

window.AI = { aiAnalyze, aiAnalyzeWithCache, getApiKey, setApiKey, hasApiKey };
