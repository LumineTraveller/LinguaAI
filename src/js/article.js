/* ============================================================
   LinguaAI · article.js
   generateArticle(), makeWords(), setupWordHover(),
   setView(), renderSentencePairs()
   ============================================================ */

function getTargetWords() {
  return parseInt($('lengthVal').value) || 150;
}
function getMaxTok(words) { return Math.round(words * 3.5) + 4000; }

async function generateArticle() {
  if (!getKey()) { showError('请先输入 API Key'); return; }
  const lang = $('targetLang').value, native = $('nativeLang').value, topic = $('customTopic').value.trim();
  const btn = $('generateBtn');
  btn.disabled = true; btn.classList.add('loading');
  btn.childNodes[btn.childNodes.length - 1].textContent = ' 生成中…';
  articleContent = ''; quizData = null; grammarData = null;
  submitted = false; Object.keys(picked).forEach(k => delete picked[k]);

  const targetWords = getTargetWords();
  const tolerance = Math.max(10, Math.round(targetWords * 0.1));
  const wordRange = `${targetWords - tolerance}-${targetWords + tolerance}`;
  const maxTok = getMaxTok(targetWords);
  const topicLine = topic ? `The article must be about: "${topic}".` : `Choose a vivid topic matching the "${currentStyle}" style.`;
  const main = $('main');
  updateCardState(false);
  main.innerHTML = `
    <div class="article-card" id="articleCard">
      <div class="article-meta">
        <span class="meta-badge badge-level">${esc(currentLevel)}</span>
        <span class="meta-badge badge-lang">${esc(lang)}</span>
        <span class="meta-badge badge-style">${esc(currentStyle)}</span>
        <div class="view-toggle" id="viewToggle" style="display:none">
          <button class="view-btn active" onclick="setView('article')">原文</button>
          <button class="view-btn" onclick="setView('both')">双栏</button>
          <button class="view-btn" onclick="setView('parallel')">逐句</button>
        </div>
      </div>
      <div class="article-body single" id="articleBody">
        <div class="text-panel">
          <div class="panel-label">${esc(lang)} 原文</div>
          <div class="article-text${wordModeOn ? ' word-mode-on' : ''}" id="articleText" data-lang="${esc(lang)}" data-native="${esc(native)}"><span class="streaming-indicator"></span></div>
        </div>
        <div class="text-panel" style="display:none">
          <div class="panel-label" id="rightPanelLabel">${esc(native)} 译文</div>
          <div class="translation-text" id="translationText" style="color:var(--text3);font-style:italic">等待原文生成…</div>
        </div>
      </div>
    </div>
    <div id="quizSection"><div class="pending-placeholder">等待生成……</div></div>
    <div id="grammarSection"><div class="pending-placeholder">等待生成……</div></div>`;
  switchView('article');

  try {
    // 1. Article
    const aEl = $('articleText');
    articleContent = await callAPI(
      [{ role: 'user', content: `Write an article (${wordRange} words) in ${lang} at CEFR ${currentLevel}. Style: ${currentStyle}. ${topicLine} Output only the article, no title, no translation.` }],
      `You write natural engaging ${lang} text at CEFR ${currentLevel}. Output only the article text.`,
      true, (_, f) => { aEl.innerHTML = esc(f) + '<span class="streaming-indicator"></span>'; }, maxTok, false, '文章生成'
    );
    aEl.innerHTML = makeWords(articleContent, lang);
    setupWordHover();
    $('viewToggle').style.display = 'flex';
    updateCardState(true);

    // 2. Translation (sentence-pair JSON for parallel view)
    const tEl = $('translationText');
    tEl.removeAttribute('style');
    tEl.innerHTML = '正在翻译…<span class="streaming-indicator"></span>';
    let sentencePairs = [];
    let translation = '';
    try {
      const rawTrans = await callAPI(
        [{ role: 'user', content: `Split the following ${lang} text into individual sentences, then translate each sentence into ${native}. Return ONLY a JSON array, no markdown:\n[{"src":"original sentence","tgt":"translated sentence"},...]\n\nText:\n${articleContent}` }],
        `You are a precise ${native} translator. Split text into sentences and translate each. Return ONLY a JSON array.`,
        false, null, 2000, true, '句对翻译'
      );
      sentencePairs = await parseOrRepairJSON(rawTrans);
      tEl.innerHTML = '正在校对译文…<span class="streaming-indicator"></span>';
      sentencePairs = await reviseSentencePairs(sentencePairs, lang, native);
      translation = sentencePairs.map(p => p.tgt).join(' ');
      currentSentencePairs = sentencePairs;
      tEl.innerHTML = esc(translation);
    } catch {
      // fallback: plain translation
      translation = await callAPI(
        [{ role: 'user', content: `Translate this ${lang} text to ${native}:\n\n${articleContent}` }],
        `Faithful ${native} translator. Output only the translation.`,
        true, (_, f) => { tEl.innerHTML = esc(f) + '<span class="streaming-indicator"></span>'; }, 800, false, '译文兜底'
      );
      tEl.innerHTML = esc(translation);
    }

    // 3. Quiz, then Grammar — sequentially, matching UI order
    await doQuiz(lang, native, articleContent);
    await doGrammar(lang, native, articleContent);

    // 4. Save history
    saveHist({
      lang, native, level: currentLevel, style: currentStyle, model: currentModel,
      article: articleContent, translation, sentencePairs, grammarData, quizData,
      date: new Date().toLocaleString('zh-CN')
    });

  } catch (e) { showError(e.message); }
  finally {
    btn.disabled = false; btn.classList.remove('loading');
    btn.childNodes[btn.childNodes.length - 1].textContent = ' 生成文章';
  }
}

