// Navbar module: overrides window.renderNavbar to allow independent editing
(function(){
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
          <nav class="hidden md:flex items-center gap-1">
            ${link('admin','اللوحة','🏠')}
            ${link('driver-management','السائقون','👨‍✈️')}
            ${link('trips-management','الرحلات','🚗')}
            <a href="#" class="topnav-link px-3 py-2 rounded-lg text-sm text-red-700 hover:text-white hover:bg-red-600" data-view="logout">خروج</a>
          </nav>
        </div>
      </header>`;
  }
  window.renderNavbar = renderNavbar;
})();
