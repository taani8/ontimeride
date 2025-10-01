// Global app state defaults and helpers
(function(){
  window.appState = window.appState || {
    view: 'driver-login',
    isAuthReady: false,
    isAdmin: false,
    drivers: [],
    trips: [],
    driverSearch: '',
    driverFilter: 'all',
    driverPage: 1,
    pageSize: 6,
    datePreset: '30d',
    dateFrom: '',
    dateTo: '',
    tableDensity: 'comfortable'
  };
})();
