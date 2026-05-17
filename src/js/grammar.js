/* ============================================================
   LinguaAI · grammar.js
   doGrammar(), renderGrammar(), isGendered(), GENDER_LANGS
   ============================================================ */

// Languages with grammatical gender
const GENDER_LANGS = {
  French: { m: 'masc.', f: 'fém.', n: null, label: '法语性别' },
  German: { m: 'mask.', f: 'fem.', n: 'neutr.', label: '德语性' },
  Spanish: { m: 'masc.', f: 'fem.', n: null, label: '西语性别' },
  Italian: { m: 'masc.', f: 'femm.', n: null, label: '意语性别' },
  Portuguese: { m: 'masc.', f: 'fem.', n: null, label: '葡语性别' },
  Russian: { m: 'м.р.', f: 'ж.р.', n: 'ср.р.', label: '俄语性' },
  Arabic: { m: 'مذ.', f: 'مؤ.', n: null, label: '阿语性别' },
  Dutch: { m: 'de(男)', f: 'de(女)', n: 'het', label: '荷语性' },
};

function isGendered(lang) { return !!GENDER_LANGS[lang]; }

const noData = '<div style="color:var(--text3);font-size:12px">暂无</div>';

// ─── Grammar & Vocab ───
async function doGrammar(lang, native, article) {
  const gs = $('grammarSection');
  gs.innerHTML = `<div class="loading-placeholder"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span><span style="margin-left:12px;color:var(--text3);font-size:17px">正在分析语法和词汇…</span></div>`;
  const gNote = isGendered(lang)
    ? `For nouns in vocabulary, include their grammatical gender: "m" (masculine), "f" (feminine)${GENDER_LANGS[lang].n ? ', "n" (neuter)' : ''}, or "none".`
    : `Set gender to "none" for all vocabulary items.`;
  try {
    const raw = await callAPI(
      [{ role: 'user', content: `Analyze this ${lang} article for a CEFR ${currentLevel} learner studying ${lang} as a ${native} speaker.\n${gNote}\n\nArticle:\n${article}\n\nReturn ONLY this JSON (no markdown, no backticks):\n{"grammar":[{"point":"grammar point name in ${native}","explanation":"brief explanation in ${native}","example":"example from the article in ${lang}"}],"vocabulary":[{"word":"word in ${lang}","gender":"m|f|n|none","pos":"part of speech in ${native}","definition":"meaning in ${native}"}]}\n\nProvide 4-6 grammar points and 6-10 key vocabulary items.` }],
      `You are a ${lang} teacher. Return ONLY valid JSON, no markdown.`,
      false, null, 2000, true, '语法词汇'
    );
    grammarData = await parseOrRepairJSON(raw);
    renderGrammar(grammarData, lang);
  } catch (e) {
    gs.innerHTML = `<div class="grammar-card"><div class="error-msg" style="margin:1rem">语法分析失败：${esc(e.message)}</div></div>`;
  }
}

function renderGrammar(data, lang) {
  const gs = $('grammarSection');
  const gd = GENDER_LANGS[lang] || null;

  const gItems = (data.grammar || []).map(g => `
    <div class="grammar-item">
      <div class="gi-term">${esc(g.point)}</div>
      <div class="gi-desc">${esc(g.explanation)}</div>
      ${g.example ? `<div class="gi-ex">${esc(g.example)}</div>` : ''}
    </div>`).join('');

  const vItems = (data.vocabulary || []).map(v => {
    let badge = '';
    if (gd && v.gender && v.gender !== 'none') {
      const lbl = gd[v.gender] || v.gender;
      const cls = v.gender === 'm' ? 'gb-m' : v.gender === 'f' ? 'gb-f' : 'gb-n';
      badge = `<span class="gender-badge ${cls}">${esc(lbl)}</span>`;
    }
    return `<div class="vocab-item">
      <div class="vocab-top"><span class="vocab-word">${esc(v.word)}</span>${badge}<span class="vocab-pos">${esc(v.pos || '')}</span></div>
      <div class="vocab-def">${esc(v.definition)}</div>
    </div>`;
  }).join('');

  const vocabTitle = gd ? `重点词汇 <span style="font-size:9px;font-weight:400;color:var(--text3)">(含词性别)</span>` : '重点词汇';
  gs.innerHTML = `
    <div class="section-card grammar-card">
      <div class="section-card-header" onclick="toggleSection('grammarBody','grammarArrow')">
        <div class="section-card-icon grammar-icon">📚</div>
        <div class="section-card-title">语法要点 · 重点词汇</div>
        <span class="section-card-arrow open" id="grammarArrow">▼</span>
      </div>
      <div class="section-card-body" id="grammarBody">
        <div class="grammar-section">
          <div class="gs-title">语法要点</div>
          <div class="grammar-list">${gItems || noData}</div>
        </div>
        <div class="grammar-section">
          <div class="gs-title">${vocabTitle}</div>
          <div class="vocab-grid">${vItems || noData}</div>
        </div>
      </div>
    </div>`;
}
