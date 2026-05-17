/* ============================================================
   LinguaAI · history.js
   saveHist(), loadHist(), openHistory(), renderHistoryList()
   ============================================================ */

function loadHist() { try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch { return []; } }

function saveHist(entry) {
  const h = loadHist(); h.unshift(entry); if (h.length > 40) h.length = 40;
  localStorage.setItem(HIST_KEY, JSON.stringify(h));
}

function openHistory() {
  const h = loadHist();
  $('histList').innerHTML = h.length
    ? h.map((item, i) => `
      <div class="hist-item" id="histitem${i}">
        <div class="hist-item-badges" onclick="loadHistItem(${i})" style="cursor:pointer">
          <span class="meta-badge badge-level" style="font-size:9px">${esc(item.level)}</span>
          <span class="meta-badge badge-lang" style="font-size:9px">${esc(item.lang)}</span>
          <span class="meta-badge badge-style" style="font-size:9px">${esc(item.style)}</span>
          ${item.model ? `<span class="meta-badge" style="font-size:9px;background:var(--bg3);color:var(--text2)">${esc(item.model)}</span>` : ''}
        </div>
        <div class="hist-item-preview" onclick="loadHistItem(${i})" style="cursor:pointer">${esc(item.article.slice(0, 90))}…</div>
        <div class="hist-item-date" onclick="loadHistItem(${i})" style="cursor:pointer">${esc(item.date)}</div>
        <button class="hist-del-btn" onclick="deleteHistItem(event,${i})" title="删除">✕</button>
      </div>`).join('')
    : '<div class="hist-empty">还没有历史记录</div>';
  $('histOverlay').classList.add('show');
}

function closeHistory() { $('histOverlay').classList.remove('show'); }

function histOverlayClick(e) { if (e.target === $('histOverlay')) closeHistory(); }

function clearHistory() { if (confirm('确定清空所有历史记录？')) { localStorage.removeItem(HIST_KEY); closeHistory(); } }

function deleteHistItem(e, i) {
  e.stopPropagation();
  const h = loadHist();
  h.splice(i, 1);
  localStorage.setItem(HIST_KEY, JSON.stringify(h));
  openHistory(); // re-render the list
}

function loadHistItem(i) {
  const h = loadHist()[i]; if (!h) return;
  closeHistory();
  articleContent = h.article; quizData = h.quizData; grammarData = h.grammarData;
  currentSentencePairs = h.sentencePairs || [];
  $('main').innerHTML = `
    <div class="article-card" id="articleCard">
      <div class="article-meta">
        <span class="meta-badge badge-level">${esc(h.level)}</span>
        <span class="meta-badge badge-lang">${esc(h.lang)}</span>
        <span class="meta-badge badge-style">${esc(h.style)}</span>
        <div class="view-toggle" id="viewToggle">
          <button class="view-btn active" onclick="setView('article')">原文</button>
          <button class="view-btn" onclick="setView('both')">双栏</button>
          <button class="view-btn" onclick="setView('parallel')">逐句</button>
        </div>
      </div>
      <div class="article-body single" id="articleBody">
        <div class="text-panel">
          <div class="panel-label">${esc(h.lang)} 原文</div>
          <div class="article-text${wordModeOn ? ' word-mode-on' : ''}" id="articleText" data-lang="${esc(h.lang)}" data-native="${esc(h.native)}">${makeWords(h.article, h.lang)}</div>
        </div>
        <div class="text-panel" style="display:none">
          <div class="panel-label">${esc(h.native)} 译文</div>
          <div class="translation-text">${esc(h.translation || '')}</div>
        </div>
      </div>
    </div>
    <div id="quizSection"></div>
    <div id="grammarSection"></div>`;
  setupWordHover();
  if (h.grammarData) renderGrammar(h.grammarData, h.lang);
  if (h.quizData) { quizData = h.quizData; submitted = false; Object.keys(picked).forEach(k => delete picked[k]); renderQuiz(h.quizData); }
  switchView('article');
  updateCardState(true);
}

// ─── New article: reset to welcome state ───
function newArticle() {
  closeHistory();
  articleContent = '';
  quizData = null;
  grammarData = null;
  currentSentencePairs = [];
  submitted = false;
  Object.keys(picked).forEach(k => delete picked[k]);
  const main = $('main');
  main.className = '';
  main.innerHTML = `
        <div class="welcome" id="welcome">
          <div class="welcome-icon">📖</div>
          <h2>配置好语言设置，开始学习</h2>
          <p>AI 将生成适合你水平的短文，提供译文对照、词汇释义、语法分析和测验题目。</p>
        </div>`;
  updateCardState(false);
}
