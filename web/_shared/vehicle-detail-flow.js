(function () {
  'use strict';

  if (!window.MIQ || !MIQ.FLEET || document.body.dataset.sub !== 'detail') return;

  var query = new URLSearchParams(location.search);
  var requested = query.get('veh') || query.get('equipmentId');
  var metricFleet = Array.isArray(MIQ.FLEET) ? MIQ.FLEET : [];
  var fleet = Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length ? MIQ.FLEET_CATALOG : metricFleet;
  var role = MIQCommon.roles.resolve(document.body.dataset.managementRole || query.get('role'));
  if (role === 'dealer_staff' || role === 'customer_staff') {
    fleet = MIQCommon.roles.filterVehicles(role, fleet);
    metricFleet = metricFleet.filter(function (item) {
      return fleet.some(function (allowed) { return allowed.vin === item.vin; });
    });
  }
  function normalize(value) { return String(value || '').replace(/[-_]/g, '').toLowerCase(); }
  var defaultVehicle = fleet.filter(function (item) { return normalize(item.vin) === normalize('FBA32_224250271'); })[0] || metricFleet[0] || fleet[0] || null;
  var matchedVehicle = fleet.filter(function (item) { return normalize(item.vin) === normalize(requested); })[0] || (!requested ? defaultVehicle : null);
  var serviceVehicle = !matchedVehicle && window.MIQServiceRecords && MIQServiceRecords.vehicleIdentity
    ? MIQServiceRecords.vehicleIdentity(requested) : null;
  if (serviceVehicle && !MIQCommon.roles.filterVehicles(role, [serviceVehicle]).length) serviceVehicle = null;
  if (requested && !matchedVehicle && !serviceVehicle) {
    var unmatchedSummaryQuery = new URLSearchParams(query.toString());
    unmatchedSummaryQuery.delete('veh');
    unmatchedSummaryQuery.delete('equipmentId');
    location.replace('../Vehicle%20Summary/vehicle-summary-tobe-3.html?' + unmatchedSummaryQuery.toString());
    return;
  }
  var vehicle = matchedVehicle || serviceVehicle || {
    vin: requested || '정보 미제공',
    model: query.get('model') || '모델 정보 미제공',
    group: query.get('group') || '소속 정보 미제공',
    type: query.get('type') || '동력 정보 미제공',
    cumKm: null, cumH: null, conn: null, soc: null, km: null, min: null, shock: null
  };
  if (matchedVehicle || serviceVehicle) {
    query.set('veh', vehicle.vin);
    query.delete('equipmentId');
    query.set('companyId', vehicle.companyId || '1933');
    if (vehicle.group) query.set('group', vehicle.group); else query.delete('group');
    if (vehicle.type) query.set('type', vehicle.type); else query.delete('type');
    history.replaceState(null, '', location.pathname + '?' + query.toString() + location.hash);
  }
  if (matchedVehicle && window.MIQServiceRecords && window.MIQServiceDemo) {
    var serviceDay = MIQCommon.dates.format(MIQCommon.dates.yesterday());
    var serviceDemo = MIQServiceDemo.create([vehicle], serviceDay);
    serviceDemo.maintenance.concat(serviceDemo.error).forEach(function (record) {
      var present = MIQServiceRecords.records.some(function (existing) {
        return existing.demo && existing.kind === record.kind && existing.vin === record.vin && existing.date === record.date;
      });
      if (!present) MIQServiceRecords.records.push(record);
    });
  }
  var aliases = { day: 'd', daily: 'd', week: 'w', weekly: 'w', month: 'm', monthly: 'm', custom: 'c' };
  var period = aliases[query.get('period')] || query.get('period') || 'm';
  if (['d', 'w', 'm', 'c'].indexOf(period) < 0) period = 'm';
  var periodInfo = {
    d: { label: '일', from: '2026-07-03', to: '2026-07-03', factor: 1 / 22 },
    w: { label: '주', from: '2026-06-29', to: '2026-07-05', factor: 1 / 4.3 },
    m: { label: '월', from: '2026-07-01', to: '2026-07-31', factor: 1 },
    c: { label: '설정 기간', from: '2026-05-01', to: '2026-07-31', factor: 3.05 }
  };
  ['d', 'w', 'm'].forEach(function (mode) {
    var range = MIQCommon.dates.operatingRange(mode);
    periodInfo[mode].from = range.from;
    periodInfo[mode].to = range.to;
  });
  function updatePeriodRange(from, to) {
    var start = MIQCommon.dates.parse(from), end = MIQCommon.dates.parse(to);
    if (!start || !end) return;
    var days = MIQCommon.dates.dayCount(start, end);
    if (days < 1 || days > 366) return;
    periodInfo[period].from = from;
    periodInfo[period].to = to;
    if (period === 'c') periodInfo.c.factor = days / 30;
  }
  updatePeriodRange(query.get('from'), query.get('to'));
  if (period === 'c') {
    var customFrom = query.get('from');
    var customTo = query.get('to');
    var customFromDate = new Date((customFrom || '') + 'T00:00:00');
    var customToDate = new Date((customTo || '') + 'T00:00:00');
    var customDays = Math.floor((customToDate - customFromDate) / 86400000) + 1;
    if (/^\d{4}-\d{2}-\d{2}$/.test(customFrom || '') && /^\d{4}-\d{2}-\d{2}$/.test(customTo || '') && customDays > 0 && customDays <= 366) {
      periodInfo.c.from = customFrom;
      periodInfo.c.to = customTo;
      periodInfo.c.factor = customDays / 30;
    }
  }

  function number(value, digits) {
    return window.MIQCommon.numbers.integer(Number(value || 0)).replace(/\.0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function hasNumber(value) { return value !== null && value !== undefined && value !== '' && !isNaN(Number(value)); }
  function hours(minutes) {
    var total = Math.max(0, Math.round(minutes || 0));
    return Math.floor(total / 60) + 'H ' + String(total % 60).padStart(2, '0') + 'M';
  }
  function energyLabel(type) { return type === '엔진' ? '평균 연료소비량' : type === '납산' ? '운영효율' : '잔여 배터리'; }
  function energyColor(value) {
    return value >= 60 ? '#00ad83' : value >= 30 ? '#ff9d3b' : '#ec2d2d';
  }
  function queryString(extra, includeVehicle) {
    var params = new URLSearchParams();
    params.set('role', document.body.dataset.managementRole);
    params.set('companyId', vehicle.companyId || query.get('companyId') || '1933');
    params.set('period', period);
    if (includeVehicle !== false) params.set('veh', vehicle.vin);
    ['metric', 'sort', 'dir', 'from', 'to', 'source', 'returnTo'].forEach(function (key) {
      if (query.get(key)) params.set(key, query.get(key));
    });
    if (vehicle.group) params.set('group', vehicle.group);
    if (vehicle.type) params.set('type', vehicle.type);
    if (vehicle.model) params.set('model', vehicle.model);
    Object.keys(extra || {}).forEach(function (key) { params.set(key, extra[key]); });
    return params.toString();
  }
  function setLink(anchor, path, extra) {
    if (!anchor) return;
    anchor.href = path + '?' + queryString(extra);
  }

  function renderIdentity() {
    document.body.dataset.currentVin = vehicle.vin;
    var aside = document.querySelector('[data-lnb-tree]');
    if (aside) MIQCommon.view.call(aside,"setAttribute",['data-vin',vehicle.vin]);
    var model = document.querySelector('.v-model');
    var vin = document.querySelector('.v-vin');
    if (model) MIQCommon.view.set(model,"textContent",vehicle.model);
    if (vin) MIQCommon.view.set(vin,"textContent",vehicle.vin);

    var conn = document.querySelector('.conn');
    if (conn) {
      var connected = MIQSummaryRow.connection(vehicle.conn) === 'on';
      conn.classList.toggle('on', connected);
      conn.classList.toggle('off', !connected);
      MIQCommon.view.set(conn,"innerHTML",'<span class="dot"></span>' + (connected ? '연결됨' : '연결 끊김'));
      if (serviceVehicle) {
        conn.classList.remove('on', 'off');
        MIQCommon.view.set(conn,"textContent",'수집 전');
      }
    }
    var energy = document.querySelector('.batt-mini');
    if (energy) {
      var label = energy.querySelector('.batt-mini__label');
      var cell = energy.querySelector('.batt-mini__cell');
      var fill = energy.querySelector('.batt-mini__fill');
      var value = energy.querySelector('.batt-mini__val');
      if (label) MIQCommon.view.set(label,"textContent",energyLabel(vehicle.type));
      var energyValue = vehicle.type === '엔진' ? vehicle.fc
        : vehicle.type === '납산' ? (hasNumber(vehicle.efficiencyRate) ? vehicle.efficiencyRate : vehicle.eff)
        : vehicle.soc;
      if (vehicle.type === '엔진') {
        if (cell) cell.hidden = true;
        if (value) {
          MIQCommon.view.set(value,"textContent",hasNumber(energyValue) ? number(energyValue, 1) + 'ℓ/H' : '수집 전');
          value.style.color = hasNumber(energyValue) ? '#000000' : '#767676';
        }
      } else if (!hasNumber(energyValue)) {
        if (cell) cell.hidden = false;
        if (fill) { fill.style.width = '0'; fill.style.background = '#b8bdc5'; }
        if (value) { MIQCommon.view.set(value,"textContent",'수집 전'); value.style.color = '#767676'; }
      } else {
        var color = energyColor(Number(energyValue));
        if (cell) cell.hidden = false;
        if (fill) { fill.style.width = Math.max(0, Math.min(100, Number(energyValue))) + '%'; fill.style.background = color; }
        if (value) { MIQCommon.view.set(value,"textContent",number(energyValue, 1) + '%'); value.style.color = color; }
      }
    }

    var isOriginalLithium = normalize(vehicle.vin) === normalize('FBA32_224250271');
    var values = {
      '소속 그룹': vehicle.group,
      '연식': vehicle.year || (isOriginalLithium ? '2024' : null),
      '분류': vehicle.type,
      '누적 이동거리': hasNumber(vehicle.cumKm) ? number(vehicle.cumKm) + ' Km' : null,
      '누적 가동시간': hasNumber(vehicle.cumH) ? number(vehicle.cumH) + ' H' : null,
      'TMS 단말기 Serial': vehicle.terminalId || (isOriginalLithium ? '22425027' : null)
    };
    Array.prototype.forEach.call(document.querySelectorAll('.v-field'), function (field) {
      var key = field.querySelector('.v-field__k');
      var value = field.querySelector('.v-field__v');
      if (!key || !value || values[MIQCommon.view.get(key,"textContent").trim()] === undefined) return;
      var nextValue = values[MIQCommon.view.get(key,"textContent").trim()];
      field.hidden = nextValue === null || nextValue === undefined || nextValue === '';
      if (!field.hidden) MIQCommon.view.set(value,"textContent",nextValue);
    });
  }

  function renderPeriod() {
    var info = periodInfo[period];
    if (window.MIQVehicleErrors) MIQVehicleErrors.render(vehicle, info);
    var labels = { '일': 'd', '주': 'w', '월': 'm', '사용자설정': 'c' };
    Array.prototype.forEach.call(document.querySelectorAll('.period-tabs button'), function (button) {
      var key = labels[MIQCommon.view.get(button,"textContent").trim()];
      if (!key) return;
      button.dataset.period = key;
      button.classList.toggle('active', key === period);
    });
    var range = document.querySelector('.date-range');
    if (range && !range.querySelector('input')) MIQCommon.view.set(range,"textContent",info.from + ' ~ ' + info.to);
    Array.prototype.forEach.call(document.querySelectorAll('.period-flag'), function (flag) { MIQCommon.view.set(flag,"textContent",info.label); });

    var observed=MIQObservations.aggregate(vehicle,info.from,period==='d'?info.from:info.to);
    var metrics = document.querySelectorAll('.metrics .metric');
    if (metrics[0]) MIQCommon.view.set(metrics[0].querySelector('.metric__v'),"textContent",observed.distanceKm===null ? '수집 전' : number(observed.distanceKm) + ' Km');
    if (metrics[1]) MIQCommon.view.set(metrics[1].querySelector('.metric__v'),"textContent",observed.runningMinutes===null ? '수집 전' : hours(observed.runningMinutes));
    if (metrics[2]) MIQCommon.view.set(metrics[2].querySelector('.metric__v'),"textContent",observed.shockCount===null ? '수집 전' : number(observed.shockCount) + '회');
    var historyCounts = window.MIQSummaryRow ? MIQSummaryRow.historyCounts(window.MIQServiceRecords, vehicle, [info.from, info.to]) : { repair: null, fault: null };
    if (metrics[3]) MIQCommon.view.set(metrics[3].querySelector('.metric__v'),"textContent",historyCounts.repair === null ? '미제공' : number(historyCounts.repair));
    if (metrics[4]) MIQCommon.view.set(metrics[4].querySelector('.metric__v'),"textContent",historyCounts.fault === null ? '미제공' : number(historyCounts.fault));
  }

  function syncLinks() {
    var summaryParams = new URLSearchParams(query.toString());
    summaryParams.set('companyId', vehicle.companyId || query.get('companyId') || 'all');
    summaryParams.set('period', period);
    summaryParams.delete('veh');
    summaryParams.delete('equipmentId');
    var back = document.querySelector('.main .back-link');
    if (back) MIQCommon.view.set(back,"textContent",'‹ 이전 목록');
    if (back) back.href = MIQCommon.navigation.listReturnHref(query.get('returnTo'),
      '../Vehicle%20Summary/vehicle-summary-tobe-3.html?' + summaryParams.toString(), document.body.dataset.managementRole, location.href);
    var metricLinks = document.querySelectorAll('.metrics a.metric');
    setLink(metricLinks[0], '../Shock/shock-tobe.html', { origin: 'vehicle-detail', vehicleDetailQuery: queryString() });
    setLink(metricLinks[1], '../Service/service-maintenance-tobe.html');
    setLink(metricLinks[2], '../Service/service-error-tobe.html');

    var detailTarget = vehicle.type === '리튬' && hasNumber(vehicle.soc) ? '../Lithium/lithium-tobe.html' : null;
    var energyTitle = document.getElementById('energyTitle');
    if (energyTitle) {
      if (detailTarget) {
        setLink(energyTitle, detailTarget, { origin: 'vehicle-detail', vehicleDetailQuery: queryString() });
        MIQCommon.view.set(energyTitle,"textContent",'에너지 상세 정보 ›');
        energyTitle.title = (vehicle.type === '엔진' ? '운행이력 > 엔진' : '운행이력 > 리튬') + ' — 이 차량으로 필터되어 열립니다';
        energyTitle.classList.remove('na');
      } else {
        energyTitle.removeAttribute('href');
        MIQCommon.view.set(energyTitle,"textContent",'에너지 상세 정보');
        energyTitle.title = '선택 차량에서 수집된 항목만 표시합니다';
        energyTitle.classList.add('na');
      }
    }
    Array.prototype.forEach.call(document.querySelectorAll('.supply-status a,.sec-more'), function (anchor) {
      var state = anchor.classList.contains('need') ? 'need' : anchor.classList.contains('soon') ? 'soon' : anchor.classList.contains('ok') ? 'ok' : '';
      // The service queue contains only items requiring attention; normal items are shown here.
      if (state === 'ok') {
        anchor.removeAttribute('href');
        anchor.title = '정상 소모품은 아래 소모품 정보에서 확인할 수 있습니다.';
        return;
      }
      setLink(anchor, '../Service/service-supply-tobe.html', state ? { state: state } : {});
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-miq-modal="supply"]'), function (button) { button.dataset.vin = vehicle.vin; });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (character) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character];
    });
  }
  function energyIcon(type) {
    if (type === '엔진') return '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M8 15h5l3-5h11l4 5h3v14H8z"/><path d="M4 18h4m26 2h3M14 29v4m15-4v4M17 15h8m-10 6h12"/></svg>';
    if (type === '납산') return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="11" width="28" height="21" rx="3"/><path d="M12 11V7h5v4m7 0V7h5v4M11 19h8m-4-4v8m10-4h5M11 27c3-2 6 2 9 0s6 2 9 0"/></svg>';
    return '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="7" y="10" width="25" height="22" rx="3"/><path d="M32 17h3v8h-3M20 13l-5 9h6l-2 7 7-11h-6z"/></svg>';
  }
  function fieldHtml(label, value) {
    return '<div class="energy-field"><span class="energy-field__label">' + escapeHtml(label) + '</span><strong class="energy-field__value">' + escapeHtml(value) + '</strong></div>';
  }
  function renderOriginalLithiumDetail(host) {
    var soc = hasNumber(vehicle.soc) ? Math.max(0, Math.min(100, Number(vehicle.soc))) : 80;
    var consumption = hasNumber(vehicle.bc) ? number(vehicle.bc, 1) : '2.4';
    host.className = 'batt-detail active energy-detail--legacy';
    MIQCommon.view.set(host,"innerHTML",'<div class="batt-status">'
      + '<div class="batt-soc"><div class="batt-soc__cell"><div class="batt-soc__fill" style="height:' + soc + '%"></div></div>'
      + '<div class="batt-soc__meta"><span class="batt-soc__pct">' + number(soc, 1) + '%</span><span class="batt-soc__stat">충전중 · SOC</span></div></div>'
      + '<div class="batt-flags"><div class="flag ok"><span class="flag__dot"></span><span class="flag__k">온도 정상 여부</span><span class="flag__v">정상</span></div>'
      + '<div class="flag ok"><span class="flag__dot"></span><span class="flag__k">충전 정상 여부</span><span class="flag__v">정상</span></div>'
      + '<div class="flag ok"><span class="flag__dot"></span><span class="flag__k">배터리 정상 여부</span><span class="flag__v">정상</span></div></div></div>'
      + '<div class="batt-info"><div class="bi"><span class="bi__k">작업 가능 예상 시간</span><span class="bi__v">3<small>H</small> 20<small>M</small></span></div>'
      + '<div class="bi"><span class="bi__k">충전 완료 예상 시간</span><span class="bi__v">1<small>H</small> 10<small>M</small></span></div>'
      + '<div class="bi"><span class="bi__k">시간당 전력 사용량</span><span class="bi__v">' + consumption + '<small>kWh</small></span></div>'
      + '<div class="bi"><span class="bi__k">시간당 전력 충전량</span><span class="bi__v">3<small>kWh</small></span></div>'
      + '<div class="bi"><span class="bi__k">마지막 충전 이후 사용량</span><span class="bi__v">6<small>kWh</small></span></div>'
      + '<div class="bi"><span class="bi__k">스마트 충전</span><span class="bi__v">08 ~ 18</span></div></div>'
      + '<div class="batt-soh"><div class="batt-soh__title">성능 최대치(SOH)</div><div class="batt-soh__circle"><div class="batt-soh__inner"><span class="batt-soh__pct">87%</span><span class="batt-soh__lbl">SOH</span></div></div></div>');
  }
  function renderEnergyDetail() {
    var host = document.getElementById('energyDetail');
    var badge = document.getElementById('fuelBadge');
    var supported = vehicle.type === '리튬';
    var section = host && host.closest('.section');
    if (!section && host) section = host.parentElement;
    if (section) section.hidden = !supported;
    if (!supported) return;

    if (!supported) {
      if (badge) { badge.className = 'fuel-badge'; MIQCommon.view.set(badge,"textContent",'분류 미지원'); }
      if (host) MIQCommon.view.set(host,"innerHTML",'<p class="energy-empty">이 동력 유형에서 제공할 수 있는 에너지 지표가 없습니다.</p>');
      return;
    }

    var badgeMap = { '리튬': ['li', '리튬 (LI)'], '엔진': ['lm', '엔진 (EN)'], '납산': ['la', '납산 (LA)'] };
    if (badge) { badge.className = 'fuel-badge ' + badgeMap[vehicle.type][0]; MIQCommon.view.set(badge,"textContent",badgeMap[vehicle.type][1]); }

    if (vehicle.type === '리튬' && normalize(vehicle.vin) === normalize('FBA32_224250271')) {
      if (host) renderOriginalLithiumDetail(host);
      return;
    }

    var info = periodInfo[period];
    var observed=MIQObservations.aggregate(vehicle,info.from,period==='d'?info.from:info.to);
    var fields = [];
    var primaryValue = '';
    var primaryLabel = '';
    var primaryClass = vehicle.type === '리튬' ? 'li' : vehicle.type === '납산' ? 'la' : 'lm';
    var operatingEfficiency = observed.efficiency;

    if (vehicle.type === '엔진') {
      var fuelRate = observed.fuelRate;
      primaryValue = hasNumber(fuelRate) ? number(fuelRate, 1) + 'ℓ/H' : '수집 전';
      primaryLabel = '평균 연료소비량';
      if (hasNumber(operatingEfficiency)) fields.push(['운영효율', number(operatingEfficiency, 1) + '%']);
    } else if (vehicle.type === '납산') {
      primaryValue = hasNumber(operatingEfficiency) ? number(operatingEfficiency, 1) + '%' : '수집 전';
      primaryLabel = '운영효율';
      if (hasNumber(observed.batteryRate)) fields.push(['평균 배터리소비량', number(observed.batteryRate, 1) + ' kWh/H']);
    } else {
      primaryValue = hasNumber(vehicle.soc) ? number(vehicle.soc, 1) + '%' : '수집 전';
      primaryLabel = '잔여 배터리 · SOC';
      if (hasNumber(operatingEfficiency)) fields.push(['운영효율', number(operatingEfficiency, 1) + '%']);
      if (hasNumber(observed.batteryRate)) fields.push(['평균 배터리소비량', number(observed.batteryRate, 1) + ' kWh/H']);
    }

    if (hasNumber(observed.utilization)) fields.push(['운영률', number(observed.utilization, 1) + '%']);
    if (hasNumber(observed.runningMinutes)) fields.push(['기간 가동시간', hours(observed.runningMinutes)]);
    if (hasNumber(observed.distanceKm)) fields.push(['기간 이동거리', number(observed.distanceKm) + ' Km']);
    if (hasNumber(vehicle.cumH)) fields.push(['누적 가동시간', number(vehicle.cumH) + ' H']);
    if (hasNumber(vehicle.cumKm)) fields.push(['누적 이동거리', number(vehicle.cumKm) + ' Km']);

    if (host) {
      host.className = 'energy-detail';
      MIQCommon.view.set(host,"innerHTML",'<div class="energy-primary energy-primary--' + primaryClass + '">' +
        '<span class="energy-primary__icon">' + energyIcon(vehicle.type) + '</span>' +
        '<span class="energy-primary__copy"><strong class="energy-primary__value">' + escapeHtml(primaryValue) + '</strong>' +
        '<span class="energy-primary__label">' + escapeHtml(primaryLabel) + '</span>' +
        '<span class="energy-primary__note">' + escapeHtml(info.from + ' ~ ' + info.to + ' 선택 기간 기준') + '</span></span></div>' +
        '<div class="energy-fields">' + (fields.length ? fields.map(function (field) { return fieldHtml(field[0], field[1]); }).join('') : '<p class="energy-empty">수집된 상세 지표가 없습니다.</p>') + '</div>');
    }
  }

  function renderSourceAvailability() {
    var supplyStatus = document.querySelector('.supply-status');
    var supplyGrid = document.querySelector('.supply-grid');
    if (!supplyGrid || !window.MIQServiceRecords) return;
    var items = MIQVehicleDetailSupplies.items(vehicle, MIQServiceRecords);
    var supplySummary = MIQVehicleDetailSupplies.summary(items), counts = supplySummary.counts;
    if (supplyStatus) ['need', 'soon', 'ok'].forEach(function (state) {
      var badge = supplyStatus.querySelector('.' + state + ' .badge');
      if (badge) MIQCommon.view.set(badge,"textContent",counts[state]);
    });
    if (!items.length && supplyStatus) MIQCommon.view.set(supplyStatus,"innerHTML",'<span class="chip">소모품 데이터 수집 전</span>');
    var template = supplyGrid.querySelector('.supply-item');
    supplyGrid.replaceChildren();
    if (!items.length || !template) {
      MIQCommon.view.set(supplyGrid,"innerHTML",'<p class="energy-empty" style="grid-column:1/-1;margin:0;padding:18px 0">선택 차량의 소모품 교체주기·사용시간 데이터가 수집되지 않았습니다.</p>');
      return;
    }
    supplySummary.preview.forEach(function (item) {
      var node = template.cloneNode(true), values = node.querySelectorAll('.supply-item__row b'), fill = node.querySelector('.bar__fill');
      node.dataset.supplyState = item.state;
      MIQCommon.view.set(node.querySelector('.supply-item__name'),"textContent",item.name);
      MIQCommon.view.set(values[0],"textContent",number(item.cycle)); MIQCommon.view.set(values[1],"textContent",number(item.used));
      fill.className = 'bar__fill ' + ({ need: 'red', soon: 'orange', ok: 'green' }[item.state] || '');
      fill.style.width = item.width + '%';
      supplyGrid.appendChild(node);
    });
  }

  document.addEventListener('click', function (event) {
    var periodButton = event.target.closest('.period-tabs button[data-period]');
    if (periodButton) {
      var filter = periodButton.closest('.filter-bar');
      if (filter && filter.dataset.periodReady === 'true') return;
      period = periodButton.dataset.period;
      query.set('period', period);
      if (period !== 'c') {
        query.set('from', periodInfo[period].from);
        query.set('to', periodInfo[period].to);
      }
      history.replaceState(null, '', location.pathname + '?' + query.toString() + location.hash);
      renderPeriod();
      renderEnergyDetail();
      syncLinks();
      document.dispatchEvent(new CustomEvent('miq:query-change', { detail: { query: query.toString() } }));
      return;
    }
  });

  document.addEventListener('miq:period-change', function (event) {
    var detail = event.detail || {};
    var periods = { D: 'd', W: 'w', M: 'm', C: 'c' };
    period = periods[detail.periodTypeCode] || period;
    query.set('period', period);
    if (detail.startDate && detail.endDate) {
      query.set('from', detail.startDate);
      query.set('to', detail.endDate);
      updatePeriodRange(detail.startDate, detail.endDate);
    }
    history.replaceState(null, '', location.pathname + '?' + query.toString() + location.hash);
    renderPeriod();
    renderEnergyDetail();
    syncLinks();
    document.dispatchEvent(new CustomEvent('miq:query-change', { detail: { query: query.toString() } }));
  });

  renderIdentity();
  renderPeriod();
  renderEnergyDetail();
  renderSourceAvailability();
  syncLinks();
})();
