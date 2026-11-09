(function () {
  'use strict';

  var body = document.body;
  if (!body || body.dataset.gnb !== 'srvc') return;

  var page = body.dataset.sub || 'all';
  var roleRules = window.MIQCommon.roles;
  var accountRole = roleRules.resolve(window.MIQ && MIQ.MANAGEMENT_ROLE
    ? MIQ.MANAGEMENT_ROLE
    : new URLSearchParams(location.search).get('role'));
  var accountPolicy = roleRules.targetPolicy(accountRole);
  var table = document.querySelector('.main table');
  var tbody = table && table.tBodies[0];
  if (!table || !tbody) return;

  var detailHref = '../Vehicle%20Detail/vehicle-detail-tobe.html';
  var seed = document.querySelector('template[data-service-seed]');
  var rows = seed ? Array.prototype.slice.call(seed.content.querySelectorAll('tbody > tr')) : [];
  if (seed) {
    table.tHead.replaceWith(seed.content.querySelector('thead'));
    seed.remove();
  }
  var initialized = false;
  function allTableRows() { return Array.prototype.slice.call(table.tHead.rows).concat(rows); }
  var pager=MIQ.createListPager(table.parentElement,{pageSize:20,onChange:function(){applyFilters()}});
  var nextOrder = 0;
  var sortState = { index: -1, direction: 1 };
  var scopeContext = window.MIQ_TARGET_CONTEXT || null;
  var initialQuery = new URLSearchParams(location.search);
  // A map count refers to exact current items, not unrelated service-only identities.
  var mapSupplyItems = null;
  if (page === 'supply' && initialQuery.get('source') === 'map' && initialQuery.has('supplyItems')) {
    mapSupplyItems = new Set();
    try {
      var requestedItems = JSON.parse(initialQuery.get('supplyItems'));
      if (Array.isArray(requestedItems)) requestedItems.forEach(function (item) {
        if (Array.isArray(item) && item.length === 2 && item.every(function (part) { return typeof part === 'string'; })) {
          mapSupplyItems.add(JSON.stringify([normalize(item[0]), item[1]]));
        }
      });
    } catch (error) { /* Invalid or empty item selection must not broaden the result. */ }
  }
  function clearMapSupplyItems() {
    mapSupplyItems = null;
    var url = new URL(location.href);
    url.searchParams.delete('supplyItems');
    history.replaceState({}, '', url.href);
  }
  var defaultPeriod = MIQCommon.dates.operatingRange(initialQuery.get('period') || 'm');
  var periodControlsReady = false;
  var filterState = {
    companyId: '',
    vehicle: '',
    group: '',
    type: '',
    from: initialQuery.get('from') || defaultPeriod.from,
    to: initialQuery.get('to') || defaultPeriod.to,
    supplyState: '',
    errorState: ''
  };
  var live = document.createElement('div');
  live.className = 'service-live';
  MIQCommon.view.call(live,"setAttribute",['role','status']);
  MIQCommon.view.call(live,"setAttribute",['aria-live','polite']);
  document.body.appendChild(live);

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalize(value) {
    return String(value || '').toUpperCase().replace(/[^0-9A-Z가-힣]/g, '');
  }

  function numberFrom(value) {
    var match = String(value || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function dateOnly(value) {
    var match = String(value || '').match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : '';
  }

  function selectedCompanyLabel() {
    var select = document.querySelector('[data-target-company]');
    if (!select || select.selectedIndex < 0) return '';
    return MIQCommon.view.call(select.options[select.selectedIndex],"getAttribute",['data-label']) || MIQCommon.view.get(select.options[select.selectedIndex],"textContent").trim();
  }

  function rowInfo(row) {
    var c = row.cells;
    var info = { row: row, company: '', group: '', model: '', vin: '', type: '', date: '', supplyState: '', errorState: '' };
    if (page === 'all') {
      info.company = c[0] ? MIQCommon.view.get(c[0],"textContent").trim() : '';
      info.group = c[1] ? MIQCommon.view.get(c[1],"textContent").trim() : '';
      info.model = c[2] ? MIQCommon.view.get(c[2],"textContent").trim() : '';
      info.vin = c[3] ? MIQCommon.view.get(c[3],"textContent").trim() : '';
    } else if (page === 'maintenance') {
      info.company = c[0] ? MIQCommon.view.get(c[0],"textContent").trim() : '';
      info.group = c[1] ? MIQCommon.view.get(c[1],"textContent").trim() : '';
      info.model = c[2] ? MIQCommon.view.get(c[2],"textContent").trim() : '';
      info.vin = c[3] ? MIQCommon.view.get(c[3],"textContent").trim() : '';
      info.date = c[4] ? dateOnly(MIQCommon.view.get(c[4],"textContent")) : '';
    } else if (page === 'supply') {
      info.company = c[1] ? MIQCommon.view.get(c[1],"textContent").trim() : '';
      info.group = c[2] ? MIQCommon.view.get(c[2],"textContent").trim() : '';
      info.model = c[3] ? MIQCommon.view.get(c[3],"textContent").trim() : '';
      info.vin = c[4] ? MIQCommon.view.get(c[4],"textContent").trim() : '';
      info.date = c[6] ? dateOnly(MIQCommon.view.get(c[6],"textContent")) : '';
      info.supplyState = row.dataset.supplyState || '';
      info.supplyName = row.dataset.name;
      info.supplyCycle = row.dataset.cycle;
      info.supplyUsed = row.dataset.used;
    } else if (page === 'error') {
      var affiliation = c[0];
      var vehicle = c[1];
      info.company = affiliation && affiliation.querySelector('strong') ? MIQCommon.view.get(affiliation.querySelector('strong'),"textContent").trim() : '';
      info.group = affiliation && affiliation.querySelector('span') ? MIQCommon.view.get(affiliation.querySelector('span'),"textContent").trim() : '';
      info.vin = vehicle && vehicle.querySelector('strong') ? MIQCommon.view.get(vehicle.querySelector('strong'),"textContent").trim() : '';
      info.model = vehicle && vehicle.querySelector('span') ? MIQCommon.view.get(vehicle.querySelector('span'),"textContent").trim() : '';
      info.date = c[6] ? dateOnly(MIQCommon.view.get(c[6],"textContent")) : '';
      info.errorState = c[2] && normalize(MIQCommon.view.get(c[2],"textContent")).indexOf(normalize('현재')) > -1 ? 'current' : 'past';
    }
    var catalogVehicle = catalogVehicleForVin(info.vin);
    info.companyId = row.dataset.companyId || (catalogVehicle && catalogVehicle.companyId)
      || (normalize(info.company).indexOf('세종물류') > -1 ? '1933' : '');
    info.type = row.dataset.vehicleType || vehicleTypeFor(info);
    return info;
  }

  function initializeDemoRows() {
    if (!window.MIQServiceDemo || body.dataset.serviceDemoReady === 'true') return;
    body.dataset.serviceDemoReady = 'true';
    var fleet = window.MIQ && (MIQ.FLEET_CATALOG || MIQ.FLEET) || [];
    var day = MIQCommon.dates.format(MIQCommon.dates.yesterday());
    var demo = MIQServiceDemo.create(fleet, day);
    // Only the separate dashboard's explicit sample link adds today's events.
    // Freeze date/hour at the clicked card so list and card stay comparable.
    var sampleQuery = new URLSearchParams(location.search);
    if (page === 'error' && sampleQuery.get('dashboardSample') === 'current' && MIQServiceDemo.createCurrent) {
      demo.error = demo.error.concat(MIQServiceDemo.createCurrent(fleet, {
        date: sampleQuery.get('sampleDate'), to: sampleQuery.get('sampleTo')
      }));
    }
    MIQServiceRecords.records.push.apply(MIQServiceRecords.records, demo.maintenance.concat(demo.error));
    if (page === 'supply' || !rows.length) return;
    var template = rows[0];
    var existing = rows.map(function (row) { return normalize(rowInfo(row).vin); });
    var items = page === 'all' ? demo.maintenance : demo[page];
    (items || []).forEach(function (item) {
      if (page === 'all' && existing.indexOf(normalize(item.vin)) > -1) return;
      var row = template.cloneNode(true), c = row.cells;
      row.hidden = false;
      row.dataset.companyId = item.companyId;
      row.dataset.vehicleType = item.type;
      row.dataset.serviceDemo = 'true';
      if (page === 'all' || page === 'maintenance') {
        [item.company, item.group, item.model, item.vin].forEach(function (value, index) { MIQCommon.view.set(c[index],"textContent",value); });
        if (page === 'all') {
          [4, 5, 6, 7].forEach(function (index) { MIQCommon.view.set(c[index],"textContent",'0'); });
        } else {
          [item.dateTime, item.part, item.symptom, item.detail].forEach(function (value, index) { MIQCommon.view.set(c[index + 4],"textContent",value); });
          MIQCommon.view.set(c[8],"innerHTML",'<span class="done ' + (item.completed ? 'y' : 'n') + '">' + (item.completed ? '완료' : '진행중') + '</span>');
        }
      } else if (page === 'error') {
        MIQCommon.view.set(c[0].querySelector('strong'),"textContent",item.company);
        MIQCommon.view.set(c[0].querySelector('span'),"textContent",item.group);
        MIQCommon.view.set(c[1].querySelector('strong'),"textContent",item.vin);
        MIQCommon.view.set(c[1].querySelector('span'),"textContent",item.model);
        MIQServiceErrors.cells(item).forEach(function(html,index){MIQCommon.view.set(c[index+2],"innerHTML",html);});
      }
      rows.push(row);
      existing.push(normalize(item.vin));
    });
  }

  function collectRows() {
    Array.prototype.forEach.call(tbody.rows, function(row){if(!row.classList.contains('service-empty-row')&&rows.indexOf(row)<0)rows.push(row)});
    rows.forEach(function (row) {
      if (typeof row._serviceOrder !== 'number') row._serviceOrder = nextOrder++;
    });
  }

  function applyServiceRole() {
    applyServiceTableColumns();
    var customer = roleRules.isCustomer(accountRole);
    var companyIndex = page === 'supply' ? 1 : 0;
    var groupIndex = companyIndex + 1;
    body.dataset.serviceRole = accountRole;
    function labelHeading(index, label) {
      var heading = table.tHead.rows[0].cells[index];
      // Repeated calls after registration must preserve the sort button/listener.
      if (heading && !heading.querySelector('.service-sort-button')) MIQCommon.view.set(heading,"textContent",label);
    }
    if (page === 'error') {
      labelHeading(0, customer ? '그룹' : '업체');
      rows.forEach(function (row) {
        row.cells[0].querySelector('strong').hidden = customer;
        row.cells[0].querySelector('span').hidden = !customer;
      });
    } else {
      labelHeading(companyIndex, '업체');
      labelHeading(groupIndex, '그룹');
      allTableRows().forEach(function (row) {
        if (row.cells.length < groupIndex + 2) return;
        row.cells[companyIndex].hidden = customer;
        row.cells[groupIndex].hidden = !customer;
      });
    }
    if (page !== 'maintenance') return;
    var hideDetail = roleRules.hideMaintenanceDetails(accountRole);
    allTableRows().forEach(function (row) { Array.prototype.forEach.call(row.querySelectorAll('.detail-col'), function (cell) {
      cell.classList.toggle('is-hidden', hideDetail);
      MIQCommon.view.call(cell,"setAttribute",['aria-hidden',hideDetail ? 'true' : 'false']);
    }); });
  }

  function fitServiceColumns() {
    var minimums={company:210,group:140,model:100,vin:190,count:110,check:48,vehicle:210,date:174,part:165,symptom:180,description:250,status:96,supply:180,progress:260,category:88,code:180,action:76};
    var translated = document.documentElement.lang !== 'ko';
    if (translated) { minimums.company=130; minimums.model=80; minimums.status=115; minimums.category=100; minimums.action=96; minimums.date=145; minimums.supply=160; minimums.progress=205; }
    if (translated && document.body.dataset.sub === 'error') { minimums.company=125; minimums.vehicle=185; minimums.status=95; minimums.category=84; minimums.code=145; minimums.description=150; minimums.date=140; minimums.action=60; }
    MIQTableLayout.fit(table,Array.prototype.map.call(table.tHead.rows[0].cells,function(header){var key=header.dataset.serviceColumn;return {min:minimums[key],compact:translated ? /^(check|vin|vehicle|action)$/.test(key) : /^(check|status|category|action)$/.test(key)};}),{withinContainer:translated});
  }

  function applyServiceTableColumns() {
    var columns = {
      all: ['company', 'group', 'model', 'vin', 'count', 'count', 'count', 'count'],
      maintenance: ['company', 'group', 'model', 'vin', 'date', 'part', 'symptom', 'description', 'status'],
      supply: ['check', 'company', 'group', 'model', 'vin', 'supply', 'date', 'progress'],
      error: ['company', 'vehicle', 'status', 'category', 'code', 'description', 'date', 'action']
    }[page];
    if (!columns) return;
    table.classList.add('service-data-table');
    var colgroup = table.querySelector('colgroup');
    if (colgroup) colgroup.remove();
    allTableRows().forEach(function (row) {
      if (row.cells.length !== columns.length) return;
      columns.forEach(function (column, index) {
        row.cells[index].dataset.serviceColumn = column;
        row.cells[index].style.removeProperty('width');
      });
    });
  }

  function catalogVehicleForVin(vin) {
    if (!window.MIQ || !vin) return null;
    var fleet = Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length
      ? MIQ.FLEET_CATALOG
      : Array.isArray(MIQ.FLEET) ? MIQ.FLEET : [];
    return fleet.filter(function (item) {
      return normalize(item.vin) === normalize(vin);
    })[0] || null;
  }

  function vehicleTypeFor(info) {
    if (!window.MIQ) return '';
    var fleet = Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length ? MIQ.FLEET_CATALOG : Array.isArray(MIQ.FLEET) ? MIQ.FLEET : [];
    var exact = catalogVehicleForVin(info.vin);
    var sameModel = fleet.filter(function (item) { return normalize(item.model) === normalize(info.model); })[0];
    return (exact || sameModel || {}).type || '';
  }

  function vehicleDetailUrl(info) {
    var catalogVehicle = catalogVehicleForVin(info && info.vin)
      || MIQServiceRecords.vehicleIdentity(info && info.vin);
    if (!catalogVehicle) return '';
    if (!roleRules.filterVehicles(accountRole, [catalogVehicle]).length) return '';
    var currentCompany = document.querySelector('[data-target-company]');
    var query = new URLSearchParams(location.search);
    var companyId = currentCompany ? currentCompany.value : (query.get('companyId') || '');
    var params = new URLSearchParams();
    params.set('role', accountRole);
    var returnQuery = new URLSearchParams();
    returnQuery.set('role', accountRole);
    [['companyId', filterState.companyId], ['group', filterState.group], ['type', filterState.type],
      ['veh', filterState.vehicle], ['period', query.get('period') || 'm'],
      ['from', filterState.from], ['to', filterState.to], ['lang', query.get('lang')],
      ['dashboardSample', query.get('dashboardSample')], ['sampleDate', query.get('sampleDate')],
      ['sampleTo', query.get('sampleTo')]].forEach(function (pair) {
      if (pair[1]) returnQuery.set(pair[0], pair[1]);
    });
    if (filterState.supplyState) returnQuery.set('state', filterState.supplyState);
    if (mapSupplyItems !== null) {
      returnQuery.set('source', 'map');
      returnQuery.set('supplyItems', new URLSearchParams(location.search).get('supplyItems') || '[]');
    }
    if (filterState.errorState) returnQuery.set('state', filterState.errorState);
    params.set('returnTo', location.pathname + '?' + returnQuery.toString());
    params.set('veh', catalogVehicle.vin);
    if (query.get('lang')) params.set('lang', query.get('lang'));
    if (catalogVehicle.companyId || companyId) params.set('companyId', catalogVehicle.companyId || companyId);
    if (info.model) params.set('model', info.model);
    if (info.group) params.set('group', info.group);
    var type = vehicleTypeFor(info);
    if (type) params.set('type', type);
    if (query.get('period')) params.set('period', query.get('period'));
    if (filterState.from) params.set('from', filterState.from);
    if (filterState.to) params.set('to', filterState.to);
    return detailHref + '?' + params.toString();
  }

  function makeVinLink(cell, info, inner) {
    if (!cell || !info || !info.vin) return;
    var target = inner || cell;
    var href = vehicleDetailUrl(info);
    if (!href) {
      MIQCommon.view.set(target,"textContent",info.vin);
      target.classList.remove('text-link');
      MIQCommon.view.call(cell,"setAttribute",['data-service-vin-unmapped','true']);
      return;
    }
    var existingLink = cell.querySelector('.service-vin-link');
    if (existingLink) {
      existingLink.href = href;
      cell.removeAttribute('data-service-vin-unmapped');
      return;
    }
    var link = document.createElement('a');
    link.className = 'service-vin-link';
    link.href = href;
    MIQCommon.view.set(link,"textContent",info.vin);
    link.addEventListener('click', function (event) {
      var nextHref = vehicleDetailUrl(info);
      if (!nextHref) {
        event.preventDefault();
        link.replaceWith(document.createTextNode(info.vin));
        MIQCommon.view.call(cell,"setAttribute",['data-service-vin-unmapped','true']);
        return;
      }
      link.href = nextHref;
    });
    if (inner) {
      MIQCommon.view.set(inner,"textContent",'');
      inner.appendChild(link);
    } else {
      MIQCommon.view.set(cell,"textContent",'');
      cell.appendChild(link);
    }
    cell.removeAttribute('data-service-vin-unmapped');
  }

  function serviceItemUrl(info, sub) {
    var destinations = {
      maintenance: 'service-maintenance-tobe.html',
      supply: 'service-supply-tobe.html',
      error: 'service-error-tobe.html'
    };
    if (!destinations[sub] || !info.vin) return '';
    var catalogVehicle = catalogVehicleForVin(info.vin);
    var fleet = window.MIQ && (MIQ.FLEET_CATALOG || MIQ.FLEET) || [];
    var companyMatches = fleet.filter(function (item) {
      var name = normalize(item.companyName);
      var rowName = normalize(info.company);
      return name && rowName && (name.indexOf(rowName) > -1 || rowName.indexOf(name) > -1);
    });
    var companyIds = companyMatches.map(function (item) { return item.companyId; }).filter(function (id, index, ids) {
      return id && ids.indexOf(id) === index;
    });
    var current = new URLSearchParams(location.search);
    var params = new URLSearchParams();
    params.set('role', accountRole);
    params.set('veh', catalogVehicle ? catalogVehicle.vin : info.vin);
    var companyId = catalogVehicle && catalogVehicle.companyId
      || (companyIds.length === 1 ? companyIds[0] : filterState.companyId);
    if (companyId && companyId !== 'all') params.set('companyId', companyId);
    if (!roleRules.isDealer(accountRole) && info.group) params.set('group', info.group);
    var type = catalogVehicle ? catalogVehicle.type : filterState.type;
    if (type) params.set('type', type);
    var activePeriod = document.querySelector('.period-tabs button.active');
    var periods = { '일': 'd', '주': 'w', '월': 'm', '사용자설정': 'c' };
    var period = current.get('period') || (activePeriod && periods[MIQCommon.view.get(activePeriod,"textContent").replace(/\s+/g, '')]) || 'm';
    params.set('period', period);
    if (filterState.from) params.set('from', filterState.from);
    if (filterState.to) params.set('to', filterState.to);
    return destinations[sub] + '?' + params.toString();
  }

  function makeServiceItemLink(cell, info, sub, label) {
    if (!cell) return;
    var value = MIQCommon.view.get(cell,"textContent").trim();
    if (!(numberFrom(value) > 0)) {
      MIQCommon.view.set(cell,"textContent",value);
      return;
    }
    var link = cell.querySelector('.service-count-link');
    if (!link) {
      link = document.createElement('a');
      link.className = 'service-count-link';
      MIQCommon.view.set(link,"textContent",value);
      MIQCommon.view.call(link,"setAttribute",['aria-label',info.vin + ' ' + label + ' ' + value + '건 보기']);
      link.addEventListener('click', function () { link.href = serviceItemUrl(info, sub); });
      link.addEventListener('auxclick', function () { link.href = serviceItemUrl(info, sub); });
      MIQCommon.view.set(cell,"textContent",'');
      cell.appendChild(link);
    }
    link.href = serviceItemUrl(info, sub);
  }

  function enhanceVinLinks() {
    rows.forEach(function (row) {
      var info = rowInfo(row);
      if (!info.vin) return;
      if (page === 'all') {
        makeVinLink(row.cells[3], info);
        makeServiceItemLink(row.cells[4], info, 'maintenance', '수리이력');
        makeServiceItemLink(row.cells[5], info, 'supply', '소모품');
        makeServiceItemLink(row.cells[6], info, 'error', '에러');
      } else if (page === 'maintenance') {
        makeVinLink(row.cells[3], info);
      } else if (page === 'supply') {
        makeVinLink(row.cells[4], info);
      } else if (page === 'error') {
        makeVinLink(row.cells[1], info, row.cells[1] && row.cells[1].querySelector('strong'));
      }
    });
  }

  function supplyProgress(row) {
    var button = row;
    var progress = row.querySelector('.progress');
    if (!button || !progress) return;

    var cycle = Number(button.dataset.cycle || 0);
    var used = Number(button.dataset.used || 0);
    var state = MIQServiceRecords.supplyStatus(cycle, used);
    var pct = state.percent === null ? 0 : state.percent;
    var capped = state.width;
    var context = used > cycle ? '초과 ' + window.MIQCommon.numbers.integer((used - cycle), true) + 'H'
      : '교체까지 ' + window.MIQCommon.numbers.integer(Math.max(0, cycle - used), true) + 'H';

    progress.classList.toggle('is-danger', state.state === 'need');
    progress.classList.toggle('is-warning', state.state === 'soon');
    progress.classList.toggle('is-safe', state.state === 'ok');
    MIQCommon.view.set(progress,"innerHTML",'<div class="progress__top"><span><b class="used">' + window.MIQCommon.numbers.integer(used, true) + 'H</b> / '
      + window.MIQCommon.numbers.integer(cycle, true) + 'H</span><span class="progress__value"><b class="percent">'
      + window.MIQCommon.numbers.integer(pct) + '%</b></span></div><div class="progress__context">' + context
      + '</div><div class="progress__bar"><span class="progress__fill" style="width:' + capped + '%"></span></div>');
    row.dataset.supplyState = state.state;
  }

  function initializeSupplyRows() {
    if (page !== 'supply') return;
    var template = rows[0];
    if (!template) return;
    // Include every common-ledger item before the rendered list is synchronized.
    // A VIN/name pair identifies an item; filtering must never remove source items.
    MIQServiceRecords.records.filter(function (record) { return record.kind === 'supply'; }).forEach(function (item) {
      var exists = rows.some(function (row) {
        return normalize(row.dataset.vin) === normalize(item.vin) && row.dataset.name === item.supplyName;
      });
      if (exists) return;
      var row = template.cloneNode(true);
      row.hidden = false;
      row.dataset.vin = item.vin;
      row.dataset.name = item.supplyName;
      row.dataset.companyId = item.companyId;
      row.dataset.vehicleType = item.type;
      row.dataset.cycle = item.supplyCycle;
      row.dataset.used = item.supplyUsed;
      delete row.dataset.lastDate;
      delete row.dataset.lastCum;
      [item.company, item.group, item.model, item.vin, item.supplyName, item.date].forEach(function (value, index) {
        MIQCommon.view.set(row.cells[index + 1],"textContent",value);
      });
      var check = row.querySelector('.item-check');
      check.checked = false;
      MIQCommon.view.call(check,"setAttribute",['aria-label',item.supplyName + ' 선택']);
      rows.push(row);
    });
    rows.forEach(function (row) {
      var item = MIQServiceRecords.supplyItems(row.dataset.vin).filter(function (value) { return value.name === row.dataset.name; })[0];
      if (item) { row.dataset.cycle = item.cycle; row.dataset.used = item.used; }
      supplyProgress(row);
    });
  }

  function matchesCompany(info) {
    if (accountPolicy.companyIds && accountPolicy.companyIds.indexOf(info.companyId) < 0) return false;
    if (accountPolicy.group && info.group !== accountPolicy.group) return false;
    var id = filterState.companyId;
    if (!id || id === 'all') return true;
    if (info.companyId) return String(info.companyId) === String(id);
    var label = selectedCompanyLabel();
    if (id === '1933' && normalize(info.company).indexOf('세종물류') > -1) return true;
    return normalize(label).indexOf(normalize(info.company)) > -1
      || normalize(info.company).indexOf(normalize(label)) > -1
      || normalize(info.company) === normalize(id);
  }

  function isVisible(info) {
    if (!matchesCompany(info)) return false;
    if (mapSupplyItems !== null && !mapSupplyItems.has(JSON.stringify([normalize(info.vin), info.supplyName]))) return false;
    if (page === 'supply' && info.supplyState !== 'need' && info.supplyState !== 'soon') return false;
    if (filterState.vehicle && normalize(info.vin) !== normalize(filterState.vehicle)) return false;
    if (filterState.group && normalize(info.group).indexOf(normalize(filterState.group)) < 0) return false;
    if (filterState.type && normalize(info.type) !== normalize(filterState.type)) return false;
    if (filterState.supplyState && info.supplyState !== filterState.supplyState) return false;
    if (filterState.errorState && info.errorState !== filterState.errorState) return false;
    if (page !== 'supply' && info.date && filterState.from && info.date < filterState.from) return false;
    if (page !== 'supply' && info.date && filterState.to && info.date > filterState.to) return false;
    return true;
  }

  function sortValue(row, index) {
    if (page === 'error' && index === 0) {
      var info = rowInfo(row);
      return roleRules.isCustomer(accountRole) ? info.group : info.company;
    }
    var text = row.cells[index] ? MIQCommon.view.get(row.cells[index],"textContent").replace(/\s+/g, ' ').trim() : '';
    var date = dateOnly(text);
    if (date) {
      var timeMatch = text.match(/\d{2}:\d{2}/);
      return Date.parse(date + 'T' + (timeMatch ? timeMatch[0] : '00:00'));
    }
    var numeric = numberFrom(text);
    if (!isNaN(numeric) && !/[A-Za-z가-힣]/.test(text.replace(/Km|SPN|FMI|PDF|H/g, ''))) return numeric;
    return text;
  }

  function sortRows() {
    if (sortState.index < 0) return;
    var index = sortState.index;
    var direction = sortState.direction;
    rows.sort(function (a, b) {
      var av = sortValue(a, index);
      var bv = sortValue(b, index);
      var result;
      if (typeof av === 'number' && typeof bv === 'number') result = av - bv;
      else result = String(av).localeCompare(String(bv), 'ko', { numeric: true, sensitivity: 'base' });
      return result === 0 ? a._serviceOrder - b._serviceOrder : result * direction;
    });

  }

  function enhanceSorting() {
    var skipLabels = ['수정', '조치'];
    Array.prototype.forEach.call(table.tHead.rows[0].cells, function (th, index) {
      var label = MIQCommon.view.get(th,"textContent").replace(/\s+/g, ' ').trim();
      if (!label || th.querySelector('input') || skipLabels.indexOf(label) > -1) return;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'service-sort-button';
      MIQCommon.view.call(button,"setAttribute",['aria-label',label + ' 기준 정렬']);
      while (th.firstChild) button.appendChild(th.firstChild);
      th.appendChild(button);
      MIQCommon.view.call(th,"setAttribute",['aria-sort','none']);
      button.addEventListener('click', function () {
        if (sortState.index === index) sortState.direction *= -1;
        else {
          sortState.index = index;
          sortState.direction = 1;
        }
        Array.prototype.forEach.call(table.tHead.rows[0].cells, function (cell, ci) {
          MIQCommon.view.call(cell,"setAttribute",['aria-sort',ci === index ? (sortState.direction > 0 ? 'ascending' : 'descending') : 'none']);
        });
        sortRows();
        applyFilters(label + (sortState.direction > 0 ? ' 오름차순' : ' 내림차순') + '으로 정렬했습니다.');
      });
    });
  }

  var meta = document.createElement('div');
  meta.className = 'service-list-meta';
  MIQCommon.view.set(meta,"innerHTML",'<span data-service-scope-summary data-miq-scope-placement="title" aria-label="현재 조회 범위"></span>'
    + '<span class="service-list-meta__chips" data-service-filter-chips></span>'
    + '<button class="service-filter-reset" type="button" data-service-filter-reset hidden>필터 초기화</button>');
  var scopeHost = meta.querySelector('[data-service-scope-summary]');
  table.closest('.table-wrap').parentNode.insertBefore(meta, table.closest('.table-wrap'));

  function chipsHtml() {
    var chips = [];
    if (mapSupplyItems !== null) chips.push('지도 집계 항목');
    if (filterState.supplyState) {
      chips.push({ need: '교체필요', soon: '교체임박', ok: '정상' }[filterState.supplyState] || filterState.supplyState);
    }
    if (filterState.errorState) chips.push(filterState.errorState === 'current' ? '현재 에러' : '과거 에러');
    return chips.map(function (text) { return '<span class="service-filter-chip">' + esc(text) + '</span>'; }).join('');
  }

  function serviceScopeFilter() {
    return Object.assign({}, filterState, { companyIds: accountPolicy.companyIds, group: accountPolicy.group || filterState.group,
      exactGroup: !!accountPolicy.group, supplyState: '', errorState: '' });
  }

  function updateSummaryCounts() {
    if (page !== 'all') return;
    rows.forEach(function (row) {
      var info = rowInfo(row);
      var totals = MIQServiceRecords.totals({ vehicle: info.vin, from: filterState.from, to: filterState.to });
      MIQCommon.view.set(row.cells[4],"textContent",totals.maintenance);
      MIQCommon.view.set(row.cells[5],"textContent",totals.supply);
      MIQCommon.view.set(row.cells[6],"textContent",totals.error);
      MIQCommon.view.set(row.cells[7],"textContent",totals.maintenance + totals.supply + totals.error);
    });
    enhanceVinLinks();
  }

  function updateServiceLnb() {
    var totals = MIQServiceRecords.totals(serviceScopeFilter());
    window.MIQ_SERVICE_COUNTS = totals;
    var current = new URLSearchParams(location.search);
    var params = new URLSearchParams();
    params.set('role', accountRole);
    [['companyId', filterState.companyId], ['group', filterState.group], ['type', filterState.type],
      ['veh', filterState.vehicle], ['from', filterState.from], ['to', filterState.to]].forEach(function (pair) {
      if (pair[1]) params.set(pair[0], pair[1]);
    });
    params.set('period', current.get('period') || 'm');
    window.MIQ_SERVICE_QUERY = params.toString();
    Array.prototype.forEach.call(document.querySelectorAll('.miq-side-item'), function (item) {
      var key = MIQCommon.view.call(item,"getAttribute",['data-miq-side-sub']);
      var badge = item.querySelector('.miq-side-count');
      if (key === 'all') { if (badge) badge.remove(); return; }
      if (!Object.prototype.hasOwnProperty.call(totals, key)) return;
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'miq-side-count';
        item.appendChild(badge);
      }
      MIQCommon.view.set(badge,"textContent",totals[key]);
    });
    document.dispatchEvent(new CustomEvent('miq:query-change', { detail: { query: window.MIQ_SERVICE_QUERY } }));
  }

  function applyFilters(message) {
    if (!initialized) return;
    collectRows();
    if (page !== 'all') MIQServiceRecords.replace(page, rows.map(rowInfo));
    updateSummaryCounts();
    sortRows();
    var visible = [];
    rows.forEach(function (row) {
      var show = isVisible(rowInfo(row));
      row.hidden = !show;
      if (show) visible.push(row);
    });
    tbody.replaceChildren.apply(tbody,pager.slice(visible));
    var oldEmpty = tbody.querySelector('.service-empty-row');
    if (oldEmpty) oldEmpty.remove();
    if (!visible.length) {
      var empty = document.createElement('tr');
      empty.className = 'service-empty-row';
      MIQCommon.view.set(empty,"innerHTML",'<td colspan="' + MIQTableLayout.columnCount(table)
        + '"><strong>조회 조건에 맞는 결과가 없습니다.</strong>차량·기간·상태 필터를 변경해 주세요.</td>');
      tbody.appendChild(empty);
    }
    var displayCount = page === 'all'
      ? visible.reduce(function (sum, row) { return sum + (numberFrom(MIQCommon.view.get(row.cells[row.cells.length - 1],"textContent")) || 0); }, 0)
      : visible.length;
    if (window.MIQ && typeof MIQ.renderScopeSummary === 'function') {
      var fallbackSegments = [
        { key: 'company', label: filterState.companyId && filterState.companyId !== 'all' ? (selectedCompanyLabel() || '선택 업체') : '전체 업체' },
        { key: 'group', label: filterState.group || '전체 그룹' },
        { key: 'type', label: filterState.type || '전체 분류' },
        { key: 'vehicle', label: filterState.vehicle || '전체 차량' }
      ];
      var targetContext = scopeContext || window.MIQ_TARGET_CONTEXT || { scopeSegments: fallbackSegments };
      var selectedVehicleCount = targetContext.selectedCount === 0 || targetContext.selectedCount
        ? targetContext.selectedCount
        : '';
      MIQ.renderScopeSummary(scopeHost, targetContext, { countLabel: '차량', count: selectedVehicleCount, countUnit: '대' });
    } else {
      MIQCommon.view.set(scopeHost,"textContent",'');
    }
    MIQCommon.view.set(meta.querySelector('[data-service-filter-chips]'),"innerHTML",chipsHtml());
    var hasExtraFilter = !!(filterState.supplyState || filterState.errorState || mapSupplyItems !== null);
    meta.querySelector('[data-service-filter-reset]').hidden = !hasExtraFilter;
    meta.classList.toggle('is-empty', !hasExtraFilter);
    updateServiceLnb(visible);
    MIQCommon.view.set(live,"textContent",message || '조회 결과 ' + displayCount + '건입니다.');
  }

  meta.querySelector('[data-service-filter-reset]').addEventListener('click', function () {
    if (mapSupplyItems !== null) clearMapSupplyItems();
    filterState.supplyState = '';
    filterState.errorState = '';
    applyFilters('추가 필터를 초기화했습니다.');
  });

  function ensureDialog() {
    var dialog = document.querySelector('.service-dialog');
    if (dialog) return dialog;
    dialog = document.createElement('dialog');
    dialog.className = 'service-dialog';
    document.body.appendChild(dialog);
    dialog.addEventListener('cancel', function () { body.classList.remove('is-printing-error'); });
    dialog.addEventListener('close', function () { body.classList.remove('is-printing-error'); });
    return dialog;
  }

  function closeDialog(dialog) {
    body.classList.remove('is-printing-error');
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  function openDialog(config) {
    var dialog = ensureDialog();
    if (config.screenId) dialog.dataset.screenId = config.screenId;
    else delete dialog.dataset.screenId;
    dialog.className = 'service-dialog' + (config.dialogClass ? ' ' + config.dialogClass : '');
    MIQCommon.view.set(dialog,"innerHTML",'<form class="service-dialog__form" novalidate>'
      + '<header class="service-dialog__head"><h2>' + esc(config.title) + '</h2>'
      + '<button class="service-dialog__close" type="button" aria-label="닫기">×</button></header>'
      + '<div class="service-dialog__body">' + config.body + '</div>'
      + '<footer class="service-dialog__foot"><button class="service-dialog__button" type="button" data-dialog-cancel>취소</button>'
      + '<button class="service-dialog__button primary" type="submit">' + esc(config.confirmLabel || '저장') + '</button></footer></form>');
    var form = dialog.querySelector('form');
    dialog.querySelector('.service-dialog__close').addEventListener('click', function () { closeDialog(dialog); });
    dialog.querySelector('[data-dialog-cancel]').addEventListener('click', function () { closeDialog(dialog); });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var shouldClose = config.onConfirm ? config.onConfirm(form, dialog) !== false : true;
      if (shouldClose) closeDialog(dialog);
    });
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else MIQCommon.view.call(dialog,"setAttribute",['open','']);
    if (config.onOpen) config.onOpen(form, dialog);
    var focusTarget = dialog.querySelector('input:not([readonly]), select, textarea, button');
    if (focusTarget) focusTarget.focus();
    return dialog;
  }

  function showToast(message, undo) {
    var old = document.querySelector('.service-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.className = 'service-toast';
    MIQCommon.view.call(toast,"setAttribute",['role','status']);
    MIQCommon.view.set(toast,"innerHTML",'<span>' + esc(message) + '</span>' + (undo ? '<button type="button">실행 취소</button>' : ''));
    if (undo) toast.querySelector('button').addEventListener('click', function () {
      undo();
      toast.remove();
    });
    document.body.appendChild(toast);
    window.setTimeout(function () { if (toast.isConnected) toast.remove(); }, 6000);
  }

  function selectedSupplyRows() {
    return Array.prototype.filter.call(tbody.querySelectorAll('.item-check'), function (check) {
      return check.checked && !check.closest('tr').hidden;
    }).map(function (check) { return check.closest('tr'); });
  }

  function syncSupplySelection() {
    if (page !== 'supply') return;
    var selected = selectedSupplyRows();
    var count = document.getElementById('selection-count');
    var reset = document.getElementById('reset-selected');
    var all = document.getElementById('check-all');
    var visibleChecks = Array.prototype.filter.call(tbody.querySelectorAll('.item-check'), function (check) {
      return !check.closest('tr').hidden;
    });
    if (count) MIQCommon.view.set(count,"textContent",selected.length + '개 선택');
    if (reset) reset.disabled = selected.length === 0;
    if (all) {
      all.checked = visibleChecks.length > 0 && selected.length === visibleChecks.length;
      all.indeterminate = selected.length > 0 && selected.length < visibleChecks.length;
    }
  }

  function openSupplyBatch() {
    var selected = selectedSupplyRows();
    if (!selected.length) return;
    var names = selected.map(function (row) {
      return row.dataset.name + ' · ' + rowInfo(row).vin;
    });
    openDialog({
      title: '선택 항목 교체 완료',
      confirmLabel: selected.length + '개 항목 처리',
      body: '<div class="service-dialog__summary"><strong>처리 대상 ' + selected.length + '개</strong>'
        + '<ul>' + names.map(function (name) { return '<li>' + esc(name) + '</li>'; }).join('') + '</ul>'
        + '<p style="margin-top:8px">처리하면 사용시간이 0H로 초기화되고 상태가 정상으로 변경됩니다.</p></div>',
      onConfirm: function () {
        var snapshots = selected.map(function (row) {
          var button = row;
          var progress = row.querySelector('.progress');
          return { row: row, used: button.dataset.used, className: progress.className, html: MIQCommon.view.get(progress,"innerHTML"), state: row.dataset.supplyState };
        });
        selected.forEach(function (row) {
          var button = row;
          button.dataset.used = '0';
          row.querySelector('.item-check').checked = false;
          row.classList.add('reset-row');
          supplyProgress(row);
        });
        syncSupplySelection();
        applyFilters(selected.length + '개 항목을 교체 완료로 처리했습니다.');
        showToast(selected.length + '개 항목을 교체 완료로 처리했습니다.', function () {
          snapshots.forEach(function (snap) {
            var button = snap.row;
            var progress = snap.row.querySelector('.progress');
            button.dataset.used = snap.used;
            progress.className = snap.className;
            MIQCommon.view.set(progress,"innerHTML",snap.html);
            snap.row.dataset.supplyState = snap.state;
            snap.row.classList.remove('reset-row');
          });
          applyFilters('교체 완료 처리를 취소했습니다.');
          showToast('교체 완료 처리를 취소했습니다.');
        });
      }
    });
  }

  function errorDetails(button) {
    var row = button.closest('tr');
    var info = rowInfo(row);
    var cells = row.cells;
    var code = cells[4].querySelector('.errcode__main').childNodes[0].nodeValue.trim();
    var level = cells[4].querySelector('.level') ? MIQCommon.view.get(cells[4].querySelector('.level'),"textContent").trim() : '-';
    var sub = cells[4].querySelector('.errcode__sub') ? MIQCommon.view.get(cells[4].querySelector('.errcode__sub'),"textContent").trim() : '-';
    return {
      info: info,
      state: MIQCommon.view.get(cells[2],"textContent").trim(),
      type: MIQCommon.view.get(cells[3],"textContent").trim(),
      code: code,
      level: level,
      sub: sub,
      description: MIQCommon.view.get(cells[5],"textContent").trim(),
      date: MIQCommon.view.get(cells[6],"textContent").replace(/\s+/g, ' ').trim()
    };
  }

  function openErrorPrint(button) {
    var d = errorDetails(button);
    var dialog = openDialog({
      title: '에러 조치 정보',
      screenId: 'LQ-SVC-004-P01',
      confirmLabel: '인쇄 / PDF 저장',
      body: MIQServiceErrors.documentHtml(d),
      onConfirm: function (form, dialog) {
        body.classList.add('is-printing-error');
        window.print();
        window.setTimeout(function () { body.classList.remove('is-printing-error'); }, 0);
        return false;
      }
    });
    var identity = dialog.querySelector('.service-dialog__summary > strong');
    if (identity) {
      makeVinLink(identity, d.info);
      identity.appendChild(document.createTextNode(' · ' + d.info.model));
    }
  }

  function enhanceErrorActions() {
    if (page !== 'error') return;
    rows.forEach(function (row) { Array.prototype.forEach.call(row.querySelectorAll('span.pdf'), function (span) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = span.className;
      MIQCommon.view.call(button,"setAttribute",['data-error-pdf','']);
      MIQCommon.view.call(button,"setAttribute",['aria-label',rowInfo(span.closest('tr')).vin + ' 에러 조치 정보 열기']);
      MIQCommon.view.set(button,"textContent",'PDF');
      span.replaceWith(button);
    }); });
  }

  function applyUrlState() {
    var params = new URLSearchParams(location.search);
    filterState.companyId = (accountPolicy.group && accountPolicy.companyId) || params.get('companyId') || '';
    filterState.vehicle = params.get('veh') || params.get('vehicle') || '';
    filterState.group = accountPolicy.group || params.get('group') || '';
    filterState.type = params.get('type') || '';
    filterState.supplyState = page === 'supply' ? (params.get('state') || '') : '';
    var requestedErrorState = page === 'error' ? String(params.get('state') || '').toLowerCase() : '';
    filterState.errorState = ({ current: 'current', now: 'current', active: 'current', '현재': 'current', past: 'past', history: 'past', resolved: 'past', '과거': 'past' })[requestedErrorState] || '';

    var company = document.querySelector('[data-target-company]');
    if (company && filterState.companyId) {
      var companyOption = Array.prototype.filter.call(company.options, function (option) {
        return option.value === filterState.companyId || normalize(MIQCommon.view.get(option,"textContent")).indexOf(normalize(filterState.companyId)) > -1;
      })[0];
      if (companyOption) company.value = companyOption.value;
    }
    if (company && !filterState.companyId) filterState.companyId = company.value;

    var vehicle = document.querySelector('[data-target-vehicle]');
    if (vehicle && filterState.vehicle) {
      var option = Array.prototype.filter.call(vehicle.options, function (item) {
        return normalize(item.value) === normalize(filterState.vehicle);
      })[0];
      if (!option) {
        option = document.createElement('option');
        option.value = filterState.vehicle;
        MIQCommon.view.set(option,"textContent",filterState.vehicle);
        vehicle.appendChild(option);
      }
      vehicle.value = option.value;
      vehicle.dispatchEvent(new Event('change', { bubbles: true }));
    } else if (vehicle && vehicle.value) {
      filterState.vehicle = vehicle.value;
    }

    var period = (params.get('period') || '').toLowerCase();
    var periodWords = { day: '일', d: '일', week: '주', w: '주', month: '월', m: '월', custom: '사용자설정', c: '사용자설정' };
    if (periodWords[period]) {
      Array.prototype.forEach.call(document.querySelectorAll('.period-tabs button'), function (button) {
        button.classList.toggle('active', MIQCommon.view.get(button,"textContent").replace(/\s+/g, '') === periodWords[period]);
      });
    }

    var inputs = document.querySelectorAll('.miq-period-filter input[type="date"], .finder input[type="date"]');
    if (inputs.length) {
      periodControlsReady = true;
      if (params.get('from')) inputs[0].value = params.get('from');
      if (inputs[1] && params.get('to')) inputs[1].value = params.get('to');
      filterState.from = inputs[0].value;
      filterState.to = inputs[1] ? inputs[1].value : inputs[0].value;
    }
  }

  document.addEventListener('miq:target-change', function (event) {
    if (initialized && mapSupplyItems !== null) clearMapSupplyItems();
    scopeContext = event.detail || scopeContext;
    filterState.companyId = (accountPolicy.group && accountPolicy.companyId) || event.detail && event.detail.companyId || '';
    filterState.vehicle = event.detail && event.detail.equipmentId || '';
    filterState.group = accountPolicy.group || event.detail && event.detail.group || '';
    filterState.type = event.detail && event.detail.type || '';
    enhanceVinLinks();
    applyFilters();
  });
  document.addEventListener('miq:period-change', function (event) {
    periodControlsReady = true;
    filterState.from = event.detail && event.detail.startDate || '';
    filterState.to = event.detail && event.detail.endDate || '';
    var periodCodes = { D: 'd', W: 'w', M: 'm', C: 'c' };
    var periodCode = periodCodes[event.detail && event.detail.periodTypeCode] || 'm';
    var url = new URL(location.href);
    url.searchParams.set('period', periodCode);
    if (filterState.from && filterState.to) {
      url.searchParams.set('from', filterState.from);
      url.searchParams.set('to', filterState.to);
    } else {
      url.searchParams.delete('from');
      url.searchParams.delete('to');
    }
    history.replaceState({}, '', url.pathname + '?' + url.searchParams.toString() + url.hash);
    document.dispatchEvent(new CustomEvent('miq:query-change', {
      detail: { query: url.searchParams.toString() }
    }));
    enhanceVinLinks();
    applyFilters();
  });
  document.addEventListener('change', function (event) {
    if (page === 'supply' && event.target.matches('.item-check, #check-all')) {
      if (event.target.id === 'check-all') {
        var checked=event.target.checked;
        Array.prototype.forEach.call(tbody.querySelectorAll('.item-check'),function(check){if(!check.closest('tr').hidden)check.checked=checked;});
      }
      syncSupplySelection();
    }
  });
  document.addEventListener('click', function (event) {
    var errorButton = event.target.closest('[data-error-pdf]');
    if (errorButton) {
      event.preventDefault();
      openErrorPrint(errorButton);
    }
  });
  document.addEventListener('click', function (event) {
    var reset = event.target.closest('#reset-selected');
    if (reset && page === 'supply') {
      event.preventDefault();
      event.stopImmediatePropagation();
      openSupplyBatch();
    }
  }, true);

  collectRows();
  initializeDemoRows();
  collectRows();
  initializeSupplyRows();
  collectRows();
  applyServiceRole();
  fitServiceColumns();
  enhanceVinLinks();
  enhanceSorting();
  enhanceErrorActions();
  applyUrlState();
  enhanceVinLinks();
  sortRows();
  initialized = true;
  applyFilters();
  syncSupplySelection();


})();
