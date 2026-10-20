/**
 * InterestCalc - Minimalist, Hızlı ve Güvenilir Faiz Hesaplayıcı
 * 1. Anapara ve günlük kazançtan faiz oranı hesaplanır ve kaydedilir.
 * 2. Sonraki tüm hesaplamalar sadece o anki anapara yazılarak bu oran üzerinden anında yapılır.
 * Değerler çerezlerde (cookies) ve localStorage'da saklanır.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'interest_calc_v2_pref';

  // --- APPLICATION STATE ---
  const state = {
    refPrincipal: 10000,
    refDailyInterest: 150,
    activeDailyRate: 1.5,
    currentPrincipal: 10000,
    mode: 'compound', // 'compound' | 'simple'
    currency: '₺'
  };

  // --- DOM ELEMENTS ---
  const elements = {
    // Step 1: Rate Setup
    refPrincipalInput: document.getElementById('refPrincipalInput'),
    refDailyInterestInput: document.getElementById('refDailyInterestInput'),
    calcRatePreview: document.getElementById('calcRatePreview'),
    saveRateBtn: document.getElementById('saveRateBtn'),
    displayActiveRate: document.getElementById('displayActiveRate'),

    // Step 2: Current Principal & Calculation
    rateInStep2Label: document.getElementById('rateInStep2Label'),
    currentPrincipalInput: document.getElementById('currentPrincipalInput'),
    currentPrincipalFormatted: document.getElementById('currentPrincipalFormatted'),
    quickChips: document.querySelectorAll('.quick-chip'),
    modeCompoundBtn: document.getElementById('modeCompoundBtn'),
    modeSimpleBtn: document.getElementById('modeSimpleBtn'),
    dailyProfitResult: document.getElementById('dailyProfitResult'),

    // Step 2: 30 & 60 Days Output
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

    // Header & Currency & Toast
    currencyButtons: document.querySelectorAll('.currency-btn'),
    currencySymbols: document.querySelectorAll('.currency-symbol'),
    resetAllBtn: document.getElementById('resetAllBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
  };

  let saveTimer = null;

  // --- SMART NUMBER PARSER (Handles Turkish comma & thousands dot) ---
  function parseNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim().replace(/\s+/g, '');
    
    // Turkish thousand dot and comma decimal: 10.000,50 -> 10000.50
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      // 150,5 -> 150.5
      str = str.replace(',', '.');
    } else if (str.includes('.')) {
      // 10.000 -> 10000 if 3 digits follow and not a small decimal like 1.5
      const parts = str.split('.');
      if (parts.length === 2 && parts[1].length === 3 && parseFloat(parts[0]) >= 1) {
        str = parts[0] + parts[1];
      }
    }
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // --- COOKIE & STORAGE HELPERS ---
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

  function persistState() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const payload = JSON.stringify(state);
      setCookie(STORAGE_KEY, payload, 365);
      try {
        localStorage.setItem(STORAGE_KEY, payload);
      } catch (e) {}
    }, 200);
  }

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

      if (data.refPrincipal !== undefined && !isNaN(data.refPrincipal)) state.refPrincipal = Number(data.refPrincipal);
      if (data.refDailyInterest !== undefined && !isNaN(data.refDailyInterest)) state.refDailyInterest = Number(data.refDailyInterest);
      if (data.activeDailyRate !== undefined && !isNaN(data.activeDailyRate) && Number(data.activeDailyRate) > 0) {
        state.activeDailyRate = Number(data.activeDailyRate);
      }
      if (data.currentPrincipal !== undefined && !isNaN(data.currentPrincipal)) {
        state.currentPrincipal = Number(data.currentPrincipal);
      }
      if (data.mode === 'compound' || data.mode === 'simple') state.mode = data.mode;
      if (data.currency) state.currency = data.currency;

      // Populate input elements
      elements.refPrincipalInput.value = state.refPrincipal;
      elements.refDailyInterestInput.value = state.refDailyInterest;
      elements.currentPrincipalInput.value = state.currentPrincipal;
      
      const rateStr = formatRate(state.activeDailyRate);
      elements.displayActiveRate.textContent = rateStr;
      elements.rateInStep2Label.textContent = rateStr;

      // Currency UI
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

      updateModeUI();
      return true;
    } catch (e) {
      return false;
    }
  }

  // --- FORMATTERS ---
  function formatMoney(amount, showDecimals = true) {
    if (isNaN(amount) || amount === null) return `${state.currency}0`;
    const decimals = showDecimals ? 2 : 0;
    return `${state.currency}${Number(amount).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`;
  }

  function formatRate(rate) {
    if (isNaN(rate) || rate === null) return '0.00';
    return Number(rate).toFixed(4).replace(/\.?0+$/, '') || '0';
  }

  function showToast(msg) {
    elements.toastMsg.textContent = msg;
    elements.toast.classList.remove('translate-y-24', 'opacity-0');
    elements.toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      elements.toast.classList.add('translate-y-24', 'opacity-0');
      elements.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2600);
  }

  // --- STEP 1: RATE PREVIEW ---
  function updateRatePreview() {
    const p = parseNumber(elements.refPrincipalInput.value);
    const r = parseNumber(elements.refDailyInterestInput.value);
    if (p > 0) {
      const calcRate = (r / p) * 100;
      elements.calcRatePreview.textContent = `%${calcRate.toFixed(4)}`;
    } else {
      elements.calcRatePreview.textContent = '%0.0000';
    }
  }

  // --- STEP 2: MODE UI ---
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

  // --- STEP 2: REAL-TIME CALCULATION ENGINE ---
  function calculate() {
    const principal = parseNumber(elements.currentPrincipalInput.value);
    state.currentPrincipal = principal;

    // Make sure we have an active rate (default to 1.5 if 0)
    let rate = state.activeDailyRate;
    if (isNaN(rate) || rate <= 0) {
      rate = 1.5;
      state.activeDailyRate = 1.5;
    }

    const dailyRateFrac = rate / 100;

    // Display formatted principal
    elements.currentPrincipalFormatted.textContent = formatMoney(principal, false);

    // 1 Day Return
    const oneDayProfit = principal * dailyRateFrac;
    elements.dailyProfitResult.textContent = formatMoney(oneDayProfit);

    let currentBalance = principal;
    let cumulativeProfit = 0;
    const breakdown = [];

    for (let day = 1; day <= 60; day++) {
      let dayProfit = 0;

      if (state.mode === 'compound') {
        // Bileşik: O anki bakiye üzerinden kâr
        dayProfit = currentBalance * dailyRateFrac;
        currentBalance += dayProfit;
        cumulativeProfit = currentBalance - principal;
      } else {
        // Basit: Başlangıç anaparası üzerinden sabit kâr
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

    // 30 Days Output
    const res30 = breakdown[29] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
    elements.profit30.textContent = `+${formatMoney(res30.cumulativeProfit)}`;
    elements.balance30.textContent = formatMoney(res30.endBalance);
    elements.roi30.textContent = `+${res30.roi.toFixed(1)}%`;

    // 60 Days Output
    const res60 = breakdown[59] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
    elements.profit60.textContent = `+${formatMoney(res60.cumulativeProfit)}`;
    elements.balance60.textContent = formatMoney(res60.endBalance);
    elements.roi60.textContent = `+${res60.roi.toFixed(1)}%`;

    // Render Compact Table
    renderTable(breakdown);

    // Persist
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
        badge = ' <span class="px-1.5 py-0.5 rounded text-[10px] bg-brand-500/25 text-brand-300 font-bold">1 Ay</span>';
      } else if (item.day === 60) {
        rowClass += ' highlight-row-60';
        badge = ' <span class="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/25 text-cyan-300 font-bold">2 Ay</span>';
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

  // --- EVENT LISTENERS ---
  function setupEvents() {
    // Step 1: Real-time Rate Preview as user types
    elements.refPrincipalInput.addEventListener('input', updateRatePreview);
    elements.refDailyInterestInput.addEventListener('input', updateRatePreview);

    // Step 1: "Faiz Oranını Hesapla & Kaydet" Button
    elements.saveRateBtn.addEventListener('click', () => {
      const p = parseNumber(elements.refPrincipalInput.value);
      const r = parseNumber(elements.refDailyInterestInput.value);

      if (p <= 0) {
        showToast('Lütfen geçerli bir anapara girin.');
        elements.refPrincipalInput.focus();
        return;
      }

      const calculatedRate = (r / p) * 100;
      state.refPrincipal = p;
      state.refDailyInterest = r;
      state.activeDailyRate = calculatedRate;

      const rateFormatted = formatRate(calculatedRate);
      elements.displayActiveRate.textContent = rateFormatted;
      elements.rateInStep2Label.textContent = rateFormatted;
      elements.calcRatePreview.textContent = `%${calculatedRate.toFixed(4)}`;

      // Automatically sync Step 2's principal with this principal
      elements.currentPrincipalInput.value = p;
      state.currentPrincipal = p;

      // Run calculation immediately
      calculate();

      showToast(`✓ Faiz oranı %${rateFormatted} olarak kaydedildi!`);
    });

    // Step 2: Instant calculation on every keystroke
    elements.currentPrincipalInput.addEventListener('input', () => {
      calculate();
    });

    // Quick Amount Chips
    elements.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amt = parseFloat(chip.dataset.amt);
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

    // Table Accordion Toggle
    elements.toggleTableBtn.addEventListener('click', () => {
      const isHidden = elements.tableContainer.classList.toggle('hidden');
      elements.tableChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Currency Switcher
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

      elements.refPrincipalInput.value = 10000;
      elements.refDailyInterestInput.value = 150;
      elements.currentPrincipalInput.value = 10000;
      
      const rateStr = formatRate(state.activeDailyRate);
      elements.displayActiveRate.textContent = rateStr;
      elements.rateInStep2Label.textContent = rateStr;
      
      updateRatePreview();
      updateModeUI();

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
      showToast('Tüm değerler ve çerezler varsayılana sıfırlandı.');
    });
  }

  // --- INITIALIZATION ---
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
