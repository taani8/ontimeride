// Navbar module with mobile menu support
(function(){
  function renderNavbar(active = 'admin') {
    const link = (key, label, icon) => {
      const is = active === key;
      return `
        <a href="#" class="nav-link ${is ? 'active' : ''}" data-view="${key}">
          <span>${icon}</span>
          <span>${label}</span>
        </a>`;
    };

    return `
      <header class="header">
        <div class="container header-bar">
          <div class="logo">
            <img src="81077e1b-876b-43d3-913b-d8a24361fefb.jpg" alt="Logo" />
            <span>On Time Ride</span>
          </div>

          <button id="mobile-menu-btn" class="mobile-menu-btn" aria-label="القائمة">
            ☰
          </button>

          <nav class="desktop-nav">
            ${link('admin','اللوحة','🏠')}
            ${link('driver-management','السائقون','👨‍✈️')}
            ${link('trips-management','الرحلات','🚗')}
            <button id="theme-toggle" class="btn btn-secondary btn-sm" title="الوضع الداكن/الفاتح">🌙</button>
            <a href="#" class="nav-link" data-view="logout" style="color: #dc2626;">خروج</a>
          </nav>
        </div>
      </header>

      <!-- Mobile Menu Overlay -->
      <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>

      <!-- Mobile Menu -->
      <div class="mobile-menu" id="mobile-menu">
        <div class="mobile-menu-header">
          <div class="logo">
            <img src="81077e1b-876b-43d3-913b-d8a24361fefb.jpg" alt="Logo" />
            <span>On Time Ride</span>
          </div>
          <button class="mobile-menu-close" id="mobile-menu-close" aria-label="إغلاق">×</button>
        </div>
        <nav class="mobile-menu-nav">
          <a href="#" class="mobile-menu-link ${active === 'admin' ? 'active' : ''}" data-view="admin">
            <span>🏠</span>
            <span>اللوحة</span>
          </a>
          <a href="#" class="mobile-menu-link ${active === 'driver-management' ? 'active' : ''}" data-view="driver-management">
            <span>👨‍✈️</span>
            <span>السائقون</span>
          </a>
          <a href="#" class="mobile-menu-link ${active === 'trips-management' ? 'active' : ''}" data-view="trips-management">
            <span>🚗</span>
            <span>الرحلات</span>
          </a>
          <div style="padding: 1rem 0; border-top: 1px solid var(--border-color); margin-top: 1rem;">
            <button id="mobile-theme-toggle" class="btn btn-secondary w-full" style="justify-content: flex-start;">
              <span>🌙</span>
              <span>الوضع الداكن/الفاتح</span>
            </button>
          </div>
          <a href="#" class="mobile-menu-link" data-view="logout" style="color: #dc2626; margin-top: 1rem;">
            <span>🚪</span>
            <span>تسجيل الخروج</span>
          </a>
        </nav>
      </div>`;
  }

  // Initialize mobile menu handlers after navbar is rendered
  function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const closeBtn = document.getElementById('mobile-menu-close');
    const menuLinks = document.querySelectorAll('.mobile-menu-link');

    function openMenu() {
      menu?.classList.add('open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      menu?.classList.remove('open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    }

    menuBtn?.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', closeMenu);
    overlay?.addEventListener('click', closeMenu);

    menuLinks.forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Theme toggle for mobile
    const mobileThemeToggle = document.getElementById('mobile-theme-toggle');
    mobileThemeToggle?.addEventListener('click', () => {
      const root = document.documentElement;
      const currentTheme = root.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  window.renderNavbar = renderNavbar;
  window.initMobileMenu = initMobileMenu;
})();
