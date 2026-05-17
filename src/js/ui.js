/* ============================================================
   LinguaAI · ui.js
   Global state, theme, collapse, switchView, setMode,
   toggles, debug panel, providers/models, init
   ============================================================ */

// ─── Global shared state ───
let currentModel = '';
let currentLevel = 'B1';
let currentStyle = '日常生活';
let wordModeOn = true;
let articleContent = '';
let quizData = null;
let grammarData = null;
let tooltipTimer = null;
const tooltipCache = {};
let currentSentencePairs = [];
let quizCount = 4;
const QUIZ_MIN = 1, QUIZ_MAX = 20;
const RATIO_CAUTION = 25, RATIO_DANGER = 12;
const picked = {};
let submitted = false;
let currentMode = 'focus';
let themeColor = 'blue';   // 'blue' | 'purple'
let themeMode = 'dark';    // 'dark' | 'light'
let debugVisible = false;
let leftOpen = true;
let rightOpen = true;
const LEVEL_INDEX = { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4, C2: 5 };

// ─── Provider / Model ───
function setProvider(provider) {
  const p = PROVIDERS[provider];
  const stored = localStorage.getItem(`linguaai_model_${provider}`);
  currentModel = (stored && p.models.includes(stored)) ? stored : p.models[0];
  $('apiModelSelect').innerHTML = p.models.map(m =>
    `<option value="${m}"${m === currentModel ? ' selected' : ''}>${m}</option>`).join('');
  $('apiKey').value = getKey();
  checkKey();
}

function setModel(model) {
  currentModel = model;
  localStorage.setItem(`linguaai_model_${currentProvider}`, model);
}

// ─── Length slider ───
function updateLengthLabel() {
  // slider moved → sync the number input
  const v = parseInt($('lengthSlider').value);
  $('lengthVal').value = v;
  checkQuizWarn();
}

function onLengthChange() {
  // number input changed → clamp then sync slider
  let v = parseInt($('lengthVal').value);
  if (isNaN(v) || v < WORDS_MIN) v = WORDS_MIN;
  if (v > WORDS_MAX) v = WORDS_MAX;
  $('lengthVal').value = v;
  $('lengthSlider').value = v;
  checkQuizWarn();
}

// ─── Quiz count ───
function changeQuizCount(delta) {
  quizCount = Math.min(QUIZ_MAX, Math.max(QUIZ_MIN, quizCount + delta));
  $('quizCountVal').textContent = quizCount;
  $('quizCountDec').disabled = quizCount <= QUIZ_MIN;
  $('quizCountInc').disabled = quizCount >= QUIZ_MAX;
  checkQuizWarn();
}

function checkQuizWarn() {
  const words = parseInt($('lengthVal').value) || 150;
  const ratio = words / quizCount;
  const warn = $('quizWarn');
  const txt = $('quizWarnText');
  // estimate quiz tokens: ~200 base + 120 per question
  const quizTok = 200 + quizCount * 120;

  if (ratio < RATIO_DANGER) {
    warn.className = 'quiz-warn lvl-danger show';
    txt.textContent = `文章仅 ${words} 词，每题平均只有 ${ratio.toFixed(0)} 词内容可参考，题目质量会明显下降，且测验将消耗约 ${quizTok} token，请减少题目数量或增加文章长度。`;
  } else if (ratio < RATIO_CAUTION) {
    warn.className = 'quiz-warn lvl-caution show';
    txt.textContent = `文章约 ${words} 词，每题平均 ${ratio.toFixed(0)} 词，部分题目可能重复或质量偏低。测验预计消耗约 ${quizTok} token。`;
  } else {
    warn.className = 'quiz-warn';
  }
}

// ─── Lang change ───
function onLangChange() { Object.keys(tooltipCache).forEach(k => delete tooltipCache[k]); }

// ─── Word mode toggle ───
function updateWordMode() {
  wordModeOn = $('wordModeToggle').checked;
  document.querySelectorAll('.article-text').forEach(el => {
    el.classList.toggle('word-mode-on', wordModeOn);
  });
}

// ─── Level ───
function initLevelBtns() {
  document.querySelectorAll('.level-btn').forEach(b => b.addEventListener('click', function () {
    document.querySelectorAll('.level-btn').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    currentLevel = this.dataset.level;
    // animate sliding pill
    const grid = this.parentElement;
    grid.style.setProperty('--level-index', LEVEL_INDEX[currentLevel]);
  }));
}

