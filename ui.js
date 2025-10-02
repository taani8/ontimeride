// وظائف عرض واجهة المستخدم

// وظيفة عرض لوحة تحكم المشرف المحسنة
function renderAdminShell(innerHtml, activeKey = 'dashboard') {
    // تبسيط: إزالة الشريط الجانبي وإرجاع المحتوى فقط
    return `${innerHtml}`;
}

// شريط علوي بسيط للتنقل بين الشاشات
function renderNavbar(active = 'admin') {
    const link = (key, label, icon) => {
        const is = active === key;
        return `
            <a href="#" class="topnav-link group relative px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${is ? 'text-indigo-700 bg-indigo-50' : 'text-gray-700 hover:text-indigo-700 hover:bg-indigo-50'}" data-view="${key}">
                <span class="text-base">${icon}</span>
                <span>${label}</span>
                ${is ? '<span class="absolute -bottom-2 inset-x-2 h-0.5 bg-indigo-600 rounded-full"></span>' : ''}
            </a>`;
    };
    return `
        <header class="w-full bg-white border-b fixed top-0 inset-x-0 z-50 shadow-sm">
            <div class="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <img src="81077e1b-876b-43d3-913b-d8a24361fefb.jpg" class="w-8 h-8 rounded" alt="Logo" />
                    <span class="font-extrabold text-gray-900">On Time Ride</span>
                </div>
                <button id="mobile-menu-btn" class="md:hidden btn btn-secondary btn-sm" aria-label="القائمة">☰</button>
                <button id="theme-toggle" class="btn btn-secondary btn-sm hidden md:inline-flex" title="الوضع الداكن/الفاتح">🌙</button>
                <nav class="hidden md:flex items-center gap-1" >
                    ${link('admin','اللوحة')}
                    ${link('driver-management','السائقون')}
                    ${link('trips-management','الرحلات')}
                    <a href="#" class="topnav-link px-3 py-2 rounded-lg text-sm text-red-700 hover:text-white hover:bg-red-600" data-view="logout">خروج</a>
                </nav>
            </div>
        </header>
    `;
}

// بطاقة إحصائية صغيرة قابلة لإعادة الاستخدام
function renderStatCard({ label, value, tone = 'green', icon = '📊' }) {
    const tones = {
        green: 'from-green-500 to-green-600',
        blue: 'from-blue-500 to-blue-600',
        purple: 'from-purple-500 to-purple-600',
        red: 'from-red-500 to-red-600',
        amber: 'from-amber-500 to-amber-600'
    };
    const grad = tones[tone] || tones.green;
    return `
        <div class="bg-gradient-to-r ${grad} rounded-xl p-6 text-white">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-white/80 text-sm">${label}</p>
                    <p class="text-3xl font-bold">${value}</p>
                </div>
                <div class="text-4xl opacity-80">${icon}</div>
            </div>
        </div>
    `;
}

