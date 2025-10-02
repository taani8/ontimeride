// Trips UI module (migrated from ui.js)
(function(){
  function renderTripsManagement() {
    if (window.appState.dbError) {
      return renderDbError(window.appState.dbError);
    }
    const { trips } = window.appState;
    const filteredTrips = window.getTripsFilteredByDate(window.appState);
    return renderAdminShell(`
        ${renderNavbar('trips-management')}
        <div style="height: 72px;"></div>
        <div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-3xl font-extrabold text-gray-900">إدارة الرحلات</h2>
            </div>
            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                ${renderStatCard({ label: 'إجمالي الرحلات', value: filteredTrips.length, tone: 'blue', icon: '🚗' })}
                ${renderStatCard({ label: 'إجمالي العمولات', value: filteredTrips.reduce((sum, trip) => sum + (trip.commissionAmount || 0), 0).toFixed(2), tone: 'amber', icon: '💰' })}
                ${renderStatCard({ label: 'متوسط العمولة', value: (filteredTrips.length ? (filteredTrips.reduce((sum, trip) => sum + (trip.commissionAmount || 0), 0) / filteredTrips.length).toFixed(2) : '0.00'), tone: 'purple', icon: '📊' })}
            </div>
            <!-- Trips Table -->
            <div class="card hoverable p-6">
                <h3 class="text-xl font-bold mb-4 border-b pb-2">قائمة الرحلات</h3>
                <div class="overflow-x-auto">
                    ${filteredTrips.length === 0 ? `
                        <div class=\"p-8 text-center text-gray-500\">لا توجد رحلات ضمن النطاق المحدد.</div>
                    ` : ''}
                    <table class="min-w-full table table-sticky table-zebra ${window.appState.tableDensity==='condensed' ? 'table-condensed' : ''}">
                        <thead>
                            <tr>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السائق</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">النوع</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">السعر الإجمالي</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">العمولة</th>
                                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredTrips.slice(0, 20).map(trip => {
                                const driver = window.appState.drivers.find(d => d.id === trip.driverId);
                                const typeMap = { 'airport': 'مطار', 'families': 'عائلات', 'passengers': 'ركاب عاديين', 'vip': 'VIP' };
                                return `
                                    <tr>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${new Date(trip.dateAdded).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            ${driver ? driver.name : 'غير محدد'}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            ${typeMap[trip.tripType] || trip.tripType}
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                            ${trip.totalPrice.toFixed(2)} دينار
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                                            ${(trip.commissionAmount || 0).toFixed(2)} دينار
                                        </td>
                                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                                            <div class="flex items-center gap-3">
                                                <button class="text-blue-600 hover:text-blue-800" onclick="window.editTrip('${trip.id || ''}')">تعديل</button>
                                                <button class="text-red-600 hover:text-red-800" onclick="window.deleteTrip('${trip.id || ''}')">حذف</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
                ${filteredTrips.length > 20 ? `<p class="text-sm text-gray-500 mt-4 text-center">عرض أول 20 رحلة من ${filteredTrips.length} رحلة</p>` : ''}
            </div>
        </div>
    `, 'trips');
  }

  window.renderTripsManagement = renderTripsManagement;
})();
