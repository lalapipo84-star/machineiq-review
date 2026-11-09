(function () {
  'use strict';
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }
  function integer(value) { return MIQCommon.numbers.integer(value); }
  function time(value) {
    var minutes = Math.round(value * 60);
    return Math.floor(minutes / 60) + 'H ' + (minutes % 60) + '분';
  }
  function rate(value, total) { return total ? value / total * 100 : 0; }
  function metrics(item) {
    return [
      ['운영효율', item.work+item.idle>0?integer(rate(item.work,item.work+item.idle))+'%':'-'],
      ['작업시간', time(item.work)], ['대기시간', time(item.idle)],
      ['미사용시간', time(Math.max(0, item.capacity - item.work - item.idle))],
      ['기준시간', time(item.capacity)],
      ['가동률', item.capacity?integer(rate(item.work+item.idle,item.capacity))+'%':'-']
    ];
  }
  function render(data, options) {
    var items = data.vehicles || [], chart = options.chart;
    var workTotal = 0, runningTotal = 0;
    var pager=chart.__miqListPager||(chart.__miqListPager=MIQ.createListPager(chart,{pageSize:20,onChange:function(){render(chart.__miqPageData,chart.__miqPageOptions)}}));
    chart.__miqPageData=data;chart.__miqPageOptions=options;
    items.forEach(function(item){workTotal+=item.work;runningTotal+=item.work+item.idle});
    var visible=pager.slice(items,options.from+'|'+options.to);
    MIQCommon.view.set(chart,"innerHTML",visible.map(function (item) {
      var v = item.vehicle, unused = Math.max(0, item.capacity - item.work - item.idle);
      var workRate = rate(item.work, item.capacity), idleRate = rate(item.idle, item.capacity);
      var unusedRate = Math.max(0, 100 - workRate - idleRate);
      var label = '<span class="efficiency-vehicle-label"><strong>' + esc(v.vin) + '</strong><small>' + esc(v.model || '') + '</small></span>';

      if (!data.filled || !item.capacity) {
        return '<div class="efficiency-daily-row is-empty" data-efficiency-vehicle="' + esc(v.vin) + '">' + label
          + '<div class="efficiency-daily-track" aria-hidden="true"></div><span class="efficiency-daily-row__metrics">미집계</span><strong>-</strong></div>';
      }
      var summary = v.vin + ' 운영효율 ' + (item.work+item.idle>0?integer(rate(item.work,item.work+item.idle)):'-') + '%, 작업 ' + time(item.work) + ', 대기 ' + time(item.idle) + ', 상세 펼치기';
      return '<details class="efficiency-vehicle" data-efficiency-vehicle="' + esc(v.vin) + '">'
        + '<summary class="efficiency-daily-row" aria-label="' + esc(summary) + '">' + label
        + '<span class="efficiency-daily-track" aria-hidden="true">'
        + '<span class="efficiency-daily-segment is-work" style="width:' + workRate.toFixed(4) + '%"></span>'
        + '<span class="efficiency-daily-segment is-idle" style="width:' + idleRate.toFixed(4) + '%"></span>'
        + '<span class="efficiency-daily-segment is-unused" style="width:' + unusedRate.toFixed(4) + '%"></span></span>'
        + '<span class="efficiency-daily-row__metrics">'
        + [['작업', item.work], ['대기', item.idle], ['미사용', unused]].map(function (metric) {
          return '<span><em>' + metric[0] + '</em><strong>' + integer(metric[1]) + 'H</strong></span>';
        }).join('') + '</span>'
        + '<strong class="efficiency-daily-row__actual">' + (item.work+item.idle>0?integer(rate(item.work,item.work+item.idle)):'-') + '% <span class="efficiency-vehicle-chevron" aria-hidden="true">⌄</span></strong></summary>'
        + '<dl class="efficiency-vehicle-detail">' + metrics(item).map(function (metric) {
          return '<div><dt>' + metric[0] + '</dt><dd>' + metric[1] + '</dd></div>';
        }).join('') + '</dl></details>';
    }).join('') || '<p class="efficiency-vehicle-empty">조회 조건에 해당하는 차량이 없습니다.</p>');
    MIQCommon.view.set(document.getElementById('efficiencyDailyPeriod'),"textContent",options.from + ' ~ ' + options.to);
    MIQCommon.view.set(document.getElementById('efficiencyDailyAverage'),"textContent",runningTotal ? integer(rate(workTotal, runningTotal)) + '%' : '-');
    MIQCommon.view.set(document.getElementById('efficiencyDailyWork'),"textContent",data.knownVehicleCount && data.filled ? integer(workTotal / data.knownVehicleCount) + 'H' : '-');
    var note = document.querySelector('.efficiency-daily-note');
    if (note) MIQCommon.view.set(note,"textContent",'※ 운영효율 = 작업 ÷ (작업+대기). 막대 구성비·가동률은 시연 조업시간(매일 08~18시) 기준이며 미수집 차량은 제외합니다.');
    if (options.tableBody) {
      MIQCommon.view.set(options.tableBody,"innerHTML",visible.map(function (item) {
        return '<tr><th scope="row">' + esc(item.vehicle.vin) + '<br><small>' + esc(item.vehicle.model || '') + '</small></th>'
          + (!data.filled || !item.capacity ? '<td colspan="6">미집계</td>' : metrics(item).map(function (metric) {
            return '<td class="r">' + metric[1] + '</td>';
          }).join('')) + '</tr>';
      }).join('') || '<tr><td colspan="7">조회 조건에 해당하는 차량이 없습니다.</td></tr>');
    }
  }
  window.MIQVehicleEfficiency = { render: render };
})();
