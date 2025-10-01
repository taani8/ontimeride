// Dashboard module (migrated from ui.js)
(function(){
  // Read CSS variable with fallback
  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }
  // Observe theme change and refresh charts
  function bindThemeObserver() {
    if (window._themeObserverBound) return;
    window._themeObserverBound = true;
    const obs = new MutationObserver((mut) => {
      const changed = mut.some(m => m.type === 'attributes' && m.attributeName === 'data-theme');
      if (changed) {
        // Re-apply defaults and rebuild charts
        applyChartTheme();
        if (typeof window.createCharts === 'function') {
          window.createCharts();
        }
      }
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // Apply Chart.js theme from CSS variables (light/dark aware)
  function applyChartTheme() {
    if (typeof Chart === 'undefined') return;
    const text = cssVar('--text-color', '#0f172a');
    const muted = cssVar('--muted-color', '#64748b');
    const grid = cssVar('--card-border', 'rgba(0,0,0,0.08)');
    const tooltipBg = cssVar('--surface', '#ffffff');

    Chart.defaults.color = text;
    Chart.defaults.borderColor = grid;
    // Scales
    Chart.defaults.scale.grid = Chart.defaults.scale.grid || {};
    Chart.defaults.scale.grid.color = grid;
    Chart.defaults.scale.ticks = Chart.defaults.scale.ticks || {};
    Chart.defaults.scale.ticks.color = muted;
    // Plugins
    Chart.defaults.plugins.legend = Chart.defaults.plugins.legend || {};
    Chart.defaults.plugins.legend.labels = Chart.defaults.plugins.legend.labels || {};
    Chart.defaults.plugins.legend.labels.color = text;
    Chart.defaults.plugins.tooltip = Chart.defaults.plugins.tooltip || {};
    Chart.defaults.plugins.tooltip.titleColor = text;
    Chart.defaults.plugins.tooltip.bodyColor = text;
    Chart.defaults.plugins.tooltip.backgroundColor = tooltipBg;
    Chart.defaults.plugins.tooltip.borderColor = grid;
    Chart.defaults.plugins.tooltip.borderWidth = 1;
  }
  function renderEnhancedAdminPanel() {
    if (window.appState.dbError) {
      return renderDbError(window.appState.dbError);
    }

    const { drivers } = window.appState;
    const trips = window.getTripsFilteredByDate(window.appState);
    const totalDrivers = drivers.length;
    const totalTrips = trips.length;
    const negativeBalanceDrivers = drivers.filter(d => d.balance < 0);
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.commissionAmount || 0), 0);

    const content = `
        ${renderNavbar('admin')}
        <div class="h-14"></div>
        <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-3xl font-extrabold bg-gradient-to-r from-primary-color to-secondary-color bg-clip-text text-transparent">📊 لوحة تحكم المشرف - On Time Ride</h2>
                <div class="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">${new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${renderStatCard({ label: 'إجمالي السائقين', value: totalDrivers, tone: 'blue', icon: '👥' })}
                ${renderStatCard({ label: 'إجمالي الرحلات', value: totalTrips, tone: 'green', icon: '🚗' })}
                ${renderStatCard({ label: 'إجمالي العمولات', value: totalRevenue.toFixed(2), tone: 'purple', icon: '💰' })}
                ${renderStatCard({ label: 'أرصدة سالبة', value: negativeBalanceDrivers.length, tone: 'red', icon: '⚠️' })}
            </div>

            <div class="flex justify-end">
                <button id="goto-negative-drivers" class="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                    <span>⚠️</span> عرض السائقين ذوي الأرصدة السالبة
                </button>
            </div>

            <!-- Date Filters and Export -->
            <div class="card hoverable p-4">
                <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">من تاريخ</label>
                            <input id="date-from" type="date" value="${window.appState.dateFrom || ''}" class="p-2 border rounded w-full">
                        </div>
                        <div>
                            <label class="block text-sm text-gray-600 mb-1">إلى تاريخ</label>
                            <input id="date-to" type="date" value="${window.appState.dateTo || ''}" class="p-2 border rounded w-full">
                        </div>
                        <div class="flex items-end">
                            <button id="clear-dates" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">مسح التواريخ</button>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="export-trips" class="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                            <span>📊</span> تصدير الرحلات CSV
                        </button>
                        <button id="export-drivers" class="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                            <span>👥</span> تصدير السائقين CSV
                        </button>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="card hoverable p-6">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-green-700">
                        <span class="text-2xl">🛫</span> توزيع أنواع الرحلات
                    </h3>
                    <div class="chart-container">
                        <canvas id="tripTypesChart"></canvas>
                    </div>
                </div>
                
                <div class="card hoverable p-6">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-blue-700">
                        <span class="text-2xl">💰</span> أرصدة السائقين
                    </h3>
                    <div class="chart-container">
                        <canvas id="balanceChart"></canvas>
                    </div>
                </div>
                
                <div class="card hoverable p-6 lg:col-span-2">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-purple-700">
                        <span class="text-2xl">📈</span> ملخص العمولات شهرياً
                    </h3>
                    <div class="chart-container" style="height:360px">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
                
                <div class="card hoverable p-6">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-orange-700">
                        <span class="text-2xl">📅</span> ملخص العمولات يومياً (آخر 14 يوم)
                    </h3>
                    <div class="chart-container" style="height:260px">
                        <canvas id="dailyChart"></canvas>
                    </div>
                </div>
                <div class="card hoverable p-6">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-indigo-700">
                        <span class="text-2xl">📊</span> ملخص العمولات سنوياً
                    </h3>
                    <div class="chart-container" style="height:260px">
                        <canvas id="yearlyChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Negative Balance Drivers -->
            ${negativeBalanceDrivers.length > 0 ? `
            <div class="card bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 p-6 rounded-xl shadow-lg">
                <h3 class="text-xl font-bold mb-4 text-red-800 border-b pb-2 flex items-center gap-2">
                    <span class="text-2xl animate-pulse">⚠️</span> سائقون برصيد سالب
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${negativeBalanceDrivers.map(driver => `
                        <div class="bg-white p-4 rounded-xl border-r-4 border-red-500 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1">
                            <div class="flex items-center space-x-3 rtl:space-x-reverse">
                                <img src="${driver.image || '81077e1b-876b-43d3-913b-d8a24361fefb.jpg'}" alt="${driver.name}" class="w-12 h-12 rounded-full object-cover border-2 border-red-200">
                                <div>
                                    <div class="font-bold text-gray-900">${driver.name}</div>
                                    <div class="text-sm text-gray-600">${driver.phoneNumber || ''}</div>
                                </div>
                            </div>
                            <div class="mt-3 text-sm bg-red-50 p-2 rounded-lg">الرصيد الحالي: <span class="font-semibold text-red-600">${(driver.balance||0).toFixed(2)} د.أ</span></div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Quick Add Trip Form -->
            <div class="card hoverable p-6">
                <h3 class="text-xl font-bold mb-4 border-b pb-2 flex items-center gap-2 text-green-700">
                    <span class="text-2xl">⚡</span> إضافة رحلة سريعة
                </h3>
                <form id="quick-trip-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="relative lg:col-span-2">
                          <input id="quick-driver-input" type="text" name="driverPhone" autocomplete="off" placeholder="ابحث بالاسم أو الهاتف..." class="p-3 border border-gray-300 rounded-lg w-full focus:ring-green-500 focus:border-green-500 transition-all">
                          <div id="quick-driver-suggest" class="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto hidden z-50"></div>
                        </div>
                        <input type="number" step="0.01" name="totalPrice" placeholder="السعر الإجمالي (دينار)" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all">
                        <select name="tripType" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all">
                            <option value="">نوع الرحلة...</option>
                            <option value="airport">مطار</option>
                            <option value="families">عائلات</option>
                            <option value="passengers">ركاب عاديين</option>
                            <option value="vip">VIP</option>
                        </select>
                    </div>
                    <div class="flex gap-4 items-end">
                        <input type="number" step="0.01" name="commissionValue" placeholder="قيمة العمولة (اتركها فارغة لاستخدام إعداد السائق)" class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 transition-all flex-1">
                        <button type="submit" class="btn-primary text-white px-8 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                            <span>➕</span> إضافة الرحلة
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    return renderAdminShell(content, 'dashboard');
  }
  function createCharts() {
    // Bind theme
    applyChartTheme();
    bindThemeObserver();
    // Ensure charts registry
    window._charts = window._charts || {};
    // Destroy previous charts if exist
    for (const key of ['tripTypes','balance','monthly','daily','yearly']) {
      try { window._charts[key]?.destroy(); } catch(_) {}
      window._charts[key] = null;
    }
    const vars = getComputedStyle(document.documentElement);
    const colors = {
      success: vars.getPropertyValue('--success-600').trim() || '#16a34a',
      indigo: vars.getPropertyValue('--indigo-500').trim() || '#6366f1',
      warning: vars.getPropertyValue('--warning-600').trim() || '#f59e0b',
      danger: vars.getPropertyValue('--danger-600').trim() || '#dc2626',
      muted: vars.getPropertyValue('--muted-color').trim() || '#6b7280'
    };
    const { drivers, trips } = window.appState;
    const filteredTrips = window.getTripsFilteredByDate(window.appState);
    const { tripTypes, balanceRanges } = (function createChartData(drivers, trips) {
      const tripTypes = {};
      trips.forEach(trip => { tripTypes[trip.tripType] = (tripTypes[trip.tripType] || 0) + 1; });
      const balanceRanges = {
        'موجب': drivers.filter(d => d.balance > 0).length,
        'صفر': drivers.filter(d => d.balance === 0).length,
        'سالب': drivers.filter(d => d.balance < 0).length
      };
      return { tripTypes, balanceRanges };
    })(drivers, filteredTrips);

    // Trip types chart
    const tripTypesCtx = document.getElementById('tripTypesChart');
    if (tripTypesCtx) {
      window._charts.tripTypes = new Chart(tripTypesCtx, {
        type: 'doughnut',
        data: {
          labels: Object.keys(tripTypes).map(type => {
            const typeMap = { 'airport': 'مطار', 'families': 'عائلات', 'passengers': 'ركاب عاديين', 'vip': 'VIP' };
            return typeMap[type] || type;
          }),
          datasets: [{
            data: Object.values(tripTypes),
            backgroundColor: [colors.success, colors.indigo, '#8B5CF6', colors.warning],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' },
            tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${window.formatCurrency ? window.formatCurrency(ctx.parsed) : ctx.parsed}` } }
          }
        }
      });
    }

    // Balance chart
    const balanceCtx = document.getElementById('balanceChart');
    if (balanceCtx) {
      window._charts.balance = new Chart(balanceCtx, {
        type: 'bar',
        data: {
          labels: Object.keys(balanceRanges),
          datasets: [{
            label: 'عدد السائقين',
            data: Object.values(balanceRanges),
            backgroundColor: [colors.success, colors.muted, colors.danger],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
      });
    }

    // Monthly commissions
    const monthlyCtx = document.getElementById('monthlyChart');
    if (monthlyCtx) {
      const monthly = summarizeMonthly(filteredTrips);
      window._charts.monthly = new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: monthly.labels,
          datasets: [{
            label: 'مجموع العمولات (دينار)',
            data: monthly.data,
            borderColor: colors.success,
            backgroundColor: 'rgba(16,185,129,0.15)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { y: { beginAtZero: true } }
        }
      });
    }

    // Daily commissions
    const dailyCtx = document.getElementById('dailyChart');
    if (dailyCtx) {
      const daily = summarizeDaily(filteredTrips, 14);
      window._charts.daily = new Chart(dailyCtx, {
        type: 'bar',
        data: {
          labels: daily.labels,
          datasets: [{
            label: 'العمولات يومياً (دينار)',
            data: daily.data,
            backgroundColor: 'rgba(99,102,241,0.35)',
            borderColor: colors.indigo,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${window.formatCurrency ? window.formatCurrency(ctx.parsed.y ?? ctx.parsed) : (ctx.parsed.y ?? ctx.parsed)}` } } }
        }
      });
    }

    // Yearly commissions
    const yearlyCtx = document.getElementById('yearlyChart');
    if (yearlyCtx) {
      const yearly = summarizeYearly(filteredTrips);
      window._charts.yearly = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
          labels: yearly.labels,
          datasets: [{
            label: 'العمولات سنوياً (دينار)',
            data: yearly.data,
            backgroundColor: 'rgba(139,92,246,0.35)',
            borderColor: '#8B5CF6',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } },
          plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => `${window.formatCurrency ? window.formatCurrency(ctx.parsed.y ?? ctx.parsed) : (ctx.parsed.y ?? ctx.parsed)}` } } }
        }
      });
    }
  }

  function summarizeMonthly(trips) {
    const map = new Map();
    trips.forEach(t => {
      const d = new Date(t.dateAdded);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const val = (t.commissionAmount ?? 0);
      map.set(key, (map.get(key) || 0) + val);
    });
    const keys = Array.from(map.keys()).sort();
    return { labels: keys, data: keys.map(k => Math.round(map.get(k)*100)/100) };
  }

  function summarizeDaily(trips, lastNDays = 14) {
    const map = new Map();
    trips.forEach(t => {
      const d = new Date(t.dateAdded);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const val = (t.commissionAmount ?? 0);
      map.set(key, (map.get(key) || 0) + val);
    });
    const keys = Array.from(map.keys()).sort();
    const sliced = keys.slice(-lastNDays);
    return { labels: sliced, data: sliced.map(k => Math.round((map.get(k) || 0)*100)/100) };
  }

  function summarizeYearly(trips) {
    const map = new Map();
    trips.forEach(t => {
      const d = new Date(t.dateAdded);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}`;
      const val = (t.commissionAmount ?? 0);
      map.set(key, (map.get(key) || 0) + val);
    });
    const keys = Array.from(map.keys()).sort();
    return { labels: keys, data: keys.map(k => Math.round((map.get(k) || 0)*100)/100) };
  }

  function computeKpisWithTrends(currentTrips, state) {
    const from = state.dateFrom ? new Date(state.dateFrom) : null;
    const to = state.dateTo ? new Date(state.dateTo) : null;
    let rangeDays = 30;
    if (from && to) {
      rangeDays = Math.max(1, Math.ceil((to - from) / (1000*60*60*24)) + 1);
    } else if (state.datePreset === 'today') rangeDays = 1;
    else if (state.datePreset === '7d') rangeDays = 7;
    else if (state.datePreset === 'month') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth()+1, 0);
      rangeDays = Math.max(1, Math.ceil((end - start)/(1000*60*60*24))+1);
    }

    const prevState = { ...state };
    if (from && to) {
      const prevTo = new Date(from.getFullYear(), from.getMonth(), from.getDate()-1);
      const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - (rangeDays-1));
      prevState.dateFrom = prevFrom.toISOString().slice(0,10);
      prevState.dateTo = prevTo.toISOString().slice(0,10);
    } else {
      const now = new Date();
      const curTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const curFrom = new Date(curTo.getFullYear(), curTo.getMonth(), curTo.getDate() - (rangeDays-1));
      const prevTo = new Date(curFrom.getFullYear(), curFrom.getMonth(), curFrom.getDate()-1);
      const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - (rangeDays-1));
      prevState.dateFrom = prevFrom.toISOString().slice(0,10);
      prevState.dateTo = prevTo.toISOString().slice(0,10);
    }
    const prevTrips = window.getTripsFilteredByDate(prevState);

    const sumCommission = arr => arr.reduce((s,t)=> s + (t.commissionAmount||0), 0);
    const current = {
      totalTrips: currentTrips.length,
      totalCommission: sumCommission(currentTrips),
      avgCommission: currentTrips.length ? sumCommission(currentTrips)/currentTrips.length : 0,
    };
    const previous = {
      totalTrips: prevTrips.length,
      totalCommission: sumCommission(prevTrips),
      avgCommission: prevTrips.length ? sumCommission(prevTrips)/prevTrips.length : 0,
    };
    const pct = (a,b) => { if (!b && !a) return 0; if (!b) return 100; return ((a-b)/b)*100; };

    return {
      kpi: {
        totalTrips: { value: current.totalTrips, delta: pct(current.totalTrips, previous.totalTrips) },
        totalCommission: { value: current.totalCommission, delta: pct(current.totalCommission, previous.totalCommission) },
        avgCommission: { value: current.avgCommission, delta: pct(current.avgCommission, previous.avgCommission) },
      }
    };
  }

  // exports
  window.createCharts = createCharts;
  window.summarizeMonthly = summarizeMonthly;
  window.summarizeDaily = summarizeDaily;
  window.summarizeYearly = summarizeYearly;
  window.computeKpisWithTrends = computeKpisWithTrends;
  window.renderEnhancedAdminPanel = renderEnhancedAdminPanel;

  // Autocomplete: Quick Add Trip driver search by name/phone
  if (!window._bindQuickDriverSearch) {
    window._bindQuickDriverSearch = true;

    // Filter and render suggestions
    function renderDriverSuggestions(query, allowEmpty = false) {
      const box = document.getElementById('quick-driver-suggest');
      const input = document.getElementById('quick-driver-input');
      if (!box || !input) return;
      const q = (query || '').trim().toLowerCase();
      const all = (window.appState?.drivers || []).slice();
      let list = all.filter(d => {
        const name = (d.name||'').toLowerCase();
        const phone = (d.phoneNumber||'').toString().toLowerCase();
        return q ? (name.includes(q) || phone.includes(q)) : true;
      });
      if (!q && !allowEmpty) list = [];
      list = list
        .sort((a,b) => (a.name||'').localeCompare(b.name||''))
        .slice(0, 8);
      if (!list.length) { box.classList.add('hidden'); box.innerHTML=''; return; }
      box.innerHTML = list.map(d => `
        <button type="button" class="w-full text-right px-3 py-2 hover:bg-gray-50 flex items-center gap-3" data-phone="${(d.phoneNumber||'').toString()}">
          <img src="${d.image || '81077e1b-876b-43d3-913b-d8a24361fefb.jpg'}" alt="${d.name||''}" class="w-8 h-8 rounded-full object-cover border">
          <span class="truncate font-semibold text-gray-900">${d.name || 'بدون اسم'}</span>
        </button>
      `).join('');
      box.classList.remove('hidden');
    }

    // Input typing handler
    document.body.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'quick-driver-input') {
        renderDriverSuggestions(e.target.value, false);
      }
    });

    // Click a suggestion -> fill phone input
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('#quick-driver-suggest > button');
      if (btn) {
        const phone = btn.getAttribute('data-phone') || '';
        const input = document.getElementById('quick-driver-input');
        if (input) input.value = phone;
        const box = document.getElementById('quick-driver-suggest');
        if (box) { box.classList.add('hidden'); box.innerHTML=''; }
      }
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      const input = document.getElementById('quick-driver-input');
      const box = document.getElementById('quick-driver-suggest');
      if (!box || !input) return;
      if (!box.contains(e.target) && e.target !== input && !input.contains(e.target)) {
        box.classList.add('hidden');
      }
    });

    // Show top suggestions on focus
    document.body.addEventListener('focusin', (e) => {
      if (e.target && e.target.id === 'quick-driver-input') {
        renderDriverSuggestions(e.target.value, true);
      }
    });
  }
})();
