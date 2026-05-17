/* ============================================================
   LinguaAI · quiz.js
   doQuiz(), renderQuiz(), submitQuiz(), retryQuiz()
   ============================================================ */

// ─── Quiz ───
async function doQuiz(lang, native, article) {
  const qs = $('quizSection');
  const compQ = Math.ceil(quizCount / 2);
  const gramQ = quizCount - compQ;
  const quizMaxTok = Math.max(1500, 300 + quizCount * 220);
  qs.innerHTML = `<div class="loading-placeholder"><span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span><span style="margin-left:12px;color:var(--text3);font-size:17px">正在生成 ${quizCount} 道测验题目…</span></div>`;
  try {
    const raw = await callAPI(
      [{ role: 'user', content: `Based on this ${lang} article at CEFR ${currentLevel}, create exactly ${quizCount} quiz questions (${compQ} comprehension + ${gramQ} vocabulary/grammar).\n\nIMPORTANT: Write ALL questions and ALL answer options in ${lang} (the target language being studied). Write ONLY the explanation field in ${native}.\n\nArticle:\n${article}\n\nReturn ONLY this JSON:\n{"questions":[{"question":"question in ${lang}","options":["A. option in ${lang}","B. option in ${lang}","C. option in ${lang}","D. option in ${lang}"],"correct":0,"explanation":"explanation in ${native}"}]}\ncorrect is 0-based index.` }],
      `Language quiz creator. Return ONLY valid JSON.`,
      false, null, quizMaxTok, true, '测验生成'
    );
    quizData = await parseOrRepairJSON(raw);
    renderQuiz(quizData);
  } catch (e) {
    qs.innerHTML = `<div class="quiz-card"><div class="error-msg">测验生成失败：${esc(e.message)}</div></div>`;
  }
}

function renderQuiz(data) {
  const qs = $('quizSection');
  const questions = data.questions || [];
  let h = `<div class="section-card quiz-card">
    <div class="section-card-header" onclick="toggleSection('quizBody','quizArrow')">
      <div class="section-card-icon" style="background:var(--amber-bg);font-size:14px">📝</div>
      <div class="section-card-title">理解测验</div>
      <div class="quiz-score" id="quizScore" style="display:none"></div>
      <span class="section-card-arrow open" id="quizArrow">▼</span>
    </div>
    <div class="section-card-body quiz-card-inner" id="quizBody">
      <p class="quiz-sub" style="margin-bottom:1rem">选择正确答案</p>
      <div class="questions">`;
  questions.forEach((q, qi) => {
    h += `<div class="question-item" id="q${qi}"><div class="question-text">${qi + 1}. ${esc(q.question)}</div><div class="options">`;
    q.options.forEach((opt, oi) => { h += `<button class="option-btn" id="q${qi}o${oi}" onclick="pickOpt(${qi},${oi})">${esc(opt)}</button>`; });
    h += `</div><div class="explanation" id="exp${qi}">${esc(q.explanation || '')}</div></div>`;
  });
  h += `</div>
      <div style="margin-top:1rem">
        <button class="btn-submit" id="submitQ" onclick="submitQuiz()">提交答案</button>
        <button class="btn-submit" id="retryQ" style="display:none;margin-left:8px" onclick="resetQuiz()">重新作答</button>
      </div>
    </div>
  </div>`;
  qs.innerHTML = h;
}

function pickOpt(qi, oi) {
  if (submitted) return;
  // clear any previously highlighted option in this question
  quizData.questions[qi].options.forEach((_, i) => {
    const b = $(`q${qi}o${i}`); b.style.background = b.style.borderColor = b.style.color = '';
  });
  // toggle off if clicking the already-selected option
  if (picked[qi] === oi) {
    delete picked[qi];
    return;
  }
  picked[qi] = oi;
  const b = $(`q${qi}o${oi}`);
  b.style.background = 'var(--accent-bg)'; b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent2)';
}

function submitQuiz() {
  if (!quizData) return;
  submitted = true;
  let ok = 0;
  quizData.questions.forEach((q, qi) => {
    const ch = picked[qi];
    q.options.forEach((_, oi) => {
      const b = $(`q${qi}o${oi}`);
      b.disabled = true; b.style.background = b.style.borderColor = b.style.color = '';
      if (oi === q.correct) b.classList.add('correct');
      else if (oi === ch && ch !== q.correct) b.classList.add('wrong');
    });
    if (ch === q.correct) ok++;
    $(`exp${qi}`).classList.add('show');
  });
  const sc = $('quizScore'), pct = Math.round(ok / quizData.questions.length * 100);
  sc.style.display = 'block';
  sc.style.color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
  sc.textContent = `${ok}/${quizData.questions.length} 正确 (${pct}%)`;
  $('submitQ').style.display = 'none'; $('retryQ').style.display = 'inline-block';
}

function resetQuiz() { submitted = false; Object.keys(picked).forEach(k => delete picked[k]); renderQuiz(quizData); }
