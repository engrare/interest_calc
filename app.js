/**
 * Engrare Finans - Günlük Faiz & Taksit Arbitraj Hesaplayıcı
 * 1. Faiz Oranı Belirleme: Anapara ve günlük kazançtan faiz oranı hesaplanır ve kaydedilir.
 * 2. Anlık Faiz Getirisi: Günlük, 30 günlük ve 60 günlük faiz kazançları anında hesaplanır.
 * 3. Taksit Arbitrajı: Alışveriş tutarı faize yatırılarak taksitlerin aydan aya faizden ödenmesi simüle edilir,
 *    reel cebinizden çıkan miktar ve net arbitraj kazancı hesaplanır.
 * 4. Mobil Navigasyon: Standart mobil bottom navigation bar ile web & mobil tam uyumlu yapı.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'interest_calc_v4_pref';

  const state = {
    refPrincipal: 10000,
    refDailyInterest: 150,
    activeDailyRate: 1.5,
    currentPrincipal: 10000,
    mode: 'compound',
    currency: '₺',
    // Taksit arbitraj state
    installmentTotal: 30000,
    installmentCount: 6,
    installmentFirstPayment: 'delayed', // 'delayed' (30 gün sonra) | 'immediate' (peşin)
    installmentMode: 'compound', // 'compound' | 'simple'
    activeTab: 'interest' // 'interest' | 'installment'
  };

  function parseNumber(val) {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (!val) return 0;
    let str = String(val).trim().replace(/\s+/g, '');
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

  function setCookie(name, value, days = 365) {
    try {
      const d = new Date();
      d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
      document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
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
      document.cookie = name + '=;Max-Age=-99999999;path=/;SameSite=Lax';
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
    }, 150);
  }

  function formatMoney(amount, showDecimals = true) {
    if (isNaN(amount) || amount === null) return state.currency + '0';
    const decimals = showDecimals ? 2 : 0;
    return state.currency + Number(amount).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function formatRate(rate) {
    if (isNaN(rate) || rate === null) return '0.00';
    return Number(rate).toFixed(4).replace(/\.?0+$/, '') || '0';
  }

  function initApp() {
    const elements = {
      // Tabs
      tabContentInterest: document.getElementById('tabContentInterest'),
      tabContentInstallment: document.getElementById('tabContentInstallment'),
      desktopTabBtns: document.querySelectorAll('.desktop-tab-btn'),
      navTabBtns: document.querySelectorAll('.nav-tab-btn'),
      navBtnInterest: document.getElementById('navBtnInterest'),
      navBtnInstallment: document.getElementById('navBtnInstallment'),
      navBtnRateQuick: document.getElementById('navBtnRateQuick'),
      switchAndAdjustRateBtn: document.getElementById('switchAndAdjustRateBtn'),

      // Step 1: Rate
      refPrincipalInput: document.getElementById('refPrincipalInput'),
      refDailyInterestInput: document.getElementById('refDailyInterestInput'),
      calcRatePreview: document.getElementById('calcRatePreview'),
      saveRateBtn: document.getElementById('saveRateBtn'),
      displayActiveRate: document.getElementById('displayActiveRate'),
      rateInStep2Label: document.getElementById('rateInStep2Label'),
      activeRateShared: document.querySelectorAll('.active-rate-shared'),

      // Step 2: Interest Calc
      currentPrincipalInput: document.getElementById('currentPrincipalInput'),
      currentPrincipalFormatted: document.getElementById('currentPrincipalFormatted'),
      quickChips: document.querySelectorAll('.quick-chip'),
      modeCompoundBtn: document.getElementById('modeCompoundBtn'),
      modeSimpleBtn: document.getElementById('modeSimpleBtn'),
      dailyProfitResult: document.getElementById('dailyProfitResult'),
      profit30: document.getElementById('profit30'),
      balance30: document.getElementById('balance30'),
      roi30: document.getElementById('roi30'),
      profit60: document.getElementById('profit60'),
      balance60: document.getElementById('balance60'),
      roi60: document.getElementById('roi60'),
      toggleTableBtn: document.getElementById('toggleTableBtn'),
      tableContainer: document.getElementById('tableContainer'),
      tableChevron: document.getElementById('tableChevron'),
      simpleTableBody: document.getElementById('simpleTableBody'),

      // Tab 2: Installment Arbitrage
      installmentTotalInput: document.getElementById('installmentTotalInput'),
      installmentTotalFormatted: document.getElementById('installmentTotalFormatted'),
      installmentChips: document.querySelectorAll('.installment-chip'),
      instCountBtns: document.querySelectorAll('.inst-count-btn'),
      installmentCountInput: document.getElementById('installmentCountInput'),
      previewMonthlyInstallment: document.getElementById('previewMonthlyInstallment'),
      firstPayDelayedBtn: document.getElementById('firstPayDelayedBtn'),
      firstPayImmediateBtn: document.getElementById('firstPayImmediateBtn'),
      instModeCompoundBtn: document.getElementById('instModeCompoundBtn'),
      instModeSimpleBtn: document.getElementById('instModeSimpleBtn'),
      realCostResult: document.getElementById('realCostResult'),
      nominalCostLabel: document.getElementById('nominalCostLabel'),
      freeProductBadge: document.getElementById('freeProductBadge'),
      arbitrageDiscountPercent: document.getElementById('arbitrageDiscountPercent'),
      totalArbitrageInterest: document.getElementById('totalArbitrageInterest'),
      monthlyInstallmentResult: document.getElementById('monthlyInstallmentResult'),
      remainingBalanceResult: document.getElementById('remainingBalanceResult'),
      barRealCost: document.getElementById('barRealCost'),
      barInterestSave: document.getElementById('barInterestSave'),
      comparisonSummaryText: document.getElementById('comparisonSummaryText'),
      barRealCostText: document.getElementById('barRealCostText'),
      barInterestSaveText: document.getElementById('barInterestSaveText'),
      toggleInstallmentTableBtn: document.getElementById('toggleInstallmentTableBtn'),
      installmentTableContainer: document.getElementById('installmentTableContainer'),
      instTableChevron: document.getElementById('instTableChevron'),
      installmentTableBody: document.getElementById('installmentTableBody'),
      tableInstallmentCountLabel: document.getElementById('tableInstallmentCountLabel'),

      // Global
      currencyButtons: document.querySelectorAll('.currency-btn'),
      currencySymbols: document.querySelectorAll('.currency-symbol'),
      resetAllBtn: document.getElementById('resetAllBtn'),
      toast: document.getElementById('toast'),
      toastMsg: document.getElementById('toastMsg')
    };

    if (!elements.refPrincipalInput || !elements.installmentTotalInput) return;

    function showToast(msg) {
      if (!elements.toast || !elements.toastMsg) return;
      elements.toastMsg.textContent = msg;
      elements.toast.classList.remove('translate-y-28', 'opacity-0');
      elements.toast.classList.add('translate-y-0', 'opacity-100');
      setTimeout(() => {
        elements.toast.classList.add('translate-y-28', 'opacity-0');
        elements.toast.classList.remove('translate-y-0', 'opacity-100');
      }, 2600);
    }

    // --- TAB SWITCHING LOGIC ---
    function switchTab(target) {
      state.activeTab = target;

      if (target === 'installment') {
        elements.tabContentInterest.classList.add('hidden');
        elements.tabContentInstallment.classList.remove('hidden');

        // Bottom Nav styling
        elements.navBtnInterest.classList.remove('text-brand-400', 'font-bold', 'bg-brand-500/10', 'border', 'border-brand-500/20');
        elements.navBtnInterest.classList.add('text-slate-400', 'font-medium');
        elements.navBtnInstallment.classList.add('text-brand-400', 'font-bold', 'bg-brand-500/10', 'border', 'border-brand-500/20');
        elements.navBtnInstallment.classList.remove('text-slate-400', 'font-medium');

        // Desktop Tab styling
        elements.desktopTabBtns.forEach(btn => {
          if (btn.dataset.targetTab === 'installment') {
            btn.classList.add('text-white', 'bg-brand-600', 'shadow');
            btn.classList.remove('text-slate-400');
          } else {
            btn.classList.remove('text-white', 'bg-brand-600', 'shadow');
            btn.classList.add('text-slate-400');
          }
        });

        calculateInstallment();
      } else {
        elements.tabContentInstallment.classList.add('hidden');
        elements.tabContentInterest.classList.remove('hidden');

        // Bottom Nav styling
        elements.navBtnInstallment.classList.remove('text-brand-400', 'font-bold', 'bg-brand-500/10', 'border', 'border-brand-500/20');
        elements.navBtnInstallment.classList.add('text-slate-400', 'font-medium');
        elements.navBtnInterest.classList.add('text-brand-400', 'font-bold', 'bg-brand-500/10', 'border', 'border-brand-500/20');
        elements.navBtnInterest.classList.remove('text-slate-400', 'font-medium');

        // Desktop Tab styling
        elements.desktopTabBtns.forEach(btn => {
          if (btn.dataset.targetTab === 'interest') {
            btn.classList.add('text-white', 'bg-brand-600', 'shadow');
            btn.classList.remove('text-slate-400');
          } else {
            btn.classList.remove('text-white', 'bg-brand-600', 'shadow');
            btn.classList.add('text-slate-400');
          }
        });

        calculateInterest();
      }

      persistState();
    }

    elements.navTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.targetTab;
        if (target) switchTab(target);
      });
    });

    elements.desktopTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.targetTab;
        if (target) switchTab(target);
      });
    });

    if (elements.navBtnRateQuick) {
      elements.navBtnRateQuick.addEventListener('click', () => {
        switchTab('interest');
        elements.refPrincipalInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elements.refPrincipalInput.focus();
      });
    }

    if (elements.switchAndAdjustRateBtn) {
      elements.switchAndAdjustRateBtn.addEventListener('click', () => {
        switchTab('interest');
        elements.refPrincipalInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        elements.refPrincipalInput.focus();
      });
    }

    // --- UPDATE RATES DISPLAY ---
    function syncRateDisplays() {
      const rateFormatted = formatRate(state.activeDailyRate);
      if (elements.displayActiveRate) elements.displayActiveRate.textContent = rateFormatted;
      if (elements.rateInStep2Label) elements.rateInStep2Label.textContent = rateFormatted;
      elements.activeRateShared.forEach(el => (el.textContent = rateFormatted));
    }

    function updateRatePreview() {
      const p = parseNumber(elements.refPrincipalInput.value);
      const r = parseNumber(elements.refDailyInterestInput.value);
      if (p > 0) {
        const calcRate = (r / p) * 100;
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = '%' + calcRate.toFixed(4);
      } else {
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = '%0.0000';
      }
    }

    function updateModeUI() {
      // Interest Mode UI
      if (elements.modeCompoundBtn && elements.modeSimpleBtn) {
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

      // Installment Mode UI
      if (elements.instModeCompoundBtn && elements.instModeSimpleBtn) {
        if (state.installmentMode === 'compound') {
          elements.instModeCompoundBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.instModeCompoundBtn.classList.remove('text-slate-400');
          elements.instModeSimpleBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.instModeSimpleBtn.classList.add('text-slate-400');
        } else {
          elements.instModeSimpleBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.instModeSimpleBtn.classList.remove('text-slate-400');
          elements.instModeCompoundBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.instModeCompoundBtn.classList.add('text-slate-400');
        }
      }

      // Installment Timing UI
      if (elements.firstPayDelayedBtn && elements.firstPayImmediateBtn) {
        if (state.installmentFirstPayment === 'delayed') {
          elements.firstPayDelayedBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.firstPayDelayedBtn.classList.remove('text-slate-400');
          elements.firstPayImmediateBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.firstPayImmediateBtn.classList.add('text-slate-400');
        } else {
          elements.firstPayImmediateBtn.classList.add('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.firstPayImmediateBtn.classList.remove('text-slate-400');
          elements.firstPayDelayedBtn.classList.remove('bg-brand-600', 'text-white', 'shadow', 'font-bold');
          elements.firstPayDelayedBtn.classList.add('text-slate-400');
        }
      }
    }

    // --- CALCULATION 1: INTEREST ONLY ---
    function calculateInterest() {
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
      if (elements.profit30) elements.profit30.textContent = '+' + formatMoney(res30.cumulativeProfit);
      if (elements.balance30) elements.balance30.textContent = formatMoney(res30.endBalance);
      if (elements.roi30) elements.roi30.textContent = '+' + res30.roi.toFixed(1) + '%';

      const res60 = breakdown[59] || { cumulativeProfit: 0, endBalance: principal, roi: 0 };
      if (elements.profit60) elements.profit60.textContent = '+' + formatMoney(res60.cumulativeProfit);
      if (elements.balance60) elements.balance60.textContent = formatMoney(res60.endBalance);
      if (elements.roi60) elements.roi60.textContent = '+' + res60.roi.toFixed(1) + '%';

      renderInterestTable(breakdown);
      persistState();
    }

    function renderInterestTable(breakdown) {
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

        rowsHtml += '<tr class="' + rowClass + '">' +
          '<td class="py-2 px-3 font-bold text-white whitespace-nowrap">' + item.day + '. Gün' + badge + '</td>' +
          '<td class="py-2 px-3 text-right text-brand-400 font-semibold">+' + formatMoney(item.dayProfit) + '</td>' +
          '<td class="py-2 px-3 text-right text-emerald-300 font-semibold">+' + formatMoney(item.cumulativeProfit) + '</td>' +
          '<td class="py-2 px-3 text-right text-white font-bold">' + formatMoney(item.endBalance) + '</td>' +
          '</tr>';
      }
      elements.simpleTableBody.innerHTML = rowsHtml;
    }

    // --- CALCULATION 2: INSTALLMENT ARBITRAGE ---
    function calculateInstallment() {
      const total = parseNumber(elements.installmentTotalInput.value);
      state.installmentTotal = total;

      let months = parseInt(elements.installmentCountInput.value, 10);
      if (isNaN(months) || months < 1) months = 6;
      if (months > 36) months = 36;
      state.installmentCount = months;

      if (elements.installmentTotalFormatted) {
        elements.installmentTotalFormatted.textContent = formatMoney(total, false);
      }
      if (elements.nominalCostLabel) {
        elements.nominalCostLabel.textContent = formatMoney(total);
      }
      if (elements.tableInstallmentCountLabel) {
        elements.tableInstallmentCountLabel.textContent = '(' + months + ' Ay)';
      }

      const monthlyInstallment = months > 0 ? (total / months) : 0;
      if (elements.previewMonthlyInstallment) {
        elements.previewMonthlyInstallment.textContent = formatMoney(monthlyInstallment);
      }
      if (elements.monthlyInstallmentResult) {
        elements.monthlyInstallmentResult.textContent = formatMoney(monthlyInstallment) + ' / ay';
      }

      // Active daily rate
      let rate = state.activeDailyRate;
      if (isNaN(rate) || rate <= 0) rate = 1.5;
      const dailyRateFrac = rate / 100;

      // Simulation Loop
      let balance = total;
      let totalInterestEarned = 0;
      const rows = [];
      const isDelayed = state.installmentFirstPayment === 'delayed';

      // If immediate first payment, deduct 1 installment at day 0
      if (!isDelayed) {
        balance = Math.max(0, balance - monthlyInstallment);
      }

      for (let m = 1; m <= months; m++) {
        const startBal = balance;
        let monthInterest = 0;

        if (startBal > 0) {
          if (state.installmentMode === 'compound') {
            const monthMultiplier = Math.pow(1 + dailyRateFrac, 30);
            monthInterest = startBal * (monthMultiplier - 1);
          } else {
            monthInterest = startBal * (dailyRateFrac * 30);
          }
        }

        const balWithInterest = startBal + monthInterest;
        totalInterestEarned += monthInterest;

        let pay = monthlyInstallment;
        if (!isDelayed && m === months) {
          pay = 0; // Already paid upfront
        }

        const endBal = Math.max(0, balWithInterest - pay);
        balance = endBal;

        rows.push({
          month: m,
          startBal,
          monthInterest,
          payment: pay,
          endBal,
          cumulativeInterest: totalInterestEarned
        });
      }

      // Final metrics
      const realCost = Math.max(0, total - totalInterestEarned);
      const remainingBalance = balance;
      const discountPct = total > 0 ? (totalInterestEarned / total) * 100 : 0;

      // Display hero metrics
      if (elements.realCostResult) {
        elements.realCostResult.textContent = formatMoney(realCost);
      }
      if (elements.totalArbitrageInterest) {
        elements.totalArbitrageInterest.textContent = '+' + formatMoney(totalInterestEarned);
      }
      if (elements.remainingBalanceResult) {
        elements.remainingBalanceResult.textContent = formatMoney(remainingBalance);
      }
      if (elements.arbitrageDiscountPercent) {
        elements.arbitrageDiscountPercent.textContent = '%' + discountPct.toFixed(1) + ' Net Kazanç';
      }

      // Free Product Badge
      if (elements.freeProductBadge) {
        if (totalInterestEarned >= total && total > 0) {
          elements.freeProductBadge.classList.remove('hidden');
          elements.realCostResult.classList.add('text-emerald-400');
          elements.realCostResult.classList.remove('text-white');
        } else {
          elements.freeProductBadge.classList.add('hidden');
          elements.realCostResult.classList.remove('text-emerald-400');
          elements.realCostResult.classList.add('text-white');
        }
      }

      // Visual Progress Bar
      const realCostPctClamped = Math.max(0, Math.min(100, total > 0 ? (realCost / total) * 100 : 100));
      const interestPctClamped = Math.max(0, Math.min(100, 100 - realCostPctClamped));

      if (elements.barRealCost && elements.barInterestSave) {
        elements.barRealCost.style.width = realCostPctClamped + '%';
        elements.barInterestSave.style.width = interestPctClamped + '%';
      }
      if (elements.comparisonSummaryText) {
        elements.comparisonSummaryText.textContent = 'Liste fiyatının %' + discountPct.toFixed(1) + "'ini faiz kazancınız ödedi!";
      }
      if (elements.barRealCostText) {
        elements.barRealCostText.textContent = formatMoney(realCost) + ' (%' + realCostPctClamped.toFixed(1) + ')';
      }
      if (elements.barInterestSaveText) {
        elements.barInterestSaveText.textContent = '+' + formatMoney(totalInterestEarned) + ' (%' + discountPct.toFixed(1) + ')';
      }

      // Render Table
      renderInstallmentTable(rows, total, totalInterestEarned, realCost, months);
      persistState();
    }

    function renderInstallmentTable(rows, total, totalInterest, realCost, months) {
      if (!elements.installmentTableBody) return;
      let html = '';

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const isLast = (i === rows.length - 1);
        let rowClass = 'hover:bg-dark-850 transition-colors';
        if (isLast) rowClass += ' highlight-row-30 font-bold';

        html += '<tr class="' + rowClass + '">' +
          '<td class="py-2.5 px-3 font-bold text-white whitespace-nowrap">' + r.month + '. Ay (' + (r.month * 30) + '. Gün)' + '</td>' +
          '<td class="py-2.5 px-3 text-right text-slate-300">' + formatMoney(r.startBal) + '</td>' +
          '<td class="py-2.5 px-3 text-right text-brand-400 font-semibold">+' + formatMoney(r.monthInterest) + '</td>' +
          '<td class="py-2.5 px-3 text-right text-rose-400">-' + formatMoney(r.payment) + '</td>' +
          '<td class="py-2.5 px-3 text-right text-white font-bold">' + formatMoney(r.endBal) + '</td>' +
          '<td class="py-2.5 px-3 text-right text-emerald-300 font-semibold">+' + formatMoney(r.cumulativeInterest) + '</td>' +
          '</tr>';
      }

      // Summary Footer Row
      html += '<tr class="bg-dark-950 font-bold text-white border-t-2 border-slate-700">' +
        '<td class="py-3 px-3">TOPLAM ÖZET</td>' +
        '<td class="py-3 px-3 text-right text-slate-400">' + formatMoney(total) + '</td>' +
        '<td class="py-3 px-3 text-right text-emerald-400">+' + formatMoney(totalInterest) + '</td>' +
        '<td class="py-3 px-3 text-right text-rose-400">-' + formatMoney(total) + '</td>' +
        '<td class="py-3 px-3 text-right text-brand-400">Reel: ' + formatMoney(realCost) + '</td>' +
        '<td class="py-3 px-3 text-right text-emerald-400">Net Kâr: +' + formatMoney(totalInterest) + '</td>' +
        '</tr>';

      elements.installmentTableBody.innerHTML = html;
    }

    // --- LOAD & PERSIST STATE ---
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

        // Installment properties
        if (data.installmentTotal !== undefined && !isNaN(data.installmentTotal)) {
          state.installmentTotal = Number(data.installmentTotal);
        }
        if (data.installmentCount !== undefined && !isNaN(data.installmentCount)) {
          state.installmentCount = Number(data.installmentCount);
        }
        if (data.installmentFirstPayment === 'delayed' || data.installmentFirstPayment === 'immediate') {
          state.installmentFirstPayment = data.installmentFirstPayment;
        }
        if (data.installmentMode === 'compound' || data.installmentMode === 'simple') {
          state.installmentMode = data.installmentMode;
        }
        if (data.activeTab === 'interest' || data.activeTab === 'installment') {
          state.activeTab = data.activeTab;
        }

        // Sync inputs
        elements.refPrincipalInput.value = state.refPrincipal;
        elements.refDailyInterestInput.value = state.refDailyInterest;
        elements.currentPrincipalInput.value = state.currentPrincipal;
        elements.installmentTotalInput.value = state.installmentTotal;
        elements.installmentCountInput.value = state.installmentCount;

        syncRateDisplays();

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

        // Sync active installment count button
        elements.instCountBtns.forEach(b => {
          if (parseInt(b.dataset.months, 10) === state.installmentCount) {
            b.classList.add('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.remove('bg-dark-850', 'border-slate-800', 'text-slate-300');
          } else {
            b.classList.remove('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.add('bg-dark-850', 'border-slate-800', 'text-slate-300');
          }
        });

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
      elements.currentPrincipalInput.addEventListener(evtName, calculateInterest);
      elements.installmentTotalInput.addEventListener(evtName, calculateInstallment);
      elements.installmentCountInput.addEventListener(evtName, () => {
        const months = parseInt(elements.installmentCountInput.value, 10);
        elements.instCountBtns.forEach(b => {
          if (parseInt(b.dataset.months, 10) === months) {
            b.classList.add('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.remove('bg-dark-850', 'border-slate-800', 'text-slate-300');
          } else {
            b.classList.remove('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.add('bg-dark-850', 'border-slate-800', 'text-slate-300');
          }
        });
        calculateInstallment();
      });
    });

    // Save Rate Button
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

        syncRateDisplays();
        if (elements.calcRatePreview) elements.calcRatePreview.textContent = '%' + calculatedRate.toFixed(4);

        elements.currentPrincipalInput.value = p;
        state.currentPrincipal = p;

        calculateInterest();
        calculateInstallment();
        showToast('✓ Faiz oranı %' + formatRate(calculatedRate) + ' olarak kaydedildi!');
      });
    }

    // Quick Chips for Interest
    elements.quickChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amt = parseFloat(chip.dataset.amt);
        elements.currentPrincipalInput.value = amt;
        calculateInterest();
      });
    });

    // Quick Chips for Installment
    elements.installmentChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const amt = parseFloat(chip.dataset.amt);
        elements.installmentTotalInput.value = amt;
        calculateInstallment();
      });
    });

    // Installment Month Buttons
    elements.instCountBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const months = parseInt(btn.dataset.months, 10);
        elements.installmentCountInput.value = months;

        elements.instCountBtns.forEach(b => {
          b.classList.remove('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
          b.classList.add('bg-dark-850', 'border-slate-800', 'text-slate-300');
        });
        btn.classList.add('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
        btn.classList.remove('bg-dark-850', 'border-slate-800', 'text-slate-300');

        calculateInstallment();
      });
    });

    // Installment Timing Buttons
    if (elements.firstPayDelayedBtn && elements.firstPayImmediateBtn) {
      elements.firstPayDelayedBtn.addEventListener('click', () => {
        state.installmentFirstPayment = 'delayed';
        updateModeUI();
        calculateInstallment();
      });

      elements.firstPayImmediateBtn.addEventListener('click', () => {
        state.installmentFirstPayment = 'immediate';
        updateModeUI();
        calculateInstallment();
      });
    }

    // Interest Modes
    if (elements.modeCompoundBtn) {
      elements.modeCompoundBtn.addEventListener('click', () => {
        state.mode = 'compound';
        updateModeUI();
        calculateInterest();
      });
    }

    if (elements.modeSimpleBtn) {
      elements.modeSimpleBtn.addEventListener('click', () => {
        state.mode = 'simple';
        updateModeUI();
        calculateInterest();
      });
    }

    // Installment Modes
    if (elements.instModeCompoundBtn) {
      elements.instModeCompoundBtn.addEventListener('click', () => {
        state.installmentMode = 'compound';
        updateModeUI();
        calculateInstallment();
      });
    }

    if (elements.instModeSimpleBtn) {
      elements.instModeSimpleBtn.addEventListener('click', () => {
        state.installmentMode = 'simple';
        updateModeUI();
        calculateInstallment();
      });
    }

    // Toggle Tables
    if (elements.toggleTableBtn && elements.tableContainer) {
      elements.toggleTableBtn.addEventListener('click', () => {
        const isHidden = elements.tableContainer.classList.toggle('hidden');
        if (elements.tableChevron) {
          elements.tableChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    }

    if (elements.toggleInstallmentTableBtn && elements.installmentTableContainer) {
      elements.toggleInstallmentTableBtn.addEventListener('click', () => {
        const isHidden = elements.installmentTableContainer.classList.toggle('hidden');
        if (elements.instTableChevron) {
          elements.instTableChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    }

    // Currency buttons
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

        calculateInterest();
        calculateInstallment();
      });
    });

    // Reset All
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
        state.installmentTotal = 30000;
        state.installmentCount = 6;
        state.installmentFirstPayment = 'delayed';
        state.installmentMode = 'compound';
        state.activeTab = 'interest';

        elements.refPrincipalInput.value = 10000;
        elements.refDailyInterestInput.value = 150;
        elements.currentPrincipalInput.value = 10000;
        elements.installmentTotalInput.value = 30000;
        elements.installmentCountInput.value = 6;

        elements.instCountBtns.forEach(b => {
          if (parseInt(b.dataset.months, 10) === 6) {
            b.classList.add('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.remove('bg-dark-850', 'border-slate-800', 'text-slate-300');
          } else {
            b.classList.remove('bg-brand-600', 'border-brand-500', 'text-white', 'shadow');
            b.classList.add('bg-dark-850', 'border-slate-800', 'text-slate-300');
          }
        });

        syncRateDisplays();
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

        switchTab('interest');
        calculateInterest();
        calculateInstallment();
        showToast('Tüm değerler ve çerezler sıfırlandı.');
      });
    }

    // Initialize state & calculations
    loadPersistedState();
    updateRatePreview();
    syncRateDisplays();
    updateModeUI();
    switchTab(state.activeTab || 'interest');
    calculateInterest();
    calculateInstallment();
  }

  if (document.getElementById('refPrincipalInput')) {
    initApp();
  } else {
    document.addEventListener('DOMContentLoaded', initApp);
  }
})();
