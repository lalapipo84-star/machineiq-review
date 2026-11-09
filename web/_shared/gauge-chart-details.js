(function () {
  'use strict';
  var host = document.querySelector('main');
  if (!host || !window.MIQCharts) return;
  function text(node) { return node ? MIQCommon.view.get(node,"textContent").trim().replace(/\s+/g, ' ') : ''; }
  function set(node, detail) {
    if (!node || !detail) return;
    MIQCommon.view.call(node,"setAttribute",['data-chart-tip',detail]);
    MIQCommon.view.call(node,"setAttribute",['aria-label',detail]);
    MIQCommon.view.call(node,"setAttribute",['tabindex','0']);
    if (!node.hasAttribute('role')) MIQCommon.view.call(node,"setAttribute",['role','img']);
    MIQCharts.bind(node);
  }
  function enhance() {
    host.querySelectorAll('.batt-mini__cell').forEach(function (gauge) {
      var card = gauge.closest('.batt-mini');
      set(gauge, '현재 잔량\n' + text(card && card.querySelector('.batt-mini__val')));
    });
    host.querySelectorAll('.batt-soc__cell').forEach(function (gauge) {
      var card = gauge.closest('.batt-soc');
      set(gauge, '배터리 충전량 (SOC)\n' + text(card.querySelector('.batt-soc__pct')) + '\n' + text(card.querySelector('.batt-soc__stat')));
    });
    host.querySelectorAll('.batt-soh__circle').forEach(function (gauge) {
      set(gauge, '배터리 성능 최대치 (SOH)\n' + text(gauge.querySelector('.batt-soh__pct')));
    });
    host.querySelectorAll('.supply-item .bar').forEach(function (gauge) {
      var item = gauge.closest('.supply-item');
      var values = Array.prototype.map.call(item.querySelectorAll('.supply-item__row'), function (row) {
        return text(row.querySelector('span')) + ' ' + text(row.querySelector('b'));
      });
      set(gauge, text(item.querySelector('.supply-item__name')) + '\n' + values.join('\n'));
    });
    host.querySelectorAll('.progress__bar').forEach(function (gauge) {
      var progress = gauge.closest('.progress'), row = gauge.closest('tr');
      var title = row && MIQCommon.view.call(row,"getAttribute",['data-name']);
      var vin = row && MIQCommon.view.call(row,"getAttribute",['data-vin']);
      var top = progress.querySelector('.progress__top');
      var values = top ? Array.prototype.map.call(top.children, text).join(' · ') : '';
      set(gauge, [title, vin, values, text(progress.querySelector('.progress__context'))].filter(Boolean).join('\n'));
    });
  }
  enhance();
  new MutationObserver(enhance).observe(host, {childList: true, subtree: true, characterData: true});
})();
