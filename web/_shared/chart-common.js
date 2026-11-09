(function (root) {
  'use strict';
  function escape(value) {
    return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function parse(value) {
    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    var date = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return date.toISOString().slice(0, 10) === value ? date : null;
  }
  function axis(period, from, to) {
    var start = parse(from), end = parse(to), labels = [], dates = [], detailLabels = [];
    if (!start || !end || start > end) return { labels: labels, dates: dates, detailLabels: detailLabels, n: 0, bucket: 1, filled: 0 };
    var count = period === 'd' ? 24 : Math.min(366, Math.round((end - start) / 86400000) + 1);
    for (var index = 0; index < count; index++) {
      var date = new Date(start.getTime() + (period === 'd' ? 0 : index * 86400000));
      var iso = date.toISOString().slice(0, 10);
      var label = period === 'd' ? String(index).padStart(2, '0') + '시'
        : (index === 0 || date.getUTCDate() === 1 ? (date.getUTCMonth() + 1) + '월 ' : '') + date.getUTCDate() + '일';
      labels.push(label); dates.push(iso); detailLabels.push(iso + (period === 'd' ? ' ' + label : ''));
    }
    return { labels: labels, dates: dates, detailLabels: detailLabels, n: count, bucket: 1, filled: count };
  }
  function tickLabel(labels, index, width) {
    var every = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((width || 800) / 38))));
    return index === 0 || index === labels.length - 1 || /월/.test(labels[index]) || index % every === 0 ? labels[index] : '';
  }
  /* Count metrics share a zero baseline, 10% headroom and integer 1/2/5 steps.
     The caller supplies only visible series; null means uncollected, not zero. */
  function countsAxis(values) {
    var collected = (Array.isArray(values) ? values : []).filter(function (value) {
      return typeof value === 'number' && isFinite(value) && value >= 0;
    });
    var peak = collected.reduce(function (maximum, value) { return Math.max(maximum, value); }, 0);
    var target = peak > 0 ? peak * 1.1 : 1;
    var rawStep = Math.max(1, target / 5);
    var magnitude = Math.pow(10, Math.floor(Math.log(rawStep) / Math.LN10));
    var normalized = rawStep / magnitude;
    var step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
    var intervals = Math.max(1, Math.ceil(target / step));
    var ticks = Array.from({ length: intervals + 1 }, function (_, index) { return index * step; });
    return { min: 0, max: ticks[ticks.length - 1], step: step, ticks: ticks, hasData: collected.length > 0 };
  }
  function tipAttrs(text) {
    return 'tabindex="0" role="img" aria-label="' + escape(text) + '" data-chart-tip="' + escape(text) + '"';
  }
  var tip, active;
  function hide() {
    if (tip) tip.hidden = true;
    if (active) { active.removeAttribute('aria-describedby'); active.classList.remove('on'); }
    active = null;
  }
  function show(target, text, event) {
    if (!target || !text || !root.document) return;
    if (!tip) {
      tip = document.createElement('div'); tip.id = 'miqChartTip'; tip.className = 'miq-chart-tip'; MIQCommon.view.call(tip,"setAttribute",['role','tooltip']); document.body.appendChild(tip);
    }
    if (active !== target) hide();
    active = target; target.classList.add('on'); MIQCommon.view.call(target,"setAttribute",['aria-describedby',tip.id]);
    MIQCommon.view.set(tip,"textContent",text); tip.hidden = false;
    var rect = target.getBoundingClientRect();
    var x = event && typeof event.clientX === 'number' ? event.clientX : rect.left + rect.width / 2;
    var y = event && typeof event.clientY === 'number' ? event.clientY : rect.top;
    tip.style.left = Math.max(8, Math.min(x + 12, root.innerWidth - tip.offsetWidth - 8)) + 'px';
    var top = y - tip.offsetHeight - 12;
    tip.style.top = Math.max(8, Math.min(top < 8 ? y + 16 : top, root.innerHeight - tip.offsetHeight - 8)) + 'px';
  }
  function bind(host) {
    if (!host || host.__miqChartsBound) return;
    host.__miqChartsBound = true;
    function target(event) { return event.target.closest && event.target.closest('[data-chart-tip]'); }
    host.addEventListener('pointermove', function (event) { var node = target(event); if (node) show(node, MIQCommon.view.call(node,"getAttribute",['data-chart-tip']), event); else hide(); });
    host.addEventListener('pointerleave', hide);
    host.addEventListener('focusin', function (event) { var node = target(event); if (node) show(node, MIQCommon.view.call(node,"getAttribute",['data-chart-tip'])); });
    host.addEventListener('focusout', hide);
    host.addEventListener('keydown', function (event) { if (event.key === 'Escape') hide(); });
    if (root.MutationObserver) new MutationObserver(hide).observe(host, { childList: true, subtree: true });
  }
  function observeSize(host, redraw) {
    if (!host || host.__miqChartSizeObserver || !root.ResizeObserver) return;
    var width = Math.round(host.getBoundingClientRect().width), frame = 0;
    var observer = new root.ResizeObserver(function () {
      var next = Math.round(host.getBoundingClientRect().width);
      if (next <= 0 || next === width) return;
      width = next;
      if (frame) root.cancelAnimationFrame(frame);
      frame = root.requestAnimationFrame(function () { frame = 0; hide(); redraw(); });
    });
    host.__miqChartSizeObserver = observer;
    observer.observe(host);
  }
  root.MIQCharts = { axis: axis, countsAxis: countsAxis, tickLabel: tickLabel, escape: escape, tipAttrs: tipAttrs, bind: bind, show: show, hide: hide, observeSize: observeSize };
  if (root.document) {
    root.addEventListener('scroll', hide, true); root.addEventListener('resize', hide);
    document.addEventListener('miq:period-change', hide); document.addEventListener('miq:target-change', hide);
  }
  if (typeof module === 'object' && module.exports) module.exports = root.MIQCharts;
})(typeof window !== 'undefined' ? window : globalThis);
