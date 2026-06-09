// Vercel Serverless Function — DeepSeek API 透明代理
// 不存储、不记录、不处理任何用户数据。仅做请求转发。

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, temperature, maxTokens } = req.body;
  const apiKey = req.headers['x-api-key'];

  if (!prompt) return res.status(400).json({ error: '缺少 prompt' });
  if (!apiKey) return res.status(400).json({ error: '缺少 API Key' });

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        max_tokens: maxTokens || 4096,
        temperature: temperature || 0.3,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: `DeepSeek API (${response.status}): ${text}` });
    }

    const data = await response.json();
    return res.status(200).json({ result: data.choices[0].message.content });
  } catch (err) {
    return res.status(500).json({ error: `代理请求失败: ${err.message}` });
  }
}
