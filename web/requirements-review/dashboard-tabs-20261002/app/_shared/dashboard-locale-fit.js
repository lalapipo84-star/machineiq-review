/* Layout only: translated content keeps the current data, filters and page. */
(function () {
  'use strict';
  var pending = false;
  function visible(el) { return el.getBoundingClientRect().width > 0; }
  function overflow(el) { return visible(el) && el.scrollWidth > el.clientWidth + 2; }
  function outside(el, parent) {
    if (!parent) return false;
    var r = el.getBoundingClientRect(), p = parent.getBoundingClientRect();
    return r.width > 0 && (r.left < p.left - 2 || r.right > p.right + 2);
  }
  function fit() {
    pending = false;
    var dashboard = document.querySelector('.dashboard-content');
    if (!dashboard) return;
    dashboard.querySelectorAll('[data-locale-columns]').forEach(function (el) { el.removeAttribute('data-locale-columns'); });
    if (/^ko$/.test(document.documentElement.lang)) { dashboard.dataset.localeFit = document.documentElement.lang; return; }
    var overview = dashboard.querySelector('.dc-overview-row');
    if (overview && Array.from(overview.querySelectorAll('.dc-ratio-legend,.dc-maintenance-value,.dwi-maintenance-action')).some(function (el) {
      return overflow(el) || outside(el, el.closest('.dc-ratio-body,.dc-maintenance-fault,.dc-maintenance-supply'));
    })) overview.dataset.localeColumns = '2';
    dashboard.querySelectorAll('.dc-company-list').forEach(function (list) {
      var tooNarrow = Array.from(list.querySelectorAll('.dc-company-alert-label,.dc-company-alert-value,.dc-state-labels,.dc-usage-total>div')).some(function (el) {
        return overflow(el) || outside(el, el.closest('.dc-company-alert,.dc-usage-metric,.dc-company-state,.dc-usage-total'));
      });
      if (tooNarrow) list.dataset.localeColumns = '2';
    });
    var six = dashboard.querySelector('.dc-period-six');
    if (six && Array.from(six.querySelectorAll('.dc-metric-number')).some(overflow)) six.dataset.localeColumns = '3';
    dashboard.dataset.localeFit = document.documentElement.lang;
  }
  function schedule() { if (!pending) { pending = true; requestAnimationFrame(fit); } }
  function start() {
    var dashboard = document.querySelector('.dashboard-content');
    if (!dashboard) return;
    var lastWidth = -1;
    new ResizeObserver(function (entries) {
      var width = Math.round(entries[0].contentRect.width);
      if (width !== lastWidth) { lastWidth = width; schedule(); }
    }).observe(dashboard);
    new MutationObserver(schedule).observe(dashboard, {childList:true,subtree:true,characterData:true});
    new MutationObserver(schedule).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
    document.fonts.ready.then(schedule);
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
