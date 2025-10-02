// Drivers UI module (migrated from ui.js)
(function(){
  function renderDriverManagement() {
    if (window.appState.dbError) {
      return renderDbError(window.appState.dbError);
    }

    const { drivers, editingDriver } = window.appState;
    const { list, totalPages, currentPage, totalItems } = filterAndPaginateDrivers(drivers, window.appState);
    
    const content = `
        ${renderNavbar('driver-management')}
        <div style="height: 72px;"></div>
        <div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
            <!-- Header -->
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-3xl font-extrabold text-gray-900">إدارة السائقين</h2>
                <div class="text-sm text-gray-500">${new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <!-- Controls -->
            <div class="card hoverable p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input id="driver-search" type="text" value="${window.appState.driverSearch || ''}" placeholder="ابحث بالاسم أو الهاتف" class="p-3 border rounded">
                    <select id="driver-filter" class="p-3 border rounded">
                        <option value="all" ${window.appState.driverFilter==='all'?'selected':''}>كل الأرصدة</option>
                        <option value="positive" ${window.appState.driverFilter==='positive'?'selected':''}>أرصدة موجبة</option>
                        <option value="zero" ${window.appState.driverFilter==='zero'?'selected':''}>رصيد صفري</option>
                        <option value="negative" ${window.appState.driverFilter==='negative'?'selected':''}>أرصدة سالبة</option>
                    </select>
                    <div class="flex items-center gap-2">
                        <button id="export-drivers-mgmt" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">تصدير السائقين CSV</button>
                    </div>
                </div>
            </div>

            <!-- Add/Edit Driver Form -->
            <div class="card hoverable p-6">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">
                    ${editingDriver ? `تعديل السائق: ${editingDriver.name}` : 'إضافة سائق جديد'}
                </h3>
                <form id="driver-form" class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input type="text" name="name" placeholder="الاسم الثلاثي" title="اكتب الاسم الثلاثي"  value="${editingDriver ? editingDriver.name : ''}" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                        <input type="tel" name="phoneNumber" placeholder="رقم الهاتف (07XXXXXXXX أو +9627XXXXXXXX)" inputmode="tel" value="${editingDriver ? editingDriver.phoneNumber : ''}" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                        <input type="number" step="0.01" name="balance" placeholder="إضافة رصيد ابتدائي (دينار)" value="${editingDriver ? editingDriver.balance : '0.00'}" required class="p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                    </div>
                    <!-- تمت إزالة حقول العمولة، والاكتفاء بحقل الرصيد فقط كما طُلب -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label for="driver-image" class="block text-sm font-medium text-gray-700 mb-2">إضافة صورة (اختياري)</label>
                            <input type="file" id="driver-image" name="imageFile" accept="image/*" class="w-full p-3 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                            <p class="text-xs text-gray-500 mt-1">الحد الأقصى: 5MB، الأنواع المدعومة: JPG, PNG, GIF</p>
                        </div>
                        <div class="flex items-end space-x-2 rtl:space-x-reverse">
                            <button type="submit" class="btn-primary flex-1 text-white p-3 rounded-lg font-semibold shadow-md">
                                ${editingDriver ? 'تحديث السائق' : 'إضافة السائق'}
                            </button>
                            ${editingDriver ? `
                                <button type="button" onclick="window.appState.editingDriver = null; window.setAppView('driver-management');" class="bg-gray-500 hover:bg-gray-600 text-white p-3 rounded-lg font-semibold">إلغاء</button>
                            ` : ''}
                        </div>
                    </div>
                </form>
            </div>

            <!-- Drivers Cards Grid -->
            <div class="card hoverable p-6">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">قائمة السائقين (${totalItems})</h3>
                ${totalItems === 0 ? `
                    <div class="p-8 text-center text-gray-500">لا يوجد سائقون لعرضهم.</div>
                ` : ''}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    ${list.map(d0 => {
                        const driver = {
                            id: d0.id,
                            name: d0.name || 'بدون اسم',
                            phoneNumber: d0.phoneNumber || '—',
                            balance: typeof d0.balance === 'number' ? d0.balance : parseFloat(d0.balance || 0) || 0,
                            image: d0.image,
                            created_at: d0.created_at
                        };
                        return `
                        <div class="card hoverable p-4">
                            <div class="flex items-center gap-3 mb-3">
                                <div class="relative">
                                    <img src="${driver.image || '81077e1b-876b-43d3-913b-d8a24361fefb.jpg'}" alt="${driver.name}" class="w-14 h-14 rounded-full object-cover border">
                                    ${driver.balance < 0 ? `<span class=\"absolute -top-1 -left-1 bg-red-600 text-white text-[10px] px-1 py-0.5 rounded\">سالب</span>` : ''}
                                </div>
                                <div class="min-w-0">
                                    <div class="font-bold text-gray-900 truncate">${driver.name}</div>
                                    <div class="text-sm text-gray-600 truncate">${driver.phoneNumber}</div>
                                </div>
                            </div>
                            <div class="flex items-center justify-between mb-3">
                                <div class="text-sm text-gray-500">الرصيد</div>
                                <div class="text-lg font-extrabold ${driver.balance >= 0 ? 'text-green-600' : 'text-red-600'}">${driver.balance.toFixed(2)} د.أ</div>
                            </div>
                            <div class="flex items-center gap-2">
                                <input type="number" step="0.01" min="0" id="credit-amount-${driver.id}" placeholder="0.00" class="flex-1 input text-sm" />
                                <button type="button" class="credit-btn bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm" data-driver-id="${driver.id}">إضافة</button>
                            </div>
                            <div class="flex items-center gap-2 mt-2 text-xs">
                                <button class="quick-credit bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" data-driver-id="${driver.id}" data-amount="5">+5</button>
                                <button class="quick-credit bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" data-driver-id="${driver.id}" data-amount="10">+10</button>
                                <button class="quick-credit bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded" data-driver-id="${driver.id}" data-amount="20">+20</button>
                            </div>
                            <div class="flex justify-between items-center mt-3 text-sm">
                                <button onclick="editDriver('${driver.id}')" class="text-blue-600 hover:text-blue-800">تعديل</button>
                                <button onclick="window.deleteDriver('${driver.id}', '${driver.name}')" class="text-red-600 hover:text-red-800">حذف</button>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
                <div class="flex items-center justify-between mt-4">
                    <div class="text-sm text-gray-600">صفحة ${currentPage} من ${totalPages}</div>
                    <div class="flex gap-2">
                        <button id="prev-page" class="px-3 py-1 border rounded ${currentPage<=1?'opacity-50 cursor-not-allowed':''}">السابق</button>
                        <button id="next-page" class="px-3 py-1 border rounded ${currentPage>=totalPages?'opacity-50 cursor-not-allowed':''}">التالي</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    return renderAdminShell(content, 'drivers');
  }

  function filterAndPaginateDrivers(drivers, state) {
    const search = (state.driverSearch || '').trim().toLowerCase();
    const filter = state.driverFilter || 'all';
    let list = drivers.slice();
    if (search) {
      list = list.filter(d => (d.name||'').toLowerCase().includes(search) || (d.phoneNumber||'').toLowerCase().includes(search));
    }
    if (filter === 'positive') list = list.filter(d => d.balance > 0);
    if (filter === 'zero') list = list.filter(d => (d.balance||0) === 0);
    if (filter === 'negative') list = list.filter(d => d.balance < 0);

    const pageSize = state.pageSize || 6;
    const totalItems = list.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(Math.max(1, state.driverPage || 1), totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return { list: list.slice(start, end), totalPages, currentPage, totalItems };
  }

  function editDriver(driverId) {
    const driver = window.appState.drivers.find(d => d.id === driverId);
    if (driver) {
      window.appState.editingDriver = driver;
      window.setAppView('driver-management');
    }
  }

  // exports
  window.renderDriverManagement = renderDriverManagement;
  window.filterAndPaginateDrivers = filterAndPaginateDrivers;
  window.editDriver = editDriver;
})();
