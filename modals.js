// Modals and action handlers (event delegation)
(function(){
  document.body.addEventListener('click', async (e) => {
    // Edit trip modal cancel
    if (e.target.closest('#edit-trip-cancel')) {
      const m = document.getElementById('edit-trip-modal');
      if (m) m.classList.add('hidden');
      return;
    }
    // Edit trip modal save
    if (e.target.closest('#edit-trip-save')) {
      e.preventDefault();
      const idEl = document.getElementById('edit-trip-id');
      const totalEl = document.getElementById('edit-trip-total');
      const typeEl = document.getElementById('edit-trip-type');
      const id = idEl ? idEl.value : '';
      const total = parseFloat(totalEl ? totalEl.value : '');
      const type = typeEl ? typeEl.value : '';
      if (isNaN(total) || total < 0) { window.showToast && window.showToast('error','قيمة السعر غير صحيحة'); return; }
      try {
        await window.applyEditTrip(id, total, type);
        const m = document.getElementById('edit-trip-modal');
        if (m) m.classList.add('hidden');
        window.setAppView && window.setAppView('trips-management');
      } catch (e2) {
        window.showToast && window.showToast('error', e2.message || 'فشل حفظ التعديلات');
      }
      return;
    }
    // Delete trip modal cancel
    if (e.target.closest('#delete-trip-cancel')) {
      const m = document.getElementById('delete-trip-modal');
      if (m) m.classList.add('hidden');
      return;
    }
    // Delete trip confirm
    if (e.target.closest('#delete-trip-confirm')) {
      e.preventDefault();
      const idEl = document.getElementById('delete-trip-id');
      const id = idEl ? idEl.value : '';
      try {
        await window.applyDeleteTrip(id);
        const m = document.getElementById('delete-trip-modal');
        if (m) m.classList.add('hidden');
        window.setAppView && window.setAppView('trips-management');
      } catch (e3) {
        window.showToast && window.showToast('error', e3.message || 'فشل حذف الرحلة');
      }
      return;
    }
  });
})();
