/**
 * InterestCalc - Frontend Faiz ve Getiri Hesaplama Uygulaması
 * Tamamen istemci taraflı (Client-side / Vanilla JS + Chart.js)
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    principal: 10000,
    dailyAmount: 150,
    dailyRate: 1.5,
    mode: 'compound', // 'compound' | 'simple'
    taxRate: 0,
    reinvestRate: 100,
    extraDaily: 0,
    currency: '₺',
    chartDays: 60,
    tableFilterDays: 60,
    customDay: 45,
    lastEdited: 'rate' // 'amount' | 'rate'
  };

  // --- DOM ELEMENTS ---
  const elements = {
    // Inputs
    principalInput: document.getElementById('principalInput'),
    principalFormattedLabel: document.getElementById('principalFormattedLabel'),
    dailyAmountInput: document.getElementById('dailyAmountInput'),
    dailyRateInput: document.getElementById('dailyRateInput'),
    modeCompound: document.getElementById('modeCompound'),
    modeSimple: document.getElementById('modeSimple'),
    compoundModeLabel: document.getElementById('compoundModeLabel'),
    simpleModeLabel: document.getElementById('simpleModeLabel'),
    taxRateInput: document.getElementById('taxRateInput'),
    taxRateLabel: document.getElementById('taxRateLabel'),
    reinvestRateInput: document.getElementById('reinvestRateInput'),
    reinvestRateLabel: document.getElementById('reinvestRateLabel'),
    reinvestContainer: document.getElementById('reinvestContainer'),
    extraDailyInput: document.getElementById('extraDailyInput'),
    customDayInput: document.getElementById('customDayInput'),
    customDayLabel: document.getElementById('customDayLabel'),
    customDayResult: document.getElementById('customDayResult'),

    // Advanced toggle
    toggleAdvancedBtn: document.getElementById('toggleAdvancedBtn'),
    advancedPanel: document.getElementById('advancedPanel'),
    advancedChevron: document.getElementById('advancedChevron'),

    // Currency buttons
    currencyButtons: document.querySelectorAll('.currency-btn'),
    currencySymbols: document.querySelectorAll('.currency-symbol'),

    // Quick buttons
    quickPrincipalButtons: document.querySelectorAll('.quick-principal-btn'),
    quickRateButtons: document.querySelectorAll('.quick-rate-btn'),

    // 30 & 60 Days Highlights
    profit30: document.getElementById('profit30'),
    balance30: document.getElementById('balance30'),
    roi30: document.getElementById('roi30'),
    profit60: document.getElementById('profit60'),
    balance60: document.getElementById('balance60'),
    roi60: document.getElementById('roi60'),

    // Other milestones
    profit7: document.getElementById('profit7'),
    balance7: document.getElementById('balance7'),
    profit14: document.getElementById('profit14'),
    balance14: document.getElementById('balance14'),
    profit90: document.getElementById('profit90'),
    balance90: document.getElementById('balance90'),
    profit180: document.getElementById('profit180'),
    balance180: document.getElementById('balance180'),
    profit365: document.getElementById('profit365'),
    balance365: document.getElementById('balance365'),

    // Chart & Table
    growthChartCanvas: document.getElementById('growthChart'),
    chartPeriodButtons: document.querySelectorAll('.chart-period-btn'),
    tableFilterButtons: document.querySelectorAll('.table-filter-btn'),
    breakdownTableBody: document.getElementById('breakdownTableBody'),
    exportCsvBtn: document.getElementById('exportCsvBtn'),

    // Top actions
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    resetBtn: document.getElementById('resetBtn'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg')
  };

  let chartInstance = null;
  let cachedProjection = [];

  // --- FORMATTING HELPERS ---
  function formatMoney(amount, showDecimals = true) {
    if (isNaN(amount) || amount === null) return `${state.currency}0`;
    const decimals = showDecimals ? 2 : 0;
    const formatted = Number(amount).toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${state.currency}${formatted}`;
  }

  function formatPercent(value) {
    if (isNaN(value)) return '%0.00';
    return `%${Number(value).toFixed(2)}`;
  }

  function formatDate(daysFromNow) {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  function showToast(message) {
    elements.toastMsg.textContent = message;
    elements.toast.classList.remove('translate-y-20', 'opacity-0');
    elements.toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      elements.toast.classList.add('translate-y-20', 'opacity-0');
      elements.toast.classList.remove('translate-y-0', 'opacity-100');
    }, 2500);
  }

  // --- CALCULATION ENGINE ---
  function calculateProjections(maxDays = 365) {
    const list = [];
    let currentBalance = Math.max(0, state.principal);
    let cumulativeProfit = 0;
    const dailyRateFrac = Math.max(0, state.dailyRate) / 100;
    const taxFrac = Math.max(0, state.taxRate) / 100;
    const reinvestFrac = state.mode === 'compound' ? Math.max(0, state.reinvestRate) / 100 : 0;
    const extraDaily = Math.max(0, state.extraDaily);

    for (let day = 1; day <= maxDays; day++) {
      let startBalance = currentBalance;
      let dayGrossProfit = 0;

      if (state.mode === 'compound') {
        // Bileşik faiz: O anki bakiye üzerinden kâr
        dayGrossProfit = startBalance * dailyRateFrac;
      } else {
        // Basit faiz: Sadece başlangıçtaki anapara üzerinden sabit kâr
        dayGrossProfit = state.principal * dailyRateFrac;
      }

      const netProfit = dayGrossProfit * (1 - taxFrac);
      cumulativeProfit += netProfit;

      let reinvested = 0;
      if (state.mode === 'compound') {
        reinvested = netProfit * reinvestFrac;
        currentBalance = startBalance + reinvested + extraDaily;
      } else {
        // Basit faizde kâr anaparaya eklenmez
        currentBalance = state.principal + cumulativeProfit + (day * extraDaily);
      }

      const totalGain = state.mode === 'compound' 
        ? (currentBalance - state.principal - (day * extraDaily))
        : cumulativeProfit;

      const roi = state.principal > 0 ? (totalGain / state.principal) * 100 : 0;

      list.push({
        day,
        date: formatDate(day),
        startBalance,
        dayProfit: netProfit,
        cumulativeProfit: totalGain,
        endBalance: currentBalance,
        roi
      });
    }

    return list;
  }

  // --- RENDER FUNCTIONS ---
  function renderUI() {
    // 1. Calculate up to 365 or customDay
    const maxDayNeeded = Math.max(365, state.customDay || 45);
    cachedProjection = calculateProjections(maxDayNeeded);

    // Update Formatted Principal Label
    elements.principalFormattedLabel.textContent = formatMoney(state.principal, false);

    // Update 30 & 60 Days Highlights
    const day30 = cachedProjection[29] || { cumulativeProfit: 0, endBalance: 0, roi: 0 };
    const day60 = cachedProjection[59] || { cumulativeProfit: 0, endBalance: 0, roi: 0 };

    elements.profit30.textContent = formatMoney(day30.cumulativeProfit);
    elements.balance30.textContent = formatMoney(day30.endBalance);
    elements.roi30.textContent = `+${day30.roi.toFixed(1)}%`;

    elements.profit60.textContent = formatMoney(day60.cumulativeProfit);
    elements.balance60.textContent = formatMoney(day60.endBalance);
    elements.roi60.textContent = `+${day60.roi.toFixed(1)}%`;

    // Update Other Milestones (7, 14, 90, 180, 365)
    const milestones = [
      { day: 7, pEl: elements.profit7, bEl: elements.balance7 },
      { day: 14, pEl: elements.profit14, bEl: elements.balance14 },
      { day: 90, pEl: elements.profit90, bEl: elements.balance90 },
      { day: 180, pEl: elements.profit180, bEl: elements.balance180 },
      { day: 365, pEl: elements.profit365, bEl: elements.balance365 },
    ];

    milestones.forEach(({ day, pEl, bEl }) => {
      const item = cachedProjection[day - 1];
      if (item) {
        pEl.textContent = formatMoney(item.cumulativeProfit);
        bEl.textContent = `Bak: ${formatMoney(item.endBalance, false)}`;
      }
    });

    // Custom Day Result
    elements.customDayLabel.textContent = state.customDay;
    const customItem = cachedProjection[state.customDay - 1];
    if (customItem) {
      elements.customDayResult.textContent = `${formatMoney(customItem.cumulativeProfit)} (+%${customItem.roi.toFixed(1)})`;
    } else {
      elements.customDayResult.textContent = '...';
    }

    // Update Chart
    renderChart();

    // Update Table
    renderTable();

    // Update URL Hash without adding history stack spam
    updateUrlHash();
  }

  // --- CHART RENDERING ---
  function initOrUpdateChart() {
    const daysToShow = state.chartDays;
    const dataSubset = cachedProjection.slice(0, daysToShow);

    const labels = dataSubset.map(d => `${d.day}. Gün`);
    const balanceData = dataSubset.map(d => Math.round(d.endBalance));
    const profitData = dataSubset.map(d => Math.round(d.cumulativeProfit));

    const ctx = elements.growthChartCanvas.getContext('2d');

    // Create Gradients
    const balanceGradient = ctx.createLinearGradient(0, 0, 0, 300);
    balanceGradient.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    balanceGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const profitGradient = ctx.createLinearGradient(0, 0, 0, 300);
    profitGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    profitGradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    const pointRadiusList = dataSubset.map(d => {
      if (d.day === 30 || d.day === 60) return 6;
      return 0;
    });

    const pointHoverRadiusList = dataSubset.map(d => {
      if (d.day === 30 || d.day === 60) return 8;
      return 4;
    });

    const chartConfig = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Toplam Bakiye',
            data: balanceData,
            borderColor: '#10b981',
            backgroundColor: balanceGradient,
            borderWidth: 2.5,
            fill: true,
            tension: 0.3,
            pointRadius: pointRadiusList,
            pointHoverRadius: pointHoverRadiusList,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          },
          {
            label: 'Net Faiz Kazancı',
            data: profitData,
            borderColor: '#06b6d4',
            backgroundColor: profitGradient,
            borderWidth: 2,
            borderDash: [4, 4],
            fill: true,
            tension: 0.3,
            pointRadius: pointRadiusList,
            pointHoverRadius: pointHoverRadiusList,
            pointBackgroundColor: '#06b6d4',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: {
              color: '#94a3b8',
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              boxWidth: 12,
              usePointStyle: true,
            }
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 10,
            titleFont: { size: 12, weight: 'bold' },
            bodyFont: { family: 'JetBrains Mono', size: 11 },
            callbacks: {
              label: function (context) {
                const label = context.dataset.label || '';
                return ` ${label}: ${state.currency}${Number(context.raw).toLocaleString('tr-TR')}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: {
              color: '#64748b',
              font: { size: 10 },
              maxTicksLimit: 10,
              callback: function (val, index) {
                return (index + 1) % 5 === 0 || index === 0 || (index + 1) === 30 || (index + 1) === 60 
                  ? `${index + 1}.G` 
                  : '';
              }
            }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.3)' },
            ticks: {
              color: '#64748b',
              font: { family: 'JetBrains Mono', size: 10 },
              callback: function (value) {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ${state.currency}`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K ${state.currency}`;
                return `${value} ${state.currency}`;
              }
            }
          }
        }
      }
    };

    if (chartInstance) {
      chartInstance.destroy();
    }
    chartInstance = new Chart(ctx, chartConfig);
  }

  function renderChart() {
    initOrUpdateChart();
  }

  // --- TABLE RENDERING ---
  function renderTable() {
    const daysToShow = state.tableFilterDays;
    const dataSubset = cachedProjection.slice(0, daysToShow);
    const tbody = elements.breakdownTableBody;

    let html = '';
    for (let i = 0; i < dataSubset.length; i++) {
      const row = dataSubset[i];
      let rowClass = 'hover:bg-dark-850/60 transition-colors';
      let badge = '';

      if (row.day === 30) {
        rowClass += ' highlight-milestone';
        badge = '<span class="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-brand-500/20 text-brand-300 font-sans font-bold">1 Ay</span>';
      } else if (row.day === 60) {
        rowClass += ' highlight-60';
        badge = '<span class="ml-1.5 px-1.5 py-0.2 rounded text-[10px] bg-cyan-500/20 text-cyan-300 font-sans font-bold">2 Ay</span>';
      }

      html += `
        <tr class="${rowClass}">
          <td class="py-2.5 px-4 font-bold text-white whitespace-nowrap">
            ${row.day}. Gün ${badge}
          </td>
          <td class="py-2.5 px-4 text-slate-400 whitespace-nowrap">${row.date}</td>
          <td class="py-2.5 px-4 text-right text-slate-300">${formatMoney(row.startBalance)}</td>
          <td class="py-2.5 px-4 text-right text-brand-400 font-semibold">+${formatMoney(row.dayProfit)}</td>
          <td class="py-2.5 px-4 text-right text-emerald-300 font-semibold">+${formatMoney(row.cumulativeProfit)}</td>
          <td class="py-2.5 px-4 text-right text-white font-bold">${formatMoney(row.endBalance)}</td>
        </tr>
      `;
    }

    tbody.innerHTML = html;
  }

  // --- SYNC INPUTS LOGIC ---
  function syncDailyFields(changedField) {
    const principal = Math.max(0, parseFloat(elements.principalInput.value) || 0);

    if (changedField === 'amount') {
      const amount = Math.max(0, parseFloat(elements.dailyAmountInput.value) || 0);
      state.dailyAmount = amount;
      if (principal > 0) {
        const calculatedRate = (amount / principal) * 100;
        state.dailyRate = Number(calculatedRate.toFixed(4));
        elements.dailyRateInput.value = state.dailyRate;
      }
      state.lastEdited = 'amount';
    } else if (changedField === 'rate') {
      const rate = Math.max(0, parseFloat(elements.dailyRateInput.value) || 0);
      state.dailyRate = rate;
      const calculatedAmount = (principal * rate) / 100;
      state.dailyAmount = Number(calculatedAmount.toFixed(2));
      elements.dailyAmountInput.value = state.dailyAmount;
      state.lastEdited = 'rate';
    } else if (changedField === 'principal') {
      state.principal = principal;
      if (state.lastEdited === 'amount') {
        // If user preferred amount, recompute rate
        if (principal > 0) {
          state.dailyRate = Number(((state.dailyAmount / principal) * 100).toFixed(4));
          elements.dailyRateInput.value = state.dailyRate;
        }
      } else {
        // Default: keep rate constant, recompute daily amount
        state.dailyAmount = Number(((principal * state.dailyRate) / 100).toFixed(2));
        elements.dailyAmountInput.value = state.dailyAmount;
      }
    }
  }

  // --- EVENT LISTENERS ---
  function setupEvents() {
    // Principal Input
    elements.principalInput.addEventListener('input', () => {
      syncDailyFields('principal');
      renderUI();
    });

    // Daily Amount Input
    elements.dailyAmountInput.addEventListener('input', () => {
      syncDailyFields('amount');
      renderUI();
    });

    // Daily Rate Input
    elements.dailyRateInput.addEventListener('input', () => {
      syncDailyFields('rate');
      renderUI();
    });

    // Quick Principal buttons
    elements.quickPrincipalButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.amount);
        elements.principalInput.value = val;
        syncDailyFields('principal');
        renderUI();
      });
    });

    // Quick Rate buttons
    elements.quickRateButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = parseFloat(btn.dataset.rate);
        elements.dailyRateInput.value = rate;
        syncDailyFields('rate');
        renderUI();
      });
    });

    // Interest Mode (Compound vs Simple)
    elements.modeCompound.addEventListener('change', () => {
      state.mode = 'compound';
      elements.compoundModeLabel.classList.add('active');
      elements.simpleModeLabel.classList.remove('active');
      elements.reinvestContainer.classList.remove('opacity-40', 'pointer-events-none');
      renderUI();
    });

    elements.modeSimple.addEventListener('change', () => {
      state.mode = 'simple';
      elements.simpleModeLabel.classList.add('active');
      elements.compoundModeLabel.classList.remove('active');
      elements.reinvestContainer.classList.add('opacity-40', 'pointer-events-none');
      renderUI();
    });

    // Advanced Panel Toggle
    elements.toggleAdvancedBtn.addEventListener('click', () => {
      const isHidden = elements.advancedPanel.classList.toggle('hidden');
      elements.advancedChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Tax Rate Input
    elements.taxRateInput.addEventListener('input', (e) => {
      const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
      state.taxRate = val;
      elements.taxRateLabel.textContent = `%${val}`;
      renderUI();
    });

    // Reinvest Rate Input
    elements.reinvestRateInput.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      state.reinvestRate = val;
      elements.reinvestRateLabel.textContent = `%${val}`;
      renderUI();
    });

    // Extra Daily Input
    elements.extraDailyInput.addEventListener('input', (e) => {
      state.extraDaily = Math.max(0, parseFloat(e.target.value) || 0);
      renderUI();
    });

    // Custom Day Input
    elements.customDayInput.addEventListener('input', (e) => {
      const day = Math.max(1, Math.min(3650, parseInt(e.target.value, 10) || 1));
      state.customDay = day;
      renderUI();
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
        renderUI();
      });
    });

    // Chart Period Switcher
    elements.chartPeriodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.chartPeriodButtons.forEach(b => {
          b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
        btn.classList.remove('text-slate-400');

        state.chartDays = parseInt(btn.dataset.days, 10);
        renderChart();
      });
    });

    // Table Filter Switcher
    elements.tableFilterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.tableFilterButtons.forEach(b => {
          b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
        btn.classList.remove('text-slate-400');

        state.tableFilterDays = parseInt(btn.dataset.filter, 10);
        renderTable();
      });
    });

    // Export CSV
    elements.exportCsvBtn.addEventListener('click', exportToCsv);

    // Share / Copy Link
    elements.copyLinkBtn.addEventListener('click', () => {
      updateUrlHash();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('Hesaplama bağlantısı panoya kopyalandı!');
        }).catch(() => {
          fallbackCopyText(window.location.href);
        });
      } else {
        fallbackCopyText(window.location.href);
      }
    });

    // Reset button
    elements.resetBtn.addEventListener('click', resetDefaults);
  }

  function fallbackCopyText(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showToast('Bağlantı kopyalandı!');
    } catch (err) {
      showToast('Kopyalanamadı.');
    }
    document.body.removeChild(textarea);
  }

  // --- CSV EXPORT ---
  function exportToCsv() {
    const dataSubset = cachedProjection.slice(0, state.tableFilterDays);
    const headers = ['Gun', 'Tarih', 'Baslangic_Bakiyesi', 'Gunun_Kazanci', 'Toplam_Faiz_Kazanci', 'Gun_Sonu_Bakiyesi'];
    
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += headers.join(';') + '\r\n';

    dataSubset.forEach(row => {
      const line = [
        row.day,
        row.date,
        row.startBalance.toFixed(2),
        row.dayProfit.toFixed(2),
        row.cumulativeProfit.toFixed(2),
        row.endBalance.toFixed(2)
      ];
      csvContent += line.join(';') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `faiz_projeksiyonu_${state.tableFilterDays}_gun.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('CSV dosyası başarıyla indirildi!');
  }

  // --- STATE URL SYNC ---
  function updateUrlHash() {
    const params = new URLSearchParams();
    params.set('p', state.principal);
    params.set('r', state.dailyRate);
    params.set('m', state.mode);
    params.set('c', state.currency);
    if (state.taxRate > 0) params.set('tax', state.taxRate);
    if (state.reinvestRate < 100) params.set('re', state.reinvestRate);
    if (state.extraDaily > 0) params.set('ext', state.extraDaily);
    if (state.customDay !== 45) params.set('cd', state.customDay);

    const newHash = '#' + params.toString();
    if (window.location.hash !== newHash) {
      history.replaceState(null, '', newHash);
    }
  }

  function loadFromUrlHash() {
    if (!window.location.hash || window.location.hash.length <= 1) return;
    try {
      const params = new URLSearchParams(window.location.hash.substring(1));
      if (params.has('p')) {
        state.principal = parseFloat(params.get('p')) || state.principal;
        elements.principalInput.value = state.principal;
      }
      if (params.has('r')) {
        state.dailyRate = parseFloat(params.get('r')) || state.dailyRate;
        elements.dailyRateInput.value = state.dailyRate;
      }
      if (params.has('m')) {
        state.mode = params.get('m') === 'simple' ? 'simple' : 'compound';
        if (state.mode === 'simple') {
          elements.modeSimple.checked = true;
          elements.simpleModeLabel.classList.add('active');
          elements.compoundModeLabel.classList.remove('active');
        } else {
          elements.modeCompound.checked = true;
          elements.compoundModeLabel.classList.add('active');
          elements.simpleModeLabel.classList.remove('active');
        }
      }
      if (params.has('c')) {
        state.currency = params.get('c');
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
      }
      if (params.has('tax')) {
        state.taxRate = parseFloat(params.get('tax')) || 0;
        elements.taxRateInput.value = state.taxRate;
        elements.taxRateLabel.textContent = `%${state.taxRate}`;
      }
      if (params.has('re')) {
        state.reinvestRate = parseInt(params.get('re'), 10) || 100;
        elements.reinvestRateInput.value = state.reinvestRate;
        elements.reinvestRateLabel.textContent = `%${state.reinvestRate}`;
      }
      if (params.has('ext')) {
        state.extraDaily = parseFloat(params.get('ext')) || 0;
        elements.extraDailyInput.value = state.extraDaily;
      }
      if (params.has('cd')) {
        state.customDay = parseInt(params.get('cd'), 10) || 45;
        elements.customDayInput.value = state.customDay;
      }

      // Calculate initial daily amount
      state.dailyAmount = Number(((state.principal * state.dailyRate) / 100).toFixed(2));
      elements.dailyAmountInput.value = state.dailyAmount;
    } catch (e) {
      console.warn('URL parametreleri yüklenemedi:', e);
    }
  }

  function resetDefaults() {
    state.principal = 10000;
    state.dailyRate = 1.5;
    state.dailyAmount = 150;
    state.mode = 'compound';
    state.taxRate = 0;
    state.reinvestRate = 100;
    state.extraDaily = 0;
    state.currency = '₺';
    state.chartDays = 60;
    state.tableFilterDays = 60;
    state.customDay = 45;

    elements.principalInput.value = 10000;
    elements.dailyRateInput.value = 1.5;
    elements.dailyAmountInput.value = 150;
    elements.modeCompound.checked = true;
    elements.compoundModeLabel.classList.add('active');
    elements.simpleModeLabel.classList.remove('active');
    elements.taxRateInput.value = 0;
    elements.taxRateLabel.textContent = '%0';
    elements.reinvestRateInput.value = 100;
    elements.reinvestRateLabel.textContent = '%100';
    elements.extraDailyInput.value = 0;
    elements.customDayInput.value = 45;

    elements.currencyButtons.forEach((b, i) => {
      if (i === 0) {
        b.classList.add('active', 'text-white', 'bg-brand-600', 'shadow');
        b.classList.remove('text-slate-400');
      } else {
        b.classList.remove('active', 'text-white', 'bg-brand-600', 'shadow');
        b.classList.add('text-slate-400');
      }
    });
    elements.currencySymbols.forEach(s => (s.textContent = '₺'));

    renderUI();
    showToast('Varsayılan değerlere sıfırlandı.');
  }

  // --- INIT ---
  function init() {
    setupEvents();
    loadFromUrlHash();
    syncDailyFields('principal');
    renderUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
