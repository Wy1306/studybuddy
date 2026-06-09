// AI 调用 — 扩展直接调 DeepSeek API（扩展内无跨域限制）
const AI_CONFIG = { keyPrefix: 'sb_ds_key' };

function getApiKey() {
  try { return localStorage.getItem(AI_CONFIG.keyPrefix) || ''; } catch (_) { return ''; }
}
function setApiKey(key) {
  if (!key || !key.startsWith('sk-')) throw new Error('格式错误，应以 sk- 开头');
  localStorage.setItem(AI_CONFIG.keyPrefix, key);
}
function hasApiKey() { return !!getApiKey(); }

async function aiAnalyze(prompt, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('请先设置 DeepSeek API Key');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout || 60000);

  try {
    const r = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.3,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    });
    if (!r.ok) {
      if (r.status === 401) throw new Error('API Key 无效');
      if (r.status === 429) throw new Error('请求太频繁');
      throw new Error(`API 错误 (${r.status})`);
    }
    const data = await r.json();
    return data.choices[0].message.content;
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('请求超时');
    throw e;
  } finally { clearTimeout(timer); }
}

window.AI = { aiAnalyze, getApiKey, setApiKey, hasApiKey };
