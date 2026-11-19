(function () {
  'use strict';

  const ALL_QUESTIONS = window.MBTI_DATA.questions;
  const TYPE_DATA = window.MBTI_DATA.types;
  const EXTENDED_PROFILES = window.MBTI_DATA.extendedProfiles || {};
  const LITERATURE = window.MBTI_DATA.literature || null;
  const ENGINE = window.MBTI_ENGINE;
  const ADVANCED = window.MBTI_ADVANCED;

  const STORAGE_KEYS = {
    DRAFT: 'prism_mbti_draft_v1',
    HISTORY: 'prism_mbti_history_v1',
    THEME: 'prism_mbti_theme_v1',
    PREFS: 'prism_mbti_prefs_v1'
  };

  const LIKERT_OPTIONS = [
    { value: 3, label: '非常同意', size: 'lg', tone: 'agree' },
    { value: 2, label: '同意', size: 'md', tone: 'agree' },
    { value: 1, label: '有點同意', size: 'sm', tone: 'agree' },
    { value: 0, label: '中立 / 不確定', size: 'xs', tone: 'neutral' },
    { value: -1, label: '有點不同意', size: 'sm', tone: 'disagree' },
    { value: -2, label: '不同意', size: 'md', tone: 'disagree' },
    { value: -3, label: '非常不同意', size: 'lg', tone: 'disagree' }
  ];

  const PAGE_SIZE = 5;

  const state = {
    activeView: 'home',
    layout: 'paged', // 'paged' | 'single'
    autoAdvance: true,
    quiz: null, // { mode, questions, answers, currentPage, currentIndex, startedAt }
    currentResult: null,
    catalogFilter: 'ALL',
    catalogSearch: '',
    missingQuestionId: null,
    autoAdvanceTimer: null
  };

  // ==================== Utilities ====================
  function $(selector, root = document) {
    return root.querySelector(selector);
  }

  function $$(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function resolveIllustrationSrc(path) {
    const map = window.MBTI_DATA && window.MBTI_DATA.illustrations;
    return (map && map[path]) || path;
  }

  let toastTimer = null;
  function showToast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.add('hidden');
    }, 2600);
  }

  function formatDateTime(isoString) {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  }

  function safeGetStorage(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function safeSetStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore quota or storage restriction errors
    }
  }

  // ==================== Theme & Preferences ====================
  function applyTheme(theme) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
    $('#theme-icon').textContent = resolved === 'dark' ? '☀' : '☾';
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, resolved);
    } catch {
      // ignore
    }
  }

  function initTheme() {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEYS.THEME);
    } catch {
      saved = null;
    }
    if (!saved && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      saved = 'dark';
    }
    applyTheme(saved || 'light');
  }

  function loadPrefs() {
    const prefs = safeGetStorage(STORAGE_KEYS.PREFS, null);
    if (prefs) {
      if (prefs.layout === 'single' || prefs.layout === 'paged') {
        state.layout = prefs.layout;
      }
      if (typeof prefs.autoAdvance === 'boolean') {
        state.autoAdvance = prefs.autoAdvance;
      }
    }
    syncLayoutButtons();
    $('#chk-auto-advance').checked = state.autoAdvance;
  }

  function savePrefs() {
    safeSetStorage(STORAGE_KEYS.PREFS, {
      layout: state.layout,
      autoAdvance: state.autoAdvance
    });
  }

  function syncLayoutButtons() {
    $$('[data-layout]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.layout === state.layout);
    });
    $$('[data-quiz-layout]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.quizLayout === state.layout);
    });
  }

  // ==================== View Switching ====================
  function switchView(viewName) {
    state.activeView = viewName;
    $$('.view').forEach((v) => v.classList.remove('is-active'));
    const target = $(`#view-${viewName}`);
    if (target) {
      target.classList.add('is-active');
    }

    $$('.nav-pill[data-nav]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.nav === viewName);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==================== Home View ====================
  function renderHomeTemperaments() {
    const host = $('#home-temperament-grid');
    const groupOrder = ['NT', 'NF', 'SJ', 'SP'];
    host.innerHTML = groupOrder
      .map((gKey) => {
        const g = TYPE_DATA.GROUPS[gKey];
        const codes = Object.values(TYPE_DATA.TYPES)
          .filter((t) => t.group === gKey)
          .map((t) => `<span>${escapeHtml(t.code)}</span>`)
          .join('');
        return `
          <div class="temp-card" style="--group-color: ${g.color}" data-home-group="${gKey}" role="button" tabindex="0">
            <div class="temp-card-illu">
              <img src="${escapeHtml(resolveIllustrationSrc(g.illustration))}" alt="${escapeHtml(g.name)}插畫" loading="lazy" />
            </div>
            <div class="temp-card-code">${escapeHtml(g.id)} · ${escapeHtml(g.enName)}</div>
            <h3>${escapeHtml(g.name)}</h3>
            <p>${escapeHtml(g.tagline)}</p>
            <div class="temp-types-mini">${codes}</div>
          </div>
        `;
      })
      .join('');

    $$('.temp-card', host).forEach((card) => {
      const openGroup = () => {
        state.catalogFilter = card.dataset.homeGroup;
        renderCatalog();
        switchView('catalog');
      };
      card.addEventListener('click', openGroup);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openGroup();
        }
      });
    });
  }

  function refreshResumeBanner() {
    const draft = safeGetStorage(STORAGE_KEYS.DRAFT, null);
    const banner = $('#resume-banner');
    if (draft && draft.mode && draft.answers && Object.keys(draft.answers).length > 0) {
      const qs = ENGINE.getQuestionsForMode(ALL_QUESTIONS, draft.mode);
      const answered = qs.filter((q) => Object.prototype.hasOwnProperty.call(draft.answers, q.id)).length;
      if (answered > 0 && answered <= qs.length) {
        const modeLabel = draft.mode === 'quick' ? '快速精簡版' : '標準完整版';
        $('#resume-desc').textContent = `模式：${modeLabel}（已完成 ${answered} / ${qs.length} 題），上次儲存於 ${formatDateTime(draft.updatedAt)}`;
        banner.classList.remove('hidden');
        return;
      }
    }
    banner.classList.add('hidden');
  }

  // ==================== Quiz Logic ====================
  function startNewQuiz(mode) {
    const questions = ENGINE.getQuestionsForMode(ALL_QUESTIONS, mode);
    state.quiz = {
      mode,
      questions,
      answers: {},
      currentPage: 0,
      currentIndex: 0,
      startedAt: new Date().toISOString()
    };
    state.missingQuestionId = null;
    saveQuizDraft();
    renderQuiz();
    switchView('quiz');
  }

  function resumeDraftQuiz() {
    const draft = safeGetStorage(STORAGE_KEYS.DRAFT, null);
    if (!draft) return;
    const questions = ENGINE.getQuestionsForMode(ALL_QUESTIONS, draft.mode);
    const firstUnanswered = questions.findIndex(
      (q) => !Object.prototype.hasOwnProperty.call(draft.answers || {}, q.id)
    );
    const targetIdx = firstUnanswered >= 0 ? firstUnanswered : 0;

    state.quiz = {
      mode: draft.mode,
      questions,
      answers: draft.answers || {},
      currentIndex: targetIdx,
      currentPage: Math.floor(targetIdx / PAGE_SIZE),
      startedAt: draft.startedAt || new Date().toISOString()
    };
    state.missingQuestionId = null;
    renderQuiz();
    switchView('quiz');
  }

  function saveQuizDraft() {
    if (!state.quiz) return;
    safeSetStorage(STORAGE_KEYS.DRAFT, {
      mode: state.quiz.mode,
      answers: state.quiz.answers,
      currentIndex: state.quiz.currentIndex,
      currentPage: state.quiz.currentPage,
      startedAt: state.quiz.startedAt,
      updatedAt: new Date().toISOString()
    });
  }

  function clearQuizDraft() {
    try {
      localStorage.removeItem(STORAGE_KEYS.DRAFT);
    } catch {
      // ignore
    }
    refreshResumeBanner();
  }

  function getAnsweredCount() {
    if (!state.quiz) return 0;
    return state.quiz.questions.filter((q) =>
      Object.prototype.hasOwnProperty.call(state.quiz.answers, q.id)
    ).length;
  }

  function updateQuizProgressUI() {
    const { questions, mode } = state.quiz;
    const total = questions.length;
    const answered = getAnsweredCount();
    const pct = Math.round((answered / total) * 100);
    const remaining = total - answered;
    const estMinutes = Math.max(1, Math.ceil((remaining * 7) / 60));

    $('#quiz-mode-pill').textContent = mode === 'quick' ? `快速精簡版 · ${total} 題` : `標準完整版 · ${total} 題`;
    $('#quiz-eta-pill').textContent = remaining === 0 ? '已完成全部題目！' : `約剩 ${estMinutes} 分鐘`;
    $('#quiz-progress-fill').style.width = `${pct}%`;
    $('#quiz-progress-bar').setAttribute('aria-valuenow', String(pct));
    $('#quiz-progress-text').textContent = `${answered} / ${total} 題 (${pct}%)`;
  }

  function showQuizAlert(message) {
    const box = $('#quiz-alert');
    if (!message) {
      box.classList.add('hidden');
      box.textContent = '';
    } else {
      box.textContent = message;
      box.classList.remove('hidden');
    }
  }

  function renderQuestionCard(q, index) {
    const selectedVal = Object.prototype.hasOwnProperty.call(state.quiz.answers, q.id)
      ? state.quiz.answers[q.id]
      : null;
    const selectedOption = LIKERT_OPTIONS.find((o) => o.value === selectedVal);
    const isMissing = state.missingQuestionId === q.id;

    const circlesHtml = LIKERT_OPTIONS.map((opt, idx) => {
      const isSelected = selectedVal === opt.value;
      return `
        <button
          type="button"
          class="likert-btn likert-btn--${opt.tone} ${isSelected ? 'is-selected' : ''}"
          data-qid="${escapeHtml(q.id)}"
          data-val="${opt.value}"
          data-size="${opt.size}"
          aria-label="${escapeHtml(opt.label)}（快捷鍵 ${idx + 1}）"
          aria-pressed="${isSelected ? 'true' : 'false'}"
          title="${escapeHtml(opt.label)}"
        ></button>
      `;
    }).join('');

    return `
      <article class="question-card ${selectedVal !== null ? 'is-answered' : ''} ${isMissing ? 'is-missing' : ''}" id="qcard-${escapeHtml(q.id)}" data-qindex="${index}">
        <div class="q-card-head">
          <span class="q-num">第 ${index + 1} / ${state.quiz.questions.length} 題</span>
          <span class="q-context">${escapeHtml(q.context)}</span>
        </div>
        <p class="q-text">${escapeHtml(q.text)}</p>
        <div class="likert-wrap">
          <div class="likert-row">
            <span class="likert-end-label likert-end-label--agree">非常同意</span>
            <div class="likert-circles" role="group" aria-label="作答選項">${circlesHtml}</div>
            <span class="likert-end-label likert-end-label--disagree">非常不同意</span>
          </div>
          <div class="likert-selected-text">
            ${selectedOption ? `已選：<strong>${escapeHtml(selectedOption.label)}</strong>` : '請選擇最符合您自然傾向的程度'}
          </div>
        </div>
      </article>
    `;
  }

  function renderQuestionMap() {
    const panel = $('#question-map-panel');
    if (panel.classList.contains('hidden')) return;
    const { questions, answers, currentIndex, currentPage } = state.quiz;

    $('#qmap-grid').innerHTML = questions
      .map((q, idx) => {
        const isDone = Object.prototype.hasOwnProperty.call(answers, q.id);
        const isCurrent =
          state.layout === 'single'
            ? idx === currentIndex
            : Math.floor(idx / PAGE_SIZE) === currentPage;
        return `
          <button
            type="button"
            class="qmap-item ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}"
            data-jump-idx="${idx}"
          >${idx + 1}</button>
        `;
      })
      .join('');

    $$('.qmap-item', panel).forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.jumpIdx);
        jumpToQuestion(idx);
      });
    });
  }

  function jumpToQuestion(idx) {
    if (!state.quiz) return;
    state.quiz.currentIndex = idx;
    state.quiz.currentPage = Math.floor(idx / PAGE_SIZE);
    renderQuiz();
    const targetQ = state.quiz.questions[idx];
    if (targetQ) {
      const card = $(`#qcard-${targetQ.id}`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  function renderQuiz() {
    if (!state.quiz) return;
    updateQuizProgressUI();

    const { questions } = state.quiz;
    const host = $('#quiz-questions-host');
    const singleBar = $('#single-mode-bar');
    const prevBtn = $('#btn-prev-step');
    const nextBtn = $('#btn-next-step');

    if (state.layout === 'single') {
      singleBar.classList.remove('hidden');
      const idx = state.quiz.currentIndex;
      const q = questions[idx];
      host.innerHTML = renderQuestionCard(q, idx);

      prevBtn.disabled = idx === 0;
      prevBtn.textContent = '← 上一題';
      const isLast = idx === questions.length - 1;
      nextBtn.textContent = isLast ? '查看測驗結果 ✓' : '下一題 →';
    } else {
      singleBar.classList.add('hidden');
      const totalPages = Math.ceil(questions.length / PAGE_SIZE);
      const page = Math.min(state.quiz.currentPage, totalPages - 1);
      state.quiz.currentPage = page;
      const start = page * PAGE_SIZE;
      const slice = questions.slice(start, start + PAGE_SIZE);

      host.innerHTML = slice.map((q, offset) => renderQuestionCard(q, start + offset)).join('');

      prevBtn.disabled = page === 0;
      prevBtn.textContent = '← 上一頁';
      const isLastPage = page === totalPages - 1;
      nextBtn.textContent = isLastPage ? '完成並查看結果 ✓' : `下一頁 (${page + 1}/${totalPages}) →`;
    }

    bindLikertListeners();
    renderQuestionMap();
  }

  function bindLikertListeners() {
    $$('.likert-btn', $('#quiz-questions-host')).forEach((btn) => {
      btn.addEventListener('click', () => {
        const qid = btn.dataset.qid;
        const val = Number(btn.dataset.val);
        handleAnswerSelection(qid, val);
      });
    });
  }

  function handleAnswerSelection(qid, val) {
    if (!state.quiz) return;
    clearTimeout(state.autoAdvanceTimer);
    state.quiz.answers[qid] = val;
    if (state.missingQuestionId === qid) {
      state.missingQuestionId = null;
      showQuizAlert('');
    }

    const qIdx = state.quiz.questions.findIndex((q) => q.id === qid);
    if (qIdx >= 0) {
      state.quiz.currentIndex = qIdx;
    }

    saveQuizDraft();
    updateQuizProgressUI();

    // Update current card DOM without full page re-render jitter
    const card = $(`#qcard-${qid}`);
    if (card) {
      card.classList.add('is-answered');
      card.classList.remove('is-missing');
      $$('.likert-btn', card).forEach((b) => {
        const isSel = Number(b.dataset.val) === val;
        b.classList.toggle('is-selected', isSel);
        b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
      });
      const opt = LIKERT_OPTIONS.find((o) => o.value === val);
      const textEl = $('.likert-selected-text', card);
      if (textEl && opt) {
        textEl.innerHTML = `已選：<strong>${escapeHtml(opt.label)}</strong>`;
      }
    }

    renderQuestionMap();

    if (state.layout === 'single' && state.autoAdvance) {
      const isLast = state.quiz.currentIndex >= state.quiz.questions.length - 1;
      if (!isLast) {
        state.autoAdvanceTimer = setTimeout(() => {
          state.quiz.currentIndex += 1;
          state.quiz.currentPage = Math.floor(state.quiz.currentIndex / PAGE_SIZE);
          renderQuiz();
        }, 210);
      }
    }
  }

  function handlePrevStep() {
    if (!state.quiz) return;
    showQuizAlert('');
    if (state.layout === 'single') {
      if (state.quiz.currentIndex > 0) {
        state.quiz.currentIndex -= 1;
        state.quiz.currentPage = Math.floor(state.quiz.currentIndex / PAGE_SIZE);
        renderQuiz();
      }
    } else if (state.quiz.currentPage > 0) {
      state.quiz.currentPage -= 1;
      state.quiz.currentIndex = state.quiz.currentPage * PAGE_SIZE;
      renderQuiz();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function handleNextStep() {
    if (!state.quiz) return;
    const { questions, answers } = state.quiz;

    if (state.layout === 'single') {
      const currentQ = questions[state.quiz.currentIndex];
      if (!Object.prototype.hasOwnProperty.call(answers, currentQ.id)) {
        state.missingQuestionId = currentQ.id;
        showQuizAlert(`請先完成第 ${state.quiz.currentIndex + 1} 題後再繼續。`);
        renderQuiz();
        return;
      }
      if (state.quiz.currentIndex < questions.length - 1) {
        state.quiz.currentIndex += 1;
        state.quiz.currentPage = Math.floor(state.quiz.currentIndex / PAGE_SIZE);
        showQuizAlert('');
        renderQuiz();
      } else {
        attemptCompleteQuiz();
      }
      return;
    }

    // Paged mode validation for current page
    const start = state.quiz.currentPage * PAGE_SIZE;
    const pageSlice = questions.slice(start, start + PAGE_SIZE);
    const missingOnPage = pageSlice.find(
      (q) => !Object.prototype.hasOwnProperty.call(answers, q.id)
    );

    if (missingOnPage) {
      const missingNum = questions.findIndex((q) => q.id === missingOnPage.id) + 1;
      state.missingQuestionId = missingOnPage.id;
      showQuizAlert(`本頁還有第 ${missingNum} 題尚未作答，已為您標示出來。`);
      renderQuiz();
      const card = $(`#qcard-${missingOnPage.id}`);
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    const totalPages = Math.ceil(questions.length / PAGE_SIZE);
    if (state.quiz.currentPage < totalPages - 1) {
      state.quiz.currentPage += 1;
      state.quiz.currentIndex = state.quiz.currentPage * PAGE_SIZE;
      showQuizAlert('');
      renderQuiz();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      attemptCompleteQuiz();
    }
  }

  function attemptCompleteQuiz() {
    const { questions, answers, mode } = state.quiz;
    const firstMissingIdx = questions.findIndex(
      (q) => !Object.prototype.hasOwnProperty.call(answers, q.id)
    );

    if (firstMissingIdx >= 0) {
      const missingQ = questions[firstMissingIdx];
      state.missingQuestionId = missingQ.id;
      showQuizAlert(`還有第 ${firstMissingIdx + 1} 題尚未作答，已為您跳轉至該題。`);
      jumpToQuestion(firstMissingIdx);
      return;
    }

    const computed = ENGINE.calculateMBTIResult(questions, answers, TYPE_DATA.TYPES, LITERATURE);
    const record = {
      id: `res_${Date.now()}`,
      createdAt: new Date().toISOString(),
      mode,
      ...computed
    };

    saveResultToHistory(record);
    clearQuizDraft();
    state.quiz = null;
    state.currentResult = record;
    renderResultReport(record);
    switchView('result');
  }

  // ==================== History Storage ====================
  function getHistory() {
    const list = safeGetStorage(STORAGE_KEYS.HISTORY, []);
    return Array.isArray(list) ? list : [];
  }

  function saveResultToHistory(record) {
    const history = getHistory();
    history.unshift(record);
    safeSetStorage(STORAGE_KEYS.HISTORY, history.slice(0, 30));
    updateHistoryBadge();
  }

  function updateHistoryBadge() {
    $('#history-count-badge').textContent = String(getHistory().length);
  }

  function renderHistoryDrawer() {
    const history = getHistory();
    const listEl = $('#history-list');

    if (history.length === 0) {
      listEl.innerHTML = `
        <div class="insight-box">
          <p style="margin:0;color:var(--text-muted)">目前尚無已完成的測驗紀錄。完成一次測驗後，結果將自動保存於此。</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = history
      .map((item) => {
        const profile = TYPE_DATA.TYPES[item.baseType];
        const group = TYPE_DATA.GROUPS[profile.group];
        const modeText = item.mode === 'quick' ? '快速 30 題' : '完整 60 題';
        return `
          <div class="history-item">
            <div class="history-item-top">
              <span class="history-type" style="color:${group.color}">${escapeHtml(item.fullType)} · ${escapeHtml(profile.name)}</span>
              <span class="mode-tag">${modeText}</span>
            </div>
            <div class="history-date">${escapeHtml(formatDateTime(item.createdAt))}</div>
            <div class="history-actions">
              <button type="button" class="btn btn-primary btn-sm" data-open-history="${escapeHtml(item.id)}">查看完整報告</button>
              <button type="button" class="btn btn-ghost btn-sm text-danger" data-delete-history="${escapeHtml(item.id)}">刪除</button>
            </div>
          </div>
        `;
      })
      .join('');

    $$('[data-open-history]', listEl).forEach((btn) => {
      btn.addEventListener('click', () => {
        const found = getHistory().find((h) => h.id === btn.dataset.openHistory);
        if (found) {
          closeHistoryDrawer();
          state.currentResult = found;
          renderResultReport(found);
          switchView('result');
        }
      });
    });

    $$('[data-delete-history]', listEl).forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = getHistory().filter((h) => h.id !== btn.dataset.deleteHistory);
        safeSetStorage(STORAGE_KEYS.HISTORY, next);
        updateHistoryBadge();
        renderHistoryDrawer();
      });
    });
  }

  function openHistoryDrawer() {
    renderHistoryDrawer();
    $('#history-backdrop').classList.remove('hidden');
    $('#history-drawer').classList.remove('hidden');
  }

  function closeHistoryDrawer() {
    $('#history-backdrop').classList.add('hidden');
    $('#history-drawer').classList.add('hidden');
  }

  // ==================== Result Report View ====================
  function renderSpectrumItem(dim, accentColor) {
    const leftWin = dim.winner === dim.poleA;
    const consistencyTag =
      typeof dim.consistency === 'number' ? ` · 一致度 ${dim.consistency}%` : '';
    const badgeText = dim.isBalanced
      ? `50% / 50% 均衡邊緣${consistencyTag}`
      : `${dim.winner} ${dim.winnerPct}% · ${dim.clarity.label}${consistencyTag}`;

    const leftColor = leftWin ? accentColor : 'color-mix(in srgb, var(--text-muted) 30%, transparent)';
    const rightColor = !leftWin ? accentColor : 'color-mix(in srgb, var(--text-muted) 30%, transparent)';

    return `
      <div class="spectrum-item">
        <div class="spectrum-header">
          <span class="spectrum-label">${escapeHtml(dim.label)}</span>
          <span class="clarity-badge">${escapeHtml(badgeText)}</span>
        </div>
        <div class="spectrum-bar-row">
          <span class="pole-label ${leftWin ? 'is-winner' : ''}">${escapeHtml(dim.nameA)} ${dim.pctA}%</span>
          <div class="spectrum-track" aria-label="${escapeHtml(dim.nameA)} ${dim.pctA}% vs ${escapeHtml(dim.nameB)} ${dim.pctB}%">
            <div class="spectrum-fill-left" style="width:${dim.pctA}%;background:${leftColor}"></div>
            <div class="spectrum-fill-right" style="width:${dim.pctB}%;background:${rightColor}"></div>
            <div class="spectrum-midline"></div>
          </div>
          <span class="pole-label pole-label--right ${!leftWin ? 'is-winner' : ''}">${dim.pctB}% ${escapeHtml(dim.nameB)}</span>
        </div>
      </div>
    `;
  }

  function buildCognitiveRadarSvg(cogScores, accentColor) {
    const order = ['Ni', 'Ne', 'Te', 'Ti', 'Fe', 'Fi', 'Se', 'Si'];
    const cx = 135;
    const cy = 135;
    const maxR = 88;
    const rings = [25, 50, 75, 100];

    const pointAt = (idx, pct) => {
      const angle = (-Math.PI / 2) + (idx * 2 * Math.PI) / order.length;
      const r = (pct / 100) * maxR;
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
    };

    const gridPolys = rings
      .map((rPct) => {
        const pts = order.map((_, i) => pointAt(i, rPct).map((n) => n.toFixed(1)).join(',')).join(' ');
        return `<polygon points="${pts}" fill="none" stroke="var(--border-strong)" stroke-width="1" stroke-dasharray="${rPct === 100 ? 'none' : '3 3'}" opacity="0.65"/>`;
      })
      .join('');

    const axisLines = order
      .map((_, i) => {
        const [x2, y2] = pointAt(i, 100);
        return `<line x1="${cx}" y1="${cy}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="var(--border-strong)" stroke-width="1" opacity="0.55"/>`;
      })
      .join('');

    const dataPoints = order.map((code, i) => pointAt(i, cogScores[code] || 20));
    const polyStr = dataPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    const dots = dataPoints
      .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${accentColor}" stroke="var(--surface)" stroke-width="1.5"/>`)
      .join('');

    const labels = order
      .map((code, i) => {
        const [lx, ly] = pointAt(i, 122);
        const val = cogScores[code] || 0;
        return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="700" fill="var(--text-secondary)">${code} ${val}%</text>`;
      })
      .join('');

    return `
      <svg width="268" height="268" viewBox="0 0 270 270" role="img" aria-label="榮格八維功能雷達圖">
        ${gridPolys}
        ${axisLines}
        <polygon points="${polyStr}" fill="${accentColor}" fill-opacity="0.22" stroke="${accentColor}" stroke-width="2.4" stroke-linejoin="round"/>
        ${dots}
        ${labels}
      </svg>
    `;
  }

  function buildDonutGaugesHtml(traits) {
    const r = 32;
    const c = 2 * Math.PI * r;
    return `
      <div class="gauges-grid">
        ${traits
          .map((t) => {
            const offset = c * (1 - t.score / 100);
            return `
              <div class="gauge-card">
                <div class="gauge-ring-wrap">
                  <svg width="82" height="82" viewBox="0 0 82 82" aria-hidden="true">
                    <circle cx="41" cy="41" r="${r}" fill="none" stroke="var(--surface-muted)" stroke-width="8"/>
                    <circle cx="41" cy="41" r="${r}" fill="none" stroke="${t.color}" stroke-width="8" stroke-linecap="round"
                      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}"
                      transform="rotate(-90 41 41)"/>
                  </svg>
                  <span class="gauge-pct">${t.score}%</span>
                </div>
                <div class="gauge-title">${escapeHtml(t.title)}</div>
                <span class="gauge-level">${escapeHtml(t.title)}：${escapeHtml(t.level)}</span>
                <p class="gauge-tip">${escapeHtml(t.tip)}</p>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  function buildSixGridHtml(items, tone) {
    const iconChar = tone === 'pos' ? '✓' : tone === 'neg' ? '!' : '★';
    return `
      <div class="six-grid">
        ${items
          .map(
            (item) => `
              <div class="six-item">
                <span class="six-icon six-icon--${tone}" aria-hidden="true">${iconChar}</span>
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.desc)}</p>
                </div>
              </div>
            `
          )
          .join('')}
      </div>
    `;
  }

  function buildCareerChapterBodyHtml(profile, ext, careerTraits) {
    return `
      <p class="summary-prose">${escapeHtml(ext.career.intro)} ${escapeHtml(profile.career.style)}</p>
      <div class="domain-section-block">
        <h3 class="domain-subhead">具有影響力的職業特質</h3>
        ${buildDonutGaugesHtml(careerTraits)}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的職場強項（6 大優勢）</h3>
        ${buildSixGridHtml(ext.career.strengths6, 'pos')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的職場短板（6 個需留意盲區）</h3>
        ${buildSixGridHtml(ext.career.weaknesses6, 'neg')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">適合你的工作風格</h3>
        ${buildSixGridHtml(ext.career.workStyles6, 'accent')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">團隊協作與領導模式</h3>
        <div class="insight-box">
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem"><strong>團隊角色：</strong>${escapeHtml(profile.leadershipAndTeam.teamRole)}</p>
          <p style="margin:6px 0 0;color:var(--text-secondary);font-size:0.9rem"><strong>領導風格：</strong>${escapeHtml(profile.leadershipAndTeam.leadershipStyle)}</p>
          <p style="margin:6px 0 0;color:var(--text-secondary);font-size:0.9rem"><strong>協作叮嚀：</strong>${escapeHtml(profile.leadershipAndTeam.collaborationTip)}</p>
        </div>
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你可能會喜歡的職涯建議（8 大方向）</h3>
        <div class="roles-reason-grid">
          ${ext.career.recommendedRoles8
            .map(
              (r) => `
                <div class="role-reason-card">
                  <strong>${escapeHtml(r.role)}</strong>
                  <p>${escapeHtml(r.reason)}</p>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  function buildGrowthChapterBodyHtml(profile, ext, mod, growthTraits) {
    const modBlock = mod
      ? `
        <div class="growth-box" style="margin-top:16px">
          <h3>${escapeHtml(mod.name)} (-${escapeHtml(mod.code)}) 自我認同調節建議</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.92rem">${escapeHtml(mod.summary)} ${escapeHtml(mod.tips)}</p>
        </div>
      `
      : '';

    return `
      <p class="summary-prose">${escapeHtml(ext.growth.intro)}</p>
      <div class="domain-section-block">
        <h3 class="domain-subhead">具有影響力的個人成長特質</h3>
        ${buildDonutGaugesHtml(growthTraits)}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的成長強項</h3>
        ${buildSixGridHtml(ext.growth.strengths6, 'pos')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的成長短板</h3>
        ${buildSixGridHtml(ext.growth.weaknesses6, 'neg')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">什麼讓你充滿活力</h3>
        ${buildSixGridHtml(ext.growth.energizers6, 'accent')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">什麼讓你感到疲憊</h3>
        ${buildSixGridHtml(ext.growth.drainers6, 'neg')}
      </div>
      <div class="detail-subgrid" style="margin-top:18px;margin-bottom:0">
        <div class="insight-box">
          <h3>壓力失衡警訊（Grip）與回血指南</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem"><strong>警訊：</strong>${escapeHtml(profile.stressAndRecovery.gripSigns)}</p>
          <p style="margin:6px 0 0;color:var(--text-secondary);font-size:0.9rem"><strong>充電：</strong>${escapeHtml(profile.stressAndRecovery.rechargeWays)}</p>
        </div>
        <div class="insight-box">
          <h3>學習風格與日常微習慣</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem"><strong>學習：</strong>${escapeHtml(profile.learningAndHabits.learningStyle)}</p>
          <p style="margin:6px 0 0;color:var(--text-secondary);font-size:0.9rem"><strong>習慣：</strong>${escapeHtml(profile.learningAndHabits.dailyHabit)}</p>
        </div>
      </div>
      ${modBlock}
    `;
  }

  function buildRelationshipsChapterBodyHtml(profile, ext, relTraits) {
    const compatHtml = profile.relationships.compatible
      .map((cCode) => {
        const cp = TYPE_DATA.TYPES[cCode];
        const cg = TYPE_DATA.GROUPS[cp.group];
        return `
          <button type="button" class="compat-btn" data-open-type="${escapeHtml(cCode)}">
            <strong style="color:${cg.color}">${escapeHtml(cCode)}</strong>
            <span>${escapeHtml(cp.name)} · ${escapeHtml(cg.name)}</span>
          </button>
        `;
      })
      .join('');

    return `
      <p class="summary-prose">${escapeHtml(ext.relationships.intro)} ${escapeHtml(profile.relationships.style)}</p>
      <div class="domain-section-block">
        <h3 class="domain-subhead">具有影響力的人際特質</h3>
        ${buildDonutGaugesHtml(relTraits)}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的關係強項</h3>
        ${buildSixGridHtml(ext.relationships.strengths6, 'pos')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的關係短板</h3>
        ${buildSixGridHtml(ext.relationships.weaknesses6, 'neg')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">你的人際關係超能力</h3>
        ${buildSixGridHtml(ext.relationships.superpowers6, 'accent')}
      </div>
      <div class="domain-section-block">
        <h3 class="domain-subhead">人際關係潛在風險</h3>
        ${buildSixGridHtml(ext.relationships.risks6, 'neg')}
      </div>
      <div class="detail-subgrid" style="margin-top:18px">
        <div class="insight-box">
          <h3>愛情觀與友情相處模式</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem"><strong>愛情：</strong>${escapeHtml(profile.relationships.loveStyle)}</p>
          <p style="margin:6px 0 0;color:var(--text-secondary);font-size:0.9rem"><strong>友情：</strong>${escapeHtml(profile.relationships.friendshipStyle)}</p>
        </div>
        <div class="insight-box">
          <h3>衝突與溝通小叮嚀</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem">${escapeHtml(profile.relationships.conflictTips)}</p>
        </div>
      </div>
      <div style="margin-bottom:16px">
        <h3 style="margin:0 0 6px;font-size:1.02rem">互動契合 / 互補類型（點擊查看報告）</h3>
        <div class="compat-grid">${compatHtml}</div>
      </div>
      <div>
        <h3 style="margin:0 0 6px;font-size:1.02rem">文化與歷史代表原型參考</h3>
        <div class="tag-cloud">
          ${profile.examples.map((ex) => `<span class="role-chip">${escapeHtml(ex)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  function buildLiteratureModelBodyHtml(litProfile, step2Facets) {
    if (!litProfile) {
      return `<p style="color:var(--text-muted)">尚未載入國際文獻模型資料。</p>`;
    }

    const interaction = litProfile.interactionStyle;
    const temperament = litProfile.temperament;
    const beebeCardsHtml = (litProfile.beebeStack || [])
      .map((item) => {
        const isShadow = item.pos >= 5;
        const scoreTag = typeof item.score === 'number' ? ` · ${item.score}%` : '';
        const detailText = isShadow && item.shadowInsight ? item.shadowInsight : `${item.fnShort} — ${item.roleDesc}`;
        return `
          <div class="beebe-card ${isShadow ? 'beebe-card--shadow' : ''}">
            <div class="beebe-card-head">
              <span class="beebe-pos-badge">第 ${item.pos} 位 · ${escapeHtml(item.sphere)}</span>
              <span class="beebe-fn-pill">${escapeHtml(item.fnCode)}${scoreTag}</span>
            </div>
            <div class="beebe-role">${escapeHtml(item.role)}</div>
            <div class="beebe-desc">${escapeHtml(detailText)}</div>
          </div>
        `;
      })
      .join('');

    let step2Html = '';
    if (step2Facets && Array.isArray(step2Facets.groups)) {
      const outCount = step2Facets.outOfPreferenceCount || 0;
      const outNames = (step2Facets.outOfPreferenceList || [])
        .slice(0, 4)
        .map((f) => `${f.winnerName}`)
        .join('、');
      const bannerText =
        outCount > 0
          ? `偵測到 <strong>${outCount}</strong> 項「跨向度混合特質 (Out-of-Preference)」，例如：${escapeHtml(outNames)}——這是同一類型中人與人展現差異的核心來源。`
          : `你在 20 個 Step II 細分面向皆與四大主偏好一致，呈現高度典型且集中的表現輪廓。`;

      const groupsHtml = step2Facets.groups
        .map((g) => {
          const rowsHtml = g.facets
            .map((f) => {
              const estTag = f.isEstimated ? ' <small style="color:var(--text-muted)">(主軸推估)</small>' : '';
              const outBadge = f.isOutOfPreference
                ? `<span class="out-pref-badge">跨向度 ${escapeHtml(f.winner)}</span>`
                : '';
              return `
                <div class="step2-facet-row">
                  <div class="step2-facet-head">
                    <span><strong>${escapeHtml(f.winnerName)}</strong> (${f.winnerPct}%)${estTag}</span>
                    ${outBadge}
                  </div>
                  <div class="step2-bar">
                    <div class="step2-bar-fill ${f.isOutOfPreference ? 'step2-bar-fill--out' : ''}" style="width:${f.pctA}%"></div>
                  </div>
                  <div class="step2-facet-poles">
                    <span>${escapeHtml(f.nameA)} ${f.pctA}%</span>
                    <span>${f.pctB}% ${escapeHtml(f.nameB)}</span>
                  </div>
                </div>
              `;
            })
            .join('');

          return `
            <div class="step2-group-card">
              <div class="step2-group-title">
                <span>${escapeHtml(g.dimLabel)} (${escapeHtml(g.dimKey)})</span>
                <span class="sub-pill">主偏好 ${escapeHtml(g.parentWinner)} · ${g.parentWinnerPct}%</span>
              </div>
              ${rowsHtml}
            </div>
          `;
        })
        .join('');

      step2Html = `
        <div class="divider-line"></div>
        <h3 style="margin:0 0 6px;font-size:1.05rem">MBTI Step II（Form Q）二十個細分面向實測光譜</h3>
        <p style="margin:0;font-size:0.86rem;color:var(--text-muted)">依據 Quenk, Hammer &amp; Majors (2001) 將四大向度細拆為 20 個獨立面向，辨識你的「順向偏好」與「跨向度混合特質」。</p>
        <div class="step2-summary-banner">
          <span>${bannerText}</span>
        </div>
        <div class="step2-groups">${groupsHtml}</div>
      `;
    }

    const loop = litProfile.cognitiveLoop || {};
    const grip = litProfile.quenkGrip || {};
    const refsHtml = (litProfile.references || [])
      .map((r) => `<li><strong>${escapeHtml(r.author)}</strong> — ${escapeHtml(r.work)}：${escapeHtml(r.role)}</li>`)
      .join('');

    return `
      <div class="lit-meta-grid">
        ${interaction ? `
          <div class="lit-meta-card">
            <h4>Berens 互動風格 (Interaction Style)</h4>
            <div class="lit-meta-title">${escapeHtml(interaction.name)}</div>
            <div class="lit-meta-sub">${escapeHtml(interaction.dimensions)}</div>
            <p style="margin:0;font-size:0.86rem;color:var(--text-secondary)">${escapeHtml(interaction.summary)}</p>
          </div>
        ` : ''}
        ${temperament ? `
          <div class="lit-meta-card">
            <h4>Keirsey 氣質動力 (Four Temperaments)</h4>
            <div class="lit-meta-title">${escapeHtml(temperament.name)}</div>
            <div class="lit-meta-sub">領導原型：${escapeHtml(temperament.leadershipArchetype)}</div>
            <p style="margin:0 0 4px;font-size:0.85rem;color:var(--text-secondary)"><strong>核心需求：</strong>${escapeHtml(temperament.coreNeed)}</p>
            <p style="margin:0;font-size:0.85rem;color:var(--text-secondary)"><strong>深層忌憚：</strong>${escapeHtml(temperament.coreFear)}</p>
          </div>
        ` : ''}
      </div>

      <h3 style="margin:4px 0 4px;font-size:1.05rem">John Beebe 八維心理原型全圖譜（意識 1–4 ＋ 陰影 5–8）</h3>
      <p style="margin:0 0 10px;font-size:0.86rem;color:var(--text-muted)">前四位構成有意識的人格主場；後四位（對立、批判父母、詭計盲點、魔鬼轉化）揭示壓力防禦與潛能整合的鑰匙。</p>
      <div class="beebe-grid">${beebeCardsHtml}</div>

      <div class="two-col-lists" style="margin-bottom:14px">
        <div class="insight-box">
          <h3>主導–第三功能防衛迴圈｜${escapeHtml(loop.name || '')}</h3>
          <p style="margin:0 0 6px;font-size:0.86rem;color:var(--text-secondary)"><strong>迴圈機制：</strong>${escapeHtml(loop.mechanism || '')}</p>
          <p style="margin:0 0 6px;font-size:0.86rem;color:var(--text-secondary)"><strong>警訊徵兆：</strong>${escapeHtml(loop.warningSigns || '')}</p>
          <p style="margin:0;font-size:0.86rem;color:var(--group-color, var(--accent))"><strong>破局策略：</strong>${escapeHtml(loop.exitStrategy || '')}</p>
        </div>
        <div class="insight-box">
          <h3>Quenk「In the Grip」劣勢壓力劫持與復原</h3>
          <p style="margin:0 0 6px;font-size:0.86rem;color:var(--text-secondary)"><strong>常見觸發：</strong>${escapeHtml(grip.trigger || '')}</p>
          <p style="margin:0 0 6px;font-size:0.86rem;color:var(--text-secondary)"><strong>失衡表徵：</strong>${escapeHtml(grip.behavior || '')}</p>
          <p style="margin:0;font-size:0.86rem;color:var(--group-color, var(--accent))"><strong>復原橋樑：</strong>${escapeHtml(grip.recoveryBridge || '')}</p>
        </div>
      </div>

      ${step2Html}

      <div class="insight-box" style="margin-top:12px">
        <h3>國際權威心理學與類型學參考文獻</h3>
        <ul class="lit-ref-list">${refsHtml}</ul>
      </div>
    `;
  }

  function buildPlainTextReport(record, adv) {
    const profile = TYPE_DATA.TYPES[record.baseType];
    const group = TYPE_DATA.GROUPS[profile.group];
    const mod = TYPE_DATA.IDENTITY_MODIFIERS[record.identity];
    const ext = EXTENDED_PROFILES[record.baseType];
    const lit = adv.literatureProfile;
    const dims = Object.values(record.dimensions)
      .map((d) => `- ${d.label}：${d.nameA} ${d.pctA}% / ${d.nameB} ${d.pctB}%（${d.clarity.label}）`)
      .join('\n');

    const litLines = lit
      ? [
          ``,
          `◆ 國際文獻深度模型（Beebe / Quenk / Berens / Keirsey）：`,
          lit.interactionStyle ? `互動風格：${lit.interactionStyle.name}` : '',
          lit.temperament ? `氣質核心：${lit.temperament.name}（核心需求：${lit.temperament.coreNeed}）` : '',
          `八維原型序位：${(lit.beebeStack || []).map((b) => `${b.pos}.${b.fnCode}(${b.role.split(' ')[0]})`).join(' → ')}`,
          lit.cognitiveLoop ? `防衛迴圈（${lit.cognitiveLoop.name}）：${lit.cognitiveLoop.exitStrategy}` : '',
          lit.quenkGrip ? `劣勢壓力復原（In the Grip）：${lit.quenkGrip.recoveryBridge}` : '',
          adv.step2Facets
            ? `Step II 跨向度混合特質數：${adv.step2Facets.outOfPreferenceCount} 項${
                adv.step2Facets.outOfPreferenceList.length
                  ? '（' + adv.step2Facets.outOfPreferenceList.slice(0, 5).map((f) => f.winnerName).join('、') + '）'
                  : ''
              }`
            : ''
        ].filter(Boolean)
      : [];

    return [
      `【PrismMBTI 進階人格測評報告】`,
      `人格類型：${record.fullType}｜${profile.name} (${profile.enName})`,
      `氣質群組：${group.name} (${group.enName})｜自我認同：${mod.name} (${mod.enName})`,
      `類型分化度：${adv.psychometrics.differentiationIndex}%（${adv.psychometrics.differentiationLabel}）｜作答一致度：${adv.psychometrics.overallConsistency}%`,
      `測驗時間：${formatDateTime(record.createdAt)}（${record.mode === 'quick' ? '快速 30 題' : '完整 60 題'}）`,
      ``,
      `◆ 專業綜述：${adv.executiveSummary}`,
      `◆ 一句話特質：${profile.tagline}`,
      `◆ 思維與決策模式：${profile.thinkingStyle}`,
      ``,
      `◆ 五大維度光譜：`,
      dims,
      ``,
      `◆ 認知動力與溝通建議：`,
      `${adv.cognitiveDynamics.axisTensionTitle} — ${adv.cognitiveDynamics.axisTensionDesc}`,
      `溝通偏好：${adv.communicationPlaybook.preferredStyle}`,
      ``,
      `◆ 職場關鍵強項：${ext.career.strengths6.map((s) => s.title).join('、')}`,
      `◆ 推薦職涯方向：${ext.career.recommendedRoles8.map((r) => r.role).join('、')}`,
      `◆ 個人成長強項：${ext.growth.strengths6.map((s) => s.title).join('、')}`,
      `◆ 人際關係超能力：${ext.relationships.superpowers6.map((s) => s.title).join('、')}`,
      ...litLines,
      ``,
      `◆ 30 天成長行動路線圖：`,
      adv.actionRoadmap.map((r) => `• ${r.stage}：${r.action}`).join('\n')
    ].join('\n');
  }

  function buildModalAnalysisTabsHtml(profile) {
    const ext = EXTENDED_PROFILES[profile.code];
    const canonicalDims = ADVANCED.buildCanonicalDimensions(profile.code);
    const subTraits = ADVANCED.computeDomainSubTraits(canonicalDims);
    const litSummary =
      ADVANCED.buildLiteratureSummary && LITERATURE
        ? ADVANCED.buildLiteratureSummary(profile.code, TYPE_DATA, LITERATURE, null)
        : null;

    const stackPreviewHtml = profile.functions
      .map((fnCode, idx) => {
        const fnMeta = TYPE_DATA.COGNITIVE_FUNCTIONS[fnCode];
        const pos = ['主導', '輔助', '第三', '劣勢'][idx];
        return `<span class="role-chip"><strong>${pos} ${escapeHtml(fnMeta.code)}</strong> · ${escapeHtml(fnMeta.name)}</span>`;
      })
      .join('');

    return `
      <div class="tabs-bar no-print" role="tablist" aria-label="16 型深度解析分類">
        <button type="button" class="tab-btn is-active" role="tab" aria-selected="true" data-tab="modal-overview">1. 人格特徵</button>
        <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="modal-career">2. 職業道路</button>
        <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="modal-growth">3. 個人成長</button>
        <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="modal-relationships">4. 人際關係</button>
        <button type="button" class="tab-btn" role="tab" aria-selected="false" data-tab="modal-literature">5. 國際文獻模型</button>
      </div>

      <div class="tab-pane is-active" id="tab-modal-overview">
        <div class="keyword-cloud">
          ${profile.keywords.map((kw) => `<span class="keyword-chip"># ${escapeHtml(kw)}</span>`).join('')}
        </div>
        <p class="summary-prose">${escapeHtml(profile.summary)}</p>
        <div class="insight-box" style="margin-bottom:16px">
          <h3>思維與決策模式</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.92rem">${escapeHtml(profile.thinkingStyle)}</p>
        </div>
        <div class="two-col-lists" style="margin-bottom:16px">
          <div class="insight-box">
            <h3>核心天賦優勢</h3>
            <ul>${profile.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
          </div>
          <div class="insight-box">
            <h3>潛在盲點與注意事項</h3>
            <ul>${profile.blindspots.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>
          </div>
        </div>
        <div>
          <h3 style="margin:0 0 6px;font-size:0.98rem">四維認知功能堆疊序位</h3>
          <div class="tag-cloud">${stackPreviewHtml}</div>
        </div>
      </div>

      <div class="tab-pane" id="tab-modal-career">
        ${buildCareerChapterBodyHtml(profile, ext, subTraits.career)}
      </div>

      <div class="tab-pane" id="tab-modal-growth">
        ${buildGrowthChapterBodyHtml(profile, ext, null, subTraits.growth)}
      </div>

      <div class="tab-pane" id="tab-modal-relationships">
        ${buildRelationshipsChapterBodyHtml(profile, ext, subTraits.relationships)}
      </div>

      <div class="tab-pane" id="tab-modal-literature">
        ${buildLiteratureModelBodyHtml(litSummary, null)}
      </div>
    `;
  }

  function bindTypeAnalysisTabs(container) {
    $$('.tab-btn', container).forEach((tabBtn) => {
      tabBtn.addEventListener('click', () => {
        const targetId = `tab-${tabBtn.dataset.tab}`;
        $$('.tab-btn', container).forEach((b) => {
          const active = b === tabBtn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        $$('.tab-pane', container).forEach((p) => {
          p.classList.toggle('is-active', p.id === targetId);
        });
      });
    });

    $$('[data-open-type]', container).forEach((btn) => {
      btn.addEventListener('click', () => openTypeModal(btn.dataset.openType));
    });
  }

  function renderResultReport(record) {
    const profile = TYPE_DATA.TYPES[record.baseType];
    const group = TYPE_DATA.GROUPS[profile.group];
    const mod = TYPE_DATA.IDENTITY_MODIFIERS[record.identity];
    const ext = EXTENDED_PROFILES[record.baseType];
    const root = $('#result-root');

    const historyList = getHistory();
    const currentIdx = historyList.findIndex((h) => h.id === record.id);
    const previousRecord =
      currentIdx >= 0 && currentIdx + 1 < historyList.length
        ? historyList[currentIdx + 1]
        : historyList.find((h) => h.id !== record.id) || null;

    const adv = ADVANCED.buildAdvancedAnalysis(record, TYPE_DATA, previousRecord, LITERATURE);

    const spectrumHtml = ['EI', 'SN', 'TF', 'JP', 'AT']
      .map((k) => renderSpectrumItem(record.dimensions[k], group.color))
      .join('');

    const stackRoles = ['主導功能 Dominant', '輔助功能 Auxiliary', '第三功能 Tertiary', '劣勢功能 Inferior'];
    const stackHtml = profile.functions
      .map((fnCode, idx) => {
        const fnMeta = TYPE_DATA.COGNITIVE_FUNCTIONS[fnCode];
        return `
          <div class="stack-card">
            <div class="stack-role">${stackRoles[idx]}</div>
            <div class="stack-code">${escapeHtml(fnMeta.code)}</div>
            <div class="stack-name">${escapeHtml(fnMeta.name)}</div>
            <p class="stack-desc">${escapeHtml(fnMeta.short)}</p>
          </div>
        `;
      })
      .join('');

    const cogOrdered = Object.entries(record.cognitiveFunctions)
      .sort((a, b) => b[1] - a[1])
      .map(([code, score]) => {
        const fnMeta = TYPE_DATA.COGNITIVE_FUNCTIONS[code];
        return `
          <div class="cog-bar-item">
            <div class="cog-bar-top">
              <span><strong>${escapeHtml(code)}</strong> · ${escapeHtml(fnMeta.name)}</span>
              <strong>${score}%</strong>
            </div>
            <div class="cog-bar-track">
              <div class="cog-bar-fill" style="width:${score}%"></div>
            </div>
          </div>
        `;
      })
      .join('');

    const borderlineHtml =
      adv.psychometrics.borderlineAxes.length > 0
        ? `
          <div class="domain-section-block">
            <h3 class="domain-subhead">邊緣均衡向度與跨類型彈性</h3>
            <div class="borderline-list">
              ${adv.psychometrics.borderlineAxes
                .map(
                  (b) => `
                    <div class="borderline-item">
                      <strong>${escapeHtml(b.label)}（${escapeHtml(b.nameA)} ${b.pctA}% / ${escapeHtml(b.nameB)} ${b.pctB}%）：</strong>
                      ${escapeHtml(b.explanation)}
                    </div>
                  `
                )
                .join('')}
            </div>
          </div>
        `
        : '';

    const neighborHtml =
      adv.psychometrics.neighborTypes.length > 0
        ? `
          <div class="domain-section-block">
            <h3 class="domain-subhead">最相近的臨界人格參考（點擊比較完整報告）</h3>
            <div class="compat-grid">
              ${adv.psychometrics.neighborTypes
                .map(
                  (n) => `
                    <button type="button" class="compat-btn" data-open-type="${escapeHtml(n.code)}">
                      <strong style="color:${n.color}">${escapeHtml(n.code)} · ${escapeHtml(n.name)}</strong>
                      <span>接近維度：${escapeHtml(n.flippedLabel)}</span>
                    </button>
                  `
                )
                .join('')}
            </div>
          </div>
        `
        : '';

    const shadowHtml = adv.cognitiveDynamics.shadowStandout
      ? `
        <div class="insight-box">
          <h3>非典型高分發展功能：${escapeHtml(adv.cognitiveDynamics.shadowStandout.code)}（${escapeHtml(adv.cognitiveDynamics.shadowStandout.name)} ${adv.cognitiveDynamics.shadowStandout.score}%）</h3>
          <p style="margin:0;color:var(--text-secondary);font-size:0.9rem">${escapeHtml(adv.cognitiveDynamics.shadowStandout.insight)}</p>
        </div>
      `
      : '';

    const historyDeltaHtml = adv.historyDelta
      ? `
        <section class="report-card">
          <span class="chapter-heading-badge">前後測驗追蹤</span>
          <h2>與前一次測驗變化對比</h2>
          <p class="report-card-sub">對比基準：${escapeHtml(adv.historyDelta.prevType)}（${escapeHtml(formatDateTime(adv.historyDelta.prevDate))}）</p>
          <div class="delta-grid">
            ${adv.historyDelta.dimShifts
              .map((s) => {
                const arrow = s.deltaA > 0 ? `+${s.deltaA}%` : s.deltaA < 0 ? `${s.deltaA}%` : '持平';
                return `
                  <div class="delta-item">
                    <small>${escapeHtml(s.label)}</small>
                    <strong>${escapeHtml(s.curWinner)} ${s.curWinnerPct}%</strong>
                    <span class="delta-shift">${s.shiftedPole ? `自 ${escapeHtml(s.prevWinner)} 轉向` : `較前次 ${arrow}`}</span>
                  </div>
                `;
              })
              .join('')}
          </div>
        </section>
      `
      : '';

    const neutralityNotice = record.quality.hasHighNeutrality
      ? `<div class="neutrality-notice">提示：本次測驗中有 <strong>${record.quality.neutralRate}%</strong> 題目選擇了「中立 / 不確定」，部分維度分數較接近邊緣。建議日後針對較有感的情境再次測驗，可獲得更鮮明的輪廓。</div>`
      : '';

    root.style.setProperty('--group-color', group.color);
    root.style.setProperty('--group-soft', group.softBg);

    root.innerHTML = `
      <section class="result-hero">
        <div class="result-hero-top">
          <div class="result-hero-main">
            <div class="result-illu-frame">
              <img src="${escapeHtml(resolveIllustrationSrc(profile.illustration))}" alt="${escapeHtml(profile.code)} ${escapeHtml(profile.name)}插畫" />
            </div>
            <div>
              <div class="result-badges">
                <span class="group-pill">${escapeHtml(group.name)} (${escapeHtml(group.enName)})</span>
                <span class="sub-pill">${escapeHtml(mod.name)} (${escapeHtml(mod.enName)})</span>
              </div>
              <h1 class="result-type-code">${escapeHtml(record.fullType)}</h1>
              <h2 class="result-type-title">${escapeHtml(profile.name)} <span>· ${escapeHtml(profile.enName)}</span></h2>
              <p class="result-tagline">${escapeHtml(profile.tagline)}</p>
              <div class="keyword-cloud" style="margin:12px 0 0">
                ${profile.keywords.map((kw) => `<span class="keyword-chip"># ${escapeHtml(kw)}</span>`).join('')}
              </div>
            </div>
          </div>
          <div class="result-meta-box">
            <div><strong>測驗模式：</strong>${record.mode === 'quick' ? '快速精簡版 (30 題)' : '標準完整版 (60 題)'}</div>
            <div><strong>完成時間：</strong>${escapeHtml(formatDateTime(record.createdAt))}</div>
            <div><strong>類型分化度：</strong>${adv.psychometrics.differentiationIndex}%（${escapeHtml(adv.psychometrics.differentiationLabel)}）</div>
            <div><strong>作答一致度：</strong>${adv.psychometrics.overallConsistency}%</div>
            <div><strong>中立作答率：</strong>${record.quality.neutralRate}%（${record.quality.neutralCount}/${record.quality.totalCount} 題）</div>
          </div>
        </div>
        <div class="result-actions no-print">
          <button type="button" class="btn btn-primary btn-sm" id="btn-copy-report">複製摘要報告</button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-save-jpg">另存成 JPG 圖片</button>
          <button type="button" class="btn btn-secondary btn-sm" id="btn-retake-quiz">重新測驗</button>
          <button type="button" class="btn btn-ghost btn-sm" id="btn-result-catalog">瀏覽 16 型圖鑑</button>
        </div>
      </section>

      ${neutralityNotice}

      <nav class="report-outline-nav no-print" aria-label="報告章節快速導覽">
        <button type="button" class="outline-pill is-active" data-scroll-sec="sec-traits">1. 人格特徵與心理指標</button>
        <button type="button" class="outline-pill" data-scroll-sec="sec-career">2. 你的職業道路</button>
        <button type="button" class="outline-pill" data-scroll-sec="sec-growth">3. 你的個人成長</button>
        <button type="button" class="outline-pill" data-scroll-sec="sec-relationships">4. 你的人際關係</button>
        <button type="button" class="outline-pill" data-scroll-sec="sec-cognitive">5. 榮格八維與行動方案</button>
        <button type="button" class="outline-pill" data-scroll-sec="sec-literature">6. 國際文獻深度模型</button>
      </nav>

      <!-- 第 1 章：人格特徵與心理指標 -->
      <section class="report-card" id="sec-traits">
        <span class="chapter-heading-badge">CHAPTER 1 · 人格特徵與心理計量</span>
        <h2>專業測評綜述與五大維度光譜</h2>
        <p class="report-card-sub">依您的作答分佈計算類型分化度、題組一致度與五維度光譜位置。</p>

        <div class="exec-summary-box">${escapeHtml(adv.executiveSummary)}</div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">類型分化明確度</div>
            <div class="metric-value">${adv.psychometrics.differentiationIndex}%</div>
            <div class="metric-sub">${escapeHtml(adv.psychometrics.differentiationLabel)} · ${escapeHtml(adv.psychometrics.differentiationSummary)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">題組作答一致度</div>
            <div class="metric-value">${adv.psychometrics.overallConsistency}%</div>
            <div class="metric-sub">${escapeHtml(adv.psychometrics.consistencyInterpretation)}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">鮮明傾向與中立比例</div>
            <div class="metric-value">${record.quality.extremeRate}% / ${record.quality.neutralRate}%</div>
            <div class="metric-sub">極端明確表態 ${record.quality.extremeCount} 題 · 中立保留 ${record.quality.neutralCount} 題</div>
          </div>
        </div>

        <div class="spectrum-list">${spectrumHtml}</div>

        <div class="insight-box" style="margin-top:20px">
          <h3>${escapeHtml(profile.code)} 性格總覽與思維模式</h3>
          <p style="margin:0 0 8px;color:var(--text-secondary);font-size:0.93rem">${escapeHtml(profile.summary)}</p>
          <p style="margin:0;color:var(--text-secondary);font-size:0.93rem"><strong>思維與決策模式：</strong>${escapeHtml(profile.thinkingStyle)}</p>
        </div>

        ${borderlineHtml}
        ${neighborHtml}
      </section>

      <!-- 第 2 章：你的職業道路 -->
      <section class="report-card" id="sec-career">
        <span class="chapter-heading-badge">CHAPTER 2 · 你的職業道路</span>
        <h2>職場競爭力、工作風格與職涯建議</h2>
        <p class="report-card-sub">結合您的五維度分數動態推算 4 大職業核心特質與專屬發展建議。</p>
        ${buildCareerChapterBodyHtml(profile, ext, adv.domainSubTraits.career)}
      </section>

      <!-- 第 3 章：你的個人成長 -->
      <section class="report-card" id="sec-growth">
        <span class="chapter-heading-badge">CHAPTER 3 · 你的個人成長</span>
        <h2>成長潛能、活力來源與能量耗損分析</h2>
        <p class="report-card-sub">看見你的心理復原力與內在掌控感指標，找到最有效率的充電與突破路徑。</p>
        ${buildGrowthChapterBodyHtml(profile, ext, mod, adv.domainSubTraits.growth)}
      </section>

      <!-- 第 4 章：你的人際關係 -->
      <section class="report-card" id="sec-relationships">
        <span class="chapter-heading-badge">CHAPTER 4 · 你的人際關係</span>
        <h2>情感連結、人際超能力與潛在風險</h2>
        <p class="report-card-sub">剖析你在伴侶、朋友與家庭關係中的互動優勢、盲點與相處契合度。</p>
        ${buildRelationshipsChapterBodyHtml(profile, ext, adv.domainSubTraits.relationships)}
      </section>

      <!-- 第 5 章：榮格八維、溝通手冊與 30 天行動方案 -->
      <section class="report-card" id="sec-cognitive">
        <span class="chapter-heading-badge">CHAPTER 5 · 榮格八維與行動方案</span>
        <h2>榮格八維認知雷達與 30 天成長路線圖</h2>
        <p class="report-card-sub">結合八維認知功能動力、他人協作溝通指南與分階段行動計畫。</p>

        <div class="stack-grid">${stackHtml}</div>

        <div class="radar-layout">
          <div class="radar-box">
            ${buildCognitiveRadarSvg(record.cognitiveFunctions, group.color)}
            <span class="radar-caption">榮格八維認知功能平衡雷達</span>
          </div>
          <div class="cog-bars" style="grid-template-columns:1fr">${cogOrdered}</div>
        </div>

        <div class="dynamics-grid">
          <div class="insight-box">
            <h3>${escapeHtml(adv.cognitiveDynamics.axisTensionTitle)}</h3>
            <p style="margin:0;color:var(--text-secondary);font-size:0.9rem">${escapeHtml(adv.cognitiveDynamics.axisTensionDesc)}</p>
            <div style="margin-top:12px">
              <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600">
                <span>內傾認知能量 (Ni/Si/Ti/Fi) ${adv.cognitiveDynamics.introvertedEnergyPct}%</span>
                <span>外傾 (Ne/Se/Te/Fe) ${adv.cognitiveDynamics.extravertedEnergyPct}%</span>
              </div>
              <div class="energy-ratio-bar">
                <div style="width:${adv.cognitiveDynamics.introvertedEnergyPct}%;background:${group.color}"></div>
                <div style="width:${adv.cognitiveDynamics.extravertedEnergyPct}%;background:color-mix(in srgb, ${group.color} 35%, var(--surface-muted))"></div>
              </div>
            </div>
          </div>
          ${shadowHtml}
        </div>

        <div class="domain-section-block">
          <h3 class="domain-subhead">專屬溝通手冊（如何與你高效合作）</h3>
          <div class="insight-box" style="margin-bottom:14px">
            <p style="margin:0;color:var(--text-secondary);font-size:0.92rem"><strong>溝通偏好：</strong>${escapeHtml(adv.communicationPlaybook.preferredStyle)}</p>
          </div>
          <div class="two-col-lists">
            <div class="insight-box">
              <h3>最佳協作方式（Do's）</h3>
              <ul>${adv.communicationPlaybook.dos.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
            </div>
            <div class="insight-box">
              <h3>溝通避雷提醒（Avoids）</h3>
              <ul>${adv.communicationPlaybook.avoids.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>

        <div class="domain-section-block">
          <h3 class="domain-subhead">30 天個人化成長行動路線圖</h3>
          <div class="roadmap-grid">
            ${adv.actionRoadmap
              .map(
                (step) => `
                  <div class="roadmap-card">
                    <div class="roadmap-stage">${escapeHtml(step.stage)}</div>
                    <div class="roadmap-focus">${escapeHtml(step.focus)}</div>
                    <p class="roadmap-action">${escapeHtml(step.action)}</p>
                  </div>
                `
              )
              .join('')}
          </div>
        </div>
      </section>

      <!-- 第 6 章：國際文獻深度模型 -->
      <section class="report-card" id="sec-literature">
        <span class="chapter-heading-badge">CHAPTER 6 · 國際文獻深度模型</span>
        <h2>Beebe 八維原型・Quenk 壓力劫持・Step II 20 細分面向</h2>
        <p class="report-card-sub">整合 John Beebe 陰影原型、Naomi Quenk 劣勢劫持復原、Linda Berens 互動風格、David Keirsey 氣質與 MBTI Step II (Form Q) 20 面向實測。</p>
        ${buildLiteratureModelBodyHtml(adv.literatureProfile, adv.step2Facets)}
      </section>

      ${historyDeltaHtml}
    `;

    $$('[data-open-type]', root).forEach((btn) => {
      btn.addEventListener('click', () => openTypeModal(btn.dataset.openType));
    });

    $$('[data-scroll-sec]', root).forEach((pill) => {
      pill.addEventListener('click', () => {
        $$('.outline-pill', root).forEach((p) => p.classList.toggle('is-active', p === pill));
        const target = $(`#${pill.dataset.scrollSec}`, root);
        if (target) {
          const y = target.getBoundingClientRect().top + window.scrollY - 134;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      });
    });

    $('#btn-copy-report').addEventListener('click', async () => {
      const text = buildPlainTextReport(record, adv);
      try {
        await navigator.clipboard.writeText(text);
        showToast('已複製進階完整報告到剪貼簿');
      } catch {
        showToast('瀏覽器不支援自動複製，可使用另存 JPG 圖片保存');
      }
    });

    function isMobileBrowser() {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const mobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
      const narrowTouch =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(max-width: 820px)').matches &&
        ('ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0);
      return mobileUa || narrowTouch;
    }

    function openJpgExportSheet(exported) {
      const modalBody = $('#type-modal-body');
      $('#type-modal-title').textContent = '手機報告圖片預覽與儲存';

      let canShareFile = false;
      try {
        if (
          exported.blob &&
          typeof navigator !== 'undefined' &&
          typeof navigator.share === 'function' &&
          typeof File === 'function'
        ) {
          const probeFile = new File([exported.blob], exported.filename, { type: 'image/jpeg' });
          canShareFile = !navigator.canShare || navigator.canShare({ files: [probeFile] });
        }
      } catch {
        canShareFile = false;
      }

      const downloadHref = exported.blob ? URL.createObjectURL(exported.blob) : exported.dataUrl;
      modalBody.innerHTML = `
        <div class="jpg-export-sheet">
          <div class="jpg-export-tip">
            <strong>報告圖片已產生（${exported.width} × ${exported.height} px）</strong>
            <p>📱 請點擊下方「分享／存入手機相簿」或「下載 JPG 檔案」；若在 LINE／社群內建瀏覽器無法自動下載，請<strong>長按下方完整圖片</strong>並選擇「儲存圖片 / 加入照片」。</p>
          </div>
          <div class="jpg-export-actions">
            ${canShareFile ? '<button type="button" class="btn btn-primary" id="btn-mobile-share-jpg">📤 分享／存入手機相簿</button>' : ''}
            <a class="btn ${canShareFile ? 'btn-secondary' : 'btn-primary'}" id="btn-mobile-dl-jpg" href="${downloadHref}" download="${escapeHtml(exported.filename)}">⬇ 下載 JPG 檔案</a>
          </div>
          <div class="jpg-preview-frame">
            <img src="${exported.dataUrl}" alt="${escapeHtml(exported.filename)}" class="jpg-preview-img" />
          </div>
        </div>
      `;

      const shareBtn = $('#btn-mobile-share-jpg', modalBody);
      if (shareBtn) {
        shareBtn.addEventListener('click', async () => {
          try {
            const file = new File([exported.blob], exported.filename, { type: 'image/jpeg' });
            await navigator.share({
              files: [file],
              title: `PrismMBTI 測評報告 (${record.fullType})`
            });
            showToast('已開啟系統分享／儲存選單');
          } catch (err) {
            if (!err || err.name !== 'AbortError') {
              showToast('此瀏覽器不支援直接分享檔案，請改點下載或長按圖片儲存');
            }
          }
        });
      }

      const dlBtn = $('#btn-mobile-dl-jpg', modalBody);
      if (dlBtn) {
        dlBtn.addEventListener('click', () => {
          showToast(`正在下載：${exported.filename}`);
        });
      }

      modalBody.scrollTop = 0;
      $('#type-modal-backdrop').classList.remove('hidden');
      $('#type-modal').classList.remove('hidden');
    }

    function triggerAnchorDownload(exported) {
      const link = document.createElement('a');
      if (exported.blob) {
        const url = URL.createObjectURL(exported.blob);
        link.href = url;
        link.download = exported.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } else {
        link.href = exported.dataUrl;
        link.download = exported.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    $('#btn-save-jpg').addEventListener('click', async () => {
      const btn = $('#btn-save-jpg');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '圖片產生中…';
      try {
        const exported = await window.MBTI_REPORT_IMAGE.generateReportJpg({
          record,
          profile,
          group,
          mod,
          ext,
          adv,
          literature: LITERATURE,
          cognitiveFunctionsMeta: TYPE_DATA.COGNITIVE_FUNCTIONS,
          illustrationSrc: resolveIllustrationSrc(profile.illustration)
        });

        if (window.pywebview && window.pywebview.api && typeof window.pywebview.api.save_jpg === 'function') {
          const res = await window.pywebview.api.save_jpg(exported.filename, exported.dataUrl);
          if (res && res.saved) {
            showToast(`已成功另存圖片至：${res.path}`);
          } else if (res && res.cancelled) {
            showToast('已取消另存圖片');
          } else {
            showToast('圖片儲存失敗，請稍後再試');
          }
          return;
        }

        if (isMobileBrowser()) {
          // On iOS/Android & in-app browsers (LINE, Files, HTMLViewer), trigger download when supported
          // AND always open the share / direct-download / long-press preview sheet so JPG saving never silently fails.
          const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || '');
          if (!isIOS) {
            try {
              triggerAnchorDownload(exported);
            } catch {
              // ignore and rely on modal actions
            }
          }
          openJpgExportSheet(exported);
          showToast('JPG 圖片已備妥，可下載或長按圖片存入手機');
          return;
        }

        triggerAnchorDownload(exported);
        showToast(`已另存報告圖片：${exported.filename}`);
      } catch {
        showToast('產生 JPG 圖片時發生錯誤');
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
      }
    });

    $('#btn-retake-quiz').addEventListener('click', () => {
      switchView('home');
    });

    $('#btn-result-catalog').addEventListener('click', () => {
      renderCatalog();
      switchView('catalog');
    });
  }

  // ==================== 16-Type Catalog & Detail Modal ====================
  function renderCatalog() {
    $$('.filter-pill', $('#catalog-filters')).forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.group === state.catalogFilter);
    });

    const query = state.catalogSearch.trim().toLowerCase();
    const list = Object.values(TYPE_DATA.TYPES).filter((t) => {
      const matchGroup = state.catalogFilter === 'ALL' || t.group === state.catalogFilter;
      const matchSearch =
        !query ||
        t.code.toLowerCase().includes(query) ||
        t.name.toLowerCase().includes(query) ||
        t.enName.toLowerCase().includes(query) ||
        t.tagline.toLowerCase().includes(query);
      return matchGroup && matchSearch;
    });

    const grid = $('#catalog-grid');
    if (list.length === 0) {
      grid.innerHTML = `<p style="color:var(--text-muted)">找不到符合「${escapeHtml(state.catalogSearch)}」的人格類型。</p>`;
      return;
    }

    grid.innerHTML = list
      .map((t) => {
        const g = TYPE_DATA.GROUPS[t.group];
        return `
          <button type="button" class="type-card" style="--group-color:${g.color}" data-catalog-type="${escapeHtml(t.code)}">
            <div class="type-card-illu">
              <img src="${escapeHtml(resolveIllustrationSrc(t.illustration))}" alt="${escapeHtml(t.code)} ${escapeHtml(t.name)}插畫" loading="lazy" />
            </div>
            <div class="type-card-code">${escapeHtml(t.code)}</div>
            <div class="type-card-title">${escapeHtml(t.name)} <span class="type-card-en">${escapeHtml(t.enName)}</span></div>
            <span class="mode-tag">${escapeHtml(g.name)}</span>
            <p class="type-card-tag">${escapeHtml(t.tagline)}</p>
          </button>
        `;
      })
      .join('');

    $$('.type-card', grid).forEach((card) => {
      card.addEventListener('click', () => openTypeModal(card.dataset.catalogType));
    });
  }

  function openTypeModal(code) {
    const profile = TYPE_DATA.TYPES[code];
    if (!profile) return;
    const group = TYPE_DATA.GROUPS[profile.group];
    const modalBody = $('#type-modal-body');

    $('#type-modal-title').textContent = `${profile.code} · ${profile.name} (${profile.enName})`;
    modalBody.innerHTML = `
      <div style="--group-color:${group.color};--group-soft:${group.softBg}">
        <div class="modal-hero">
          <div class="modal-illu-frame">
            <img src="${escapeHtml(resolveIllustrationSrc(profile.illustration))}" alt="${escapeHtml(profile.code)} ${escapeHtml(profile.name)}插畫" />
          </div>
          <div>
            <div class="result-badges">
              <span class="group-pill">${escapeHtml(group.name)} (${escapeHtml(group.enName)})</span>
              <span class="sub-pill">認知堆疊：${profile.functions.join(' → ')}</span>
            </div>
            <p style="font-weight:600;margin:8px 0 0;font-size:1.02rem">${escapeHtml(profile.tagline)}</p>
          </div>
        </div>
        ${buildModalAnalysisTabsHtml(profile)}
      </div>
    `;

    bindTypeAnalysisTabs(modalBody);
    modalBody.scrollTop = 0;

    $('#type-modal-backdrop').classList.remove('hidden');
    $('#type-modal').classList.remove('hidden');
  }

  function closeTypeModal() {
    $('#type-modal-backdrop').classList.add('hidden');
    $('#type-modal').classList.add('hidden');
  }

  // ==================== Event Bindings & Init ====================
  function bindEvents() {
    $('#btn-theme-toggle').addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    $('#btn-brand-home').addEventListener('click', () => {
      refreshResumeBanner();
      switchView('home');
    });

    $$('.nav-pill[data-nav]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const dest = btn.dataset.nav;
        if (dest === 'home') refreshResumeBanner();
        if (dest === 'catalog') renderCatalog();
        switchView(dest);
      });
    });

    $('#btn-home-to-catalog').addEventListener('click', () => {
      renderCatalog();
      switchView('catalog');
    });

    $$('.start-quiz-btn').forEach((btn) => {
      btn.addEventListener('click', () => startNewQuiz(btn.dataset.mode));
    });

    $('#btn-resume-quiz').addEventListener('click', resumeDraftQuiz);
    $('#btn-discard-draft').addEventListener('click', () => {
      clearQuizDraft();
      showToast('已清除未完成草稿');
    });

    $$('[data-layout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.layout = btn.dataset.layout;
        syncLayoutButtons();
        savePrefs();
      });
    });

    $$('[data-quiz-layout]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.layout = btn.dataset.quizLayout;
        syncLayoutButtons();
        savePrefs();
        if (state.quiz) {
          state.quiz.currentPage = Math.floor(state.quiz.currentIndex / PAGE_SIZE);
          renderQuiz();
        }
      });
    });

    $('#chk-auto-advance').addEventListener('change', (e) => {
      state.autoAdvance = e.target.checked;
      savePrefs();
    });

    $('#btn-pause-quiz').addEventListener('click', () => {
      saveQuizDraft();
      refreshResumeBanner();
      switchView('home');
      showToast('作答進度已保存，隨時可繼續');
    });

    $('#btn-reset-quiz').addEventListener('click', () => {
      if (!state.quiz) return;
      const mode = state.quiz.mode;
      startNewQuiz(mode);
      showToast('已重新開始測驗');
    });

    $('#btn-prev-step').addEventListener('click', handlePrevStep);
    $('#btn-next-step').addEventListener('click', handleNextStep);

    $('#btn-toggle-qmap').addEventListener('click', () => {
      const panel = $('#question-map-panel');
      panel.classList.toggle('hidden');
      renderQuestionMap();
    });

    // Catalog filters
    $$('.filter-pill', $('#catalog-filters')).forEach((btn) => {
      btn.addEventListener('click', () => {
        state.catalogFilter = btn.dataset.group;
        renderCatalog();
      });
    });

    $('#catalog-search').addEventListener('input', (e) => {
      state.catalogSearch = e.target.value;
      renderCatalog();
    });

    // History Drawer
    $('#btn-open-history').addEventListener('click', openHistoryDrawer);
    $('#btn-close-history').addEventListener('click', closeHistoryDrawer);
    $('#history-backdrop').addEventListener('click', closeHistoryDrawer);
    $('#btn-clear-history').addEventListener('click', () => {
      safeSetStorage(STORAGE_KEYS.HISTORY, []);
      updateHistoryBadge();
      renderHistoryDrawer();
      showToast('已清空歷史紀錄');
    });

    // Type Modal
    $('#btn-close-type-modal').addEventListener('click', closeTypeModal);
    $('#type-modal-backdrop').addEventListener('click', closeTypeModal);

    // Keyboard shortcuts for single-question mode & Escape closing dialogs
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeHistoryDrawer();
        closeTypeModal();
        return;
      }

      if (state.activeView !== 'quiz' || !state.quiz || state.layout !== 'single') {
        return;
      }

      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if (e.key >= '1' && e.key <= '7') {
        const option = LIKERT_OPTIONS[Number(e.key) - 1];
        const currentQ = state.quiz.questions[state.quiz.currentIndex];
        if (option && currentQ) {
          e.preventDefault();
          handleAnswerSelection(currentQ.id, option.value);
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevStep();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextStep();
      }
    });
  }

  function init() {
    initTheme();
    loadPrefs();
    renderHomeTemperaments();
    refreshResumeBanner();
    updateHistoryBadge();
    renderCatalog();
    bindEvents();
  }

  init();
}());