// ─── Clickable words ───
function makeWords(text, lang) {
  return text.replace(/([^\s\p{P}]+)/gu, m => `<span class="word" data-word="${escA(m)}">${esc(m)}</span>`);
}

function setupWordHover() { setupWordHoverIn($('articleText')); }

function setupWordHoverIn(container) {
  container.addEventListener('mouseover', e => {
    if (!wordModeOn) return;
    const w = e.target.closest('.word'); if (!w) return;
    clearTimeout(tooltipTimer);
    tooltipTimer = setTimeout(() => showTip(w), 650);
  });
  container.addEventListener('mouseout', e => {
    if (!e.target.closest('.word')) return;
    clearTimeout(tooltipTimer); tooltipTimer = setTimeout(hideTip, 380);
  });
}

async function showTip(el) {
  const word = el.dataset.word;
  // Read lang/native from the article container, not the sidebar dropdowns
  const articleEl = $('articleText');
  const lang = articleEl.dataset.lang || $('targetLang').value;
  const native = articleEl.dataset.native || $('nativeLang').value;
  const cacheKey = `${lang}::${word}`;
  const rect = el.getBoundingClientRect();
  const tt = $('tooltip');
  $('ttWord').textContent = word;
  $('ttPos').textContent = ''; $('ttDef').textContent = '';
  const tg = $('ttGender'); tg.textContent = ''; tg.className = 'gender-badge gb-hide';
  $('ttLoading').textContent = '查询中…';
  tt.style.top = (rect.bottom + 6) + 'px';
  tt.style.left = Math.min(rect.left, window.innerWidth - 255) + 'px';
  tt.classList.add('show');

  if (tooltipCache[cacheKey]) { applyTip(tooltipCache[cacheKey], lang); return; }
  try {
    if (!getKey()) { $('ttLoading').textContent = '需要 API Key'; return; }
    const gNote = isGendered(lang) ? `If the word is a noun, set "gender" to "m","f", or "n". Otherwise "none".` : `Set "gender":"none".`;
    const raw = await callAPI(
      [{ role: 'user', content: `Define the ${lang} word: "${word}"\n${gNote}\nReturn ONLY JSON: {"pos":"${native} part of speech","gender":"m|f|n|none","definition":"brief meaning in ${native}","example":"short ${lang} example"}` }],
      `${lang} vocabulary definer for ${native} speakers. ONLY JSON.`,
      false, null, 300, false, `词汇:${word}`
    );
    const result = await parseOrRepairJSON(raw);
    tooltipCache[cacheKey] = result;
    applyTip(result, lang);
  } catch { $('ttLoading').textContent = '查询失败'; }
}

function applyTip(d, lang) {
  $('ttPos').textContent = d.pos || '';
  $('ttDef').textContent = (d.definition || '') + (d.example ? '\n例: ' + d.example : '');
  $('ttLoading').textContent = '';
  const gd = GENDER_LANGS[lang];
  const tg = $('ttGender');
  if (gd && d.gender && d.gender !== 'none') {
    const lbl = gd[d.gender] || d.gender;
    tg.textContent = lbl;
    tg.className = 'gender-badge ' + (d.gender === 'm' ? 'gb-m' : d.gender === 'f' ? 'gb-f' : 'gb-n');
  }
}

function hideTip() { $('tooltip').classList.remove('show'); }

// ─── View ───
function buildParallelHTML(pairs, lang, native) {
  if (!pairs || !pairs.length) return `<div style="color:var(--text3);font-size:12px;padding:1.2rem">逐句数据不可用（旧版历史记录无此格式）</div>`;
  const rows = pairs.map(p => `
    <div class="parallel-pair">
      <div class="parallel-cell src">${makeWords(p.src || '', lang)}</div>
      <div class="parallel-cell tgt">${esc(p.tgt || '')}</div>
    </div>`).join('');
  return `
    <div class="parallel-header">
      <div class="parallel-header-cell">${esc(lang)} 原文</div>
      <div class="parallel-header-cell">${esc(native)} 译文</div>
    </div>
    <div class="parallel-body">${rows}</div>`;
}

function setView(mode) {
  const card = $('articleCard');
  const body = $('articleBody');
  if (!card || !body) return;  // no article generated yet
  document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
  const btns = document.querySelectorAll('.view-btn');

  // Always remove parallel overlay if switching away
  const existing = card.querySelector('.parallel-overlay');
  if (existing) existing.remove();
  body.style.display = '';

  if (mode === 'both') {
    body.className = 'article-body';
    body.children[0].style.display = '';
    body.children[1].style.display = '';
    btns[1].classList.add('active');

  } else if (mode === 'article') {
    body.className = 'article-body single';
    body.children[0].style.display = '';
    body.children[1].style.display = 'none';
    btns[0].classList.add('active');

  } else if (mode === 'parallel') {
    // Hide the two-panel body, inject a full-width parallel overlay
    body.style.display = 'none';
    const aEl = $('articleText');
    const lang = aEl ? aEl.dataset.lang || '' : '';
    const native = aEl ? aEl.dataset.native || '' : '';
    const overlay = document.createElement('div');
    overlay.className = 'parallel-overlay';
    overlay.innerHTML = buildParallelHTML(currentSentencePairs, lang, native);
    card.appendChild(overlay);
    setupWordHoverIn(overlay);
    btns[2].classList.add('active');
  }
}
