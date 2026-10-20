/**
 * InterestCalc - Minimalist ve Hızlı Faiz Hesaplayıcı
 * 1. Anapara ve günlük faiz girilerek oran hesaplanır ve kaydedilir.
 * 2. Sonrasında sadece o anki anapara yazılarak 30 ve 60 günlük kazanç anında hesaplanır.
 * Tüm değerler çerezlerde (cookies) ve localStorage'da saklanır.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'interest_calc_pref';

  // --- STATE ---
  const state = {
    refPrincipal: 10000,
    refDailyInterest: 150,
    activeDailyRate: 1.5,
    currentPrincipal: 10000,
    mode: 'compound', // 'compound' | 'simple'
    currency: '₺',
    rateFormOpen: true
  };

  // --- DOM ELEMENTS ---
  const elements = {
    // Step 1: Rate Setup
    refPrincipalInput: document.getElementById('refPrincipalInput'),
    refDailyInterestInput: document.getElementById('refDailyInterestInput'),
    calcRatePreview: document.getElementById('calcRatePreview'),
    saveRateBtn: document.getElementById('saveRateBtn'),
    displayActiveRate: document.getElementById('displayActiveRate'),
    savedRateBadge: document.getElementById('savedRateBadge'),
    rateSectionHeader: document.getElementById('rateSectionHeader'),
    rateFormContainer: document.getElementById('rateFormContainer'),
    rateChevron: document.getElementById('rateChevron'),

    // Step 2: Current Principal & Calculation
    currentPrincipalInput: document.getElementById('currentPrincipalInput'),
    quickChips: document.querySelectorAll('.quick-chip'),
    modeCompoundBtn: document.getElementById('modeCompoundBtn'),
    modeSimpleBtn: document.getElementById('modeSimpleBtn'),
    dailyProfitResult: document.getElementById('dailyProfitResult'),

    // Results
    profit30: document.getElementById('profit30'),
    balance30: document.getElementById('balance30'),
    roi30: document.getElementById('roi30'),
    profit60: document.getElementById('profit60'),
    balance60: document.getElementById('balance60'),
    roi60: document.getElementById('roi60'),

    // Table
    toggleTableBtn: document.getElementById('toggleTableBtn'),
    tableContainer: document.getElementById('tableContainer'),
    tableChevron: document.getElementById('tableChevron'),
    simpleTableBody: document.getElementById('simpleTableBody'),

    // Header controls & Toast
    currencyButtons: document.querySelectorAll('.currency-btn'),
    currencySymbols: document.querySelectorAll('.currency-symbol'),
    resetAllBtn: document.getElementById('resetAllBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
  };

  let saveTimer = null;

  // --- COOKIE HELPERS ---
  function setCookie(name, value, days = 365) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};path=/;SameSite=Lax`;
    } catch (e) {}
  }

  function getCookie(name) {
    try {
      const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
      return v ? decodeURIComponent(v[2]) : null;
    } catch (e) {
      return null;
    }
  }

  function eraseCookie(name) {
    try {
      document.cookie = `${name}=;Max-Age=-99999999;path=/;SameSite=Lax`;
    } catch (e) {}
  }

  // Save state to cookies & localStorage
  function persistState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const payload = JSON.stringify(state);
      setCookie(STORAGE_KEY, payload, 365);
      try {
        localStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {}
    }, 150);
  }

  // Load state from cookies or localStorage
  function loadPersistedState() {
    let raw = getCookie(STORAGE_KEY);
    if (!raw) {
      try {
        raw = localStorage.getItem(STORAGE_KEY);
      } catch (e) {}
    }
    if (!raw) return false;

    try {
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return false;

      if (data.refPrincipal !== undefined) state.refPrincipal = Number(data.refPrincipal);
      if (data.refDailyInterest !== undefined) state.refDailyInterest = Number(data.refDailyInterest);
      if (data.activeDailyRate !== undefined) state.activeDailyRate = Number(data.activeDailyRate);
      if (data.currentPrincipal !== undefined) state.currentPrincipal = Number(data.currentPrincipal);
      if (data.mode === 'compound' || data.mode === 'simple') state.mode = data.mode;
      if (data.currency) state.currency = data.currency;
      if (data.rateFormOpen !== undefined) state.rateFormOpen = Boolean(data.rateFormOpen);

      // Sync inputs
      elements.refPrincipalInput.value = state.refPrincipal;
      elements.refDailyInterestInput.value = state.refDailyInterest;
      elements.currentPrincipalInput.value = state.currentPrincipal;
      elements.displayActiveRate.textContent = state.activeDailyRate.toFixed(4).replace(/\.?0+$/, '') || '0';

      // Sync Currency UI
      elements.currencyButtons.forEach(b => {
        if (b.dataset.currency === state.currency) {
          b.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.remove('text-slate-400');
        } else {
          b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.add('text-slate-400');
        }
      });
      elements.currencySymbols.forEach(s => (s.textContent = state.currency));

      // Sync Mode UI
      updateModeUI();

      // Sync accordion open/close state
      setRateFormVisibility(state.rateFormOpen);

      return true;
    } catch (e) {
      return false;
    }
  }

  // --- NOTIFICATION ---
  function showToast(msg) {
    elements.toastMsg.textContent = msg;
    elements.toast.classList.remove('translate-y-24', 'opacity-0');
    elements.toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      elements.toast.classList.add('translate-y-24', 'opacity-0');
      elements.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2500);
  }

  // --- MONEY FORMATTER ---
  function formatMoney(amount, showDecimals = true) {
    if (isNaN(amount) || amount === null) return `${state.currency}0`;
    const decimals = showDecimals ? 2 : 0;
    return `${state.currency}${Number(amount).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  // --- RATE PREVIEW IN STEP 1 ---
  function updateRatePreview() {
    const p = parseFloat(elements.refPrincipalInput.value) || 0;
    const r = parseFloat(elements.refDailyInterestInput.value) || 0;
    if (p > 0) {
      const calcRate = (r / p) * 100;
      elements.calcRatePreview.textContent = `%${calcRate.toFixed(4)}`;
    } else {
      elements.calcRatePreview.textContent = '%0.0000';
    }
  }

  // --- TOGGLE STEP 1 ACCORDION ---
  function setRateFormVisibility(open) {
    state.rateFormOpen = open;
    if (open) {
      elements.rateFormContainer.classList.remove('hidden');
      elements.rateChevron.style.transform = 'rotate(0deg)';
    } else {
      elements.rateFormContainer.classList.add('hidden');
      elements.rateChevron.style.transform = 'rotate(-90deg)';
    }
    persistState();
  }

  // --- MODE UI ---
  function updateModeUI() {
    if (state.mode === 'compound') {
      elements.modeCompoundBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
      elements.modeCompoundBtn.classList.remove('text-slate-400');
      elements.modeSimpleBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
      elements.modeSimpleBtn.classList.add('text-slate-400');
    } else {
      elements.modeSimpleBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
      elements.modeSimpleBtn.classList.remove('text-slate-400');
      elements.modeCompoundBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
      elements.modeCompoundBtn.classList.add('text-slate-400');
    }
  }

  // --- CORE CALCULATION ENGINE ---
  function calculate() {
    const principal = Math.max(0, state.currentPrincipal);
    const dailyRateFrac = Math.max(0, state.activeDailyRate) / 100;

    // Daily Profit Preview for Day 1
    const oneDayProfit = principal * dailyRateFrac;
    elements.dailyProfitResult.textContent = formatMoney(oneDayProfit);

    let currentBalance = principal;
    let cumulativeProfit = 0;
    const breakdown = [];

    for (let day = 1; day <= 60; day++) {
      let dayProfit = 0;

      if (state.mode === 'compound') {
        // Bileşik: O anki bakiye üzerinden kâr eklenir
        dayProfit = currentBalance * dailyRateFrac;
        currentBalance += dayProfit;
        cumulativeProfit = currentBalance - principal;
      } else {
        // Basit: Her gün başlangıç anaparası üzerinden sabit kâr
        dayProfit = principal * dailyRateFrac;
        cumulativeProfit += dayProfit;
        currentBalance = principal + cumulativeProfit;
      }

      breakdown.push({
        day,
        dayProfit,
        cumulativeProfit,
        endBalance: currentBalance,
        roi: principal > 0 ? (cumulativeProfit / principal) * 100 : 0
      });
    }

    // 30 Days Result
    const res30 = breakdown[29] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
    elements.profit30.textContent = `+${formatMoney(res30.cumulativeProfit)}`;
    elements.balance30.textContent = formatMoney(res30.endBalance);
    elements.roi30.textContent = `+${res30.roi.toFixed(1)}%`;

    // 60 Days Result
    const res60 = breakdown[59] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
    elements.profit60.textContent = `+${formatMoney(res60.cumulativeProfit)}`;
    elements.balance60.textContent = formatMoney(res60.endBalance);
    elements.roi60.textContent = `+${res60.roi.toFixed(1)}%`;

    // Render Compact Table
    renderTable(breakdown);

    // Save to cookies & storage
    persistState();
  }

  // --- RENDER TABLE ---
  function renderTable(breakdown) {
    let rowsHtml = '';
    for (let i = 0; i < breakdown.length; i++) {
      const item = breakdown[i];
      let rowClass = 'hover:bg-dark-850 transition-colors';
      let badge = '';

      if (item.day === 30) {
        rowClass += ' highlight-row-30';
        badge = ' <span class="px-1.5 py-0.5 rounded text-[10px] bg-brand-500/20 text-brand-300 font-bold">1 Ay</span>';
      } else if (item.day === 60) {
        rowClass += ' highlight-row-60';
        badge = ' <span class="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-bold">2 Ay</span>';
      }

      rowsHtml += `
        <tr class="${rowClass}">
          <td class="py-2 px-3 font-bold text-white whitespace-nowrap">${item.day}. Gün${badge}</td>
          <td class="py-2 px-3 text-right text-brand-400 font-semibold">+${formatMoney(item.dayProfit)}</td>
          <td class="py-2 px-3 text-right text-emerald-300 font-semibold">+${formatMoney(item.cumulativeProfit)}</td>
          <td class="py-2 px-3 text-right text-white font-bold">${formatMoney(item.endBalance)}</td>
        </tr>
      `;
    }
    elements.simpleTableBody.innerHTML = rowsHtml;
  }

  // --- EVENT HANDLERS ---
  function setupEvents() {
    // Step 1: Inputs
    elements.refPrincipalInput.addEventListener('input', updateRatePreview);
    elements.refDailyInterestInput.addEventListener('input', updateRatePreview);

    // Step 1: Save Rate Button
    elements.saveRateBtn.addEventListener('click', () => {
      const p = parseFloat(elements.refPrincipalInput.value) || 0;
      const r = parseFloat(elements.refDailyInterestInput.value) || 0;

      if (p <= 0) {
        showToast('Lütfen geçerli bir anapara girin.');
        return;
      }

      state.refPrincipal = p;
      state.refDailyInterest = r;
      state.activeDailyRate = (r / p) * 100;

      const rateStr = state.activeDailyRate.toFixed(4).replace(/\.?0+$/, '') || '0';
      elements.displayActiveRate.textContent = rateStr;

      showToast(`Faiz oranı %${rateStr} olarak kaydedildi!`);

      // Optionally close accordion to keep UI clean and focus on calculation
      setRateFormVisibility(false);

      // Re-calculate with current principal
      calculate();
    });

    // Accordion toggle on header
    elements.rateSectionHeader.addEventListener('click', () => {
      setRateFormVisibility(elements.rateFormContainer.classList.contains('hidden'));
    });

    // Step 2: Current Principal Input
    elements.currentPrincipalInput.addEventListener('input', (e) => {
      state.currentPrincipal = Math.max(0, parseFloat(e.target.value) || 0);
      calculate();
    });

    // Quick Chips
    elements.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amt = parseFloat(chip.dataset.amt);
        state.currentPrincipal = amt;
        elements.currentPrincipalInput.value = amt;
        calculate();
      });
    });

    // Mode Toggle
    elements.modeCompoundBtn.addEventListener('click', () => {
      state.mode = 'compound';
      updateModeUI();
      calculate();
    });

    elements.modeSimpleBtn.addEventListener('click', () => {
      state.mode = 'simple';
      updateModeUI();
      calculate();
    });

    // Toggle Table
    elements.toggleTableBtn.addEventListener('click', () => {
      const isHidden = elements.tableContainer.classList.toggle('hidden');
      elements.tableChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Currency Selector
    elements.currencyButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.currencyButtons.forEach(b => {
          b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
        btn.classList.remove('text-slate-400');

        state.currency = btn.dataset.currency;
        elements.currencySymbols.forEach(s => (s.textContent = state.currency));
        calculate();
      });
    });

    // Reset All
    elements.resetAllBtn.addEventListener('click', () => {
      eraseCookie(STORAGE_KEY);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      state.refPrincipal = 10000;
      state.refDailyInterest = 150;
      state.activeDailyRate = 1.5;
      state.currentPrincipal = 10000;
      state.mode = 'compound';
      state.currency = '₺';
      state.rateFormOpen = true;

      elements.refPrincipalInput.value = 10000;
      elements.refDailyInterestInput.value = 150;
      elements.currentPrincipalInput.value = 10000;
      elements.displayActiveRate.textContent = '1.5';
      updateRatePreview();
      updateModeUI();
      setRateFormVisibility(true);

      elements.currencyButtons.forEach((b, idx) => {
        if (idx === 0) {
          b.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.remove('text-slate-400');
        } else {
          b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.add('text-slate-400');
        }
      });
      elements.currencySymbols.forEach(s => (s.textContent = '₺'));

      calculate();
      showToast('Tüm değerler ve çerezler sıfırlandı.');
    });
  }

  // --- INIT ---
  function init() {
    setupEvents();
    loadPersistedState();
    updateRatePreview();
    calculate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
