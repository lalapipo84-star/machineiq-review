(function () {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function integer(value) { return MIQCommon.numbers.integer(value); }
  function rate(value, total) { return total ? value / total * 100 : 0; }
  function metrics(item, display) {
    var shares = display.percent(item.work, item.idle);
    return [
      ['가동시간', display.time(item.work + item.idle)],
      ['작업시간', display.time(item.work) + ' (' + shares.workText + ')'],
      ['대기시간', display.time(item.idle) + ' (' + shares.idleText + ')']
    ];
  }
  function render(data, options) {
    var items = data.vehicles || [], chart = options.chart, display = options.runningDisplay;
    var workTotal = 0, runningTotal = 0;
    var pager=chart.__miqListPager||(chart.__miqListPager=MIQ.createListPager(chart,{pageSize:20,onChange:function(){render(chart.__miqPageData,chart.__miqPageOptions)}}));
    chart.__miqPageData=data;chart.__miqPageOptions=options;
    items.forEach(function(item){workTotal+=item.work;runningTotal+=item.work+item.idle});
    var visible=pager.slice(items,options.from+'|'+options.to);
    MIQCommon.view.set(chart,"innerHTML",visible.map(function (item) {
      var v = item.vehicle, running = item.work + item.idle;
      var label = '<span class="efficiency-vehicle-label"><strong>' + esc(v.vin) + '</strong><small>' + esc(v.model || '') + '</small></span>';

      if (!data.filled || !item.known) {
        return '<div class="efficiency-daily-row is-empty" data-efficiency-vehicle="' + esc(v.vin) + '">' + label
          + '<div class="efficiency-daily-track" aria-hidden="true"></div><span class="efficiency-daily-row__metrics">미집계</span></div>';
      }
      var shares = display.percent(item.work, item.idle);
      var summary = v.vin + ', 가동시간 ' + display.time(running)
        + ', 작업시간 ' + display.time(item.work) + ' (' + shares.workText + ')'
        + ', 대기시간 ' + display.time(item.idle) + ' (' + shares.idleText + '), 상세 펼치기';
      return '<details class="efficiency-vehicle" data-efficiency-vehicle="' + esc(v.vin) + '">'
        + '<summary class="efficiency-daily-row" aria-label="' + esc(summary) + '">' + label
        + '<span class="efficiency-daily-track" aria-hidden="true">'
        + (running > 0 ? '<span class="efficiency-daily-segment is-work" style="width:' + shares.work + '%"></span>'
          + '<span class="efficiency-daily-segment is-idle" style="width:' + shares.idle + '%"></span>' : '') + '</span>'
        + display.metrics(item.work, item.idle)
        + '<span class="efficiency-vehicle-chevron" aria-hidden="true">⌄</span></summary>'
        + '<dl class="efficiency-vehicle-detail">' + metrics(item, display).map(function (metric) {
          return '<div><dt>' + metric[0] + '</dt><dd>' + esc(metric[1]) + '</dd></div>';
        }).join('') + '</dl></details>';
    }).join('') || '<p class="efficiency-vehicle-empty">조회 조건에 해당하는 차량이 없습니다.</p>');
    MIQCommon.view.set(document.getElementById('efficiencyDailyPeriod'),"textContent",options.from + ' ~ ' + options.to);
    MIQCommon.view.set(document.getElementById('efficiencyDailyAverage'),"textContent",runningTotal ? integer(rate(workTotal, runningTotal)) + '%' : '-');
    MIQCommon.view.set(document.getElementById('efficiencyDailyWork'),"textContent",data.knownVehicleCount && data.filled ? integer(workTotal / data.knownVehicleCount) + 'H' : '-');
    if (options.tableBody) {
      MIQCommon.view.set(options.tableBody,"innerHTML",visible.map(function (item) {
        return '<tr><th scope="row">' + esc(item.vehicle.vin) + '<br><small>' + esc(item.vehicle.model || '') + '</small></th>'
          + (!data.filled || !item.known ? '<td colspan="3">미집계</td>' : metrics(item, display).map(function (metric) {
            return '<td class="r">' + esc(metric[1]) + '</td>';
          }).join('')) + '</tr>';
      }).join('') || '<tr><td colspan="4">조회 조건에 해당하는 차량이 없습니다.</td></tr>');
    }
  }
  window.MIQVehicleEfficiency = { render: render };
})();