function renderEnhancedAdminPanel() {
    if (window.appState.dbError) {
        return renderDbError(window.appState.dbError);
    }

    const { drivers } = window.appState;
    const trips = getTripsFilteredByDate(window.appState);

    // حساب الإحصائيات
    const totalDrivers = drivers.length;
    const totalTrips = trips.length;
    const negativeBalanceDrivers = drivers.filter(d => d.balance < 0);
    const totalRevenue = trips.reduce((sum, trip) => sum + (trip.commissionAmount || 0), 0);

    // إنشاء بيانات الرسم البياني
    const chartData = createChartData(drivers, trips);

    const content = `
        ${renderNavbar('admin')}
        <div style="height: 72px;"></div>
        <div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-3xl font-extrabold text-gray-900">لوحة تحكم المشرف - On Time Ride</h2>
                <div class="text-sm text-gray-500">${new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${renderStatCard({ label: 'إجمالي السائقين', value: totalDrivers, tone: 'blue', icon: '👥' })}
                ${renderStatCard({ label: 'إجمالي الرحلات', value: totalTrips, tone: 'green', icon: '🚗' })}
                ${renderStatCard({ label: 'إجمالي العمولات', value: totalRevenue.toFixed(2), tone: 'purple', icon: '💰' })}
                ${renderStatCard({ label: 'أرصدة سالبة', value: negativeBalanceDrivers.length, tone: 'red', icon: '⚠️' })}
            </div>

            <div class="flex justify-end">
                <button id="goto-negative-drivers" class="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded text-sm">عرض السائقين ذوي الأرصدة السالبة</button>
            </div>

            <!-- Date Filters and Export -->
            <div class="card bg-white p-4 rounded-xl">
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
                            <button id="clear-dates" class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded">مسح التواريخ</button>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="export-trips" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">تصدير الرحلات CSV</button>
                        <button id="export-drivers" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">تصدير السائقين CSV</button>
                    </div>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="card bg-white p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2">توزيع أنواع الرحلات</h3>
                    <div class="chart-container">
                        <canvas id="tripTypesChart"></canvas>
                    </div>
                </div>
                
                <div class="card bg-white p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2">أرصدة السائقين</h3>
                    <div class="chart-container">
                        <canvas id="balanceChart"></canvas>
                    </div>
                </div>
                
                <div class="card bg-white p-6 rounded-xl lg:col-span-2">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2">ملخص العمولات شهرياً</h3>
                    <div class="chart-container" style="height:360px">
                        <canvas id="monthlyChart"></canvas>
                    </div>
                </div>
                
                <div class="card bg-white p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2">ملخص العمولات يومياً (آخر 14 يوم)</h3>
                    <div class="chart-container" style="height:260px">
                        <canvas id="dailyChart"></canvas>
                    </div>
                </div>
                <div class="card bg-white p-6 rounded-xl">
                    <h3 class="text-xl font-bold mb-4 border-b pb-2">ملخص العمولات سنوياً</h3>
                    <div class="chart-container" style="height:260px">
                        <canvas id="yearlyChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- Negative Balance Drivers -->
            ${negativeBalanceDrivers.length > 0 ? `
            <div class="card bg-red-50 border-2 border-red-200 p-6 rounded-xl">
                <h3 class="text-xl font-bold mb-4 text-red-800 border-b pb-2">⚠️ سائقون برصيد سالب</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${negativeBalanceDrivers.map(driver => `
                        <div class="bg-white p-4 rounded-lg border-r-4 border-red-500 shadow-sm">
                            <div class="flex items-center space-x-3 rtl:space-x-reverse">
                                <img src="${driver.image || '81077e1b-876b-43d3-913b-d8a24361fefb.jpg'}" alt="${driver.name}" class="w-12 h-12 rounded-full object-cover border-2 border-red-200">
                                <div>
                                    <p class="font-bold text-gray-800">${driver.name}</p>
                                    <p class="text-sm text-gray-500">${driver.phoneNumber}</p>
                                    <p class="text-lg font-bold text-red-600">${driver.balance.toFixed(2)} دينار</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Driver Cards -->
            <div class="card bg-white p-6 rounded-xl">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">بطاقات السائقين</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${drivers.map(driver => {
                        const driverTrips = trips.filter(t => t.driverId === driver.id);
                        const totalTripsCount = driverTrips.length;
                        const balanceColor = driver.balance >= 0 ? 'text-green-600' : 'text-red-600';
                        const borderColor = driver.balance >= 0 ? 'border-green-500' : 'border-red-500';
                        
                        return `
                            <div class="bg-white p-4 rounded-lg border-r-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow">
                                <div class="flex items-center space-x-3 rtl:space-x-reverse mb-3">
                                    <img src="${driver.image || '81077e1b-876b-43d3-913b-d8a24361fefb.jpg'}" alt="${driver.name}" class="w-16 h-16 rounded-full object-cover border-2 border-gray-200">
                                    <div class="flex-1">
                                        <p class="font-bold text-gray-800">${driver.name}</p>
                                        <p class="text-sm text-gray-500">${driver.phoneNumber}</p>
                                        <p class="text-xs text-gray-400">${totalTripsCount} رحلات</p>
                                    </div>
                                </div>
                                <div class="text-center mb-3">
                                    <p class="text-2xl font-extrabold ${balanceColor}">${driver.balance.toFixed(2)} دينار</p>
                                    <p class="text-xs text-gray-500">الرصيد المستحق</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input type="number" step="0.01" min="0" id="credit-amount-${driver.id}" placeholder="إضافة رصيد" class="flex-1 p-2 border rounded text-sm" />
                                    <button type="button" class="credit-btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm" data-driver-id="${driver.id}">إضافة رصيد</button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>

            <!-- Quick Add Trip Form -->
            <div class="card bg-white p-6 rounded-xl">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">إضافة رحلة سريعة</h3>
                <form id="add-trip-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <select name="driverId" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                            <option value="">اختر السائق...</option>
                            ${drivers.map(driver => 
                                `<option value="${driver.id}">${driver.name} - ${driver.phoneNumber}</option>`
                            ).join('')}
                        </select>
                        <input type="number" step="0.01" name="totalPrice" placeholder="السعر الإجمالي (دينار)" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                        
                        <select name="tripType" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                            <option value="">نوع الرحلة...</option>
                            <option value="airport">مطار</option>
                            <option value="families">عائلات</option>
                            <option value="passengers">ركاب عاديين</option>
                            <option value="vip">VIP</option>
                        </select>

                        <input type="number" step="0.01" name="commissionValue" placeholder="قيمة العمولة (اتركها فارغة لاستخدام إعداد السائق)" class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                    </div>
                    <button type="submit" class="btn-primary w-full text-white p-3 rounded-lg font-semibold shadow-md">إضافة الرحلة</button>
                </form>
            </div>
        </div>
    `;
    return renderAdminShell(content, 'dashboard');
}

// وظيفة عرض صفحة إدارة السائقين
// moved to js/ui/drivers.js

// وظائف مساعدة لإنشاء بيانات الرسوم البيانية
// moved to js/ui/dashboard.js

// moved to js/ui/dashboard.js

function summarizeMonthly(trips) {
    // Aggregate by YYYY-MM
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
    // Aggregate by YYYY-MM-DD, then take last N days
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
    // Aggregate by YYYY
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

function getTripsFilteredByDate(state) {
    const from = state.dateFrom ? new Date(state.dateFrom) : null;
    const to = state.dateTo ? new Date(state.dateTo) : null;
    return state.trips.filter(t => {
        const d = new Date(t.dateAdded);
        if (isNaN(d)) return false;
        if (from && d < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
        if (to && d > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999)) return false;
        return true;
    });
}

// تنسيق عملة بسيط (دينار)
function formatCurrency(n) {
    const v = Number(n || 0);
    return `${v.toFixed(2)} دينار`;
}

// حساب KPIs للفترة الحالية ومقارنتها مع فترة سابقة بنفس الطول
function computeKpisWithTrends(currentTrips, state) {
    // حدد نطاق التاريخ الحالي
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

    // استخرج رحلات الفترة السابقة بنفس الطول مباشرة قبل الفترة الحالية
    const prevState = { ...state };
    if (from && to) {
        const prevTo = new Date(from.getFullYear(), from.getMonth(), from.getDate()-1);
        const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - (rangeDays-1));
        prevState.dateFrom = prevFrom.toISOString().slice(0,10);
        prevState.dateTo = prevTo.toISOString().slice(0,10);
    } else {
        // إذا لا يوجد نطاق محدد، اعتبر الفترة السابقة مباشرة قبل اليوم/المدى المفضل
        const now = new Date();
        const curTo = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const curFrom = new Date(curTo.getFullYear(), curTo.getMonth(), curTo.getDate() - (rangeDays-1));
        const prevTo = new Date(curFrom.getFullYear(), curFrom.getMonth(), curFrom.getDate()-1);
        const prevFrom = new Date(prevTo.getFullYear(), prevTo.getMonth(), prevTo.getDate() - (rangeDays-1));
        prevState.dateFrom = prevFrom.toISOString().slice(0,10);
        prevState.dateTo = prevTo.toISOString().slice(0,10);
    }
    const prevTrips = getTripsFilteredByDate(prevState);

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

    const pct = (a,b) => {
        if (!b && !a) return 0;
        if (!b) return 100;
        return ((a-b)/b)*100;
    };

    return {
        kpi: {
            totalTrips: { value: current.totalTrips, delta: pct(current.totalTrips, previous.totalTrips) },
            totalCommission: { value: current.totalCommission, delta: pct(current.totalCommission, previous.totalCommission) },
            avgCommission: { value: current.avgCommission, delta: pct(current.avgCommission, previous.avgCommission) },
        }
    };
}

function renderKpiCard({ label, value, delta = null, tone = 'green', icon = '📊', isCurrency = false }) {
    const colors = {
        green: 'text-green-600 bg-green-50',
        blue: 'text-blue-600 bg-blue-50',
        purple: 'text-purple-600 bg-purple-50',
        red: 'text-red-600 bg-red-50',
        amber: 'text-amber-600 bg-amber-50'
    };
    const chip = delta===null ? '' : `
        <span class="badge ${delta>=0 ? 'badge-indigo' : 'badge-red'}">${delta>=0?'▲':'▼'} ${Math.abs(delta).toFixed(1)}%</span>
    `;
    const valText = isCurrency ? formatCurrency(value) : (typeof value === 'number' ? value : String(value));
    const toneClass = colors[tone] || colors.green;
    return `
        <div class="card p-5 rounded-xl fade-in">
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-sm text-gray-500">${label}</p>
                    <p class="mt-1 text-2xl font-extrabold">${valText}</p>
                    <div class="mt-2">${chip}</div>
                </div>
                <div class="text-2xl ${toneClass} rounded-lg px-2 py-1">${icon}</div>
            </div>
        </div>
    `;
}

// moved to js/ui/drivers.js

// وظيفة تعديل السائق
// moved to js/ui/drivers.js

// إدارة الرحلات
// moved to js/ui/trips.js

// تصدير الوظائف
window.renderEnhancedAdminPanel = renderEnhancedAdminPanel;
window.getTripsFilteredByDate = getTripsFilteredByDate;
window.renderDriverManagement = renderDriverManagement;