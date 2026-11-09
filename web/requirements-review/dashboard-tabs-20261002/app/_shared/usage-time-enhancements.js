(function () {
  'use strict';

  var body = document.body;
  if (!body || !body.classList.contains('miq-usage-time')) return;

  var QUERY = new URLSearchParams(location.search);
  var FLEET = window.MIQ && Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length ? MIQ.FLEET_CATALOG : window.MIQ && MIQ.FLEET ? MIQ.FLEET : [];
  var MIN_OPERATING_MINUTES = 30;
  var monthRules = window.MIQUsageMonth;
  var TODAY = monthRules.today(new Date());
  var monthInput = document.getElementById('usageMonth');
  var WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  var feedback = document.getElementById('metricsFeedback');
  var scopeContext = window.MIQ_TARGET_CONTEXT || null;
  var context = {
    companyId: QUERY.get('companyId') || 'all',
    group: QUERY.get('group') || null,
    type: QUERY.get('type') || null,
    veh: QUERY.get('veh') || QUERY.get('equipmentId') || null
  };
  function inSelectedCompany(vehicle) {
    return !context.companyId || context.companyId === 'all' || String(vehicle.companyId || '1933') === String(context.companyId);
  }
  var initialRange = monthRules.range(monthRules.initial(QUERY, TODAY));
  var state = {
    year: initialRange.year,
    month: initialRange.month,
    period: 'm',
    from: initialRange.from,
    to: initialRange.to,
    rows: FLEET,
    label: '전체차량',
    selection: null
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function pad(value) { return value < 10 ? '0' + value : String(value); }

  function isoDate(year, month, day) {
    return year + '-' + pad(month) + '-' + pad(day);
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    if (date.getFullYear() !== parts[0] || date.getMonth() !== parts[1] - 1 || date.getDate() !== parts[2]) return null;
    return date;
  }

  function monthLastDay(year, month) { return new Date(year, month, 0).getDate(); }

  function addDays(date, amount) {
    var value = new Date(date.getTime());
    value.setDate(value.getDate() + amount);
    return value;
  }

  function setFeedback(message, isError) {
    if (!feedback) return;
    MIQCommon.view.set(feedback,"textContent",message || '');
    feedback.classList.toggle('is-error', !!isError);
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
      period: state.period,
      from: state.from,
      to: state.to
    };
    Object.keys(extra || {}).forEach(function (key) { values[key] = extra[key]; });
    Object.keys(values).forEach(function (key) {
      var value = values[key];
      if (value === null || value === undefined || value === '') url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    return url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
  }

  function syncContextLinks() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-context-link]'), function (link) {
      if (link.hasAttribute('data-miq-side-sub')) return;
      var source = MIQCommon.view.call(link,"getAttribute",['href']);
      if (!source || /^#|^javascript:/i.test(source)) return;
      link.href = contextualHref(source);
    });
  }

  function isUncollected(year, month, day) {
    return monthRules.status(isoDate(year, month, day), TODAY) !== 'collected';
  }

  function vehicleDay(vehicle, year, month, day) {
    var date=isoDate(year,month,day),value=MIQObservations.aggregate(vehicle,date,date,TODAY);
    return value.known?{vehicle:vehicle,work:value.workMinutes,distance:value.distanceKm}:null;
  }
  function dayAggregate(year, month, day) {
    if (isUncollected(year, month, day)) return null;
    var rows=state.rows.map(function(vehicle){return vehicleDay(vehicle,year,month,day);}).filter(Boolean);
    if(!rows.length)return null;
    var aggregate={rows:rows,work:0,distance:0,operating:0};
    rows.forEach(function(row){aggregate.work+=row.work;aggregate.distance+=row.distance;if(row.work>=MIN_OPERATING_MINUTES)aggregate.operating++;});
    return aggregate;
  }

  function formatMinutesHtml(minutes) {
    minutes = Math.max(0, Math.round(minutes || 0));
    return Math.floor(minutes / 60).toLocaleString() + '<small>H</small> ' + pad(minutes % 60) + '<small>M</small>';
  }

  function formatMinutesText(minutes) {
    minutes = Math.max(0, Math.round(minutes || 0));
    return Math.floor(minutes / 60).toLocaleString() + 'H ' + pad(minutes % 60) + 'M';
  }

  function formatDistanceHtml(distance) {
    return Math.round(distance || 0).toLocaleString() + '<small>km</small>';
  }

  function formatDistanceText(distance) {
    return Math.round(distance || 0).toLocaleString() + 'km';
  }

  function aggregateRange() {
    var totals = { work: 0, distance: 0, operating: 0, operatingDays: 0, collectedDays: 0, records: [] };
    var cursor = parseDate(state.from);
    var end = parseDate(state.to);
    if (!cursor || !end) return totals;
    while (cursor <= end) {
      var year = cursor.getFullYear();
      var month = cursor.getMonth() + 1;
      var day = cursor.getDate();
      var aggregate = dayAggregate(year, month, day);
      if (aggregate) {
        totals.work += aggregate.work;
        totals.distance += aggregate.distance;
        totals.operating += aggregate.operating;
        totals.collectedDays++;
        if (aggregate.operating > 0) totals.operatingDays++;
        totals.records.push({ year: year, month: month, day: day, aggregate: aggregate });
      }
      cursor = addDays(cursor, 1);
    }
    return totals;
  }

  function renderCalendar(totals) {
    var firstWeekday = new Date(state.year, state.month - 1, 1).getDay();
    var lastDay = monthLastDay(state.year, state.month);
    var html = '';

    WEEKDAYS.forEach(function (weekday, index) {
      html += '<div class="cal__dow' + (index === 0 ? ' sun' : index === 6 ? ' sat' : '') + '">' + weekday + '</div>';
    });
    for (var blank = 0; blank < firstWeekday; blank++) html += '<div class="cal__day void" aria-hidden="true"></div>';

    for (var day = 1; day <= lastDay; day++) {
      var weekdayIndex = new Date(state.year, state.month - 1, day).getDay();
      var date = isoDate(state.year, state.month, day);
      var status = monthRules.status(date, TODAY);
      var aggregate = dayAggregate(state.year, state.month, day);
      var dayClass = weekdayIndex === 0 ? ' sun' : weekdayIndex === 6 ? ' sat' : '';
      var cellClass = 'cal__day';
      if (status !== 'collected') cellClass += ' is-' + status;
      if (date === TODAY) cellClass += ' today';
      html += '<div class="' + cellClass + '" data-date="' + date + '" data-status="' + status + '"' + (aggregate ? ' data-day="' + day + '" role="button" tabindex="0"' : '') + '>';
      html += '<div class="cal__d' + dayClass + '">' + day + '</div>';
      if (!aggregate) {
        html += '<div class="empty">' + monthRules.label(status) + '</div>';
      } else {
        html += '<div class="ct' + (aggregate.work === 0 ? ' zero' : '') + '">';
        html += '<div class="ct__row work"><span class="ct__k">작업시간</span><span class="ct__v">' + formatMinutesHtml(aggregate.work) + '</span></div>';
        html += '<div class="ct__row"><span class="ct__k">이동거리</span><span class="ct__v">' + formatDistanceHtml(aggregate.distance) + '</span></div>';
        html += '<div class="ct__row"><span class="ct__k">운영 장비 수</span><span class="ct__v">' + aggregate.operating + '<small>대</small></span></div>';
        html += '</div>';
      }
      html += '</div>';
    }

    var trailing = (7 - (firstWeekday + lastDay) % 7) % 7;
    for (var tail = 0; tail < trailing; tail++) html += '<div class="cal__day void" aria-hidden="true"></div>';

    var calendar = document.getElementById('usageCalendar');
    MIQCommon.view.set(calendar,"innerHTML",html);
    Array.prototype.forEach.call(calendar.querySelectorAll('.cal__day[data-day]'), function (cell) {
      var day = Number(MIQCommon.view.call(cell,"getAttribute",['data-day']));
      var record = totals.records.filter(function (item) {
        return item.year === state.year && item.month === state.month && item.day === day;
      })[0];
      if (!record) return;
      var label = isoDate(state.year, state.month, day) + ', 총 작업시간 ' + formatMinutesText(record.aggregate.work)
        + ', 총 이동거리 ' + formatDistanceText(record.aggregate.distance) + ', 운영 장비 ' + record.aggregate.operating + '대. 상세 보기';
      MIQCommon.view.call(cell,"setAttribute",['aria-label',label]);
      MIQCommon.view.call(cell,"setAttribute",['data-chart-tip',label]);
      cell.addEventListener('click', function () { openDay(day, record.aggregate); });
      cell.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDay(day, record.aggregate);
        }
      });
    });
    if (window.MIQCharts) MIQCharts.bind(calendar);
  }

  function renderSummary(totals) {
    var from = parseDate(state.from);
    var to = parseDate(state.to);
    MIQCommon.view.set(document.getElementById('usageSummaryTitle'),"textContent",state.year + '년 ' + state.month + '월 요약');
    MIQCommon.view.set(document.getElementById('usageSumWork'),"innerHTML",totals.collectedDays ? formatMinutesHtml(totals.work) : '-');
    MIQCommon.view.set(document.getElementById('usageSumDistance'),"innerHTML",totals.collectedDays ? formatDistanceHtml(totals.distance) : '-');
    var averageOperating = totals.operatingDays ? Math.round(totals.operating / totals.operatingDays * 10) / 10 : 0;
    MIQCommon.view.set(document.getElementById('usageSumOperating'),"innerHTML",totals.collectedDays ? window.MIQCommon.numbers.integer(averageOperating, true) + '<small>대</small>' : '-');
    var selectedDays = Math.round((to - from) / 86400000) + 1;
    var pendingDays = TODAY >= state.from && TODAY <= state.to ? 1 : 0;
    var futureDays = selectedDays - totals.collectedDays - pendingDays;
    var meta = '조회 월 ' + selectedDays + '일 · 집계 완료 ' + totals.collectedDays + '일';
    if (pendingDays) meta += ' · 집계 전 ' + pendingDays + '일';
    if (futureDays) meta += ' · 미도래 ' + futureDays + '일';
    MIQCommon.view.set(document.getElementById('usageSummaryMeta'),"textContent",meta);
  }

  function vehicleDetailHref(vehicle, day) {
    return contextualHref('../Vehicle%20Detail/vehicle-detail-tobe.html', {
      veh: vehicle.vin,
      group: vehicle.group,
      type: vehicle.type,
      period: 'd',
      from: isoDate(state.year, state.month, day),
      to: isoDate(state.year, state.month, day)
    });
  }

  var activeDay,activeDayAggregate;
  var dayPager=MIQ.createListPager(document.getElementById('usageDayRows').closest('.tbl-wrap'),{pageSize:20,onChange:function(){openDay(activeDay,activeDayAggregate)}});
  function openDay(day, aggregate) {
    activeDay=day;activeDayAggregate=aggregate;
    var weekday = WEEKDAYS[new Date(state.year, state.month - 1, day).getDay()];
    MIQCommon.view.set(document.getElementById('dayModalTitle'),"textContent",isoDate(state.year, state.month, day) + ' (' + weekday + ') 운행시간 상세');
    MIQCommon.view.set(document.getElementById('usageDaySummary'),"innerHTML",'<div class="cell"><div class="cell__v">' + formatMinutesHtml(aggregate.work) + '</div><div class="cell__k">총 작업시간</div></div>'
      + '<div class="cell"><div class="cell__v">' + formatDistanceHtml(aggregate.distance) + '</div><div class="cell__k">총 이동거리</div></div>'
      + '<div class="cell hl"><div class="cell__v">' + aggregate.operating + '<small>대</small></div><div class="cell__k">운영 장비 수 (30분 이상)</div></div>');
    MIQCommon.view.set(document.getElementById('usageDayMeta'),"textContent",state.rows.length + '대 중 운영 ' + aggregate.operating + '대 · 작업시간 내림차순');
    MIQCommon.view.set(document.getElementById('usageDayRows'),"innerHTML",dayPager.slice(aggregate.rows.slice().sort(function (left, right) { return right.work - left.work; }),String(day)).map(function (row) {
      var operating = row.work >= MIN_OPERATING_MINUTES;
      return '<tr><td class="strong"><a class="metrics-vehicle-link" href="' + escapeHtml(vehicleDetailHref(row.vehicle, day)) + '">' + escapeHtml(row.vehicle.vin)
        + ' <span class="mute">' + escapeHtml(row.vehicle.model) + '</span></a></td><td>' + escapeHtml(row.vehicle.type) + '</td><td class="mute">' + escapeHtml(row.vehicle.group) + '</td>'
        + '<td class="r ' + (operating ? 'strong' : 'mute') + '">' + formatMinutesText(row.work) + '</td><td class="r ' + (operating ? '' : 'mute') + '">' + formatDistanceText(row.distance) + '</td>'
        + '<td class="c"><span class="usage-status' + (operating ? ' is-operating' : '') + '">' + (operating ? '운영' : '미운영') + '</span></td></tr>';
    }).join(''));
    document.getElementById('dayEfficiencyLink').href = contextualHref('../Operational%20Efficiency/operational-efficiency-tobe-option-b.html', {
      period: 'd',
      from: isoDate(state.year, state.month, day),
      to: isoDate(state.year, state.month, day)
    });
    document.getElementById('dayModal').classList.add('open');
  }

  function updateLocation() {
    setQuery({
      companyId: context.companyId,
      group: context.group,
      type: context.type,
      veh: context.veh,
      period: state.period,
      month: state.from.slice(0, 7),
      from: state.from,
      to: state.to
    });
    syncContextLinks();
  }

  function render() {
    var rangeEnd = parseDate(state.to);
    state.year = rangeEnd.getFullYear();
    state.month = rangeEnd.getMonth() + 1;
    var totals = aggregateRange();
    renderCalendar(totals);
    renderSummary(totals);
    var scopeHost = document.getElementById('usageScopeSummary');
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
    updateLocation();
  }

  function applyContextSelection() {
    var selectedRows = FLEET.filter(function (vehicle) {
      if (!inSelectedCompany(vehicle)) return false;
      if (context.group && vehicle.group !== context.group) return false;
      if (context.type && vehicle.type !== context.type) return false;
      if (context.veh && vehicle.vin !== context.veh) return false;
      return true;
    });
    state.rows = selectedRows;
    state.label = ([context.group, context.type, context.veh].filter(Boolean).join(' · ') || '전체차량');
    render();
  }

  function exportCsv() {
    var rows = ['일자,총 작업시간,총 이동거리,운영 장비 수,수집 상태'];
    var cursor = parseDate(state.from);
    var end = parseDate(state.to);
    while (cursor && end && cursor <= end) {
      var year = cursor.getFullYear();
      var month = cursor.getMonth() + 1;
      var day = cursor.getDate();
      var aggregate = dayAggregate(year, month, day);
      if (!aggregate) {
        rows.push([isoDate(year, month, day), '', '', '', monthRules.label(monthRules.status(isoDate(year, month, day), TODAY))].join(','));
      } else {
        rows.push([isoDate(year, month, day), formatMinutesText(aggregate.work), Math.round(aggregate.distance) + 'km', aggregate.operating, '집계 완료'].join(','));
      }
      cursor = addDays(cursor, 1);
    }
    var blob = new Blob(['\ufeff' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var href = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = href;
    link.download = 'machine-iq-usage-time-' + state.from + '-' + state.to + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(href);
    setFeedback(state.from + '부터 ' + state.to + '까지의 운행시간 집계 결과를 CSV로 내보냈습니다.', false);
  }

  var lastValidDraftMonth = state.from.slice(0, 7);
  function syncDraftMonth() {
    var currentDate = monthRules.today(new Date());
    monthInput.max = currentDate.slice(0, 7);
    if (monthRules.parse(monthInput.value) && !monthRules.selectable(monthInput.value, currentDate)) {
      monthInput.value = lastValidDraftMonth;
      setFeedback('이번 달까지만 선택할 수 있습니다.', true);
    }
    if (monthRules.selectable(monthInput.value, currentDate)) lastValidDraftMonth = monthInput.value;
    MIQCommon.view.set(document.getElementById('usageMonthLabel'),"textContent",monthInput.value || '연월 선택');
    var draft = monthRules.range(monthInput.value);
    document.getElementById('usagePrevMonth').disabled = !draft || !monthRules.shift(monthInput.value, -1);
    document.getElementById('usageNextMonth').disabled = !draft || !monthRules.selectable(monthRules.shift(monthInput.value, 1), currentDate);
  }
  function shiftDraftMonth(amount) {
    var next = monthRules.shift(monthInput.value, amount);
    if (!monthRules.selectable(next, monthRules.today(new Date()))) return;
    monthInput.value = next;
    syncDraftMonth();
  }
  monthInput.value = state.from.slice(0, 7);
  syncDraftMonth();
  monthInput.addEventListener('input', syncDraftMonth);
  monthInput.addEventListener('change', syncDraftMonth);
  monthInput.addEventListener('click', function () { if (typeof monthInput.showPicker === 'function') monthInput.showPicker(); });
  document.getElementById('usagePrevMonth').addEventListener('click', function () { shiftDraftMonth(-1); });
  document.getElementById('usageNextMonth').addEventListener('click', function () { shiftDraftMonth(1); });
  document.getElementById('usageSearch').addEventListener('click', function () {
    var currentDate = monthRules.today(new Date());
    if (monthRules.parse(monthInput.value) && !monthRules.selectable(monthInput.value, currentDate)) {
      syncDraftMonth();
      return;
    }
    var range = monthRules.range(monthInput.value);
    if (!range) { setFeedback('조회할 연도와 월을 선택해 주세요.', true); monthInput.focus(); return; }
    TODAY = currentDate;
    state.from = range.from;
    state.to = range.to;
    render();
    setFeedback(state.year + '년 ' + state.month + '월 조회가 완료되었습니다.', false);
  });
  document.getElementById('usageExport').addEventListener('click', exportCsv);

  document.addEventListener('miq:target-change', function (event) {
    var target = event.detail || {};
    scopeContext = target;
    context.companyId = target.companyId || context.companyId;
    context.group = target.group || null;
    context.type = target.type || null;
    context.veh = target.equipmentId || null;
    applyContextSelection();
  });

  applyContextSelection();
})();