// ─── Custom select (学习语言 / 译文语言) ───
function toggleCS(e, id) {
  e.stopPropagation();
  const el = document.getElementById(id);
  // close other open custom-selects
  document.querySelectorAll('.custom-select.open').forEach(o => { if (o !== el) o.classList.remove('open'); });
  el.classList.toggle('open');
}

function selectCS(id, opt) {
  const el = document.getElementById(id);
  el.querySelectorAll('.cs-option').forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  el.querySelector('.cs-header-text').textContent = opt.textContent;
  const targetId = el.dataset.target;
  const hidden = document.getElementById(targetId);
  const prev = hidden.value;
  hidden.value = opt.dataset.value;
  el.classList.remove('open');
  // optional callback (e.g. onLangChange)
  const cb = el.dataset.callback;
  if (cb && prev !== hidden.value && typeof window[cb] === 'function') window[cb]();
}

// ─── Style dropdown ───
function toggleStyleList() {
  $('styleHeader').classList.toggle('open');
  $('styleList').classList.toggle('open');
}

function selectStyle(el) {
  document.querySelectorAll('.style-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  const isCustom = el.dataset.style === 'custom';
  $('styleCustomRow').style.display = isCustom ? 'block' : 'none';
  if (!isCustom) {
    currentStyle = el.dataset.style;
    $('styleHeaderText').textContent = currentStyle;
    $('styleHeader').classList.remove('open');
    $('styleList').classList.remove('open');
  } else {
    const v = $('styleCustomInput').value;
    currentStyle = v || '自定义风格';
    $('styleHeaderText').textContent = v || '其他（自定义）';
  }
}

function onCustomStyle() {
  const v = $('styleCustomInput').value.trim();
  currentStyle = v || '自定义风格';
  $('styleHeaderText').textContent = v || '其他（自定义）';
}

// ─── Mode (study / focus) ───
function setMode(mode) {
  currentMode = mode;
  const isFocus = mode === 'focus';

  // body class
  document.body.classList.toggle('focus-mode', isFocus);

  // button active states
  $('modeStudyBtn').className = 'mode-btn' + (isFocus ? '' : ' active');
  $('modeFocusBtn').className = 'mode-btn' + (isFocus ? ' focus-active active' : '');

  // word hover toggle — force off in focus, restore in study
  const toggle = $('wordModeToggle');
  if (isFocus) {
    toggle.checked = false;
    updateWordMode();
  } else {
    toggle.checked = true;
    updateWordMode();
  }

  // Disable grammar card in focus mode; re-enable in study (if article exists)
  const grammarCard = $('tcGrammar');
  if (grammarCard) grammarCard.classList.toggle('disabled', isFocus || !articleContent);

  // In focus mode: if grammar view is active, switch back to article
  if (isFocus) {
    const main = $('main');
    if (main && main.classList.contains('mid-view-grammar')) {
      switchView('article');
    } else if ($('articleBody')) {
      setView('article');
    }
  }
}

// ─── Collapsible sections ───
function toggleSection(bodyId, arrowId) {
  const body = document.getElementById(bodyId);
  const arrow = document.getElementById(arrowId);
  if (!body) return;
  body.classList.toggle('collapsed');
  if (arrow) arrow.classList.toggle('open');
}

// ─── Debug panel ───
function toggleDebug() {
  debugVisible = !debugVisible;
  const wrap = $('debugWrap');
  const btn = $('debugToggleBtn');
  if (wrap) wrap.style.display = debugVisible ? 'block' : 'none';
  if (btn) btn.style.background = debugVisible ? 'var(--accent-bg)' : '';
}

function clearDebug() {
  debugLog.length = 0;
  const panel = $('debugPanel');
  if (panel) panel.innerHTML = '';
}

// ─── API key panel ───
function toggleApiKey() {
  toggleRightPanel('apiKeyDropdown', 'tcApiKey');
}

// ─── Theme ───
function applyTheme() {
  const html = document.documentElement;
  html.classList.toggle('light', themeMode === 'light');
  html.classList.toggle('theme-blue', themeColor === 'blue');
  html.classList.toggle('theme-purple', themeColor === 'purple');
  localStorage.setItem('linguaai_theme', themeMode);
  localStorage.setItem('linguaai_color', themeColor);
  const darkBtn = $('modeDarkBtn'), lightBtn = $('modeLightBtn');
  if (darkBtn) darkBtn.classList.toggle('active', themeMode === 'dark');
  if (lightBtn) lightBtn.classList.toggle('active', themeMode === 'light');
}

function setAppearance(mode) { themeMode = mode; applyTheme(); }
function setThemeColor(color) { themeColor = color; applyTheme(); }
function toggleThemePanel() { toggleRightPanel('themePanelDropdown', 'tcTheme'); }

// legacy toggleTheme kept for safety
function toggleTheme() { setAppearance(themeMode === 'dark' ? 'light' : 'dark'); }

// ─── Left column collapse ───
function toggleLeft() {
  leftOpen = !leftOpen;
  $('colLeft').classList.toggle('collapsed', !leftOpen);
  $('collapseBtn').textContent = leftOpen ? '‹' : '›';
}

// ─── Right column collapse ───
function toggleRight() {
  rightOpen = !rightOpen;
  $('colRight').classList.toggle('collapsed', !rightOpen);
  $('collapseRightBtn').textContent = rightOpen ? '›' : '‹';
}

// ─── View switching (article / quiz / grammar) ───
function switchView(view) {
  const main = $('main');
  if (!main) return;
  main.classList.remove('mid-view-article', 'mid-view-quiz', 'mid-view-grammar');
  main.classList.add('mid-view-' + view);
  // Update card active states
  const map = { article: 'tcArticle', quiz: 'tcQuiz', grammar: 'tcGrammar' };
  ['tcArticle', 'tcQuiz', 'tcGrammar'].forEach(id => {
    const el = $(id); if (el) el.classList.remove('tc-active');
  });
  const activeCard = $(map[view]);
  if (activeCard) activeCard.classList.add('tc-active');
}

// ─── Card state (enable/disable first 3 content cards) ───
function updateCardState(hasContent) {
  ['tcArticle', 'tcQuiz'].forEach(id => {
    const el = $(id);
    if (el) el.classList.toggle('disabled', !hasContent);
  });
  // Grammar is also disabled in focus mode
  const grammarCard = $('tcGrammar');
  if (grammarCard) grammarCard.classList.toggle('disabled', !hasContent || currentMode === 'focus');
  const fab = $('genFab');
  if (fab) fab.style.display = hasContent ? 'none' : 'flex';
}

// ─── Right panel toggle ───
function toggleRightPanel(panelId, cardId) {
  const panel = $(panelId);
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.right-panel').forEach(p => p.classList.remove('open'));
  ['tcTheme', 'tcApiKey'].forEach(id => { const el = $(id); if (el) el.classList.remove('tc-active'); });
  if (!isOpen) {
    panel.classList.add('open');
    const card = $(cardId);
    if (card) card.classList.add('tc-active');
  }
}

// ─── Auto-grow textarea ───
function initTextareas() {
  document.querySelectorAll('textarea').forEach(ta => {
    ta.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 300) + 'px';
      this.style.overflowY = this.scrollHeight > 300 ? 'auto' : 'hidden';
    });
  });
}

// ─── Close dropdowns on outside click ───
function initDropdownClosers() {
  document.addEventListener('click', e => {
    document.querySelectorAll('.custom-select').forEach(cs => {
      if (!cs.contains(e.target)) cs.classList.remove('open');
    });
  });
  document.addEventListener('click', e => {
    if (!$('styleDropdown').contains(e.target)) {
      $('styleHeader').classList.remove('open');
      $('styleList').classList.remove('open');
    }
  });
}

// ─── Init (DOMContentLoaded) ───
document.addEventListener('DOMContentLoaded', () => {
  // Theme from localStorage
  themeMode = localStorage.getItem('linguaai_theme') || 'dark';
  themeColor = localStorage.getItem('linguaai_color') || 'blue';
  applyTheme();

  // Provider / model
  setProvider(currentProvider);

  // Focus mode on load
  setMode('focus');

  // Level buttons
  initLevelBtns();

  // Textarea auto-grow
  initTextareas();

  // Dropdown outside-click closers
  initDropdownClosers();
});
