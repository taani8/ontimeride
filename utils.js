// Core utilities shared across UI and features
(function(){
  function formatCurrency(n){
    const v = Number(n || 0);
    return `${v.toFixed(2)} دينار`;
  }
  function debounce(fn, wait=250){
    let t; return function(...args){ clearTimeout(t); t=setTimeout(()=>fn.apply(this,args), wait); };
  }
  function throttle(fn, wait=300){
    let inFlight=false, lastArgs=null;
    return function(...args){
      if (inFlight) { lastArgs=args; return; }
      inFlight=true; fn.apply(this,args);
      setTimeout(()=>{ inFlight=false; if (lastArgs){ const a=lastArgs; lastArgs=null; fn.apply(this,a); } }, wait);
    };
  }
  function parseISODateOnly(s){
    // Safe parse YYYY-MM-DD to Date at local midnight
    if(!s) return null; const [y,m,d] = s.split('-').map(Number);
    if(!y||!m||!d) return null; return new Date(y, m-1, d);
  }
  // expose
  window.utils = Object.assign(window.utils||{}, { formatCurrency, debounce, throttle, parseISODateOnly });
  // backward compat for existing calls
  window.formatCurrency = window.formatCurrency || formatCurrency;
})();
