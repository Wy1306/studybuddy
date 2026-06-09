// Markdown 渲染器 — 将 AI 返回的文本转为 HTML

function markdownToHtml(text) {
  if (!text) return '';
  let html = text;

  // 保护代码块
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push(`<pre><code>${escapeHtml(code.trim())}</code></pre>`);
    return `%%CB${codeBlocks.length - 1}%%`;
  });

  // 保护内联代码
  const inlineCodes = [];
  html = html.replace(/`([^`]+)`/g, (_, code) => {
    inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
    return `%%IC${inlineCodes.length - 1}%%`;
  });

  // 标题
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');

  // 粗体
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // 无序列表
  const listItems = [];
  html = html.replace(/^[\-\*] (.+)$/gm, (_, item) => {
    const idx = listItems.length;
    listItems.push(item);
    return `%%LI${idx}%%`;
  });
  html = html.replace(/(%%LI\d+%%\n?)+/g, (match) => {
    return '<ul>' + match.replace(/%%LI(\d+)%%\n?/g, (_, idx) => `<li>${listItems[parseInt(idx)]}</li>`) + '</ul>';
  });

  // 段落
  html = html.replace(/\n\n+/g, '</p><p>');
  html = '<p>' + html + '</p>';
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<(h[2-4]|ul)>)/g, '$1');
  html = html.replace(/(<\/(h[2-4]|ul)>)<\/p>/g, '$1');

  // 恢复代码
  codeBlocks.forEach((block, i) => { html = html.replace(`%%CB${i}%%`, block); });
  inlineCodes.forEach((code, i) => { html = html.replace(`%%IC${i}%%`, code); });

  // 清理残余标记
  html = html.replace(/<p><\/p>/g, '');
  html = html.replace(/\n/g, '<br>');

  return html;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
  return text.replace(/[&<>"]/g, c => map[c]);
}

function showResult(containerId, content, isError = false) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = 'block';
  if (isError) {
    el.innerHTML = `<div class="result-error">${content}</div>`;
  } else {
    el.innerHTML = markdownToHtml(content);
  }
}

function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<div class="loading-spinner">⏳ AI 分析中...</div>';
}

function hideResult(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.style.display = 'none';
}
