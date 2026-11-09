(function () {
  'use strict';

  var body = document.body;
  if (!body || !body.classList.contains('miq-operation-metrics')) return;

  var QUERY = new URLSearchParams(location.search);
  var PERIOD_ALIASES = { day: 'd', daily: 'd', week: 'w', weekly: 'w', month: 'm', monthly: 'm', custom: 'c' };
  var requestedPeriod = PERIOD_ALIASES[QUERY.get('period')] || QUERY.get('period');
  var PAGE = MIQCommon.view.call(body,"getAttribute",['data-metrics-page']);
  var FLEET = window.MIQ && Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length ? MIQ.FLEET_CATALOG : window.MIQ && MIQ.FLEET ? MIQ.FLEET : [];
  var feedback = document.getElementById('metricsFeedback');
  var scopeContext = window.MIQ_TARGET_CONTEXT || null;
  var context = {
    companyId: QUERY.get('companyId') || 'all',
    group: QUERY.get('group') || null,
    type: QUERY.get('type') || null,
    veh: QUERY.get('veh') || QUERY.get('equipmentId') || null,
    period: requestedPeriod || 'm'
  };
  function scopedRows(rows) {
    rows = Array.isArray(rows) ? rows : [];
    return rows.filter(function (vehicle) {
      if (context.companyId && context.companyId !== 'all' && String(vehicle.companyId || '1933') !== String(context.companyId)) return false;
      if (context.group && vehicle.group !== context.group) return false;
      if (context.type && vehicle.type !== context.type) return false;
      if (context.veh && vehicle.vin !== context.veh) return false;
      return true;
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad(value) { return value < 10 ? '0' + value : String(value); }

  function isoDate(date) {
    return window.MIQCommon.dates.format(date);
  }

  function parseDate(value) {
    return window.MIQCommon.dates.parse(value);
  }

  function dayCount(from, to) {
    return window.MIQCommon.dates.dayCount(from, to);
  }

  function setFeedback(message, isError) {
    if (!feedback) return;
    MIQCommon.view.set(feedback,"textContent",message || '');
    feedback.classList.toggle('is-error', !!isError);
  }

  function validateRange(fromInput, toInput) {
    var from = parseDate(fromInput && fromInput.value);
    var to = parseDate(toInput && toInput.value);
    if (!from || !to) {
      setFeedback('조회 시작일과 종료일을 모두 입력해 주세요.', true);
      if (fromInput) fromInput.focus();
      return null;
    }
    if (from > to) {
      setFeedback('조회 시작일은 종료일보다 늦을 수 없습니다.', true);
      fromInput.focus();
      return null;
    }
    if (dayCount(from, to) > 366) {
      setFeedback('사용자설정 기간은 최대 366일까지 조회할 수 있습니다.', true);
      toInput.focus();
      return null;
    }
    return { from: from, to: to, days: dayCount(from, to) };
  }

  function setQuery(values) {
    var url = new URL(location.href);
    Object.keys(values).forEach(function (key) {
      var value = values[key];
      if (value === null || value === undefined || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash);
    document.dispatchEvent(new CustomEvent('miq:query-change', {
      detail: { query: url.searchParams.toString() }
    }));
  }

  function contextualHref(path, extra) {
    var url = new URL(path, location.href);
    var values = {
      role: body.dataset.managementRole || QUERY.get('role') || 'internal',
      companyId: context.companyId,
      group: context.group,
      type: context.type,
      veh: context.veh,
      period: context.period,
      from: new URLSearchParams(location.search).get('from'),
      to: new URLSearchParams(location.search).get('to')
    };
    extra = extra || {};
    Object.keys(extra).forEach(function (key) { values[key] = extra[key]; });
    Object.keys(values).forEach(function (key) {
      var value = values[key];
      if (value !== null && value !== undefined && value !== '') url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });
    return url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
  }

  function syncContextLinks(extra) {
    extra = extra || {};
    Array.prototype.forEach.call(document.querySelectorAll('[data-context-link]:not([data-miq-side-sub])'), function (link) {
      var source = MIQCommon.view.call(link,"getAttribute",['href']);
      if (!source || /^#|^javascript:/i.test(source)) return;
      link.href = contextualHref(source, extra);
    });
  }

  function vehicleByVin(vin) {
    return FLEET.filter(function (vehicle) { return vehicle.vin === vin; })[0] || null;
  }

  function unitFromKey(key) {
    var value = 2166136261;
    String(key || '').split('').forEach(function (character) {
      value ^= character.charCodeAt(0);
      value = Math.imul(value, 16777619);
    });
    return (value >>> 0) / 4294967295;
  }

  function detailHref(vehicle, extra) {
    extra = extra || {};
    extra.veh = vehicle.vin;
    extra.group = vehicle.group;
    extra.type = vehicle.type;
    var applied = MIQ.getAppliedPeriod();
    if (applied) { extra.from = applied.from; extra.to = applied.to; }
    else if (context.period === 'c') {
      var customFrom = document.getElementById('dFrom') || document.getElementById('usageFrom');
      var customTo = document.getElementById('dTo') || document.getElementById('usageTo');
      if (customFrom && customFrom.value) extra.from = customFrom.value;
      if (customTo && customTo.value) extra.to = customTo.value;
    }
    return contextualHref('../Vehicle%20Detail/vehicle-detail-tobe.html', extra);
  }

  function setupContextRefresh(tree, onSelection) {
    document.addEventListener('miq:target-change', function (event) {
      var target = event.detail || {};
      scopeContext = target;
      context.companyId = target.companyId || context.companyId;
      var requestedVin = target.equipmentId || null;
      var exists = requestedVin && vehicleByVin(requestedVin);
      var requestedGroup = target.group || null;
      var requestedType = target.type || null;
      if (tree) {
        if (exists) tree.set({ group: null, type: null, vin: requestedVin });
        else tree.set({ group: requestedGroup, type: requestedType, vin: null });
      }
      if (!tree || !exists) {
        context.group = requestedGroup;
        context.type = requestedType;
        context.veh = exists ? requestedVin : null;
        if (typeof onSelection === 'function') onSelection();
      }
      syncContextLinks();
    });
    document.addEventListener('DOMContentLoaded', function () {
      window.setTimeout(function () { syncContextLinks(); }, 0);
    });
    window.addEventListener('load', function () {
      window.setTimeout(function () { syncContextLinks(); }, 0);
    });
  }

  function makeTooltip() {
    var tooltip = document.createElement('div');
    tooltip.className = 'metrics-tip';
    tooltip.id = 'metricsAccessibleTip';
    MIQCommon.view.call(tooltip,"setAttribute",['role','tooltip']);
    tooltip.hidden = true;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  function positionTooltip(tooltip, rect) {
    var width = tooltip.offsetWidth || 220;
    var left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
    var top = Math.max(8, rect.top - tooltip.offsetHeight - 8);
    if (top <= 8) top = Math.min(window.innerHeight - tooltip.offsetHeight - 8, rect.bottom + 8);
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
  }

  // The two WEB row views share the mobile chart's running-time composition.
  // These are prototype presentation values; production values/rounding remain server-owned.
  var runningDisplay = {
    time: function (value) {
      if (!Number.isFinite(value)) return '-';
      var minutes = Math.round(Math.max(0, value) * 60);
      return window.MIQCommon.numbers.integer(Math.floor(minutes / 60)) + 'H ' + minutes % 60 + '분';
    },
    percent: function (work, idle) {
      var running = work + idle;
      var workRate = running > 0 ? work / running * 100 : 0;
      var idleRate = running > 0 ? idle / running * 100 : 0;
      return {
        work: workRate, idle: idleRate,
        workText: running > 0 ? window.MIQCommon.numbers.integer(workRate) + '%' : '-',
        idleText: running > 0 ? window.MIQCommon.numbers.integer(idleRate) + '%' : '-'
      };
    },
    metrics: function (work, idle) {
      var percent = this.percent(work, idle), display = this;
      return '<span class="efficiency-daily-row__metrics">' + [
        ['running', '가동시간', work + idle, ''],
        ['work', '작업시간', work, percent.workText],
        ['idle', '대기시간', idle, percent.idleText]
      ].map(function (item) {
        return '<span data-running-metric="' + item[0] + '"><em>' + item[1] + '</em><strong>'
          + escapeHtml(display.time(item[2])) + (item[3] ? ' <small>(' + escapeHtml(item[3]) + ')</small>' : '')
          + '</strong></span>';
      }).join('') + '</span>';
    }
  };

  function initEfficiency() {
    var vehicleRowsView = MIQCommon.view.call(body,"getAttribute",['data-efficiency-view']) === 'vehicle-rows';
    var dailyRowsView = vehicleRowsView || MIQCommon.view.call(body,"getAttribute",['data-efficiency-view']) === 'daily-rows';
    var latestDate = new Date();
    latestDate.setHours(12, 0, 0, 0);
    latestDate.setDate(latestDate.getDate() - 1);
    var weekStart = new Date(latestDate.getTime());
    weekStart.setDate(weekStart.getDate() - 6);
    var monthStart = new Date(latestDate.getFullYear(), latestDate.getMonth(), 1, 12, 0, 0, 0);
    var PERIOD = {
      d: { from: isoDate(latestDate), to: isoDate(latestDate), label: '일' },
      w: { from: isoDate(weekStart), to: isoDate(latestDate), label: '주' },
      m: { from: isoDate(monthStart), to: isoDate(latestDate), label: '월' },
      c: { from: QUERY.get('from') || isoDate(monthStart), to: QUERY.get('to') || isoDate(latestDate), label: '설정 기간' }
    };
    var state = {
      period: PERIOD[requestedPeriod] ? requestedPeriod : 'm',
      rows: scopedRows(FLEET),
      label: '전체차량',
      selection: null
    };
    context.period = state.period;
    if (QUERY.get('from') && QUERY.get('to') && PERIOD[state.period]) {
      PERIOD[state.period].from = QUERY.get('from');
      PERIOD[state.period].to = QUERY.get('to');
    }

    var fromInput = document.getElementById('dFrom');
    var toInput = document.getElementById('dTo');
    var chart = document.getElementById('chart');
    var chartWrap = document.getElementById('chartWrap');
    var chartTip = document.getElementById('tip');
    var chartUncollected = document.getElementById('chartUncollected');
    var tableBody = document.getElementById('efficiencyTableBody');

    function round1(value) { return window.MIQCommon.numbers.integer(value); }

    function hours(value) {
      return state.period === 'd' ? Math.round(value * 60) + '분' : round1(value) + 'H';
    }

    function build() {
      var range=PERIOD[state.period],axis=MIQCharts.axis(state.period,range.from,range.to);
      var observations=window.MIQObservations,asOf=observations.windowAt(),totals=[];
      var knownRows=state.rows.filter(observations.hasProfile),divisor=knownRows.length||1;
      var columns=axis.dates.map(function(day,hour){
        var value=observations.aggregate(knownRows,day,day,asOf,state.period==='d'?hour:null);
        if(!value.known)return null;
        totals.push(value);
        return {work:value.workMinutes/60/divisor,idle:value.idleMinutes/60/divisor,capacity:value.capacityMinutes/60/divisor};
      });
      var vehicles=state.rows.map(function(vehicle){
        var value=observations.aggregate(vehicle,range.from,state.period==='d'?range.from:range.to,asOf);
        return {vehicle:vehicle,work:value.workMinutes/60,idle:value.idleMinutes/60,capacity:value.capacityMinutes/60,known:!!value.known};
      });
      var totalWork=totals.reduce(function(s,v){return s+v.workMinutes/60;},0);
      var totalIdle=totals.reduce(function(s,v){return s+v.idleMinutes/60;},0),filled=totals.length;
      return {labels:axis.labels,detailLabels:axis.detailLabels,columns:columns,
        top:vehicles.filter(function(v){return v.known;}).sort(function(a,b){return b.work-a.work;}).slice(0,5),vehicles:vehicles,
        filled:filled,bucket:axis.bucket,knownVehicleCount:knownRows.length,
        average:{work:filled?totalWork/divisor/filled:0,idle:filled?totalIdle/divisor/filled:0},
        averageVehicleWorkTotal:totalWork/divisor};
    }

    function renderTop(data) {
      var work = data.average.work;
      var idle = data.average.idle;
      var total = work + idle;
      var workRate = total ? work / total * 100 : 0;
      var idleRate = total ? 100 - workRate : 0;
      var split = document.getElementById('split');
      if (!state.rows.length) {
        MIQCommon.view.set(split,"innerHTML",'<div class="split__seg idle" style="width:100%">조회 조건에 해당하는 차량이 없습니다.</div>');
        MIQCommon.view.call(split,"setAttribute",['aria-label','조회 조건에 해당하는 차량이 없습니다.']);
      } else {
        MIQCommon.view.set(split,"innerHTML",'<div class="split__seg work" style="width:' + workRate.toFixed(1) + '%">작업 ' + hours(work) + ' · ' + window.MIQCommon.numbers.integer(workRate) + '%</div>'
          + '<div class="split__seg idle" style="width:' + idleRate.toFixed(1) + '%">대기 ' + hours(idle) + ' · ' + window.MIQCommon.numbers.integer(idleRate) + '%</div>');
        MIQCommon.view.call(split,"setAttribute",['aria-label','평균 작업시간 ' + hours(work) + ', ' + window.MIQCommon.numbers.integer(workRate) + '퍼센트. 평균 대기시간 ' + hours(idle) + ', ' + window.MIQCommon.numbers.integer(idleRate) + '퍼센트.']);
      }
      Array.prototype.forEach.call(split.querySelectorAll('.split__seg'),function(segment){MIQCommon.view.call(segment,"setAttribute",['data-chart-tip',MIQCommon.view.get(segment,"textContent")]);MIQCommon.view.call(segment,"setAttribute",['tabindex','0']);});
      MIQCharts.bind(split);
      MIQCommon.view.set(document.getElementById('efficiencyTotal'),"innerHTML",total ? hours(total) + '<small>평균 가동</small>' : '-');
      MIQCommon.view.set(document.getElementById('top5List'),"innerHTML",data.top.length ? data.top.map(function (item) {
        var vehicle = item.vehicle;
        return '<li><span class="row"><a href="' + escapeHtml(detailHref(vehicle)) + '">' + escapeHtml(vehicle.vin) + '</a><span class="n">' + round1(item.work) + 'H</span></span></li>';
      }).join('') : '<li>조회 조건에 해당하는 차량이 없습니다.</li>');
    }

    function showChartTip(group, item, label, event) {
      var total = item.work + item.idle;
      var workRate = total ? item.work / total * 100 : 0;
      MIQCommon.view.set(chartTip,"innerHTML",'<b>' + escapeHtml(label) + '</b>'
        + '<div class="r"><i style="background:#ff3600"></i>작업시간<span>' + hours(item.work) + ' · ' + window.MIQCommon.numbers.integer(workRate) + '%</span></div>'
        + '<div class="r"><i style="background:#4d5359"></i>대기시간<span>' + hours(item.idle) + ' · ' + window.MIQCommon.numbers.integer((100 - workRate)) + '%</span></div>'
        + '<div class="r"><i style="background:transparent"></i>가동시간<span>' + hours(total) + '</span></div>');
      chartTip.style.display = 'block';
      group.classList.add('on');
      moveChartTip(group, event);
    }

    function moveChartTip(group, event) {
      var wrapBox = chartWrap.getBoundingClientRect();
      var groupBox = group.getBoundingClientRect();
      var clientX = event && event.clientX ? event.clientX : groupBox.left + groupBox.width / 2;
      var clientY = event && event.clientY ? event.clientY : groupBox.top;
      var x = clientX - wrapBox.left;
      var y = clientY - wrapBox.top;
      chartTip.style.left = Math.max(0, Math.min(wrapBox.width - 205, x + 12)) + 'px';
      chartTip.style.top = Math.max(0, y - 74) + 'px';
    }

    function hideChartTip(group) {
      group.classList.remove('on');
      chartTip.style.display = 'none';
    }

    function renderChart(data) {
      var width = Math.max(640, Math.round(chart.getBoundingClientRect().width) || chart.clientWidth || 960);
      var left = 48;
      var top = 18;
      var bottom = 264;
      var right = width - 12;
      var height = 300;
      MIQCommon.view.call(chart,"setAttribute",['viewBox','0 0 ' + width + ' ' + height]);
      var plottedIndexes = data.columns.reduce(function (indexes, column, index) {
        if (column) indexes.push(index);
        return indexes;
      }, []);
      var band = (right - left) / Math.max(1, plottedIndexes.length);
      var barWidth = Math.max(10, Math.min(32, band * .34));
      var svg = '';
      function y(rate) { return bottom - rate / 100 * (bottom - top); }
      function fixed(value) { return Math.round(value * 10) / 10; }
      for (var tick = 0; tick <= 100; tick += 20) {
        svg += '<line class="grid" x1="' + left + '" y1="' + fixed(y(tick)) + '" x2="' + right + '" y2="' + fixed(y(tick)) + '"/>'
          + '<text x="' + (left - 9) + '" y="' + fixed(y(tick) + 4) + '" text-anchor="end">' + tick + '%</text>';
      }
      svg += '<line class="axis" x1="' + left + '" y1="' + bottom + '" x2="' + right + '" y2="' + bottom + '"/>';
      plottedIndexes.forEach(function (index, visualIndex) {
        var column = data.columns[index];
        var center = left + band * (visualIndex + .5);
        var x = fixed(center - barWidth / 2);
        var total = column.work + column.idle;
        var workRate = total ? column.work / total * 100 : 0;
        var workHeight = fixed((bottom - top) * workRate / 100);
        var idleHeight = fixed((bottom - top) - workHeight);
        var label = data.labels[index] + ', 작업시간 ' + hours(column.work) + ', 대기시간 ' + hours(column.idle) + ', 운영효율 ' + window.MIQCommon.numbers.integer(workRate) + '퍼센트';
        svg += '<g class="col" tabindex="0" role="img" aria-label="' + escapeHtml(label) + '" data-index="' + index + '" style="--bar-delay:' + Math.min(180, visualIndex * 12) + 'ms">'
          + '<rect class="seg idle" x="' + x + '" y="' + top + '" width="' + fixed(barWidth) + '" height="' + idleHeight + '"/>'
          + '<rect class="seg work" x="' + x + '" y="' + fixed(top + idleHeight) + '" width="' + fixed(barWidth) + '" height="' + workHeight + '"/>'
          + '<rect class="hit" x="' + fixed(center - band / 2) + '" y="' + top + '" width="' + fixed(band) + '" height="' + (bottom - top) + '"/>'
          + '</g>';
        var axisLabel = MIQCharts.tickLabel(data.labels,index,right-left);
        if (axisLabel) svg += '<text x="' + fixed(center) + '" y="' + (bottom + 20) + '" text-anchor="middle">' + escapeHtml(axisLabel) + '</text>';
      });
      MIQCommon.view.set(chart,"innerHTML",svg);
      chart.classList.remove('is-animating');
      requestAnimationFrame(function () { chart.classList.add('is-animating'); });

      Array.prototype.forEach.call(chart.querySelectorAll('.col'), function (group) {
        var index = Number(MIQCommon.view.call(group,"getAttribute",['data-index']));
        var item = data.columns[index];
        group.addEventListener('mouseenter', function (event) { showChartTip(group, item, data.detailLabels[index], event); });
        group.addEventListener('mousemove', function (event) { moveChartTip(group, event); });
        group.addEventListener('mouseleave', function () { hideChartTip(group); });
        group.addEventListener('focus', function () { showChartTip(group, item, data.detailLabels[index]); });
        group.addEventListener('blur', function () { hideChartTip(group); });
        group.addEventListener('keydown', function (event) { if (event.key === 'Escape') { hideChartTip(group); group.blur(); } });
      });

      MIQCommon.view.set(tableBody,"innerHTML",data.columns.map(function (column, index) {
        if (!column) return '<tr><td>' + escapeHtml(data.labels[index]) + '</td><td class="r" colspan="4">집계 전</td></tr>';
        var total = column.work + column.idle;
        var rate = total ? column.work / total * 100 : 0;
        return '<tr><th scope="row">' + escapeHtml(data.labels[index]) + '</th><td class="r">' + hours(column.work) + '</td><td class="r">' + hours(column.idle) + '</td><td class="r">' + hours(total) + '</td><td class="r strong">' + (rate===null?'-':window.MIQCommon.numbers.integer(rate)+'%') + '</td></tr>';
      }).join(''));
    }

    /* 운영효율 B안: 각 행의 가동시간을 100%로 보고 작업·대기 구성비를 표시한다. */
    function renderDailyRows(data) {
      if (vehicleRowsView) {
        window.MIQVehicleEfficiency.render(data, {
          from: PERIOD[state.period].from, to: PERIOD[state.period].to,
          period: state.period, chart: chart, tableBody: tableBody, runningDisplay: runningDisplay
        });
        return;
      }
      var hasRows = state.rows.length > 0;
      var workTotal = 0;
      var runningTotal = 0;
      var dailyRows = data.columns.map(function (column, index) {
        if (!column || !hasRows) {
          return '<div class="efficiency-daily-row is-empty" role="img" aria-label="' + escapeHtml(data.labels[index]) + ', 집계 없음">'
            + '<strong class="efficiency-daily-row__date">' + escapeHtml(data.labels[index]) + '</strong>'
            + '<div class="efficiency-daily-track" aria-hidden="true"></div>'
            + '<span class="efficiency-daily-row__metrics">집계 없음</span></div>';
        }

        var work = Math.max(0, column.work);
        var idle = Math.max(0, column.idle);
        var percent = runningDisplay.percent(work, idle);
        workTotal += work;
        runningTotal += work + idle;
        var accessible = data.labels[index] + ', 가동시간 ' + runningDisplay.time(work + idle)
          + ', 작업시간 ' + runningDisplay.time(work) + ' (' + percent.workText + ')'
          + ', 대기시간 ' + runningDisplay.time(idle) + ' (' + percent.idleText + ')';
        return '<div class="efficiency-daily-row" tabindex="0" role="img" aria-label="' + escapeHtml(accessible) + '" data-index="' + index + '">'
          + '<strong class="efficiency-daily-row__date">' + escapeHtml(data.labels[index]) + '</strong>'
          + '<div class="efficiency-daily-track" aria-hidden="true">'
          + '<span class="efficiency-daily-segment is-work" style="width:' + percent.work.toFixed(4) + '%"></span>'
          + '<span class="efficiency-daily-segment is-idle" style="width:' + percent.idle.toFixed(4) + '%"></span></div>'
          + runningDisplay.metrics(work, idle) + '</div>';
      }).join('');

      MIQCommon.view.set(chart,"innerHTML",dailyRows);
      var selectedPeriod = document.getElementById('efficiencyDailyPeriod');
      var averageRate = document.getElementById('efficiencyDailyAverage');
      var actualWork = document.getElementById('efficiencyDailyWork');
      var axisLabel = document.getElementById('efficiencyDailyAxisLabel');
      if (selectedPeriod) MIQCommon.view.set(selectedPeriod,"textContent",fromInput.value + ' ~ ' + toInput.value);
      if (averageRate) MIQCommon.view.set(averageRate,"textContent",hasRows && runningTotal ? window.MIQCommon.numbers.integer((workTotal / runningTotal * 100)) + '%' : '-');
      if (actualWork) MIQCommon.view.set(actualWork,"textContent",hasRows && data.filled ? round1(workTotal) + 'H' : '-');
      if (axisLabel) MIQCommon.view.set(axisLabel,"textContent",state.period === 'd' ? '시간대' : state.period === 'c' ? '기간' : '일자');

      Array.prototype.forEach.call(chart.querySelectorAll('.efficiency-daily-row[data-index]'), function (row) {
        var index = Number(MIQCommon.view.call(row,"getAttribute",['data-index']));
        var item = data.columns[index];
        function show(event) {
          var percent = runningDisplay.percent(item.work, item.idle);
          MIQCommon.view.set(chartTip,"innerHTML",'<b>' + escapeHtml(data.detailLabels[index]) + '</b>'
            + '<div class="r">가동시간<span>' + runningDisplay.time(item.work + item.idle) + '</span></div>'
            + '<div class="r"><i style="background:#ff3600"></i>작업시간<span>' + runningDisplay.time(item.work) + ' · ' + percent.workText + '</span></div>'
            + '<div class="r"><i style="background:#4d5359"></i>대기시간<span>' + runningDisplay.time(item.idle) + ' · ' + percent.idleText + '</span></div>');
          chartTip.style.display = 'block';
          row.classList.add('on');
          moveChartTip(row, event);
        }
        row.addEventListener('mouseenter', show);
        row.addEventListener('mousemove', function (event) { moveChartTip(row, event); });
        row.addEventListener('mouseleave', function () { hideChartTip(row); });
        row.addEventListener('focus', function () { show(); });
        row.addEventListener('blur', function () { hideChartTip(row); });
        row.addEventListener('keydown', function (event) { if (event.key === 'Escape') { hideChartTip(row); row.blur(); } });
      });

      if (tableBody) {
        MIQCommon.view.set(tableBody,"innerHTML",data.columns.map(function (column, index) {
          if (!column || !hasRows) return '<tr><th scope="row">' + escapeHtml(data.labels[index]) + '</th><td class="r" colspan="3">집계 없음</td></tr>';
          var percent = runningDisplay.percent(column.work, column.idle);
          return '<tr><th scope="row">' + escapeHtml(data.labels[index]) + '</th><td class="r">' + runningDisplay.time(column.work + column.idle)
            + '</td><td class="r">' + runningDisplay.time(column.work) + ' (' + percent.workText + ')</td><td class="r">'
            + runningDisplay.time(column.idle) + ' (' + percent.idleText + ')</td></tr>';
        }).join(''));
      }
    }

    function applyDates() {
      if (MIQ.getAppliedPeriod()) return;
      fromInput.value = PERIOD[state.period].from;
      toInput.value = PERIOD[state.period].to;
      fromInput.readOnly = false;
      toInput.readOnly = false;
      fromInput.removeAttribute('readonly');
      toInput.removeAttribute('readonly');
    }

    function render() {
      applyDates();
      if(chartTip) chartTip.style.display='none';
      var data = build();
      if (!data) return;
      renderTop(data);
      if (dailyRowsView) renderDailyRows(data);
      else renderChart(data);
      var hint = state.period === 'd' ? '시간대별 대당 평균입니다.'
        : state.period === 'c' ? '설정 기간은 ' + (dayCount(parseDate(PERIOD[state.period].from), parseDate(PERIOD[state.period].to)) > 31 ? '주' : '일') + ' 단위로 표시합니다.'
          : '일자별 대당 평균입니다.';
      MIQCommon.view.set(document.getElementById('chartHint'),"textContent",vehicleRowsView
        ? '선택 기간의 차량별 누적 시간입니다. 행을 누르면 상세 항목을 확인할 수 있습니다.'
        : hint + ' 막대에 마우스를 올리거나 키보드로 초점을 이동하면 수치를 확인할 수 있습니다.');
      var hasUncollected = state.period === 'm' && data.filled < data.labels.length;
      if (chartUncollected) {
        chartUncollected.hidden = !hasUncollected;
        MIQCommon.view.set(chartUncollected,"textContent",hasUncollected
          ? data.labels[data.filled] + '–' + data.labels[data.labels.length - 1] + ' 집계 전'
          : '');
      }
      if (hasUncollected) MIQCommon.view.call(chart,"setAttribute",['aria-describedby','chartHint chartUncollected']);
      else MIQCommon.view.call(chart,"setAttribute",['aria-describedby','chartHint']);
      var scopeHost = document.getElementById('efficiencyScopeSummary');
      if (scopeHost && window.MIQ && typeof MIQ.renderScopeSummary === 'function') {
        var target = scopeContext || {
          scopeSegments: [
            { key: 'company', label: context.companyId === 'all' ? '전체 업체' : (state.rows[0] && state.rows[0].companyName || '선택 업체') },
            { key: 'group', label: context.group || '전체 그룹' },
            { key: 'type', label: context.type || '전체 분류' }
          ]
        };
        MIQ.renderScopeSummary(scopeHost, target, { countLabel: '차량', count: state.rows.length, countUnit: '대', includeVehicle: true });
      }
      context.period = state.period;
      setQuery({ companyId: context.companyId, group: context.group, type: context.type, veh: context.veh, period: state.period, from: PERIOD[state.period].from, to: PERIOD[state.period].to });
      syncContextLinks({ from: PERIOD[state.period].from, to: PERIOD[state.period].to });
    }

    function applyContextSelection() {
      state.rows = scopedRows(FLEET);
      state.label = [context.group, context.type, context.veh].filter(Boolean).join(' · ') || '전체차량';
      render();
    }

    document.getElementById('periodTabs').addEventListener('click', function (event) {
      if (this.closest('.finder, .filter-bar').__miqPeriodController) return;
      var button = event.target.closest('button[data-period]');
      if (!button) return;
      state.period = MIQCommon.view.call(button,"getAttribute",['data-period']);
      context.period = state.period;
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (item) { item.classList.toggle('active', item === button); });
      applyDates();
      if (state.period === 'c') {
        fromInput.focus();
        setFeedback('사용자설정 기간을 입력한 뒤 조회해 주세요. 최대 366일까지 조회할 수 있습니다.', false);
      } else {
        setFeedback(PERIOD[state.period].label + ' 기준으로 조회했습니다.', false);
        render();
      }
    });

    (document.getElementById('periodTabs').closest('.finder, .filter-bar') || document.getElementById('periodTabs')).addEventListener('miq:period-change', function (event) {
      var detail = event.detail || {};
      state.period = detail.period || state.period;
      if (!PERIOD[state.period]) state.period = 'm';
      PERIOD[state.period].from = detail.startDate || PERIOD[state.period].from;
      PERIOD[state.period].to = detail.endDate || PERIOD[state.period].to;
      context.period = state.period;
      render();
    });

    document.getElementById('btnSearch').addEventListener('click', function () {
      if (this.closest('.finder, .filter-bar').__miqPeriodController) return;
      if (state.period === 'c') {
        var range = validateRange(fromInput, toInput);
        if (!range) return;
        PERIOD.c.from = fromInput.value;
        PERIOD.c.to = toInput.value;
      }
      render();
      setFeedback(PERIOD[state.period].label + ' 기준으로 조회했습니다.', false);
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var data = build();
        if (data && dailyRowsView) renderDailyRows(data);
        else if (data) renderChart(data);
      }, 120);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#periodTabs button[data-period]'), function (button) {
      button.classList.toggle('active', MIQCommon.view.call(button,"getAttribute",['data-period']) === state.period);
    });
    applyDates();
    setupContextRefresh(null, applyContextSelection);
    if (!dailyRowsView) MIQCharts.observeSize(chart, function(){var data=build();if(data)renderChart(data);});
    render();
  }

  function initUsage() {
    var fromInput = document.getElementById('usageFrom');
    var toInput = document.getElementById('usageTo');
    var calendar = document.querySelector('.cal');
    var tooltip = makeTooltip();
    var state = {
      period: ['d', 'w', 'm', 'c'].indexOf(requestedPeriod) >= 0 ? requestedPeriod : 'm',
      year: 2026,
      month: 5,
      selection: null,
      rows: scopedRows(FLEET),
      view: 'calendar'
    };
    context.period = state.period;
    if (QUERY.get('from')) {
      var requestedFrom = parseDate(QUERY.get('from'));
      if (requestedFrom) { state.year = requestedFrom.getFullYear(); state.month = requestedFrom.getMonth(); }
    }

    var cells = Array.prototype.slice.call(calendar.querySelectorAll('.cal__day'));
    var records = [];
    var baseSummary = [115.4, 37.1, 24.6, 152.5, 86.6, 75.7];
    var baseDelta = Array.prototype.map.call(document.querySelectorAll('.box.total .cell__d'), function (element) { return MIQCommon.view.get(element,"innerHTML"); });
    var baseDeltaShort = Array.prototype.map.call(document.querySelectorAll('.box.total .cell__d'), function (element) {
      return MIQCommon.view.get(element,"textContent").replace(/\s*\([^)]*\)\s*/, '').trim();
    });
    var summaryCells = Array.prototype.slice.call(document.querySelectorAll('.box.total .stat-cells > .cell'));

    function minutesFromPercent(percent) { return Math.round((percent || 0) / 100 * 480); }
    function formatMinutes(minutes) {
      minutes = Math.max(0, Math.round(minutes || 0));
      return Math.floor(minutes / 60) + ':' + pad(minutes % 60);
    }
    function numberFromWidth(segment) {
      if (!segment) return 0;
      var match = (MIQCommon.view.call(segment,"getAttribute",['style']) || '').match(/width\s*:\s*([\d.]+)%/i);
      return match ? Number(match[1]) : 0;
    }
    function dayNumber(cell) {
      var dateElement = cell.querySelector('.cal__d');
      var match = dateElement && MIQCommon.view.get(dateElement,"textContent").match(/\d+/);
      return match ? Number(match[0]) : null;
    }
    function cellRecord(cell) {
      var day = dayNumber(cell);
      if (!day) return null;
      var bar = cell.querySelector('.cal__bar');
      var work = minutesFromPercent(numberFromWidth(bar && bar.querySelector('.work')));
      var idle = minutesFromPercent(numberFromWidth(bar && bar.querySelector('.idle')));
      var off = minutesFromPercent(numberFromWidth(bar && bar.querySelector('.off')));
      var rateElement = cell.querySelector('.cal__rate');
      var rateMatch = rateElement && MIQCommon.view.get(rateElement,"textContent").match(/[\d.]+/);
      var status = Array.prototype.map.call(cell.querySelectorAll('.flag'), function (flag) { return MIQCommon.view.call(flag,"getAttribute",['title']) || MIQCommon.view.get(flag,"textContent").trim(); }).join(' · ');
      return { cell: cell, day: day, work: work, idle: idle, off: off, rate: rateMatch ? Number(rateMatch[0]) : null, status: status || (cell.classList.contains('void') ? '휴무' : '정상') };
    }
    cells.forEach(function (cell) {
      var record = cellRecord(cell);
      if (record) records.push(record);
    });

    function currentDate(day) { return new Date(state.year, state.month, day); }
    function currentIso(day) { return isoDate(currentDate(day)); }
    function lastDay() { return new Date(state.year, state.month + 1, 0).getDate(); }
    function monthRange() { return { from: new Date(state.year, state.month, 1), to: new Date(state.year, state.month, lastDay()) }; }

    function periodRange(period) {
      var endOfMonth = lastDay();
      if (period === 'd') {
        var day = Math.min(16, endOfMonth);
        return { from: currentDate(day), to: currentDate(day) };
      }
      if (period === 'w') {
        var weekFrom = Math.min(15, Math.max(1, endOfMonth - 6));
        return { from: currentDate(weekFrom), to: currentDate(Math.min(endOfMonth, weekFrom + 6)) };
      }
      if (period === 'c') {
        var customFrom = parseDate(QUERY.get('from')) || parseDate(fromInput.value) || monthRange().from;
        var customTo = parseDate(QUERY.get('to')) || parseDate(toInput.value) || monthRange().to;
        return { from: customFrom, to: customTo };
      }
      return monthRange();
    }

    function setRange(range) {
      fromInput.value = isoDate(range.from);
      toInput.value = isoDate(range.to);
      fromInput.readOnly = state.period !== 'c';
      toInput.readOnly = state.period !== 'c';
    }

    function inCurrentRange(record) {
      var date = currentDate(record.day);
      var from = parseDate(fromInput.value);
      var to = parseDate(toInput.value);
      return from && to && date >= from && date <= to;
    }

    function activeRecords() {
      return records.filter(function (record) {
        return inCurrentRange(record) && !record.cell.classList.contains('void') && !record.cell.classList.contains('holiday');
      });
    }

    function summaryLabel() {
      var from = parseDate(fromInput.value);
      var to = parseDate(toInput.value);
      if (!from || !to) return '사용시간 요약';
      if (state.period === 'd') return from.getFullYear() + '년 ' + (from.getMonth() + 1) + '월 ' + from.getDate() + '일 요약';
      if (state.period === 'm' && from.getMonth() === to.getMonth()) return from.getFullYear() + '년 ' + (from.getMonth() + 1) + '월 요약';
      return (from.getMonth() + 1) + '월 ' + from.getDate() + '일 ~ ' + (to.getMonth() + 1) + '월 ' + to.getDate() + '일 요약';
    }

    function renderSummary() {
      var active = activeRecords();
      var all = records.filter(function (record) { return !record.cell.classList.contains('void') && !record.cell.classList.contains('holiday'); });
      var factor = all.length ? active.length / all.length : 0;
      var scopedCount = state.rows.length;
      MIQCommon.view.set(document.getElementById('usageSummaryTitle'),"textContent",summaryLabel());
      MIQCommon.view.set(document.getElementById('usageBasisBadge'),"textContent",state.selection && state.selection.vehicle ? '해당 차량' : '대당 평균');
      MIQCommon.view.set(document.getElementById('usageSummaryMeta'),"textContent",'근무일 ' + active.length + '일 · 계획 ' + Math.round(active.length * 8) + 'H · 차량 ' + scopedCount + '대');
      summaryCells.forEach(function (cell, index) {
        var valueElement = cell.querySelector('.cell__v');
        var deltaElement = cell.querySelector('.cell__d');
        if (!valueElement) return;
        var value = index < 4 ? baseSummary[index] * factor : baseSummary[index];
        MIQCommon.view.set(valueElement,"innerHTML",window.MIQCommon.numbers.integer(value) + '<small>' + (index < 4 ? 'H' : '%') + '</small>');
        if (deltaElement) MIQCommon.view.set(deltaElement,"innerHTML",state.period === 'm' ? baseDelta[index] : escapeHtml(baseDeltaShort[index]) + ' <span class="miq-sr-only">이전 기간 대비</span>');
      });
    }

    function recordLabel(record) {
      var pieces = [currentIso(record.day), '작업 ' + formatMinutes(record.work), '대기 ' + formatMinutes(record.idle), '미사용 ' + formatMinutes(record.off)];
      if (record.rate !== null) pieces.push('운영률 ' + window.MIQCommon.numbers.integer(record.rate) + '%');
      if (record.status && record.status !== '정상') pieces.push(record.status);
      return pieces.join(', ');
    }

    function showTooltip(record) {
      MIQCommon.view.set(tooltip,"textContent",recordLabel(record));
      tooltip.hidden = false;
      positionTooltip(tooltip, record.cell.getBoundingClientRect());
    }

    function hideTooltip() { tooltip.hidden = true; }

    function updateModal(record) {
      var modal = document.getElementById('dayModal');
      var date = currentDate(record.day);
      var weekdays = ['일', '월', '화', '수', '목', '금', '토'];
      MIQCommon.view.set(modal.querySelector('.modal__title'),"textContent",isoDate(date) + ' (' + weekdays[date.getDay()] + ') 사용시간 상세');
      var values = modal.querySelectorAll('.stat-cells .cell__v');
      if (values.length >= 5) {
        MIQCommon.view.set(values[0],"textContent",formatMinutes(record.work));
        MIQCommon.view.set(values[1],"textContent",formatMinutes(record.idle));
        MIQCommon.view.set(values[2],"textContent",formatMinutes(record.off));
        MIQCommon.view.set(values[3],"innerHTML",(record.rate === null ? '-' : window.MIQCommon.numbers.integer(record.rate)) + (record.rate === null ? '' : '<small>%</small>'));
        var shockMatch = (record.status || '').match(/충격\s*(\d+)건/);
        MIQCommon.view.set(values[4],"textContent",shockMatch ? shockMatch[1] : '0');
      }
      MIQCommon.view.set(document.getElementById('usageBasisBadge'),"textContent",state.selection && state.selection.vehicle ? '해당 차량' : '대당 평균');
      document.getElementById('dayModal').dataset.day = String(record.day);
      MIQCommon.view.set(document.querySelector('#dayModal .modal__body .sub-head .tail'),"textContent",state.rows.length + '대 중 상위 ' + Math.min(6, state.rows.length) + '대');
      MIQCommon.view.call(document.getElementById('usageBasisBadge'),"setAttribute",['title',state.selection && state.selection.vehicle ? state.selection.vehicle.vin : '선택 범위의 대당 평균']);
      document.getElementById('dayModal').querySelector('.modal__foot .btn--pri').href = contextualHref('../Operational%20Efficiency/operational-efficiency-tobe-option-b.html', { period: 'd', from: isoDate(date), to: isoDate(date) });
      var modalRows = state.rows.slice(0, 6);
      var shockTotal = shockMatch ? Number(shockMatch[1]) : 0;
      MIQCommon.view.set(modal.querySelector('tbody'),"innerHTML",modalRows.length ? modalRows.map(function (vehicle, index) {
        var ratio = modalRows.length === 1 ? 1 : .86 + unitFromKey(vehicle.vin + isoDate(date)) * .28;
        var work = Math.round(record.work * ratio);
        var idle = Math.round(record.idle * (1.06 - (ratio - .86) * .35));
        var off = Math.max(0, 480 - work - idle);
        var rate = (work + idle) / 480 * 100;
        var shock = shockTotal && index < shockTotal ? 1 : 0;
        return '<tr><td class="strong"><a class="metrics-vehicle-link" href="' + escapeHtml(detailHref(vehicle)) + '">' + escapeHtml(vehicle.model) + ' <span class="mute">' + escapeHtml(vehicle.vin) + '</span></a></td>'
          + '<td>' + escapeHtml(vehicle.type) + '</td><td class="r">' + formatMinutes(work) + '</td><td class="r">' + formatMinutes(idle) + '</td>'
          + '<td class="r">' + formatMinutes(off) + '</td><td class="r strong">' + window.MIQCommon.numbers.integer(rate) + '%</td><td class="c' + (shock ? ' strong' : ' mute') + '">' + shock + '</td></tr>';
      }).join('') : '<tr><td colspan="7">선택한 조건에 해당하는 차량이 없습니다.</td></tr>');
    }

    function renderTable() {
      var tableRows = records.filter(inCurrentRange);
      MIQCommon.view.set(document.getElementById('usageTableBody'),"innerHTML",tableRows.length ? tableRows.map(function (record) {
        return '<tr><th scope="row">' + currentIso(record.day) + '</th><td class="r">' + formatMinutes(record.work) + '</td><td class="r">' + formatMinutes(record.idle) + '</td><td class="r">' + formatMinutes(record.off) + '</td><td class="r strong">' + (record.rate === null ? '-' : window.MIQCommon.numbers.integer(record.rate) + '%') + '</td><td>' + escapeHtml(record.status) + '</td></tr>';
      }).join('') : '<tr><td colspan="6">선택한 기간에 표시할 데이터가 없습니다.</td></tr>');
    }

    function renderCalendarState() {
      records.forEach(function (record) {
        var enabled = inCurrentRange(record);
        record.cell.classList.toggle('is-outside-range', !enabled);
        if (!record.cell.classList.contains('void')) {
          record.cell.tabIndex = enabled ? 0 : -1;
          MIQCommon.view.call(record.cell,"setAttribute",['role','button']);
          MIQCommon.view.call(record.cell,"setAttribute",['aria-label',recordLabel(record) + '. 상세 보기']);
          MIQCommon.view.call(record.cell,"setAttribute",['aria-disabled',enabled ? 'false' : 'true']);
        }
      });
      calendar.classList.remove('is-animating');
      requestAnimationFrame(function () { calendar.classList.add('is-animating'); });
      Array.prototype.forEach.call(document.querySelectorAll('.stack-chart'), function (chart) {
        chart.classList.remove('is-animating');
        requestAnimationFrame(function () { chart.classList.add('is-animating'); });
      });
    }

    function updateMonthLabels() {
      MIQCommon.view.set(document.getElementById('usageMonthLabel'),"textContent",state.year + '-' + pad(state.month + 1));
    }

    function render() {
      updateMonthLabels();
      renderCalendarState();
      renderSummary();
      renderTable();
      var selected = state.selection && state.selection.vehicle;
      var label = selected ? selected.model + ' · ' + selected.vin : (state.selection && state.selection.label && state.selection.label !== '전체' ? state.selection.label : '전체차량');
      Array.prototype.forEach.call(document.querySelectorAll('[data-lnb-label]'), function (element) { MIQCommon.view.set(element,"textContent",'- ' + label); });
      context.period = state.period;
      setQuery({ companyId: context.companyId, group: context.group, type: context.type, veh: context.veh, period: state.period, from: state.period === 'c' ? fromInput.value : null, to: state.period === 'c' ? toInput.value : null });
      syncContextLinks(state.period === 'c' ? { from: fromInput.value, to: toInput.value } : { from: null, to: null });
    }

    records.forEach(function (record) {
      if (record.cell.classList.contains('void')) return;
      record.cell.addEventListener('mouseenter', function () { if (inCurrentRange(record)) showTooltip(record); });
      record.cell.addEventListener('mouseleave', hideTooltip);
      record.cell.addEventListener('focus', function () { if (inCurrentRange(record)) showTooltip(record); });
      record.cell.addEventListener('blur', hideTooltip);
      record.cell.addEventListener('click', function (event) {
        if (!inCurrentRange(record)) { event.preventDefault(); event.stopPropagation(); return; }
        updateModal(record);
      });
      record.cell.addEventListener('keydown', function (event) {
        if ((event.key === 'Enter' || event.key === ' ') && inCurrentRange(record)) {
          event.preventDefault();
          updateModal(record);
          record.cell.click();
        } else if (event.key === 'Escape') {
          hideTooltip();
          record.cell.blur();
        }
      });
    });

    Array.prototype.forEach.call(document.querySelectorAll('.box.total .tip'), function (tip, index) {
      var description = tip.querySelector('.tip__box');
      if (!description) return;
      description.id = 'usageFormulaTip' + index;
      tip.tabIndex = 0;
      MIQCommon.view.call(tip,"setAttribute",['role','button']);
      MIQCommon.view.call(tip,"setAttribute",['aria-label',MIQCommon.view.get(description,"textContent").trim()]);
      MIQCommon.view.call(tip,"setAttribute",['aria-describedby',description.id]);
    });

    Array.prototype.forEach.call(document.querySelectorAll('#dayModal tbody tr'), function (row) {
      var identity = row.querySelector('td.strong');
      var vinElement = identity && identity.querySelector('.mute');
      var vin = vinElement && MIQCommon.view.get(vinElement,"textContent").trim();
      var vehicle = vehicleByVin(vin);
      if (!identity || !vehicle) return;
      var modelText = identity.childNodes[0] ? identity.childNodes[0].nodeValue.trim() : vehicle.model;
      MIQCommon.view.set(identity,"innerHTML",'<a class="metrics-vehicle-link" href="' + escapeHtml(detailHref(vehicle)) + '">' + escapeHtml(modelText || vehicle.model) + ' <span class="mute">' + escapeHtml(vehicle.vin) + '</span></a>');
    });

    document.getElementById('usageViewTabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-usage-view]');
      if (!button) return;
      state.view = MIQCommon.view.call(button,"getAttribute",['data-usage-view']);
      Array.prototype.forEach.call(this.querySelectorAll('[data-usage-view]'), function (item) {
        var active = item === button;
        item.classList.toggle('active', active);
        MIQCommon.view.call(item,"setAttribute",['aria-selected',active ? 'true' : 'false']);
      });
      document.getElementById('usageCalendarPane').hidden = state.view !== 'calendar';
      document.getElementById('usageTablePane').hidden = state.view !== 'table';
      setFeedback(state.view === 'calendar' ? '캘린더 보기로 전환했습니다.' : '일자별 표 보기로 전환했습니다.', false);
    });

    document.getElementById('usagePeriodTabs').addEventListener('click', function (event) {
      var button = event.target.closest('button[data-period]');
      if (!button) return;
      state.period = MIQCommon.view.call(button,"getAttribute",['data-period']);
      context.period = state.period;
      Array.prototype.forEach.call(this.querySelectorAll('button'), function (item) { item.classList.toggle('active', item === button); });
      setRange(periodRange(state.period));
      if (state.period === 'c') {
        fromInput.focus();
        setFeedback('사용자설정 기간을 입력한 뒤 조회해 주세요. 최대 366일까지 조회할 수 있습니다.', false);
      } else {
        render();
        setFeedback(MIQCommon.view.get(button,"textContent").trim() + ' 기준으로 조회했습니다.', false);
      }
    });

    document.getElementById('usageSearch').addEventListener('click', function () {
      var range = validateRange(fromInput, toInput);
      if (!range) return;
      render();
      setFeedback('선택한 기간으로 조회했습니다.', false);
    });

    function moveMonth(delta) {
      state.month += delta;
      if (state.month < 0) { state.month = 11; state.year -= 1; }
      if (state.month > 11) { state.month = 0; state.year += 1; }
      setRange(periodRange(state.period === 'c' ? 'm' : state.period));
      render();
      setFeedback(MIQCommon.view.get(document.getElementById('usageMonthLabel'),"textContent") + ' 데이터를 표시합니다.', false);
    }
    document.getElementById('usagePrevMonth').addEventListener('click', function () { moveMonth(-1); });
    document.getElementById('usageNextMonth').addEventListener('click', function () { moveMonth(1); });

    document.getElementById('usageExport').addEventListener('click', function () {
      var rows = records.filter(inCurrentRange);
      var csv = ['일자,작업시간,대기시간,미사용시간,운영률,상태'].concat(rows.map(function (record) {
        return [currentIso(record.day), formatMinutes(record.work), formatMinutes(record.idle), formatMinutes(record.off), record.rate === null ? '' : window.MIQCommon.numbers.integer(record.rate) + '%', '"' + String(record.status).replace(/"/g, '""') + '"'].join(',');
      })).join('\r\n');
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      var href = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = href;
      link.download = 'machine-iq-usage-time-' + fromInput.value + '-' + toInput.value + '.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
      setFeedback('현재 조회 결과를 CSV로 내보냈습니다.', false);
    });

    var comparison = document.querySelector('#usageFilter input[type="checkbox"]');
    if (comparison) comparison.addEventListener('change', function () {
      body.classList.toggle('hide-period-comparison', !comparison.checked);
      setFeedback(comparison.checked ? '전월 대비 값을 표시합니다.' : '전월 대비 값을 숨겼습니다.', false);
    });

    var tree = MIQ.lnbTree(document.getElementById('lnb'), {
      vehicles: FLEET,
      group: context.group,
      type: context.type,
      vin: vehicleByVin(context.veh) ? context.veh : null,
      hint: '조회 대상은 상단 선택과 함께 적용되며, 사용시간 요약도 같은 차량 범위를 사용합니다.',
      onChange: function (selection) {
        state.selection = selection;
        state.rows = scopedRows(selection.vehicles);
        context.group = selection.group;
        context.type = selection.type;
        context.veh = selection.vin;
        render();
      }
    });
    state.selection = tree.get();

    Array.prototype.forEach.call(document.querySelectorAll('#usagePeriodTabs button[data-period]'), function (button) {
      button.classList.toggle('active', MIQCommon.view.call(button,"getAttribute",['data-period']) === state.period);
    });
    setRange(periodRange(state.period));
    setupContextRefresh(tree, render);
    render();
  }

  if (PAGE === 'efficiency') initEfficiency();
  else if (PAGE === 'usage') initUsage();
})();
