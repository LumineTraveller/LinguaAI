/* ============================================================
   LinguaAI · api.js
   callAPI(), SSE streaming, tryParse(), parseOrRepairJSON()
   Also contains: $ helper, esc helpers, key helpers
   ============================================================ */

// ─── DOM helper ───
const $ = id => document.getElementById(id);

// ─── HTML escape helpers ───
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function escA(s) { return String(s).replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

// ─── Constants ───
const HIST_KEY = 'linguaai_v2_history';

const PROVIDERS = {
  deepseek: { name: 'DeepSeek', url: 'https://api.deepseek.com/chat/completions', models: ['deepseek-v4-flash', 'deepseek-v4-pro'], placeholder: 'sk-...', type: 'openai' },
};
const currentProvider = 'deepseek';

const WORDS_MIN = 100, WORDS_MAX = 800;

// ─── Key helpers ───
function getKey() {
  return localStorage.getItem(`linguaai_key_${currentProvider}`) || $('apiKey').value.trim();
}
function saveKey() {
  localStorage.setItem(`linguaai_key_${currentProvider}`, $('apiKey').value.trim());
  checkKey();
}
function checkKey() {
  $('apiStatus').className = 'api-status' + (getKey().length > 10 ? ' ok' : '');
}

// ─── Debug log ───
const debugLog = [];
function debugAppend(label, raw) {
  const ts = new Date().toLocaleTimeString('zh-CN');
  debugLog.push({ ts, label, raw });
  const panel = $('debugPanel');
  if (!panel) return;
  const id = 'dbgb' + debugLog.length;
  const entry = document.createElement('div');
  entry.className = 'dbg-entry';
  entry.innerHTML =
    `<div class="dbg-hdr" onclick="var b=document.getElementById('${id}'),a=this.querySelector('.dbg-arr');b.classList.toggle('open');a.classList.toggle('open')">` +
    `<span class="dbg-lbl">${esc(label)}</span>` +
    `<span class="dbg-ts">${ts}</span>` +
    `<span class="dbg-len">${raw.length} 字符</span>` +
    `<span class="dbg-arr">▶</span>` +
    `</div>` +
    `<div class="dbg-body" id="${id}"><pre class="dbg-raw">${esc(raw)}</pre></div>`;
  panel.appendChild(entry);
  if (typeof debugVisible !== 'undefined' && debugVisible) panel.scrollTop = panel.scrollHeight;
}

// ─── API ───
async function callAPI(messages, sys, stream, onChunk, maxTok = 1000, jsonMode = false, label = '') {
  const key = getKey();
  if (!key) throw new Error('请先输入 API Key');
  const provider = PROVIDERS[currentProvider];

  // ── DeepSeek / OpenAI 兼容接口 ──
  const msgs = sys ? [{ role: 'system', content: sys }, ...messages] : messages;
  const body = { model: currentModel, max_tokens: maxTok, messages: msgs, stream: !!stream, thinking: { type: 'disabled' } };
  if (jsonMode) body.response_format = { type: 'json_object' };
  const resp = await fetch(provider.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const e = await resp.json().catch(() => ({}));
    throw new Error(e.error?.message || `API 错误 ${resp.status}`);
  }
  if (stream) {
    const reader = resp.body.getReader(), dec = new TextDecoder();
    let full = '', rawBody = '', buf = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        rawBody += chunk;
        buf += chunk;
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const delta = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content;
              if (delta) { full += delta; onChunk && onChunk(delta, full); }
            } catch { }
          }
        }
      }
    } finally {
      debugAppend(label || 'stream', rawBody);
    }
    return full;
  } else {
    const rawText = await resp.text();
    debugAppend(label || 'json', rawText);
    return JSON.parse(rawText).choices[0].message.content;
  }
}

// ─── JSON parse helper (with AI-assisted repair) ───
function tryParse(text) {
  let s = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(s); } catch { }
  const m = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (m) { try { return JSON.parse(m[1]); } catch { } }
  return null;
}

async function parseOrRepairJSON(raw) {
  // Pass 1: local strip + regex extraction
  const r1 = tryParse(raw);
  if (r1 !== null) return r1;

  // Pass 2: ask the model to fix the broken JSON (one retry)
  let fixed;
  try {
    fixed = await callAPI(
      [{ role: 'user', content: `The following output should be valid JSON but contains syntax errors. Return ONLY the corrected JSON — no explanation, no markdown fences:\n\n${raw.slice(0, 3000)}` }],
      'You are a JSON repair assistant. Output only valid JSON, nothing else.',
      false, null, 2500, false, 'JSON修复'
    );
  } catch (e) {
    throw new Error(`JSON 解析失败（修复请求也出错）\n原始回复: ${raw.slice(0, 200)}`);
  }

  const r2 = tryParse(fixed);
  if (r2 !== null) return r2;

  throw new Error(`JSON 解析失败（修复后仍无效）\n原始回复: ${raw.slice(0, 200)}`);
}

// ─── Translation revision helper ───
async function reviseSentencePairs(pairs, lang, native) {
  const pairsJson = JSON.stringify(pairs);
  const revised = await callAPI(
    [{ role: 'user', content: `You are a professional ${native} translator reviewing a sentence-by-sentence translation of a ${lang} text.\n\nReview each translation for accuracy, naturalness and completeness. Fix any errors, awkward phrasing or omissions. Keep the same JSON structure.\n\nReturn ONLY the corrected JSON array (no markdown, no explanation):\n[{"src":"original ${lang} sentence","tgt":"revised ${native} translation"},...]\n\nOriginal pairs:\n${pairsJson}` }],
    `Expert ${lang}→${native} translation revisor. Return ONLY valid JSON array.`,
    false, null, 2500, true, '译文校对'
  );
  try {
    return await parseOrRepairJSON(revised);
  } catch {
    return pairs; // fallback: keep original if revision itself breaks
  }
}

// ─── Error toast ───
function showError(msg) {
  const existing = document.querySelector('.toast-error');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast-error';
  toast.innerHTML = `<span class="toast-icon">⚠</span><span class="toast-msg">${esc(msg)}</span><button class="toast-close" aria-label="关闭">✕</button>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  const dismiss = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 280);
  };
  toast.querySelector('.toast-close').addEventListener('click', dismiss);
  setTimeout(dismiss, 5000);
}
