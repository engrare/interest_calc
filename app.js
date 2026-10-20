/**
 * InterestCalc - Minimalist, Hızlı ve Güvenilir Faiz Hesaplayıcı
 * 1. Anapara ve günlük kazançtan faiz oranı hesaplanır ve kaydedilir.
 * 2. Sonraki tüm hesaplamalar sadece o anki anapara yazılarak bu oran üzerinden anında yapılır.
 * Değerler çerezlerde (cookies) ve localStorage'da saklanır.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'interest_calc_v3_pref';

  // --- APPLICATION STATE ---
  const state = {
    refPrincipal: 10000,
    refDailyInterest: 150,
    activeDailyRate: 1.5,
    currentPrincipal: 10000,
    mode: 'compound', // 'compound' | 'simple'
    currency: '₺'
  };

  // --- SMART NUMBER PARSER (Handles Turkish comma & thousands dot) ---
  function parseNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim().replace(/\s+/g, '');
    
    // Turkish thousand dot and comma decimal: 10.000,50 -> 10000.50
    if (str.includes('.') && str.includes(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else if (str.includes(',')) {
      str = str.replace(',', '.');
    } else if (str.includes('.')) {
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

  let saveTimer = null;
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

  function initApp() {
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

    if (!elements.refPrincipalInput || !elements.currentPrincipalInput) {
      console.warn('InterestCalc: Critical DOM elements not found.');
      return;
    }

    function showToast(msg) {
      if (!elements.toast || !elements.toastMsg) return;
      elements.toastMsg.textContent = msg;
      elements.toast.classList.remove('translate-y-24', 'opacity-0');
      elements.toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        elements.toast.classList.add('translate-y-24', 'opacity-0');
        elements.toast.classList.remove('translate-y-0', 'opacity-100');
      }, 2600);
    }

    function updateRatePreview() {
      const p = parseNumber(elements.refPrincipalInput.value);
      const r = parseNumber(elements.refDailyInterestInput.value);
      if (p > 0) {
        const calcRate = (r / p) * 100;
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = `%${calcRate.toFixed(4)}`;
      } else {
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = '%0.0000';
      }
    }

    function updateModeUI() {
      if (!elements.modeCompoundBtn || !elements.modeSimpleBtn) return;
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

    function calculate() {
      const principal = parseNumber(elements.currentPrincipalInput.value);
      state.currentPrincipal = principal;

      let rate = state.activeDailyRate;
      if (isNaN(rate) || rate <= 0) {
        rate = 1.5;
        state.activeDailyRate = 1.5;
      }

      const dailyRateFrac = rate / 100;

      if (elements.currentPrincipalFormatted) {
        elements.currentPrincipalFormatted.textContent = formatMoney(principal, false);
      }

      const oneDayProfit = principal * dailyRateFrac;
      if (elements.dailyProfitResult) {
        elements.dailyProfitResult.textContent = formatMoney(oneDayProfit);
      }

      let currentBalance = principal;
      let cumulativeProfit = 0;
      const breakdown = [];

      for (let day = 1; day <= 60; day++) {
        let dayProfit = 0;
        if (state.mode === 'compound') {
          dayProfit = currentBalance * dailyRateFrac;
          currentBalance += dayProfit;
          cumulativeProfit = currentBalance - principal;
        } else {
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

      const res30 = breakdown[29] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
      if (elements.profit30) elements.profit30.textContent = `+${formatMoney(res30.cumulativeProfit)}`;
      if (elements.balance30) elements.balance30.textContent = formatMoney(res30.endBalance);
      if (elements.roi30) elements.roi30.textContent = `+${res30.roi.toFixed(1)}%`;

      const res60 = breakdown[59] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
      if (elements.profit60) elements.profit60.textContent = `+${formatMoney(res60.cumulativeProfit)}`;
      if (elements.balance60) elements.balance60.textContent = formatMoney(res60.endBalance);
      if (elements.roi60) elements.roi60.textContent = `+${res60.roi.toFixed(1)}%`;

      renderTable(breakdown);
      persistState();
    }

    function renderTable(breakdown) {
      if (!elements.simpleTableBody) return;
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

        elements.refPrincipalInput.value = state.refPrincipal;
        elements.refDailyInterestInput.value = state.refDailyInterest;
        elements.currentPrincipalInput.value = state.currentPrincipal;

        const rateStr = formatRate(state.activeDailyRate);
        if (elements.displayActiveRate) elements.displayActiveRate.textContent = rateStr;
        if (elements.rateInStep2Label) elements.rateInStep2Label.textContent = rateStr;

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

    // --- EVENT LISTENERS ---
    ['input', 'keyup', 'change', 'paste'].forEach(evtName => {
      elements.refPrincipalInput.addEventListener(evtName, updateRatePreview);
      elements.refDailyInterestInput.addEventListener(evtName, updateRatePreview);
      elements.currentPrincipalInput.addEventListener(evtName, calculate);
    });

    if (elements.saveRateBtn) {
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
        if (elements.displayActiveRate) elements.displayActiveRate.textContent = rateFormatted;
        if (elements.rateInStep2Label) elements.rateInStep2Label.textContent = rateFormatted;
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = `%${calculatedRate.toFixed(4)}`;

        elements.currentPrincipalInput.value = p;
        state.currentPrincipal = p;

        calculate();
        showToast(`✓ Faiz oranı %${rateFormatted} olarak kaydedildi!`);
      });
    }

    elements.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amt = parseFloat(chip.dataset.amt);
        elements.currentPrincipalInput.value = amt;
        calculate();
      });
    });

    if (elements.modeCompoundBtn) {
      elements.modeCompoundBtn.addEventListener('click', () => {
        state.mode = 'compound';
        updateModeUI();
        calculate();
      });
    }

    if (elements.modeSimpleBtn) {
      elements.modeSimpleBtn.addEventListener('click', () => {
        state.mode = 'simple';
        updateModeUI();
        calculate();
      });
    }

    if (elements.toggleTableBtn && elements.tableContainer) {
      elements.toggleTableBtn.addEventListener('click', () => {
        const isHidden = elements.tableContainer.classList.toggle('hidden');
        if (elements.tableChevron) {
          elements.tableChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    }

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

    if (elements.resetAllBtn) {
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
        if (elements.displayActiveRate) elements.displayActiveRate.textContent = rateStr;
        if (elements.rateInStep2Label) elements.rateInStep2Label.textContent = rateStr;

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
        showToast('Tüm değerler ve çerezler sıfırlandı.');
      });
    }

    // Load and calculate initial state
    loadPersistedState();
    updateRatePreview();
    calculate();
  }

  // Safe run: If DOM elements are already available, initialize immediately!
  if (document.getElementById('refPrincipalInput')) {
    initApp();
  } else {
    document.addEventListener('DOMContentLoaded', initApp);
  }
})();
