/* MACHINE IQ map / management functional enhancement layer.
   It intentionally augments, rather than replaces, the existing local mock-up DOM. */
(function () {
  'use strict';

  var body = document.body;
  var section = MIQCommon.view.call(body,"getAttribute",['data-gnb']) || '';
  var page = MIQCommon.view.call(body,"getAttribute",['data-sub']) || '';
  var query = new URLSearchParams(window.location.search);
  var managementHeader = window.MIQManagementHeader || null;
  // The management vehicle seed contains 42 vehicles across these four groups.
  var customerVehicleGroupTotals = { '미배정': 2, '기본그룹': 18, '테스트그룹': 12, '물류1팀': 10 };

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var common = window.MIQCommon;
  var norm = common.search.normalize;
  function currentDemoRequests(legacy, ageDays) {
    return legacy.map(function (record, index) {
      var date = common.dates.addDays(common.dates.today(), -ageDays[index]);
      var registered = common.dates.format(date) + record.registered.slice(10);
      var processed = '';
      if (record.processed) {
        var elapsed = Date.parse(record.processed.replace(' ', 'T')) - Date.parse(record.registered.replace(' ', 'T'));
        var completed = new Date(Date.parse(registered.replace(' ', 'T')) + elapsed);
        processed = common.dates.format(completed) + ' ' + String(completed.getHours()).padStart(2, '0') + ':' + String(completed.getMinutes()).padStart(2, '0');
      }
      return Object.assign({}, record, { registered: registered, processed: processed, demoDateRevision: '20260915-current' });
    });
  }
  function initRequestPeriod(onChange) {
    var control = document.querySelector('[data-request-period-control]');
    control.addEventListener('click', function (event) {
      var selected = event.target.closest('[data-request-period]');
      if (!selected || !control.contains(selected)) return;
      Array.prototype.forEach.call(control.querySelectorAll('[data-request-period]'), function (button) {
        var active = button === selected;
        button.classList.toggle('active', active);
        MIQCommon.view.call(button,"setAttribute",['aria-pressed',active ? 'true' : 'false']);
      });
      // The existing 조회 button applies this draft together with the other filters.
    });
    return {
      read: function () {
        var active = control.querySelector('[data-request-period].active');
        return common.dates.requestRange(active ? active.dataset.requestPeriod : 'm', new Date());
      }
    };
  }
  function initRejectionReason(textarea, type, error) {
    var reasons = type === 'account' ? [
      ['company_affiliation', '업체·소속 정보 확인', '업체 또는 소속 정보를 확인해 주세요.'],
      ['representative_information', '대표자 정보 확인', '대표자 정보를 확인해 주세요.'],
      ['duplicate_request', '중복 신청', '이미 접수된 신청입니다.']
    ] : [
      ['vehicle_information', '차량 정보 불일치', '차대번호 또는 기종 정보가 일치하지 않습니다.'],
      ['duplicate_terminal', '단말기 중복 등록', '해당 단말기 ID가 이미 다른 차량에 등록되어 있습니다.'],
      ['vehicle_connection', '차량 연결 정보 확인', '차량 소유 또는 연결 정보를 확인해 주세요.'],
      ['duplicate_request', '중복 신청', '이미 접수된 신청입니다.']
    ];
    var select = document.createElement('select');
    select.className = 'inp mm-rejection-select';
    select.id = textarea.id + 'Type';
    MIQCommon.view.call(select,"setAttribute",['aria-label','반려 사유 선택']);
    select.required = true;
    MIQCommon.view.set(select,"innerHTML",'<option value="">사유 선택</option>' + reasons.map(function (reason) {
      return '<option value="' + reason[0] + '">' + esc(reason[1]) + '</option>';
    }).join('') + '<option value="custom">직접 입력</option>');
    textarea.parentNode.insertBefore(select, textarea);
    var label = document.querySelector('label[for="' + textarea.id + '"]');
    if (label) label.htmlFor = select.id;
    textarea.classList.add('mm-rejection-input');
    MIQCommon.view.call(textarea,"setAttribute",['aria-label','직접 입력 반려 사유']);
    MIQCommon.view.set(textarea,"placeholder",'신청자에게 안내할 반려 사유를 입력해 주세요.');
    function clearError() {
      error.classList.add('is-hidden');
      select.removeAttribute('aria-invalid');
      textarea.removeAttribute('aria-invalid');
    }
    function sync() {
      var custom = select.value === 'custom';
      var selected = reasons.filter(function (reason) { return reason[0] === select.value; })[0];
      textarea.value = selected ? selected[2] : '';
      textarea.classList.toggle('is-hidden', !custom);
      textarea.disabled = !custom;
      textarea.required = custom;
      clearError();
    }
    select.addEventListener('change', function () { sync(); if (select.value === 'custom') textarea.focus(); });
    textarea.addEventListener('input', clearError);
    sync();
    return {
      reset: function () { select.value = ''; sync(); },
      read: function () {
        var selected = reasons.filter(function (reason) { return reason[0] === select.value; })[0];
        var custom = select.value === 'custom';
        var value = custom ? textarea.value.trim() : selected ? selected[2] : '';
        if (!value || (custom && textarea.maxLength > 0 && value.length > textarea.maxLength)) {
          var field = custom ? textarea : select;
          MIQCommon.view.set(error,"textContent",custom ? '반려 사유를 입력해 주세요. (최대 ' + textarea.maxLength + '자)' : '반려 사유를 선택해 주세요.');
          error.classList.remove('is-hidden');
          MIQCommon.view.call(field,"setAttribute",['aria-invalid','true']);
          field.focus();
          return null;
        }
        return { type:select.value, reason:value };
      }
    };
  }
  function nowText() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function toast(message, tone) {
    var old = document.querySelector('.mm-toast');
    if (old) old.remove();
    var node = document.createElement('div');
    node.className = 'mm-toast' + (tone ? ' is-' + tone : '');
    MIQCommon.view.call(node,"setAttribute",['role','status']);
    MIQCommon.view.call(node,"setAttribute",['aria-live','polite']);
    MIQCommon.view.set(node,"textContent",message);
    document.body.appendChild(node);
    requestAnimationFrame(function () { node.classList.add('is-visible'); });
    window.setTimeout(function () {
      node.classList.remove('is-visible');
      window.setTimeout(function () { if (node.parentNode) node.remove(); }, 220);
    }, 2600);
  }
  function setQuery(values, remove) {
    var u = new URL(window.location.href);
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value === '' || value == null) u.searchParams.delete(key);
      else u.searchParams.set(key, value);
    });
    (remove || []).forEach(function (key) { u.searchParams.delete(key); });
    history.replaceState(null, '', u.href);
    query = u.searchParams;
  }
  function managementRole() {
    var candidate = managementHeader && managementHeader.roleCode ? managementHeader.roleCode : query.get('role');
    return common.roles.resolve(candidate);
  }
  function hasCapability(capability) {
    return common.roles.hasCapability(managementRole(), capability);
  }
  function setRole(select) {
    var role = managementRole();
    if (select) select.value = role;
    return role;
  }
  function setColumnVisible(table, index, visible) {
    if (!table) return;
    Array.prototype.forEach.call(table.rows, function (row) {
      if (row.children[index]) row.children[index].classList.toggle('mm-role-hidden', !visible);
    });
  }
  function addEmpty(tbody, message) {
    if (tbody.querySelector('.mm-empty')) return;
    var row = document.createElement('tr');
    row.className = 'mm-empty';
    MIQCommon.view.set(row,"innerHTML",'<td colspan="' + MIQTableLayout.columnCount(tbody.closest('table')) + '">' + esc(message) + '</td>');
    tbody.appendChild(row);
  }
  function clearEmpty(tbody) {
    var row = tbody.querySelector('.mm-empty');
    if (row) row.remove();
  }
  function bindTabArrowKeys(tabList) {
    if (!tabList || tabList.dataset.mmArrowKeysReady) return;
    tabList.dataset.mmArrowKeysReady = '1';
    tabList.addEventListener('keydown', function (event) {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].indexOf(event.key) < 0) return;
      var tabs = Array.prototype.filter.call(tabList.querySelectorAll('[role="tab"]'), function (button) {
        return !button.classList.contains('is-hidden') && button.offsetParent !== null;
      });
      if (!tabs.length) return;
      var index = tabs.indexOf(document.activeElement);
      if (event.key === 'Home') index = 0;
      else if (event.key === 'End') index = tabs.length - 1;
      else if (event.key === 'ArrowRight') index = (Math.max(index, -1) + 1) % tabs.length;
      else index = (index <= 0 ? tabs.length : index) - 1;
      event.preventDefault();
      tabs[index].click();
      tabs[index].focus();
    });
  }

  /* ───────────────────────────────────────────── Map */
  function initMap() {
    var map = document.getElementById('map');
    var tbody = document.getElementById('eqBody');
    if (!map || !tbody || !window.MIQ || (!MIQ.FLEET_CATALOG && !MIQ.FLEET)) return;

    /* nav.js normalizes the hierarchy before this module starts on DOMContentLoaded.
       Re-read the canonical URL/context so the map never restores a stale bare group. */
    query = new URLSearchParams(window.location.search);
    var initialTarget = window.MIQ_TARGET_CONTEXT || null;
    var hasInitialTarget = !!(initialTarget && initialTarget.profile);
    var scopeContext = initialTarget;

    var vinMap = {};
    var mapFleet = MIQ.FLEET_CATALOG || MIQ.FLEET;
    if (['dealer_staff', 'customer_staff'].indexOf(managementRole()) > -1) mapFleet = common.roles.filterVehicles(managementRole(), mapFleet);
    mapFleet.forEach(function (vehicle) { vinMap[vehicle.vin] = vehicle; });
    var filters = {
      companyId: hasInitialTarget ? (initialTarget.companyId || 'all') : (query.get('companyId') || 'all'),
      group: hasInitialTarget ? (initialTarget.group || '') : (query.get('group') || ''),
      type: hasInitialTarget ? (initialTarget.type || '') : (query.get('type') || ''),
      connection: query.get('connection') || '',
      operation: query.get('operation') || '',
      fault: query.get('fault') || (query.get('state') === 'current' ? 'current' : ''),
      vehicle: hasInitialTarget ? (initialTarget.equipmentId || '') : (query.get('veh') || '')
    };
    var routeMode = query.get('route') === '1';
    var restoreRouteVin = query.get('routeVin');
    var routeToday = window.MIQMeeting ? MIQMeeting.hourlyWindow().date : common.dates.format(new Date());
    var routePeriod = /^[dwm]$/.test(query.get('routePeriod') || '') ? query.get('routePeriod') : 'd';
    var routeFrom = common.dates.parse(query.get('routeFrom')) ? query.get('routeFrom') : routeToday;
    var routeTo = common.dates.parse(query.get('routeTo')) ? query.get('routeTo') : routeFrom;
    if (routeFrom > routeTo) routeTo = routeFrom;
    var routeRequestId = 0;
    var applying = false;

    var toolbar = document.createElement('div');
    toolbar.className = 'mm-map-toolbar' + (routeMode ? ' is-route' : '');
    MIQCommon.view.set(toolbar,"innerHTML",'<div class="mm-map-toolbar__modes" role="group" aria-label="지도 표시 모드">' +
        '<button type="button" data-mm-map-mode="position" class="' + (routeMode ? '' : 'is-active') + '">현재 위치</button>' +
        '<button type="button" data-mm-map-mode="route" class="' + (routeMode ? 'is-active' : '') + '">차량 경로 조회</button>' +
      '</div>' +
      '<div class="mm-map-toolbar__date" role="group" aria-label="이동 경로 조회 기간">' +
        '<label class="mm-route-vehicle">차량 <select data-mm-route-vehicle aria-label="경로 조회 차량"><option value="">차량 선택</option></select></label>' +
        '<div class="mm-map-toolbar__modes" aria-label="경로 기간 단위">' +
          '<button type="button" data-mm-route-period="d">일</button><button type="button" data-mm-route-period="w">주</button><button type="button" data-mm-route-period="m">월</button>' +
        '</div><input type="date" aria-label="경로 시작일" data-mm-route-from value="' + routeFrom + '"> ~ ' +
        '<input type="date" aria-label="경로 종료일" data-mm-route-to value="' + routeTo + '">' +
        '<button type="button" class="btn-search" data-mm-route-search>경로 조회</button>' +
        '<span class="mm-route-legend"><i class="start"></i>시작 <i class="end"></i>종료</span>' +
      '</div>' +
      '<div class="mm-map-toolbar__filters" data-mm-map-filters></div>' +
      '<span class="mm-map-toolbar__hint" data-mm-map-hint>아래 장비목록의 차대번호를 누르면 지도에서 차량이 선택됩니다.</span>');
    map.parentNode.insertBefore(toolbar, map);

    function rowFault(row) {
      if(!row.children)return Number(row.err)||0;
      var cell = row.children[6];
      return cell ? parseInt(MIQCommon.view.get(cell,"textContent").replace(/[^0-9-]/g, ''), 10) || 0 : 0;
    }
    function rowRun(row) {
      if(!row.children)return Number(row.runH)||0;
      var cell = row.children[3];
      return cell ? parseFloat(MIQCommon.view.get(cell,"textContent").replace(/[^0-9.-]/g, '')) || 0 : 0;
    }
    function allowed(row) {
      var vin = row.getAttribute?MIQCommon.view.call(row,"getAttribute",['data-vin']):row.vin;
      var vehicle = vinMap[vin];
      if (!vehicle && ['dealer_staff', 'customer_staff'].indexOf(managementRole()) > -1) return false;
      if (filters.companyId !== 'all' && (!vehicle || String(vehicle.companyId || '1933') !== String(filters.companyId))) return false;
      if (filters.group && (!vehicle || vehicle.group !== filters.group)) return false;
      if (filters.type && (!vehicle || vehicle.type !== filters.type)) return false;
      if (filters.vehicle && filters.vehicle !== vin) return false;
      if (filters.connection === 'connected' && (!vehicle || vehicle.conn !== true)) return false;
      if (filters.connection === 'disconnected' && (!vehicle || vehicle.conn !== false)) return false;
      if (filters.operation === 'running' && rowRun(row) <= 0) return false;
      if (filters.operation === 'idle' && rowRun(row) > 0) return false;
      if (filters.fault && rowFault(row) <= 0) return false;
      return true;
    }
    function detailUrl(vin, from) {
      var p = new URLSearchParams();
      var vehicle = vinMap[vin];
      var selectedCompany = query.get('companyId');
      if (query.get('role')) p.set('role', query.get('role'));
      p.set('veh', vin);
      p.set('from', from || 'map');
      p.set('companyId', selectedCompany && selectedCompany !== 'all'
        ? selectedCompany
        : (vehicle && vehicle.companyId) || '1933');
      if (vehicle) {
        p.set('model', vehicle.model);
        p.set('group', query.get('group') || vehicle.group);
        p.set('type', vehicle.type);
      } else if (query.get('group')) {
        p.set('group', query.get('group'));
      }
      return '../Vehicle%20Detail/vehicle-detail-tobe.html?' + p.toString();
    }
    MIQMapData.detailUrl = detailUrl;
    function decorateRows() {
      Array.prototype.forEach.call(tbody.querySelectorAll('tr[data-vin]'), function (row) {
        row.tabIndex = 0;
        var cell = row.querySelector('td.vin');
        if (cell && !cell.querySelector('[data-mm-map-select]')) {
          var vin = MIQCommon.view.call(row,"getAttribute",['data-vin']);
          MIQCommon.view.set(cell,"innerHTML",'<button type="button" class="mm-map-select" data-mm-map-select aria-label="' + esc(vin) + ' 지도에서 선택">' + esc(vin) + '</button>');
          cell.querySelector('button').addEventListener('click', function (event) {
            event.stopPropagation();
            MIQMapData.select(vin);
            if (event.detail === 0) {
              var nextRow = Array.prototype.find.call(tbody.querySelectorAll('tr[data-vin]'), function (item) { return MIQCommon.view.call(item,"getAttribute",['data-vin']) === vin; });
              var nextButton = nextRow && nextRow.querySelector('[data-mm-map-select]');
              if (nextButton) nextButton.focus({ preventScroll: true });
            }
          });
        }
        var selectButton = cell && cell.querySelector('[data-mm-map-select]');
        if (selectButton) MIQCommon.view.call(selectButton,"setAttribute",['aria-pressed',String(row.classList.contains('sel'))]);
        if (!row.dataset.mmKeyboard) {
          row.dataset.mmKeyboard = '1';
          row.addEventListener('keydown', function (event) {
            if (event.target !== row || event.repeat) return;
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.click(); }
          });
        }
      });
    }
    function updatePopupLink() {
      var link = document.querySelector('.map-pop__go');
      var vin = selectedVin();
      if (link && vin) link.href = detailUrl(vin, 'map-popup');
    }
    function selectedVin() {
      var visible=MIQMapData.getVisibleRows(),vin=MIQMapData.getSelectedVin()||filters.vehicle||'';
      return visible.some(function(row){return row.vin===vin;})?vin:'';
    }
    var routeVehicleKey='';
    function syncRouteVehicles(rows,vin){
      var select=toolbar.querySelector('[data-mm-route-vehicle]');
      var key=rows.map(function(row){return row.vin;}).join('|');
      if(key!==routeVehicleKey){
        routeVehicleKey=key;select.replaceChildren();
        var placeholder=document.createElement('option');placeholder.value='';MIQCommon.view.set(placeholder,"textContent",'차량 선택');select.appendChild(placeholder);
        rows.forEach(function(row){var option=document.createElement('option');option.value=row.vin;MIQCommon.view.set(option,"textContent",row.vin+' · '+row.model);select.appendChild(option);});
      }
      select.value=vin;
    }
    function renderRoute() {
      var vin = selectedVin();
      var rows=MIQMapData.getVisibleRows();
      var visible = rows.map(function(row){return row.vin;});
      syncRouteVehicles(rows,vin);
      if(routeMode&&(query.get('routeVin')||'')!==vin)setQuery({routeVin:vin||null});
      if (window.MIQGoogleMap) MIQGoogleMap.sync({ visibleVins: visible, selectedVin: vin, routeMode: routeMode, from: routeFrom, to: routeTo, requestId: routeRequestId });
      MIQCommon.view.set(toolbar.querySelector('[data-mm-map-hint]'),"textContent",routeMode && vin
        ? vin + ' · ' + routeFrom + (routeFrom === routeTo ? '' : ' ~ ' + routeTo) + ' 이동 경로'
        : routeMode?'차량과 기간을 선택한 뒤 경로를 조회하세요.':'아래 장비목록의 차대번호를 누르면 지도에서 차량이 선택됩니다.');
    }    function paintFilterChips() {
      var box = toolbar.querySelector('[data-mm-map-filters]');
      var items = [];
      if (filters.connection) items.push('통신 · ' + (filters.connection === 'connected' ? '연결' : '미연결'));
      if (filters.operation) items.push('가동 · ' + (filters.operation === 'running' ? '가동' : '유휴'));
      if (filters.fault) items.push('현재 Fault');
      MIQCommon.view.set(box,"innerHTML",items.map(function (item) { return '<span class="mm-filter-chip">' + esc(item) + '</span>'; }).join(''));
    }
    function currentScopeTarget() {
      var target = {};
      if (scopeContext) {
        Object.keys(scopeContext).forEach(function (key) { target[key] = scopeContext[key]; });
      }
      target.companyId = filters.companyId;
      target.group = filters.group || null;
      target.type = filters.type || null;
      target.equipmentId = filters.vehicle || null;
      if (!target.scopePath && (!Array.isArray(target.scopeSegments) || !target.scopeSegments.length)) {
        var segments = [];
        if (filters.companyId !== 'all') {
          var companySelect = document.querySelector('[data-target-company]');
          var companyOption = companySelect && companySelect.options[companySelect.selectedIndex];
          var companyLabel = companyOption
            ? companyOption.text.replace(/\s*·\s*\d+대\s*$/, '')
            : '선택 업체';
          segments.push({ key: 'company', label: companyLabel });
        }
        if (filters.group) segments.push({ key: 'group', label: filters.group });
        if (filters.type) segments.push({ key: 'type', label: filters.type });
        if (filters.vehicle) {
          var selectedVehicle = vinMap[filters.vehicle];
          segments.push({
            key: 'vehicle',
            label: selectedVehicle ? selectedVehicle.vin + ' · ' + selectedVehicle.model : filters.vehicle
          });
        }
        target.scopeSegments = segments;
      }
      return target;
    }
    function renderMapScope(count) {
      MIQ.renderScopeSummary(document.getElementById('mapScopeSummary'), currentScopeTarget(), {
        countLabel: '차량',
        count: count,
        countUnit: '대',
        includeVehicle: true
      });
      updateSummaryLinks();
    }
    function updateSummaryLinks() {
      var target = currentScopeTarget();
      var windowNow = MIQMeeting.hourlyWindow();
      var paths = {
        owned: '../Vehicle%20Summary/vehicle-summary-tobe-3.html',
        fault: '../Service/service-error-tobe.html',
        shock: '../Shock/shock-tobe.html',
        supply: '../Service/service-supply-tobe.html'
      };
      map.querySelectorAll('[data-map-summary-link]').forEach(function (link) {
        var kind = link.dataset.mapSummaryLink;
        var url = new URL(paths[kind], location.href);
        url.searchParams.set('role', managementRole());
        url.searchParams.set('source', 'map');
        [['companyId', target.companyId], ['group', target.group], ['type', target.type],
          ['veh', target.equipmentId], ['lang', query.get('lang')]].forEach(function (pair) {
          if (pair[1]) url.searchParams.set(pair[0], pair[1]);
        });
        if (kind === 'fault') {
          // Use the same frozen hourly sample as the count, including its date boundary.
          Object.entries({period:'d', from:windowNow.date, to:windowNow.date,
            dashboardSample:'current', sampleDate:windowNow.date, sampleTo:windowNow.to
          }).forEach(function (pair) { url.searchParams.set(pair[0], pair[1]); });
        } else if (kind === 'supply') {
          url.searchParams.set('state', 'need');
          var visibleVins = new Set(MIQMapData.getVisibleRows().map(function (row) { return row.vin; }));
          var items = MIQServiceRecords.records.filter(function (record) {
            return record.kind === 'supply' && record.supplyState === 'need' && visibleVins.has(record.vin);
          }).map(function (record) { return [record.vin, record.supplyName]; });
          url.searchParams.set('supplyItems', JSON.stringify(items));
        }
        link.href = url.href;
      });
    }
    function updateScopeLabel() {
      var label = '전체차량';
      if (filters.vehicle) {
        var vehicle = vinMap[filters.vehicle];
        label = vehicle ? vehicle.model + ' · ' + vehicle.vin : filters.vehicle;
      } else if (filters.type) {
        label = filters.type;
      } else if (filters.group) {
        label = filters.group;
      } else if (filters.companyId !== 'all') {
        var companySelect = document.querySelector('[data-target-company]');
        var companyOption = companySelect && companySelect.options[companySelect.selectedIndex];
        label = companyOption ? companyOption.text.replace(/\s*·\s*\d+대\s*$/, '') : '선택 업체';
      }
      Array.prototype.forEach.call(document.querySelectorAll('[data-lnb-label]'), function (node) {
        MIQCommon.view.set(node,"textContent",'- ' + label);
      });
    }
    function applyFilters() {
      if (applying) return;
      applying = true;
      MIQMapData.setFilter(allowed);
      MIQMapData.refresh();
      decorateRows();
      renderMapScope(MIQMapData.getVisibleRows().length);
      updatePopupLink();
      paintFilterChips();
      updateScopeLabel();
      renderRoute();
      applying = false;
    }
    var searchInput = document.getElementById('eqQ');
    searchInput.value = query.get('q') || '';
    var searchState = common.search.bind(searchInput, document.getElementById('btnMapSearch'), applyMapSearch);
    function applyMapSearch() {
      setQuery({ q: searchState.value() });
      MIQMapData.setSearch(searchState.value());
      applyFilters();
    }
    applyMapSearch();
    toolbar.querySelector('[data-mm-route-vehicle]').addEventListener('change',function(event){MIQMapData.setSelectedVin(event.target.value);});
    toolbar.addEventListener('click', function (event) {
      var button = event.target.closest('[data-mm-map-mode]');
      if (!button) return;
      routeMode = button.dataset.mmMapMode === 'route';
      Array.prototype.forEach.call(toolbar.querySelectorAll('[data-mm-map-mode]'), function (item) {
        item.classList.toggle('is-active', item === button);
      });
      toolbar.classList.toggle('is-route', routeMode);
      setQuery({ route: routeMode ? '1' : null, routeVin: routeMode ? selectedVin() || null : null });
      renderRoute();
    });
    function paintRoutePeriod() {
      toolbar.querySelectorAll('[data-mm-route-period]').forEach(function(button) {
        var active = button.dataset.mmRoutePeriod === routePeriod;
        button.classList.toggle('is-active', active); MIQCommon.view.call(button,"setAttribute",['aria-pressed',String(active)]);
      });
    }
    toolbar.addEventListener('click', function(event) {
      var preset = event.target.closest('[data-mm-route-period]');
      if (preset) {
        routePeriod = preset.dataset.mmRoutePeriod;
        var anchor = common.dates.parse(toolbar.querySelector('[data-mm-route-to]').value) || common.dates.parse(routeToday);
        var range = routePeriod === 'm' ? common.dates.monthRange(anchor, common.dates.parse(routeToday)) : common.dates.operatingRange(routePeriod, anchor);
        toolbar.querySelector('[data-mm-route-from]').value = range.from;
        toolbar.querySelector('[data-mm-route-to]').value = range.to;
        paintRoutePeriod();
      }
      if (!event.target.closest('[data-mm-route-search]')) return;
      var from = toolbar.querySelector('[data-mm-route-from]').value, to = toolbar.querySelector('[data-mm-route-to]').value;
      if (!common.dates.parse(from) || !common.dates.parse(to) || from > to) { toast('조회 시작일과 종료일을 확인해 주세요.', 'error'); return; }
      if (!selectedVin()) { toast('경로를 조회할 차량을 선택해 주세요.', 'error'); return; }
      routeFrom = from; routeTo = to; routeRequestId++;
      setQuery({routeFrom:routeFrom,routeTo:routeTo,routePeriod:routePeriod,routeVin:selectedVin()}); renderRoute();
    });
    toolbar.querySelector('.mm-map-toolbar__date').addEventListener('keydown',function(event){if(event.key==='Enter'&&event.target.matches('input[type="date"]')){event.preventDefault();toolbar.querySelector('[data-mm-route-search]').click();}});
    paintRoutePeriod();
    document.addEventListener('miq:map-route', function(event) {
      var vin = event.detail && event.detail.vin;
      if (vin && selectedVin() !== vin) MIQMapData.setSelectedVin(vin);
      toolbar.querySelector('[data-mm-map-mode="route"]').click();
    });

    document.getElementById('btnExport').addEventListener('click', function () {
      var rows = MIQMapData.getVisibleRows();
      var columns = ['model', 'vin', 'dataTime', 'runH', 'conn', 'idle', 'err', 'battErr', 'posTime', 'addr'];
      var heads = Array.prototype.map.call(document.querySelectorAll('#eqHead th'), function (th) { return '"' + MIQCommon.view.get(th,"textContent").replace(/[▲▼↕↑↓]/g, '').trim().replace(/"/g, '""') + '"'; });
      var lines = [heads.join(',')].concat(rows.map(function (row) {
        return columns.map(function (key) {
          var value = row[key];
          if (value === null || value === undefined || value === '') value = '-';
          else if (typeof value === 'number') value = common.numbers.integer(value);
          return '"' + String(value).replace(/"/g, '""') + '"';
        }).join(',');
      }));
      var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'MACHINE_IQ_장비목록_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link); link.click(); link.remove();
      window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 0);
      toast('현재 조회 결과 ' + rows.length + '대를 CSV로 내보냈습니다.', 'success');
    });
    document.addEventListener('miq:target-change', function (event) {
      var target = event.detail || {};
      var vin = target.equipmentId;
      scopeContext = target;
      filters.companyId = target.companyId || 'all';
      filters.group = target.group || '';
      filters.type = target.type || '';
      filters.vehicle = vin || '';
      setQuery({ companyId: filters.companyId, group: filters.group || null, type: filters.type || null, veh: filters.vehicle || null });
      window.setTimeout(applyFilters, 0);
    });

    // Restore the current scope and zoom before refreshed hourly rows are painted.
    document.addEventListener('miq:map-rendered', function () { if(!applying){decorateRows();renderMapScope(MIQMapData.getVisibleRows().length);updatePopupLink();renderRoute();} });

    applyFilters();
    if (routeMode && restoreRouteVin) {
      MIQMapData.setSelectedVin(restoreRouteVin);
    }
  }

  /* ───────────────────────────────────────────── Management / User */
  function initUser() {
    var table = document.getElementById('userTable');
    if (!table) return;
    var tbody = table.tBodies[0];
    var userRows=Array.from(tbody.querySelectorAll('tr[data-owner]'));
    var userPager=MIQ.createListPager(table.parentElement,{pageSize:20,presentation:'operations',unit:'건',onChange:applyFilters});
    var userRequestPager=MIQ.createListPager(document.getElementById('userRequestBody').closest('.tbl-wrap'),{pageSize:20,presentation:'operations',unit:'건',onChange:renderUserRequests});
    var filterBar = document.querySelector('.filter-bar');
    var search = managementHeader ? managementHeader.getControl('query') : filterBar.querySelector('input');
    var searchButton = filterBar.querySelector('[data-mgmt-search-submit], .btn-search');
    var searchState = managementHeader.bindSearch(search, searchButton, applyFilters);
    var roleSelect = document.getElementById('account-role');
    var currentRole = setRole(roleSelect);
    var roleFilter = managementHeader ? managementHeader.getControl('userRole') : filterBar.querySelector('[data-mgmt-filter="userRole"]');
    var groupFilter = managementHeader ? managementHeader.getControl('groupName') : filterBar.querySelector('[data-mgmt-filter="userGroup"]');
    var userContext = document.getElementById('userContext');
    var userScopeByRoleName = {
      '내부 사용자': 'internal', '딜러 대표': 'dealer_owner', '딜러 직원': 'dealer_staff',
      '고객 대표': 'customer_owner', '고객 직원': 'customer_staff'
    };
    function accessibleVehicleCount(row) {
      var name = MIQCommon.view.get(row.children[2],"textContent").trim();
      var companyName = MIQCommon.view.get(row.children[3],"textContent").trim();
      var group = assignedUserGroup(row);
      if ((name === '고객 대표' || name === '고객 직원') && companyName !== '(주)세종물류중부지점') {
        return { count: null, basis: '조회 가능한 차량 정보가 없습니다.' };
      }
      if (name === '고객 직원') return { count: group === '전체' ? 42 : (customerVehicleGroupTotals[group] || 0), basis: group === '전체' ? '내 업체 전체 그룹' : '소속 그룹' };
      if (name === '딜러 직원') return { count: 11, basis: '담당 업체' };
      if (name === '딜러 대표') return { count: 22, basis: '관리 업체' };
      return { count: 42, basis: name === '고객 대표' ? '내 업체' : '전체 지원 범위' };
    }
    function normaliseCustomerGroup(row) {
      var roleName = MIQCommon.view.get(row.children[2],"textContent").trim();
      var select = row.querySelector('.group-select');
      var view = row.querySelector('.role-view-only');
      if (!select) return;
      if (roleName === '고객 대표') {
        var allOption = Array.prototype.filter.call(select.options, function (option) {
          return option.value === '전체';
        })[0];
        if (!allOption) {
          allOption = document.createElement('option');
          MIQCommon.view.set(allOption,"textContent",'전체');
          select.appendChild(allOption);
        }
        select.value = '전체';
        if (view) MIQCommon.view.set(view,"textContent",'전체');
      } else if (roleName === '고객 직원') {
        var savedGroup = select.value;
        if (!Array.prototype.some.call(select.options, function (option) { return option.value === '전체'; })) {
          var staffAllOption = document.createElement('option');
          MIQCommon.view.set(staffAllOption,"textContent",'전체');
          select.insertBefore(staffAllOption, select.firstChild);
        }
        select.value = savedGroup;
        if (!select.value && select.options.length) select.selectedIndex = 0;
        if (view) MIQCommon.view.set(view,"textContent",select.value);
      }
    }
    function ensureVehicleLink(row) {
      var info = accessibleVehicleCount(row);
      var link = row.querySelector('[data-user-vehicles]');
      if (!link) {
        link = document.createElement('button');
        link.type = 'button';
        link.className = 'mm-count-link mm-user-vehicle-link';
        link.dataset.userVehicles = '';
        row.children[0].appendChild(link);
      }
      MIQCommon.view.call(link,"setAttribute",['aria-label',MIQCommon.view.get(row.children[1],"textContent").trim() + ' 조회 가능 차량 보기']);
      link.disabled = info.count == null;
      link.title = info.count == null ? info.basis : '';
      MIQCommon.view.set(link,"textContent",info.count == null ? '조회 가능 차량 없음' : '조회 차량 ' + info.count + '대');
    }
    Array.prototype.forEach.call(rowsNow(), function (row) {
      normaliseCustomerGroup(row);
      ensureVehicleLink(row);
    });

    // 조회 차량 건수는 기존 차량 목록으로 바로 이동한다.
    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-user-vehicles]');
      if (!trigger) return;
      var row = trigger.closest('tr');
      var group = assignedUserGroup(row);
      var info = accessibleVehicleCount(row);
      if (info.count == null) return;
      var userScope = userScopeByRoleName[MIQCommon.view.get(row.children[2],"textContent").trim()] || currentRole;
      var values = { userScope: userScope };
      if (MIQCommon.view.get(row.children[2],"textContent").trim() === '고객 직원' && group) {
        if (group === '전체') values.userGroup = group;
        else values.group = group;
      }
      location.href = managementHeader.withRole('../Mgmt%20Vehicle/mgmt-vehicle-tobe.html', values);
    });
    var explicitCompany = query.get('company') || '';
    var principals = {
      dealer_owner: 'dealer.park@sejonglog.co.kr', dealer_staff: 'staff.jung@sejonglog.co.kr',
      customer_owner: 'leader.yoon@customer.co.kr', customer_staff: 'user.oh@customer.co.kr'
    };
    var scopeLabels = {
      internal: '전체 업체', dealer_owner: '관리 고객사', dealer_staff: '담당 고객사',
      customer_owner: '', customer_staff: ''
    };
    function rowRole(row) { return row.children[2] ? MIQCommon.view.get(row.children[2],"textContent").trim() : ''; }
    function dealerOwnerForStaff(email) {
      var row = Array.prototype.filter.call(rowsNow(), function (item) { return item.dataset.owner === email; })[0];
      return row && row.dataset.managedBy ? row.dataset.managedBy : principals.dealer_owner;
    }
    function inRoleScope(row) {
      var owner = row.dataset.owner;
      var roleName = rowRole(row);
      if (currentRole === 'internal') return true;
      if (currentRole === 'dealer_owner') {
        return owner === principals.dealer_owner ||
          (row.dataset.managedBy === principals.dealer_owner && (roleName === '딜러 직원' || roleName === '고객 대표'));
      }
      if (currentRole === 'dealer_staff') {
        var dealerOwner = dealerOwnerForStaff(principals.dealer_staff);
        return owner === principals.dealer_staff || (roleName === '고객 대표' && row.dataset.managedBy === dealerOwner);
      }
      if (currentRole === 'customer_owner') {
        return owner === principals.customer_owner || (roleName === '고객 직원' && row.dataset.managedBy === principals.customer_owner);
      }
      return owner === principals.customer_staff;
    }
    function applyPermission() {
      currentRole = managementRole();
      var showGroupColumn = currentRole !== 'dealer_owner' && currentRole !== 'dealer_staff';
      var showManagementColumn = currentRole === 'customer_owner';
      Array.prototype.forEach.call(rowsNow(), function (row) {
        var show = inRoleScope(row);
        var editableCustomerStaff = hasCapability('assignUserGroup') && rowRole(row) === '고객 직원';
        row.classList.toggle('row-hidden', !show);
        Array.prototype.forEach.call(row.querySelectorAll('.group-select'), function (node) { node.classList.toggle('is-hidden', !editableCustomerStaff); });
        Array.prototype.forEach.call(row.querySelectorAll('.role-view-only'), function (node) { node.classList.toggle('is-hidden', editableCustomerStaff); });
        Array.prototype.forEach.call(row.querySelectorAll('td:last-child .role-gated'), function (node) { node.classList.toggle('is-hidden', !editableCustomerStaff); });
      });
      setColumnVisible(table, 3, currentRole !== 'customer_owner' && currentRole !== 'customer_staff');
      setColumnVisible(table, 4, showGroupColumn);
      setColumnVisible(table, 8, showManagementColumn);
      var approvalTab = document.getElementById('userTabApprovalBtn');
      var canApproveRequests = hasCapability('approveUserRequest');
      if (approvalTab) approvalTab.classList.toggle('is-hidden', !canApproveRequests);
      if (!canApproveRequests && activeUserTab === 'approval') setUserTab('list');
    }
    function rowsNow() { return userRows.slice(); }
    function selectedGroup(row) {
      var select = row.querySelector('.group-select');
      var view = row.querySelector('.role-view-only');
      if (select && !select.classList.contains('is-hidden')) return select.value.trim();
      return view ? MIQCommon.view.get(view,"textContent").trim() : '';
    }
    function assignedUserGroup(row) {
      var view = row.querySelector('.role-view-only');
      return view ? MIQCommon.view.get(view,"textContent").trim() : selectedGroup(row);
    }
    function searchableUserText(row) {
      /* 검색 안내에 명시한 ID·이름·연락처와 허용된 기본 소속만 사용한다.
         딜러에게 숨긴 고객 운영그룹이 통합검색으로 노출되지 않게 한다. */
      return [row.dataset.owner, MIQCommon.view.get(row.children[1],"textContent").trim(), MIQCommon.view.get(row.children[2],"textContent").trim(),
        MIQCommon.view.get(row.children[3],"textContent").trim(), MIQCommon.view.get(row.children[5],"textContent").trim()].join(' ');
    }
    function applyFilters() {
      clearEmpty(tbody);
      var q = searchState.read(), role = roleFilter ? roleFilter.value : '', group = groupFilter ? groupFilter.value : '';
      var shown = 0;
      rowsNow().forEach(function (row) {
        var cells = row.children;
        var groupText = selectedGroup(row);
        var pass = (!q || norm(searchableUserText(row)).indexOf(q) > -1) && (!role || MIQCommon.view.get(cells[2],"textContent").trim() === role) && (!group || groupText === group) && (!explicitCompany || MIQCommon.view.get(cells[3],"textContent").trim() === explicitCompany);
        row.classList.toggle('mm-filter-hidden', !pass);
        if (pass && !row.classList.contains('row-hidden')) shown++;
      });
      tbody.replaceChildren.apply(tbody,userPager.slice(rowsNow().filter(function(row){return !row.classList.contains('mm-filter-hidden')&&!row.classList.contains('row-hidden')})));
      setColumnVisible(table,3,currentRole!=='customer_owner'&&currentRole!=='customer_staff');
      setColumnVisible(table,4,currentRole!=='dealer_owner'&&currentRole!=='dealer_staff');
      setColumnVisible(table,8,currentRole==='customer_owner');
      if (!shown) addEmpty(tbody, '조회 조건에 해당하는 사용자가 없습니다.');
      MIQCommon.view.set(document.getElementById('userCount'),"textContent",shown);
      if (userContext) MIQCommon.view.set(userContext,"textContent",scopeLabels[currentRole]);
    }
    var activeUserTab = 'list';
    var activeUserRequestView = 'all';
    var selectedUserRequests = {};
    var modalUserRequests = [];
    var modalUserDecision = 'APRV';
    var userRequestModalTrigger = null;
    var USER_REQUEST_STORAGE_KEY = 'linq.management.userRequests.v2';
    var USER_REQUEST_REFERENCE = nowText();
    var USER_REQUEST_STATUS = {
      REQ: { label: '신청', cls: 'warn' },
      APRV: { label: '승인', cls: 'ok' },
      RJCT: { label: '반려', cls: 'bad' }
    };
    function seedUserRequests() {
      return [
        { id:'UR-20260706-01', email:'kim.jh@sejong.co.kr', name:'김지훈', role:'고객 직원', company:'(주)세종물류중부지점', phone:'010-****-4821', registered:'2026-07-06 09:41', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.customer_owner, group:'' },
        { id:'UR-20260705-01', email:'park.sy@sejong.co.kr', name:'박서연', role:'딜러 직원', company:'세종모터스', phone:'010-****-5720', registered:'2026-07-05 16:22', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260703-01', email:'ceo@daeyoung-eng.co.kr', name:'정대영', role:'딜러 대표', company:'대영엔지니어링(주)', phone:'010-****-3301', registered:'2026-07-03 11:08', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:'internal', group:'전체' },
        { id:'UR-20260702-01', email:'lee.ms@minsoo-log.kr', name:'이민수', role:'고객 대표', company:'민수물류', phone:'010-****-6244', registered:'2026-07-02 14:55', processed:'', status:'REQ', processor:'', processorRole:'', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260621-01', email:'cho.hj@sejong.co.kr', name:'조현지', role:'고객 직원', company:'(주)세종물류중부지점', phone:'010-****-9018', registered:'2026-06-21 13:20', processed:'2026-06-22 10:14', status:'APRV', processor:'윤태호', processorRole:'고객 대표', reason:'', approverId:principals.customer_owner, group:'테스트그룹' },
        { id:'UR-20260612-01', email:'leader.han@hanbit.co.kr', name:'한지민', role:'고객 대표', company:'한빛산업', phone:'010-****-1184', registered:'2026-06-12 08:44', processed:'2026-06-13 11:08', status:'APRV', processor:'박민아', processorRole:'딜러 대표', reason:'', approverId:principals.dealer_owner, group:'전체' },
        { id:'UR-20260530-01', email:'dealer.temp@sejonglog.co.kr', name:'강도윤', role:'딜러 직원', company:'세종모터스', phone:'010-****-7732', registered:'2026-05-30 16:12', processed:'2026-06-01 09:21', status:'RJCT', processor:'박민아', processorRole:'딜러 대표', reason:'재직 확인 서류가 첨부되지 않았습니다.', approverId:principals.dealer_owner, group:'전체' }
      ];
    }
    function loadUserRequests() {
      var legacy = seedUserRequests();
      var current = currentDemoRequests(legacy, [1, 2, 3, 4, 10, 16, 22]);
      try {
        var saved = JSON.parse(sessionStorage.getItem(USER_REQUEST_STORAGE_KEY) || 'null');
        if (Array.isArray(saved)) {
          var migrated = saved.map(function (record) {
            var index = legacy.findIndex(function (seed) { return seed.id === record.id; });
            var seed = legacy[index];
            if (!seed || record.demoDateRevision || record.registered !== seed.registered || record.processed !== seed.processed || record.status !== seed.status) return record;
            return Object.assign({}, record, { registered: current[index].registered, processed: current[index].processed, demoDateRevision: current[index].demoDateRevision });
          });
          try { sessionStorage.setItem(USER_REQUEST_STORAGE_KEY, JSON.stringify(migrated)); } catch (ignoreWrite) {}
          return migrated;
        }
      } catch (error) {}
      return current;
    }
    var userRequests = loadUserRequests();
    function saveUserRequests() {
      try { sessionStorage.setItem(USER_REQUEST_STORAGE_KEY, JSON.stringify(userRequests)); } catch (error) {}
    }
    function userApproverId() { return principals[currentRole] || ''; }
    function userRequestInScope(record) {
      return !!record && hasCapability('approveUserRequest') && record.approverId === userApproverId() &&
        (currentRole !== 'dealer_owner' || record.role === '딜러 직원');
    }
    function userRequestsInScope() { return userRequests.filter(userRequestInScope); }
    function userRequestById(id) {
      return userRequests.filter(function (record) { return record.id === id; })[0] || null;
    }
    function setUserTab(tab) {
      activeUserTab = tab === 'approval' && hasCapability('approveUserRequest') ? 'approval' : 'list';
      Array.prototype.forEach.call(document.querySelectorAll('[data-user-tab]'), function (button) {
        var active = button.dataset.userTab === activeUserTab;
        button.classList.toggle('active', active);
        MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']);
        button.tabIndex = active ? 0 : -1;
      });
      if (managementHeader && typeof managementHeader.setControlContext === 'function') {
        managementHeader.setControlContext(activeUserTab);
      } else {
        var listFilters = document.getElementById('userListFilters');
        if (listFilters) listFilters.classList.toggle('is-hidden', activeUserTab !== 'list');
      }
      var listPanel = document.getElementById('userListPane');
      if (listPanel) {
        listPanel.classList.toggle('active', activeUserTab === 'list');
        listPanel.classList.toggle('is-hidden', activeUserTab !== 'list');
        MIQCommon.view.call(listPanel,"setAttribute",['aria-hidden',activeUserTab === 'list' ? 'false' : 'true']);
      }
      var panel = document.getElementById('reqPanel');
      panel.classList.toggle('is-hidden', activeUserTab !== 'approval');
      MIQCommon.view.call(panel,"setAttribute",['aria-hidden',activeUserTab === 'approval' ? 'false' : 'true']);
      if (activeUserTab === 'approval') renderUserRequests();
    }
    document.querySelector('.mm-user-tabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-user-tab]'); if (button) setUserTab(button.dataset.userTab);
    });
    bindTabArrowKeys(document.querySelector('.mm-user-tabs'));
    function parseUserRequestDate(value) { return Date.parse(String(value || '').replace(' ', 'T')); }
    var userRequestSearch = managementHeader.bindSearch(document.getElementById('userRequestQuery'), document.getElementById('userRequestSearch'), applyUserRequestFilters);
    var userRequestPeriod = initRequestPeriod(applyUserRequestFilters);
    var initialUserRequestRange = userRequestPeriod.read();
    var appliedUserRequestFilters = {
      q: '',
      status: '',
      from: initialUserRequestRange.from,
      to: initialUserRequestRange.to
    };
    function applyUserRequestFilters() {
      var range = userRequestPeriod.read();
      appliedUserRequestFilters = {
        q: userRequestSearch.read(),
        status: document.getElementById('userRequestStatus').value,
        from: range.from,
        to: range.to
      };
      selectedUserRequests = {};
      renderUserRequests();
      return true;
    }
    function scopedFilteredUserRequests() {
      var q = appliedUserRequestFilters.q;
      var status = appliedUserRequestFilters.status;
      var from = appliedUserRequestFilters.from;
      var to = appliedUserRequestFilters.to;
      return userRequestsInScope().filter(function (record) {
        var date = record.registered.slice(0, 10);
        var pass = (!q || norm([record.email, record.name, record.role, record.company].join(' ')).indexOf(q) > -1) &&
          (!status || record.status === status) && (!from || date >= from) && (!to || date <= to);
        return pass && (activeUserRequestView !== 'pending' || record.status === 'REQ');
      }).sort(function (a, b) { return parseUserRequestDate(b.registered) - parseUserRequestDate(a.registered); });
    }
    function selectedScopedUserRequests() {
      var visible = {};
      scopedFilteredUserRequests().forEach(function (record) { if (record.status === 'REQ') visible[record.id] = true; });
      return Object.keys(selectedUserRequests).filter(function (id) { return visible[id]; }).map(userRequestById).filter(Boolean);
    }
    function renderUserRequestSummary() {
      var referenceLabel = document.querySelector('#reqPanel .mm-request-reference');
      if (referenceLabel) MIQCommon.view.set(referenceLabel,"textContent",'데이터 기준 ' + USER_REQUEST_REFERENCE);
      var scoped = userRequestsInScope();
      var pending = scoped.filter(function (record) { return record.status === 'REQ'; });
      var approved = scoped.filter(function (record) { return record.status === 'APRV'; });
      var rejected = scoped.filter(function (record) { return record.status === 'RJCT'; });
      var completed = scoped.filter(function (record) { return record.processed; });
      var hours = completed.map(function (record) { return Math.max(0, (parseUserRequestDate(record.processed) - parseUserRequestDate(record.registered)) / 3600000); });
      var average = hours.length ? window.MIQCommon.numbers.integer((hours.reduce(function (sum, value) { return sum + value; }, 0) / hours.length)) + '시간' : '-';
      var reference = parseUserRequestDate(USER_REQUEST_REFERENCE);
      var longest = pending.length ? Math.max.apply(null, pending.map(function (record) { return Math.max(1, Math.ceil((reference - parseUserRequestDate(record.registered)) / 86400000)); })) + '일' : '-';
      MIQCommon.view.set(document.getElementById('userRequestSummary'),"innerHTML",[
        ['신청', pending.length + '건', '처리가 필요한 신청', 'is-pending'],
        ['승인', approved.length + '건', '계정 생성 완료', ''],
        ['반려', rejected.length + '건', '사유 확인 가능', ''],
        ['평균 처리시간', average, '승인·반려 완료 기준', ''],
        ['최장 대기', longest, pending.length ? pending.slice().sort(function (a, b) { return parseUserRequestDate(a.registered) - parseUserRequestDate(b.registered); })[0].email : '대기 없음', '']
      ].map(function (item) { return '<div class="mm-request-kpi"><span class="mm-request-kpi__label">' + item[0] + '</span><strong class="mm-request-kpi__value ' + item[3] + '">' + esc(item[1]) + '</strong><span class="mm-request-kpi__sub">' + esc(item[2]) + '</span></div>'; }).join(''));
      MIQCommon.view.set(document.getElementById('userRequestTabCount'),"textContent",pending.length);
      MIQCommon.view.set(document.getElementById('userRequestScopeCaption'),"textContent",currentRole === 'customer_owner'
        ? '내 업체 고객 직원의 계정 신청을 처리합니다.'
        : '담당 딜러 직원의 계정 신청을 처리합니다.');
    }
    function renderUserRequests() {
      if (!hasCapability('approveUserRequest')) return;
      renderUserRequestSummary();
      var filtered = scopedFilteredUserRequests();
      var scopeAll = userRequestsInScope();
      var pendingAll = scopeAll.filter(function (record) { return record.status === 'REQ'; });
      var body = document.getElementById('userRequestBody');
      MIQCommon.view.set(body,"innerHTML",filtered.length ? userRequestPager.slice(filtered).map(function (record) {
        var status = USER_REQUEST_STATUS[record.status] || USER_REQUEST_STATUS.REQ;
        var selectable = record.status === 'REQ';
        var checked = !!selectedUserRequests[record.id];
        return '<tr data-user-request-id="' + esc(record.id) + '"><td class="c">' + (selectable ? '<input type="checkbox" data-user-request-select="' + esc(record.id) + '" aria-label="' + esc(record.name) + ' 신청 선택"' + (checked ? ' checked' : '') + '/>' : '<span class="mute">-</span>') + '</td>' +
          '<td class="strong">' + esc(record.email) + '</td><td class="c"><span class="badge ' + status.cls + '" data-status-code="' + esc(record.status) + '" data-i18n-key="request.status.' + (record.status === 'APRV' ? 'approved' : record.status === 'RJCT' ? 'rejected' : 'pending') + '">' + status.label + '</span></td><td>' + esc(record.name) + '</td><td>' + esc(record.role) + '</td><td>' + esc(record.company) + '</td><td>' + esc(record.registered) + '</td><td>' + esc(record.processed || '-') + '</td><td>' + esc(record.processor || '-') + '</td><td class="c"><button class="btn btn--sm ' + (selectable ? 'btn--pri' : '') + '" type="button" ' + (selectable ? 'data-user-request-process' : 'data-user-request-detail') + '="' + esc(record.id) + '">' + (selectable ? '처리' : '상세') + '</button></td></tr>';
      }).join('') : '<tr class="empty"><td colspan="10">조회 조건에 해당하는 계정 신청이 없습니다.</td></tr>');
      if (!filtered.length) userRequestPager.slice([]);
      MIQCommon.view.set(document.getElementById('userRequestAllCount'),"textContent",scopeAll.length);
      MIQCommon.view.set(document.getElementById('userRequestPendingCount'),"textContent",pendingAll.length);
      MIQCommon.view.set(document.getElementById('userRequestResultCount'),"textContent",filtered.length);
      var selected = selectedScopedUserRequests();
      MIQCommon.view.set(document.getElementById('userRequestSelectedCount'),"textContent",selected.length);
      document.getElementById('userRequestBulkApprove').disabled = !selected.length;
      document.getElementById('userRequestBulkReject').disabled = !selected.length;
      var visiblePending = filtered.filter(function (record) { return record.status === 'REQ'; });
      var selectAll = document.getElementById('userRequestSelectAll');
      var selectedVisible = visiblePending.filter(function (record) { return selectedUserRequests[record.id]; }).length;
      selectAll.checked = !!visiblePending.length && selectedVisible === visiblePending.length;
      selectAll.indeterminate = selectedVisible > 0 && selectedVisible < visiblePending.length;
    }
    function addApprovedUser(record) {
      if (!record || rowsNow().some(function (row) { return row.dataset.owner === record.email; })) return;
      var group = record.role === '고객 직원' ? record.group : '전체';
      var groupOptions = '<option' + (group === '기본그룹' ? ' selected' : '') + '>기본그룹</option><option' + (group === '테스트그룹' ? ' selected' : '') + '>테스트그룹</option><option' + (group === '물류1팀' ? ' selected' : '') + '>물류1팀</option>';
      groupOptions = '<option' + (group === '전체' ? ' selected' : '') + '>전체</option>' + groupOptions;
      var tr = document.createElement('tr');
      tr.dataset.owner = record.email; tr.dataset.company = record.company; tr.dataset.managedBy = record.approverId;
      MIQCommon.view.set(tr,"innerHTML",'<td class="strong">' + esc(record.email) + '</td><td>' + esc(record.name) + '</td><td>' + esc(record.role) + '</td><td>' + esc(record.company) + '</td>' +
        '<td><select class="inp group-select" aria-label="' + esc(record.name) + ' 그룹">' + groupOptions + '</select><span class="mute role-view-only is-hidden">' + esc(group) + '</span></td>' +
        '<td>' + esc(record.phone || '-') + '</td><td>' + esc(record.registered) + '</td><td>' + esc(record.processed) + '</td><td class="c"><span class="mm-inline-actions"><button class="btn btn--sm btn--pri" data-group-mode>그룹 저장</button> <button class="btn btn--sm btn--danger" data-modal-open="delModal">삭제</button></span></td>');
      userRows.unshift(tr); tbody.insertBefore(tr, tbody.firstChild); normaliseCustomerGroup(tr); ensureVehicleLink(tr); tr.classList.add('mm-just-saved');
    }
    var userRequestModal = document.getElementById('userRequestModal');
    var userRejection = initRejectionReason(document.getElementById('userRequestReason'), 'account', document.getElementById('userRequestReasonError'));
    function userRequestModalFocusable() {
      return Array.prototype.filter.call(userRequestModal.querySelectorAll('button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'), function (node) {
        return !node.classList.contains('is-hidden') && node.getClientRects().length > 0;
      });
    }
    function paintUserRequestDecision() {
      var readonly = userRequestModal.dataset.readonly === '1';
      var isReject = modalUserDecision === 'RJCT';
      var needsGroup = !readonly && !isReject && modalUserRequests.some(function (record) { return record.role === '고객 직원'; });
      document.getElementById('userRequestDecisionTabs').classList.toggle('is-hidden', readonly);
      document.getElementById('userRequestGroupArea').classList.toggle('is-hidden', !needsGroup);
      document.getElementById('userRequestReasonArea').classList.toggle('is-hidden', !isReject || readonly);
      var submit = document.getElementById('userRequestSubmit'); submit.classList.toggle('is-hidden', readonly);
      MIQCommon.view.set(submit,"textContent",isReject ? '반려 처리' : '승인 처리'); submit.classList.toggle('btn--pri', !isReject); submit.classList.toggle('btn--danger', isReject);
      Array.prototype.forEach.call(document.querySelectorAll('[data-user-request-decision]'), function (button) {
        var active = button.dataset.userRequestDecision === modalUserDecision; button.classList.toggle('active', active); MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']); button.tabIndex = active ? 0 : -1;
      });
    }
    function openUserRequestModal(records, readonly, decision) {
      records = records.filter(userRequestInScope);
      if (!records.length) { toast('이미 처리되었거나 처리 권한이 없는 신청입니다.', 'danger'); return; }
      userRequestModalTrigger = document.activeElement;
      modalUserRequests = records.slice(); modalUserDecision = decision || 'APRV'; userRequestModal.dataset.readonly = readonly ? '1' : '0';
      var first = records[0];
      MIQCommon.view.set(document.getElementById('userRequestModalTitle'),"textContent",readonly ? '계정신청 상세' : (records.length > 1 ? '계정신청 일괄 처리' : '계정신청 처리'));
      MIQCommon.view.set(document.getElementById('userRequestModalGuide'),"textContent",readonly ? '처리 결과와 이력을 확인합니다.' : '신청자와 생성될 권한을 확인한 후 처리해 주세요.');
      MIQCommon.view.set(document.getElementById('userRequestPreview'),"innerHTML",'<div><dt>처리 대상</dt><dd>' + (records.length > 1 ? records.length + '건' : esc(first.name)) + '</dd></div><div><dt>사용자 ID</dt><dd>' + (records.length > 1 ? '선택 신청 일괄 처리' : esc(first.email)) + '</dd></div><div><dt>신청 권한</dt><dd>' + (records.length > 1 ? esc(records.map(function (record) { return record.role; }).filter(function (value, index, values) { return values.indexOf(value) === index; }).join(', ')) : esc(first.role)) + '</dd></div><div><dt>업체</dt><dd>' + (records.length > 1 ? '승인 범위 내 ' + records.length + '개 신청' : esc(first.company)) + '</dd></div><div><dt>처리상태</dt><dd>' + esc((USER_REQUEST_STATUS[first.status] || USER_REQUEST_STATUS.REQ).label) + '</dd></div><div><dt>처리 정보</dt><dd>' + esc(first.processed ? first.processed + ' · ' + first.processor : '미처리') + '</dd></div>' + (first.reason ? '<div><dt>반려 사유</dt><dd>' + esc(first.reason) + '</dd></div>' : ''));
      document.getElementById('userRequestGroup').value = first.group || '';
      userRejection.reset();
      document.getElementById('userRequestReasonError').classList.add('is-hidden');
      paintUserRequestDecision(); userRequestModal.classList.add('open'); MIQCommon.view.call(userRequestModal,"setAttribute",['aria-hidden','false']);
      window.setTimeout(function () { var target = readonly ? userRequestModal.querySelector('[data-user-request-close]') : userRequestModal.querySelector('[data-user-request-decision].active'); if (target) target.focus(); }, 0);
    }
    function closeUserRequestModal() {
      userRequestModal.classList.remove('open'); MIQCommon.view.call(userRequestModal,"setAttribute",['aria-hidden','true']); modalUserRequests = [];
      var trigger = userRequestModalTrigger; userRequestModalTrigger = null;
      window.setTimeout(function () {
        var fallback = document.getElementById('userTabApprovalBtn');
        var target = trigger && document.contains(trigger) && !trigger.disabled ? trigger : fallback;
        if (target && typeof target.focus === 'function') target.focus();
      }, 0);
    }
    Array.prototype.forEach.call(document.querySelectorAll('[data-user-request-close]'), function (button) { button.addEventListener('click', closeUserRequestModal); });
    userRequestModal.addEventListener('click', function (event) { if (event.target === userRequestModal) closeUserRequestModal(); });
    document.addEventListener('keydown', function (event) {
      if (!userRequestModal.classList.contains('open')) return;
      if (event.key === 'Escape') { event.preventDefault(); closeUserRequestModal(); return; }
      if (event.key !== 'Tab') return;
      var focusable = userRequestModalFocusable();
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    document.getElementById('userRequestDecisionTabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-user-request-decision]'); if (!button) return; modalUserDecision = button.dataset.userRequestDecision; paintUserRequestDecision();
    });
    document.getElementById('userRequestSubmit').addEventListener('click', function () {
      if (!hasCapability('approveUserRequest')) { toast('현재 권한에서는 계정 신청을 처리할 수 없습니다.', 'danger'); return; }
      var targets = modalUserRequests.filter(function (record) { return record && record.status === 'REQ' && userRequestInScope(record); });
      if (!targets.length) { toast('이미 처리되었거나 처리 권한이 없는 신청입니다.', 'danger'); return; }
      if (targets.some(function (record) { return record.email === userApproverId(); })) { toast('자기 계정 신청은 직접 승인할 수 없습니다.', 'danger'); return; }
      var rejection = modalUserDecision === 'RJCT' ? userRejection.read() : { type:'', reason:'' };
      if (!rejection) return;
      var reason = rejection.reason;
      var group = document.getElementById('userRequestGroup').value;
      if (modalUserDecision === 'APRV' && targets.some(function (record) { return record.role === '고객 직원'; }) && !group) { toast('고객 직원에게 배정할 그룹을 선택해 주세요.', 'danger'); document.getElementById('userRequestGroup').focus(); return; }
      var duplicate = targets.filter(function (record) { return rowsNow().some(function (row) { return row.dataset.owner === record.email; }); });
      if (modalUserDecision === 'APRV' && duplicate.length) { toast(duplicate[0].email + '은(는) 이미 등록된 사용자입니다.', 'danger'); return; }
      var operator = window.MIQ && window.MIQ.MANAGEMENT_IDENTITY ? window.MIQ.MANAGEMENT_IDENTITY.operator : (currentRole === 'customer_owner' ? '윤태호' : '박민아');
      targets.forEach(function (record) {
        record.status = modalUserDecision; record.processed = nowText(); record.processor = operator; record.processorRole = currentRole === 'customer_owner' ? '고객 대표' : '딜러 대표'; record.reason = modalUserDecision === 'RJCT' ? reason : ''; record.group = record.role === '고객 직원' ? group : '전체';
        record.reasonType = modalUserDecision === 'RJCT' ? rejection.type : '';
        if (modalUserDecision === 'APRV') { record.addedToUsers = true; addApprovedUser(record); }
        delete selectedUserRequests[record.id];
      });
      saveUserRequests(); closeUserRequestModal(); applyPermission(); applyFilters(); renderUserRequests();
      toast(targets.length + '건의 계정 신청을 ' + (modalUserDecision === 'APRV' ? '승인했습니다.' : '반려했습니다.'), modalUserDecision === 'APRV' ? 'success' : 'danger');
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('#reqPanel [data-user-request-process], #reqPanel [data-user-request-detail], #userRequestBulkApprove, #userRequestBulkReject') && !hasCapability('approveUserRequest')) {
        event.preventDefault(); event.stopImmediatePropagation(); toast('현재 권한에서는 계정 신청을 처리할 수 없습니다.', 'danger');
      }
      if (event.target.closest('#userTable [data-group-mode], #userTable [data-modal-open="delModal"]') && !hasCapability('assignUserGroup')) {
        event.preventDefault(); event.stopImmediatePropagation(); toast('고객 대표만 고객 직원의 그룹을 변경할 수 있습니다.', 'danger');
      }
    }, true);
    document.addEventListener('click', function (event) {
      var process = event.target.closest('[data-user-request-process]'); if (process) openUserRequestModal([userRequestById(process.dataset.userRequestProcess)], false, 'APRV');
      var detail = event.target.closest('[data-user-request-detail]'); if (detail) openUserRequestModal([userRequestById(detail.dataset.userRequestDetail)], true, 'APRV');
      var save = event.target.closest('#userTable [data-group-mode]');
      if (save) {
        var saveRow = save.closest('tr'), select = saveRow.querySelector('.group-select'), view = saveRow.querySelector('.role-view-only');
        if (!hasCapability('assignUserGroup') || rowRole(saveRow) !== '고객 직원') return;
        if (view) MIQCommon.view.set(view,"textContent",select.value);
        ensureVehicleLink(saveRow);
        saveRow.classList.add('mm-just-saved');
        window.setTimeout(function () { saveRow.classList.remove('mm-just-saved'); }, 1600);
        toast(MIQCommon.view.get(saveRow.children[1],"textContent").trim() + ' 사용자의 그룹을 ' + select.value + '(으)로 저장했습니다.', 'success');
        applyFilters();
      }
    });
    document.getElementById('userRequestBody').addEventListener('change', function (event) {
      var input = event.target.closest('[data-user-request-select]'); if (!input) return;
      if (input.checked) selectedUserRequests[input.dataset.userRequestSelect] = true; else delete selectedUserRequests[input.dataset.userRequestSelect]; renderUserRequests();
    });
    document.getElementById('userRequestSelectAll').addEventListener('change', function () {
      var checked = this.checked; scopedFilteredUserRequests().forEach(function (record) { if (record.status === 'REQ') { if (checked) selectedUserRequests[record.id] = true; else delete selectedUserRequests[record.id]; } }); renderUserRequests();
    });
    document.getElementById('userRequestBulkApprove').addEventListener('click', function () { var records = selectedScopedUserRequests(); if (records.length) openUserRequestModal(records, false, 'APRV'); });
    document.getElementById('userRequestBulkReject').addEventListener('click', function () { var records = selectedScopedUserRequests(); if (records.length) openUserRequestModal(records, false, 'RJCT'); });
    document.querySelector('.mm-user-approval-pane .mm-request-view-tabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-user-request-view]'); if (!button) return; activeUserRequestView = button.dataset.userRequestView;
      Array.prototype.forEach.call(this.querySelectorAll('[data-user-request-view]'), function (tab) { var active = tab === button; tab.classList.toggle('active', active); MIQCommon.view.call(tab,"setAttribute",['aria-pressed',active ? 'true' : 'false']); }); renderUserRequests();
    });
    document.getElementById('userRequestStatus').addEventListener('change', function () {
      appliedUserRequestFilters.status = this.value;
      selectedUserRequests = {};
      renderUserRequests();
    });
    document.getElementById('userRequestExport').addEventListener('click', function () {
      if (!hasCapability('approveUserRequest')) { toast('승인 권한이 있는 사용자만 신청 목록을 내보낼 수 있습니다.', 'danger'); return; }
      var values = [['사용자ID(이메일)','처리상태','사용자명','신청 권한','업체명','신청일시','처리일시','처리자','반려 사유']].concat(scopedFilteredUserRequests().map(function (record) {
        var status = USER_REQUEST_STATUS[record.status] || { label: '확인 필요' };
        return [record.email, status.label, record.name, record.role, record.company, record.registered, record.processed || '', record.processor || '', record.reason || ''];
      }));
      var csv = '\ufeff' + values.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url;
      link.download = '계정신청_목록_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
    userRequests.filter(function (record) { return record.status === 'APRV' && record.addedToUsers; }).forEach(addApprovedUser);

    var deleting = null;
    document.addEventListener('click', function (event) {
      var button = event.target.closest('#userTable [data-modal-open="delModal"]');
      if (!button) return;
      deleting = button.closest('tr');
      var name = MIQCommon.view.get(deleting.children[1],"textContent").trim(), email = MIQCommon.view.get(deleting.children[0],"textContent").trim();
      var modal = document.getElementById('delModal');
      MIQCommon.view.set(modal.querySelector('.modal__body > div'),"innerHTML",'<b>' + esc(name) + ' (' + esc(email) + ')</b> 계정을 미사용 상태로 전환하시겠습니까?');
    });
    var deleteConfirm = document.querySelector('#delModal .modal__foot .btn--danger');
    deleteConfirm.addEventListener('click', function () {
      if (!deleting || !hasCapability('deactivateCustomerStaff') || rowRole(deleting) !== '고객 직원') return;
      var name = MIQCommon.view.get(deleting.children[1],"textContent").trim();
      userRows=userRows.filter(function(row){return row!==deleting});
      deleting.remove(); deleting = null;
      document.getElementById('delModal').classList.remove('open');
      applyFilters(); toast(name + ' 계정을 미사용 상태로 전환했습니다.', 'success');
    });

    [roleFilter, groupFilter].filter(Boolean).forEach(function (control) { control.addEventListener('change', applyFilters); });
    if (roleSelect) roleSelect.addEventListener('change', function () { applyPermission(); applyFilters(); renderUserRequests(); });
    applyPermission(); applyFilters(); renderUserRequests(); setUserTab('list');
  }

  /* ───────────────────────────────────────────── Management / Company */
  function initCompany() {
    var table = document.querySelector('.tbl');
    if (!table || !table.tBodies.length) return;
    var tbody = table.tBodies[0];
    var companyRows=Array.from(tbody.rows);
    var companyPager=MIQ.createListPager(table.parentElement,{pageSize:20,presentation:'operations',unit:'건',onChange:apply});
    var filter = document.querySelector('.filter-bar');
    var search = managementHeader ? managementHeader.getControl('query') : filter.querySelector('input');
    var button = filter.querySelector('[data-mgmt-search-submit], .btn-search');
    var searchState = managementHeader.bindSearch(search, button, function () {
      exact = ''; setQuery({}, ['company', 'companyId']); apply();
    });
    var role = managementRole();
    var exact = query.get('company') || '';
    if (query.get('companyId') === '1933') exact = '(주)세종물류중부지점';
    var rowScope = [
      { dealer: 'dealer.park@sejonglog.co.kr', staff: 'staff.jung@sejonglog.co.kr' },
      { dealer: 'dealer.park@sejonglog.co.kr', staff: '' },
      { dealer: 'dealer.choi@sejonglog.co.kr', staff: 'staff.kang@sejonglog.co.kr' },
      { dealer: 'internal', staff: '' },
      { dealer: 'dealer.park@sejonglog.co.kr', staff: 'staff.jung@sejonglog.co.kr' }
    ];
    function inRoleScope(row) {
      if (role === 'internal') return true;
      if (role === 'dealer_owner') return row.dataset.dealerOwner === 'dealer.park@sejonglog.co.kr';
      if (role === 'dealer_staff') return row.dataset.dealerStaff === 'staff.jung@sejonglog.co.kr';
      return row.dataset.companyId === '1933';
    }
    Array.prototype.forEach.call(tbody.rows, function (row, index) {
      var name = MIQCommon.view.get(row.children[0],"textContent").trim();
      row.dataset.company = name;
      row.dataset.companyId = index === 0 ? '1933' : 'company-' + (index + 1);
      row.dataset.dealerOwner = rowScope[index] ? rowScope[index].dealer : '';
      row.dataset.dealerStaff = rowScope[index] ? rowScope[index].staff : '';
      row.tabIndex = 0;
      var countCell = row.children[2], count = MIQCommon.view.get(countCell,"textContent").trim();
      if (row.dataset.companyId === '1933') {
        var vehicleHref = managementHeader && managementHeader.withRole
          ? managementHeader.withRole('../Mgmt%20Vehicle/mgmt-vehicle-tobe.html', { company: name })
          : '../Mgmt%20Vehicle/mgmt-vehicle-tobe.html?role=' + encodeURIComponent(role) + '&company=' + encodeURIComponent(name);
        MIQCommon.view.set(countCell,"innerHTML",'<a class="mm-count-link" href="' + vehicleHref + '">' + esc(count) + '</a>');
      } else {
        /* 현재 관리 차량 목록에는 1933 업체의 상세 행만 있다.
           건수는 원본 필드로 유지하되 0건 화면으로 잘못 이동하는 링크는 만들지 않는다. */
        MIQCommon.view.set(countCell,"innerHTML",'<span>' + esc(count) + '</span>');
      }
      row.addEventListener('click', function (event) {
        if (event.target.closest('a')) return;
        Array.prototype.forEach.call(tbody.rows, function (other) { other.classList.remove('sel'); });
        row.classList.add('sel'); exact = name; search.value = ''; searchState.commit('');
        setQuery({ company: name }, ['companyId']); apply();
      });
      row.addEventListener('keydown', function (event) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); row.click(); } });
    });
    function apply() {
      clearEmpty(tbody);
      var q = searchState.read(), shown = 0, vehicles = 0;
      companyRows.forEach( function (row) {
        var pass = inRoleScope(row) && (!q || norm(MIQCommon.view.get(row,"textContent")).indexOf(q) > -1) && (!exact || row.dataset.company === exact);
        row.classList.toggle('mm-filter-hidden', !pass);
        if (pass) { shown++; vehicles += parseInt(MIQCommon.view.get(row.children[2],"textContent"), 10) || 0; }
      });
      tbody.replaceChildren.apply(tbody,companyPager.slice(companyRows.filter(function(row){return !row.classList.contains('mm-filter-hidden')})));
      if (!shown) addEmpty(tbody, '조회 조건에 해당하는 업체가 없습니다.');
      var count = document.getElementById('companyCount'); if (count) MIQCommon.view.set(count,"textContent",shown);
      var vehicleCount = document.getElementById('companyVehicleCount'); if (vehicleCount) MIQCommon.view.set(vehicleCount,"textContent",vehicles);
    }
    if (exact) {
      var exactRow = Array.prototype.filter.call(tbody.querySelectorAll('tr[data-company]'), function (row) { return row.dataset.company === exact; })[0];
      if (!exactRow || !inRoleScope(exactRow)) exact = '';
    }
    apply();
  }

  /* ───────────────────────────────────────────── Management / Group */
  function initGroup() {
    var listPane = document.getElementById('tabList');
    if (!listPane) return;
    var table = listPane.querySelector('.tbl');
    var tbody = table.tBodies[0];
    var groupRows=Array.from(tbody.rows);
    var groupPager=MIQ.createListPager(table.parentElement,{pageSize:20,presentation:'operations',unit:'건',onChange:applyFilter});
    var filterBar = document.querySelector('.filter-bar');
    var search = managementHeader ? managementHeader.getControl('query') : filterBar.querySelector('input');
    var timezone = managementHeader ? managementHeader.getControl('timezone') : filterBar.querySelector('select.inp');
    var searchButton = filterBar.querySelector('[data-mgmt-search-submit], .btn-search');
    var searchState = managementHeader.bindSearch(search, searchButton, applyFilter);
    var roleSelect = document.getElementById('account-role');
    var role = setRole(roleSelect);
    var canManage = hasCapability('manageGroup');
    var pendingMode = '';
    var editingRow = null;
    var deleting = null;
    var baseCounts = {};
    var syncAssignmentCatalog = function () {};
    var hasUnsavedAssignmentChanges = function () { return false; };
    var groupResult = document.getElementById('groupResult');
    var groupRegistered = document.getElementById('groupRegistered');
    var groupUnassigned = document.getElementById('groupUnassigned');
    var groupAssignmentTabCount = document.getElementById('groupAssignmentTabCount');

    function setGroupControlContext(tabKey) {
      if (managementHeader && typeof managementHeader.setControlContext === 'function') {
        managementHeader.setControlContext(tabKey === 'tabList' ? 'list' : 'none');
      }
      var primaryActions = document.querySelector('[data-mgmt-primary-actions]');
      if (primaryActions) primaryActions.classList.toggle('is-hidden', tabKey !== 'tabList');
    }
    function operatingGroupCount() {
      return Array.prototype.filter.call(groupRows, function (row) {
        return row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim() !== '미배정' && !row.classList.contains('mm-empty');
      }).length;
    }
    function restoreAssignmentTabState() {
      var listButton = document.querySelector('.tabs button[data-tab="tabList"]');
      var assignButton = document.getElementById('tabBtnAssign');
      var assignPane = document.getElementById('tabAssign');
      if (listButton) {
        listButton.classList.remove('active');
        MIQCommon.view.call(listButton,"setAttribute",['aria-selected','false']);
        listButton.tabIndex = -1;
      }
      if (assignButton) {
        assignButton.classList.add('active');
        MIQCommon.view.call(assignButton,"setAttribute",['aria-selected','true']);
        assignButton.tabIndex = 0;
      }
      listPane.classList.remove('active');
      MIQCommon.view.call(listPane,"setAttribute",['aria-hidden','true']);
      if (assignPane) {
        assignPane.classList.add('active');
        MIQCommon.view.call(assignPane,"setAttribute",['aria-hidden','false']);
      }
      setGroupControlContext('tabAssign');
    }
    window.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('.tabs button[data-tab="tabList"]');
      if (!button || !hasUnsavedAssignmentChanges()) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      restoreAssignmentTabState();
      toast('저장하지 않은 차량 배정 변경이 있습니다. 변경을 저장하거나 취소한 뒤 그룹 목록으로 이동해 주세요.', 'danger');
    }, true);
    var groupTabs = document.querySelector('.tabs');
    if (groupTabs) {
      groupTabs.addEventListener('click', function (event) {
        var button = event.target.closest('button[data-tab]');
        if (!button) return;
        if (button.dataset.tab === 'tabList' && hasUnsavedAssignmentChanges()) {
          event.preventDefault();
          event.stopImmediatePropagation();
          toast('저장하지 않은 차량 배정 변경이 있습니다. 변경을 저장하거나 취소한 뒤 그룹 목록으로 이동해 주세요.', 'danger');
          return;
        }
        setGroupControlContext(button.dataset.tab);
      }, true);
    }
    setGroupControlContext('tabList');


    function inRoleScope(row) {
      if (role === 'customer_staff') return row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim() === '물류1팀';
      return true;
    }
    function applyRoleAccess() {
      Array.prototype.forEach.call(document.querySelectorAll('.role-gated'), function (node) {
        node.classList.toggle('is-hidden', !canManage);
      });
      setColumnVisible(table, 7, canManage);
      if (!canManage) {
        var assignButton = document.getElementById('tabBtnAssign');
        var assignPane = document.getElementById('tabAssign');
        if (assignButton) assignButton.classList.remove('active');
        if (assignPane) assignPane.classList.remove('active');
        var listButton = document.querySelector('.tabs button[data-tab="tabList"]');
        if (listButton) listButton.classList.add('active');
        listPane.classList.add('active');
      }
    }
    document.addEventListener('click', function (event) {
      if (!canManage && event.target.closest('[data-group-mode], #tabAssign button, #grpSave, #delModal .btn--danger')) {
        event.preventDefault(); event.stopImmediatePropagation();
        toast('고객 대표만 운영 그룹과 차량 배정을 변경할 수 있습니다.', 'danger');
      }
    }, true);

    function readCounts() {
      baseCounts = {};
      Array.prototype.forEach.call(groupRows, function (row) {
        if (row.classList.contains('mm-empty')) return;
        baseCounts[MIQCommon.view.get(row.children[1],"textContent").trim()] = parseInt(MIQCommon.view.get(row.children[5],"textContent"), 10) || 0;
      });
    }
    function groupRowByName(name) {
      return Array.prototype.filter.call(groupRows, function (row) {
        return row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim() === name;
      })[0] || null;
    }
    function setGroupVehicleCount(row, count) {
      if (!row || !row.children[5]) return;
      MIQCommon.view.set(row.children[5],"textContent",count);
      var editButton = row.querySelector('[data-group-mode="edit"]');
      if (editButton) editButton.dataset.veh = String(count);
    }
    function renderDeletePreview() {
      if (!deleting) return;
      var modal = document.getElementById('delModal');
      var name = MIQCommon.view.get(deleting.children[1],"textContent").trim();
      var vehicleCount = parseInt(MIQCommon.view.get(deleting.children[5],"textContent"), 10) || 0;
      var userCount = parseInt(MIQCommon.view.get(deleting.children[6],"textContent"), 10) || 0;
      var vehicleSelect = document.getElementById('deleteGroupVehicleTarget');
      var userSelect = document.getElementById('deleteGroupUserTarget');
      var vehicleTarget = vehicleSelect.value || '미배정';
      var userTarget = userSelect.value || '전체';
      var vehicleTargetRow = groupRowByName(vehicleTarget);
      var vehicleTargetCount = vehicleTargetRow ? (parseInt(MIQCommon.view.get(vehicleTargetRow.children[5],"textContent"), 10) || 0) : 0;
      var totalVehicles = Object.keys(baseCounts).reduce(function (sum, key) { return sum + (baseCounts[key] || 0); }, 0);
      var groupTotal = operatingGroupCount();
      var removed = modal.querySelector('[data-delete-preview="removed"]');
      var vehicles = modal.querySelector('[data-delete-preview="vehicles"]');
      var users = modal.querySelector('[data-delete-preview="users"]');
      var groups = modal.querySelector('[data-delete-preview="groups"]');
      if (removed) {
        MIQCommon.view.set(removed.querySelector('.k'),"textContent",name);
        MIQCommon.view.set(removed.querySelector('.b4'),"textContent",vehicleCount + '대');
      }
      if (vehicles) {
        MIQCommon.view.set(vehicles.querySelector('.k'),"textContent",vehicleTarget);
        MIQCommon.view.set(vehicles.querySelector('.b4'),"textContent",vehicleTargetCount + '대');
        MIQCommon.view.set(vehicles.querySelector('.af'),"textContent",vehicleTargetCount + vehicleCount + '대');
        MIQCommon.view.set(vehicles.querySelector('.badge'),"textContent",'+' + vehicleCount);
      }
      if (users) {
        MIQCommon.view.set(users.querySelector('.b4'),"textContent",userCount + '명');
        MIQCommon.view.set(users.querySelector('.af'),"textContent",userTarget === '전체' ? '전사(전체)' : userTarget);
        MIQCommon.view.set(users.querySelector('.badge'),"textContent",userTarget === '전체' ? '권한 유지' : '그룹 이관');
      }
      if (groups) {
        MIQCommon.view.set(groups.querySelector('.b4'),"textContent",groupTotal + '개');
        MIQCommon.view.set(groups.querySelector('.af'),"textContent",Math.max(0, groupTotal - 1) + '개');
        MIQCommon.view.set(groups.querySelector('.badge'),"textContent",'합계 ' + totalVehicles + '대 유지');
      }
    }
    function refreshLabels(shown) {
      var rows = Array.prototype.filter.call(groupRows, function (row) {
        return !row.classList.contains('mm-empty') && !row.classList.contains('mm-filter-hidden');
      });
      var registered = rows.filter(function (row) { return MIQCommon.view.get(row.children[1],"textContent").trim() !== '미배정'; }).length;
      var unassigned = rows.length - registered;
      if (groupResult) MIQCommon.view.set(groupResult,"textContent",typeof shown === 'number' ? shown : rows.length);
      if (groupRegistered) MIQCommon.view.set(groupRegistered,"textContent",registered);
      if (groupUnassigned) MIQCommon.view.set(groupUnassigned,"textContent",unassigned);
      if (groupAssignmentTabCount) {
        MIQCommon.view.set(groupAssignmentTabCount,"textContent",Array.prototype.reduce.call(groupRows, function (sum, row) {
          if (!row.children[5] || row.classList.contains('mm-empty')) return sum;
          return sum + (parseInt(MIQCommon.view.get(row.children[5],"textContent"), 10) || 0);
        }, 0));
      }
      var tab = document.querySelector('[data-tab="tabList"]'); if (tab) MIQCommon.view.set(tab,"textContent",'그룹 목록');
    }
    function applyFilter() {
      clearEmpty(tbody);
      var q = searchState.read(), tz = timezone.selectedIndex > 0 ? 'Asia/Seoul' : '', shown = 0;
      Array.prototype.forEach.call(groupRows, function (row) {
        if (!row.children[1]) return;
        var searchable = [MIQCommon.view.get(row.children[1],"textContent"), MIQCommon.view.get(row.children[2],"textContent")].join(' ');
        var pass = inRoleScope(row) && (!q || norm(searchable).indexOf(q) > -1) && (!tz || MIQCommon.view.get(row.children[3],"textContent").indexOf(tz) > -1);
        row.classList.toggle('mm-filter-hidden', !pass); if (pass) shown++;
      });
      tbody.replaceChildren.apply(tbody,groupPager.slice(groupRows.filter(function(row){return !row.classList.contains('mm-filter-hidden')})));
      setColumnVisible(table,7,canManage);
      if (!shown) addEmpty(tbody, '조회 조건에 해당하는 그룹이 없습니다.');
      refreshLabels(shown);
    }
    document.addEventListener('click', function (event) {
      var modeButton = event.target.closest('[data-group-mode]');
      if (modeButton) {
        pendingMode = modeButton.dataset.groupMode;
        editingRow = pendingMode === 'edit' ? modeButton.closest('tr') : null;
      }
      var deleteButton = event.target.closest('#tabList [data-modal-open="delModal"]');
      if (deleteButton) {
        if (operatingGroupCount() <= 1) {
          event.preventDefault();
          document.getElementById('delModal').classList.remove('open');
          deleting = null;
          toast('운영 그룹은 최소 1개가 필요합니다. 새 그룹을 등록한 뒤 이 그룹을 삭제해 주세요.', 'danger');
          return;
        }
        deleting = deleteButton.closest('tr');
        var name = MIQCommon.view.get(deleting.children[1],"textContent").trim();
        var vehicles = MIQCommon.view.get(deleting.children[5],"textContent").trim(), users = MIQCommon.view.get(deleting.children[6],"textContent").trim();
        var modal = document.getElementById('delModal');
        MIQCommon.view.set(modal.querySelector('.modal__title'),"textContent",'그룹 삭제 확인 — ' + name);
        MIQCommon.view.set(modal.querySelector('.warn-box.bad'),"innerHTML",'<b>이 그룹에는 차량 ' + esc(vehicles) + '대 · 사용자 ' + esc(users) + '명이 연결되어 있습니다.</b> 삭제 전 각 항목의 처리 방식을 지정해야 합니다.');
        Array.prototype.forEach.call(modal.querySelectorAll('select'), function (select) {
          Array.prototype.forEach.call(select.options, function (option) { option.disabled = option.value === name; });
          if (select.value === name || (select.options[select.selectedIndex] && select.options[select.selectedIndex].disabled)) {
            select.value = select.id === 'deleteGroupVehicleTarget' ? '미배정' : '전체';
          }
        });
        var impactRows = modal.querySelectorAll('tbody tr');
        if (impactRows[0]) MIQCommon.view.set(impactRows[0].children[1],"textContent",vehicles + '대');
        if (impactRows[1]) MIQCommon.view.set(impactRows[1].children[1],"textContent",users + '명');
        renderDeletePreview();
      }
    });
    document.getElementById('deleteGroupVehicleTarget').addEventListener('change', renderDeletePreview);
    document.getElementById('deleteGroupUserTarget').addEventListener('change', renderDeletePreview);
    document.getElementById('grpSave').addEventListener('click', function () {
      if (!canManage) return;
      if (hasUnsavedAssignmentChanges()) {
        toast('차량 배정 변경을 먼저 저장하거나 취소해 주세요.', 'danger');
        return;
      }
      var modal = document.getElementById('grpModal');
      var inputs = modal.querySelectorAll('.form-grid input');
      var timezoneValue = modal.querySelector('.form-grid select').value.split(' ')[0];
      var name = inputs[1].value.trim(), locationText = inputs[2].value.trim();
      if (!name) { toast('그룹명을 입력해 주세요.', 'danger'); inputs[1].focus(); return; }
      if (Array.prototype.some.call(groupRows, function (row) { return row !== editingRow && row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim() === name; })) {
        toast('이미 존재하는 그룹명입니다.', 'danger'); inputs[1].focus(); return;
      }
      var levels = Array.prototype.map.call(document.querySelectorAll('#grpZones .zone b'), function (node) {
        var matches = MIQCommon.view.get(node,"textContent").match(/[0-9]+(?:\.[0-9]+)?/g); return matches ? matches[matches.length - 1] : '-';
      }).slice(0, 3);
      var assignmentChange = null;
      if (pendingMode === 'create') {
        var row = document.createElement('tr');
        MIQCommon.view.set(row,"innerHTML",'<td>' + esc(inputs[0].value) + '</td><td class="strong">' + esc(name) + '</td><td>' + esc(locationText || '-') + '</td><td>' + esc(timezoneValue) + '</td><td class="c thr-cell">' + esc(levels.join(' / ')) + '</td><td class="r">0</td><td class="r">0</td><td class="c"><button class="btn btn--sm role-gated" data-modal-open="grpModal" data-group-mode="edit" data-shock="' + esc(levels.join(',')) + '" data-veh="0" data-ovr="0">수정</button> <button class="btn btn--sm btn--danger role-gated" data-modal-open="delModal">삭제</button></td>');
        var unassigned = Array.prototype.filter.call(groupRows, function (tr) { return tr.children[1] && MIQCommon.view.get(tr.children[1],"textContent").trim() === '미배정'; })[0];
        groupRows.splice(unassigned?groupRows.indexOf(unassigned):groupRows.length,0,row);
        tbody.insertBefore(row,unassigned&&unassigned.parentNode===tbody?unassigned:null);
        assignmentChange = { type: 'create', name: name };
        toast(name + ' 그룹을 등록했습니다.', 'success');
      } else if (editingRow) {
        var cells = editingRow.children;
        var oldName = MIQCommon.view.get(cells[1],"textContent").trim();
        MIQCommon.view.set(cells[1],"textContent",name);
        MIQCommon.view.set(cells[2],"textContent",locationText || '-');
        MIQCommon.view.set(cells[3],"textContent",timezoneValue);
        MIQCommon.view.set(cells[4],"textContent",levels.join(' / '));
        var editButton = editingRow.querySelector('[data-group-mode="edit"]');
        if (editButton) editButton.dataset.shock = levels.join(',');
        var savedRow = editingRow;
        savedRow.classList.add('just-saved');
        window.setTimeout(function () { savedRow.classList.remove('just-saved'); }, 1600);
        assignmentChange = { type: 'rename', oldName: oldName, name: name };
        toast(name + ' 그룹 정보를 저장했습니다.', 'success');
      }
      pendingMode = '';
      editingRow = null;
      modal.classList.remove('open');
      readCounts();
      syncAssignmentCatalog(assignmentChange);
      applyFilter();
    });
    var deleteConfirm = document.querySelector('#delModal .modal__foot .btn--danger');
    deleteConfirm.addEventListener('click', function () {
      if (!deleting || !canManage) return;
      if (hasUnsavedAssignmentChanges()) {
        toast('차량 배정 변경을 먼저 저장하거나 취소해 주세요.', 'danger');
        return;
      }
      var name = MIQCommon.view.get(deleting.children[1],"textContent").trim();
      var vehicleCount = parseInt(MIQCommon.view.get(deleting.children[5],"textContent"), 10) || 0;
      var userCount = parseInt(MIQCommon.view.get(deleting.children[6],"textContent"), 10) || 0;
      var vehicleTarget = document.getElementById('deleteGroupVehicleTarget').value || '미배정';
      var userTarget = document.getElementById('deleteGroupUserTarget').value || '전체';
      if (operatingGroupCount() <= 1) {
        toast('운영 그룹은 최소 1개가 필요합니다. 새 그룹을 등록한 뒤 삭제해 주세요.', 'danger');
        return;
      }
      if (vehicleTarget === name || userTarget === name) {
        toast('삭제할 그룹은 이관 대상으로 선택할 수 없습니다.', 'danger');
        return;
      }
      var vehicleTargetRow = groupRowByName(vehicleTarget);
      if (vehicleTargetRow && vehicleTargetRow !== deleting) setGroupVehicleCount(vehicleTargetRow, (parseInt(MIQCommon.view.get(vehicleTargetRow.children[5],"textContent"), 10) || 0) + vehicleCount);
      var userTargetRow = groupRowByName(userTarget);
      if (userTargetRow && userTargetRow !== deleting) MIQCommon.view.set(userTargetRow.children[6],"textContent",(parseInt(MIQCommon.view.get(userTargetRow.children[6],"textContent"), 10) || 0) + userCount);
      groupRows=groupRows.filter(function(row){return row!==deleting});
      deleting.remove(); deleting = null; document.getElementById('delModal').classList.remove('open');
      readCounts();
      syncAssignmentCatalog({ type: 'delete', oldName: name, destination: vehicleTarget });
      applyFilter(); toast(name + ' 그룹을 삭제하고 연결 항목을 지정한 대상으로 이관했습니다.', 'success');
    });
    timezone.addEventListener('change', applyFilter);

    /* Vehicle assignment: two-pane editor with dynamic preview and save confirmation. */
    var assign = document.getElementById('tabAssign');
    var cols = assign ? assign.querySelectorAll('.xfer__col') : [];
    if (cols.length === 2) {
      var left = cols[0].querySelector('.xfer__list'), right = cols[1].querySelector('.xfer__list');
      var targetSelect = document.getElementById('groupAssignmentTarget');
      var sourceGroupFilter = document.getElementById('groupAssignmentSourceGroup');
      var searchInputs = assign.querySelectorAll('.xfer__col input.inp');
      var sourceMeta = document.getElementById('groupAssignmentSourceMeta');
      var targetMeta = document.getElementById('groupAssignmentTargetMeta');
      var changeList = document.getElementById('groupAssignmentChangeList');
      var resetButton = document.getElementById('groupAssignmentReset');
      var saveButton = document.getElementById('groupAssignmentSave');
      var confirmModal = document.getElementById('groupAssignmentConfirmModal');
      var confirmSummary = document.getElementById('groupAssignmentConfirmSummary');
      var confirmList = document.getElementById('groupAssignmentConfirmList');
      var confirmSave = document.getElementById('groupAssignmentConfirmSave');
      var tipButton = document.getElementById('groupAssignmentTipButton');
      var tipPanel = document.getElementById('groupAssignmentTip');
      var actionButton = function (name) { return assign.querySelector('[data-transfer-action="' + name + '"]'); };

      /* Remove duplicated mock rows that represented a preselected, unsaved state. */
      Array.prototype.forEach.call(right.querySelectorAll('.xfer__it'), function (item) {
        if (item.querySelector('.badge.pri')) item.remove();
      });

      var items = Array.prototype.slice.call(assign.querySelectorAll('.xfer__it'));
      function badgeText(item) { var badge = item.querySelector('.sp'); return badge ? MIQCommon.view.get(badge,"textContent").trim() : '미배정'; }
      function targetName() {
        if (!targetSelect || !targetSelect.options.length) return '';
        var option = targetSelect.options[targetSelect.selectedIndex] || targetSelect.options[0];
        return targetSelect.value || option.text.replace(/\s*\(\d+대\).*$/, '').trim();
      }
      var previousTarget = targetName();
      items.forEach(function (item) {
        item._mmOriginalGroup = item.closest('.xfer__col') === cols[1] ? targetName() : badgeText(item);
        item._mmCurrentGroup = item._mmOriginalGroup;
        item.tabIndex = 0; item.draggable = true; MIQCommon.view.call(item,"setAttribute",['role','option']);
      });

      function decorate(item, destination) {
        var badge = item.querySelector('.sp');
        if (destination === right) {
          badge.className = 'sp badge ' + (item._mmOriginalGroup === targetName() ? 'ok' : 'pri');
          MIQCommon.view.set(badge,"textContent",item._mmOriginalGroup === targetName() ? '기존' : '추가 예정');
        } else {
          badge.className = 'sp badge gray';
          MIQCommon.view.set(badge,"textContent",item._mmCurrentGroup || '미배정');
        }
        item.style.background = '';
        var check = item.querySelector('input[type="checkbox"]'); if (check) check.checked = false;
      }
      function place(item, destination, nextGroup) {
        item._mmCurrentGroup = nextGroup;
        destination.appendChild(item);
        decorate(item, destination);
      }
      function selected(source) {
        return Array.prototype.filter.call(source.querySelectorAll('.xfer__it'), function (item) {
          var check = item.querySelector('input[type="checkbox"]'); return check && check.checked && !item.classList.contains('mm-filter-hidden');
        });
      }
      function visibleItems(source) {
        return Array.prototype.filter.call(source.querySelectorAll('.xfer__it'), function (item) { return !item.classList.contains('mm-filter-hidden'); });
      }
      function dirtyItems() { return items.filter(function (item) { return item._mmCurrentGroup !== item._mmOriginalGroup; }); }
      hasUnsavedAssignmentChanges = function () { return dirtyItems().length > 0; };
      function currentCounts() {
        var counts = {}; Object.keys(baseCounts).forEach(function (key) { counts[key] = baseCounts[key]; });
        items.forEach(function (item) {
          if (item._mmCurrentGroup === item._mmOriginalGroup) return;
          counts[item._mmOriginalGroup] = (counts[item._mmOriginalGroup] || 0) - 1;
          counts[item._mmCurrentGroup] = (counts[item._mmCurrentGroup] || 0) + 1;
        });
        return counts;
      }
      function updateOptionCounts() {
        Array.prototype.forEach.call(targetSelect.options, function (option) {
          var name = option.value || MIQCommon.view.get(option,"textContent").replace(/\s*\(\d+대\).*$/, '').trim();
          option.value = name;
          MIQCommon.view.set(option,"textContent",name + ' (' + (baseCounts[name] || 0) + '대)');
        });
        if (sourceGroupFilter) Array.prototype.forEach.call(sourceGroupFilter.options, function (option) {
          if (!option.value) { MIQCommon.view.set(option,"textContent",'전체 그룹'); return; }
          MIQCommon.view.set(option,"textContent",option.value + ' (' + (baseCounts[option.value] || 0) + '대)');
        });
      }
      function renderSelectionMeta() {
        var leftSelected = selected(left).length, rightSelected = selected(right).length;
        MIQCommon.view.set(sourceMeta,"textContent",visibleItems(left).length + '대 표시' + (leftSelected ? ' · ' + leftSelected + '대 선택' : ''));
        MIQCommon.view.set(targetMeta,"textContent",visibleItems(right).length + '대 표시' + (rightSelected ? ' · ' + rightSelected + '대 선택' : ''));
      }
      function updatePreview() {
        var counts = currentCounts();
        var changed = Object.keys(counts).filter(function (name) { return (baseCounts[name] || 0) !== counts[name]; });
        changed.sort(function (a, b) { return a === targetName() ? -1 : b === targetName() ? 1 : a.localeCompare(b, 'ko'); });
        if (!changed.length) {
          MIQCommon.view.set(changeList,"innerHTML",'<span class="mm-transfer-change-empty">변경 없음</span>');
        } else {
          MIQCommon.view.set(changeList,"innerHTML",changed.map(function (name) {
            var before = baseCounts[name] || 0, after = counts[name], delta = after - before;
            return '<span class="mm-transfer-change-item' + (name === targetName() ? ' is-target' : '') + '"><strong>' + esc(name) + '</strong><span>' + before + ' → ' + after + '대</span><span class="mm-transfer-change-delta ' + (delta > 0 ? 'is-positive' : 'is-negative') + '">' + (delta > 0 ? '+' : '−') + Math.abs(delta) + '</span></span>';
          }).join(''));
        }
        var moved = dirtyItems().length;
        MIQCommon.view.set(cols[1].querySelector('.xfer__hd').firstChild,"textContent",targetName() + ' ');
        var topBadge = cols[1].querySelector('.xfer__hd .badge');
        if (topBadge) MIQCommon.view.set(topBadge,"textContent",moved ? (baseCounts[targetName()] || 0) + '대 → ' + (counts[targetName()] || 0) + '대' : (baseCounts[targetName()] || 0) + '대');
        resetButton.disabled = !moved;
        saveButton.disabled = !moved;
        MIQCommon.view.set(saveButton,"textContent",moved ? '변경 ' + moved + '대 저장' : '변경 저장');
        refreshTransferFilters();
      }
      function resetForTarget() {
        if (!targetName()) {
          items.forEach(function (item) { place(item, left, item._mmOriginalGroup); });
          updatePreview();
          return;
        }
        items.forEach(function (item) {
          var destination = item._mmOriginalGroup === targetName() ? right : left;
          place(item, destination, item._mmOriginalGroup);
        });
        updatePreview();
      }
      function replaceOptions(select, entries, preferredValue) {
        if (!select) return;
        var previous = preferredValue != null ? preferredValue : select.value;
        MIQCommon.view.set(select,"innerHTML",'');
        entries.forEach(function (entry) { select.add(new Option(entry.label, entry.value)); });
        var available = entries.some(function (entry) { return entry.value === previous; });
        select.value = available ? previous : (entries[0] ? entries[0].value : '');
      }
      function groupNames() {
        return Object.keys(baseCounts).filter(function (name) { return name && name !== '미배정'; });
      }
      function rebuildGroupCatalog(preferredTarget) {
        var names = groupNames();
        replaceOptions(targetSelect, names.map(function (name) { return { value:name, label:name + ' (' + (baseCounts[name] || 0) + '대)' }; }), preferredTarget);
        replaceOptions(sourceGroupFilter, [{ value:'', label:'전체 그룹' }].concat(Object.keys(baseCounts).map(function (name) {
          return { value:name, label:name + ' (' + (baseCounts[name] || 0) + '대)' };
        })), sourceGroupFilter ? sourceGroupFilter.value : '');
        replaceOptions(document.getElementById('deleteGroupVehicleTarget'), [{ value:'미배정', label:'미배정으로 이관 (기본)' }].concat(names.map(function (name) {
          return { value:name, label:name + '에 이관' };
        })), '미배정');
        replaceOptions(document.getElementById('deleteGroupUserTarget'), [{ value:'전체', label:'전사(전체)로 변경 — 권한 유지' }].concat(names.map(function (name) {
          return { value:name, label:name + '에 이관' };
        })), '전체');
      }
      function refreshTransferFilters() {
        Array.prototype.forEach.call(cols, function (col, index) {
          var input = searchInputs[index];
          var q = input ? norm(input.value) : '';
          var group = index === 0 && sourceGroupFilter ? sourceGroupFilter.value : '';
          Array.prototype.forEach.call(col.querySelector('.xfer__list').children, function (item) {
            var textPass = !q || norm(MIQCommon.view.get(item,"textContent")).indexOf(q) > -1;
            var groupPass = !group || item._mmCurrentGroup === group;
            item.classList.toggle('mm-filter-hidden', !(textPass && groupPass));
          });
        });
        renderSelectionMeta();
      }
      syncAssignmentCatalog = function (change) {
        change = change || {};
        var preferred = change.preferredTarget || targetSelect.value || previousTarget;
        if (change.type === 'rename' && change.oldName && change.name) {
          items.forEach(function (item) {
            if (item._mmOriginalGroup === change.oldName) item._mmOriginalGroup = change.name;
            if (item._mmCurrentGroup === change.oldName) item._mmCurrentGroup = change.name;
          });
          if (preferred === change.oldName) preferred = change.name;
        }
        if (change.type === 'delete' && change.oldName) {
          var destination = change.destination || '미배정';
          items.forEach(function (item) {
            if (item._mmOriginalGroup === change.oldName) item._mmOriginalGroup = destination;
            if (item._mmCurrentGroup === change.oldName) item._mmCurrentGroup = destination;
          });
          if (preferred === change.oldName) preferred = destination === '미배정' ? '' : destination;
        }
        rebuildGroupCatalog(preferred);
        previousTarget = targetName();
        resetForTarget();
      };
      function assignItems(list) {
        if (!list.length) { toast('배정할 차량을 선택해 주세요.', 'danger'); return; }
        list.forEach(function (item) { place(item, right, targetName()); });
        updatePreview(); toast(list.length + '대를 배정 목록에 반영했습니다.', 'success');
      }
      function releaseItems(list) {
        if (!list.length) { toast('해제할 차량을 선택해 주세요.', 'danger'); return; }
        list.forEach(function (item) {
          var nextGroup = item._mmOriginalGroup === targetName() ? '미배정' : item._mmOriginalGroup;
          place(item, left, nextGroup);
        });
        updatePreview(); toast(list.length + '대를 해제 목록에 반영했습니다.', 'success');
      }
      function openSaveConfirmation() {
        var changed = dirtyItems();
        if (!changed.length) return;
        MIQCommon.view.set(confirmSummary,"textContent",changed.length + '대의 그룹 배정을 변경합니다.');
        MIQCommon.view.set(confirmList,"innerHTML",changed.map(function (item) {
          var label = MIQCommon.view.get(item.querySelector('b'),"textContent").trim();
          var vin = MIQCommon.view.get(item.querySelector('.vin'),"textContent").trim();
          return '<div class="mm-transfer-confirm-row"><span><strong>' + esc(label) + '</strong> · ' + esc(vin) + '</span><span>' + esc(item._mmOriginalGroup) + ' → <strong>' + esc(item._mmCurrentGroup) + '</strong></span></div>';
        }).join(''));
        confirmModal.classList.add('open');
        window.setTimeout(function () { confirmSave.focus(); }, 0);
      }
      function commitAssignment() {
        var changed = dirtyItems().slice();
        if (!changed.length) { confirmModal.classList.remove('open'); return; }
        var counts = currentCounts();
        Array.prototype.forEach.call(groupRows, function (row) {
          var name = row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim();
          if (name && counts[name] != null) setGroupVehicleCount(row, counts[name]);
        });
        baseCounts = counts;
        items.forEach(function (item) { item._mmOriginalGroup = item._mmCurrentGroup; decorate(item, item.parentNode); });
        updateOptionCounts();
        confirmModal.classList.remove('open');
        updatePreview();
        toast('차량 ' + changed.length + '대의 그룹 배정을 저장했습니다.', 'success');
      }

      actionButton('assign').addEventListener('click', function () { assignItems(selected(left)); });
      actionButton('release').addEventListener('click', function () { releaseItems(selected(right)); });
      actionButton('assign-visible').addEventListener('click', function () { assignItems(visibleItems(left)); });
      actionButton('release-visible').addEventListener('click', function () { releaseItems(visibleItems(right)); });
      actionButton('clear-selection').addEventListener('click', function () {
        Array.prototype.forEach.call(right.querySelectorAll('input[type="checkbox"]'), function (check) { check.checked = false; });
        renderSelectionMeta();
      });
      actionButton('reset').addEventListener('click', resetForTarget);
      actionButton('save').addEventListener('click', openSaveConfirmation);
      confirmSave.addEventListener('click', commitAssignment);

      targetSelect.addEventListener('change', function () {
        if (dirtyItems().length) {
          targetSelect.value = previousTarget;
          toast('저장하지 않은 변경이 있습니다. 변경을 저장하거나 취소한 뒤 대상 그룹을 바꿔 주세요.', 'danger');
          return;
        }
        previousTarget = targetName();
        resetForTarget();
      });
      assign.addEventListener('change', function (event) {
        if (event.target.matches('.xfer__it input[type="checkbox"]')) renderSelectionMeta();
      });
      assign.addEventListener('keydown', function (event) {
        var item = event.target.closest('.xfer__it'); if (!item) return;
        if (event.key === ' ' || event.key === 'Enter') {
          event.preventDefault(); var checkbox = item.querySelector('input'); checkbox.checked = !checkbox.checked; renderSelectionMeta();
        }
        if (event.key === 'ArrowRight' && item.parentNode === left) { event.preventDefault(); assignItems([item]); }
        if (event.key === 'ArrowLeft' && item.parentNode === right) { event.preventDefault(); releaseItems([item]); }
      });
      var dragged = null;
      assign.addEventListener('dragstart', function (event) { dragged = event.target.closest('.xfer__it'); if (dragged) dragged.classList.add('mm-dragging'); });
      assign.addEventListener('dragend', function () { if (dragged) dragged.classList.remove('mm-dragging'); dragged = null; Array.prototype.forEach.call(assign.querySelectorAll('.mm-drop-target'), function (x) { x.classList.remove('mm-drop-target'); }); });
      [left, right].forEach(function (list) {
        list.addEventListener('dragover', function (event) { event.preventDefault(); list.classList.add('mm-drop-target'); });
        list.addEventListener('dragleave', function () { list.classList.remove('mm-drop-target'); });
        list.addEventListener('drop', function (event) {
          event.preventDefault(); list.classList.remove('mm-drop-target');
          if (!dragged) return;
          if (list === right && dragged.parentNode === left) assignItems([dragged]);
          else if (list === left && dragged.parentNode === right) releaseItems([dragged]);
        });
      });
      searchInputs.forEach(function (input) { input.addEventListener('input', refreshTransferFilters); });
      if (sourceGroupFilter) sourceGroupFilter.addEventListener('change', refreshTransferFilters);
      tipButton.addEventListener('click', function (event) {
        event.stopPropagation();
        var willOpen = tipPanel.hidden;
        tipPanel.hidden = !willOpen;
        MIQCommon.view.call(tipButton,"setAttribute",['aria-expanded',willOpen ? 'true' : 'false']);
      });
      document.addEventListener('click', function (event) {
        if (!event.target.closest('.mm-context-tip')) { tipPanel.hidden = true; MIQCommon.view.call(tipButton,"setAttribute",['aria-expanded','false']); }
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !tipPanel.hidden) { tipPanel.hidden = true; MIQCommon.view.call(tipButton,"setAttribute",['aria-expanded','false']); tipButton.focus(); }
      });

      readCounts();
      var deepGroup = query.get('group');
      syncAssignmentCatalog({ type:'init', preferredTarget:deepGroup || targetName() });
    }
    applyRoleAccess(); readCounts(); applyFilter();
  }

  /* ───────────────────────────────────────────── Management / Vehicle */
  function initVehicle() {
    var tbody = document.getElementById('vehBody');
    if (!tbody) return;
    var managedModalIds = ['reqModal', 'vehModal', 'aprvModal', 'requestBulkModal'];
    var managedModalReturnFocus = null;
    function managedModalFocusable(modal) {
      return Array.prototype.filter.call(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'), function (node) {
        return !node.disabled && node.offsetParent !== null;
      });
    }
    function focusManagedModal(modal, trigger) {
      if (!modal || managedModalIds.indexOf(modal.id) < 0) return;
      managedModalReturnFocus = trigger || document.activeElement || managedModalReturnFocus;
      window.setTimeout(function () {
        var focusable = managedModalFocusable(modal);
        var preferred = focusable.filter(function (node) { return !node.hasAttribute('data-modal-close'); })[0] || focusable[0];
        if (preferred) preferred.focus();
        else {
          var dialog = modal.querySelector('[role="dialog"]');
          if (dialog) { dialog.tabIndex = -1; dialog.focus(); }
        }
      }, 0);
    }
    function restoreManagedModalFocus() {
      var target = managedModalReturnFocus;
      managedModalReturnFocus = null;
      window.setTimeout(function () { if (target && document.contains(target) && typeof target.focus === 'function') target.focus(); }, 0);
    }
    document.addEventListener('click', function (event) {
      var opener = event.target.closest('[data-modal-open]');
      if (opener && managedModalIds.indexOf(opener.dataset.modalOpen) > -1) {
        focusManagedModal(document.getElementById(opener.dataset.modalOpen), opener);
      }
      var closer = event.target.closest('[data-modal-close]');
      if (closer && closer.closest('.dim') && managedModalIds.indexOf(closer.closest('.dim').id) > -1) restoreManagedModalFocus();
    });
    document.addEventListener('mousedown', function (event) {
      if (event.target.classList && event.target.classList.contains('dim') && managedModalIds.indexOf(event.target.id) > -1) restoreManagedModalFocus();
    });
    document.addEventListener('keydown', function (event) {
      var modal = Array.prototype.filter.call(document.querySelectorAll('.dim.open'), function (node) { return managedModalIds.indexOf(node.id) > -1; }).pop();
      if (!modal) return;
      if (event.key === 'Escape') { restoreManagedModalFocus(); return; }
      if (event.key !== 'Tab') return;
      var focusable = managedModalFocusable(modal);
      if (!focusable.length) return;
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, true);
    document.addEventListener('miq:modal-closed', restoreManagedModalFocus);
    var table = tbody.closest('table');
    var cachedVehicleRows=[], vehicleReady=false;
    var vehiclePager=MIQ.createListPager(table.parentElement,{pageSize:20,presentation:'operations',unit:'건',onChange:applyFilter});
    var filterBar = document.querySelector('.filter-bar');
    var search = managementHeader ? managementHeader.getControl('query') : filterBar.querySelector('input');
    var selects = filterBar.querySelectorAll('select.inp');
    var groupFilter = managementHeader ? managementHeader.getControl('groupName') : selects[0];
    var typeFilter = managementHeader ? managementHeader.getControl('powerType') : selects[1];
    var searchButton = filterBar.querySelector('[data-mgmt-search-submit], .btn-search');
    var roleSelect = document.getElementById('account-role');
    var role = setRole(roleSelect);
    var company = query.get('company') || '';
    var companyQueryLocked = !!company;
    var vehicleResult = document.getElementById('vehResult');
    var vehicleLoaded = document.getElementById('vehLoaded');
    var vehicleTotal = document.getElementById('vehTotal');
    var requestedUserScope = query.get('userScope');
    var allowedUserScopes = {
      internal: ['internal', 'dealer_owner', 'dealer_staff', 'customer_owner', 'customer_staff'],
      dealer_owner: ['dealer_owner', 'dealer_staff', 'customer_owner', 'customer_staff'],
      dealer_staff: ['dealer_staff', 'customer_owner'],
      customer_owner: ['customer_owner', 'customer_staff'],
      customer_staff: ['customer_staff']
    };
    var vehicleScopeRole = (allowedUserScopes[role] || [role]).indexOf(requestedUserScope) > -1 ? requestedUserScope : role;
    var onboarding = window.MIQCustomerAccess && MIQCustomerAccess.current(role);
    if (onboarding) tbody.replaceChildren();
    // Staff viewing their own list remain in their assigned scope. Authorized
    // managers following a user shortcut must use that user's saved group.
    var vehicleScopeGroup = role === 'customer_staff' ? '물류1팀' : (query.get('userGroup') === '전체' ? '전체' : (query.get('group') || '물류1팀'));
    var baseRoleTotals = {
      internal: 42,
      dealer_owner: 22,
      dealer_staff: 11,
      customer_owner: 42,
      customer_staff: 10
    };

    function syncTabStops(tabList, activeButton) {
      if (!tabList) return;
      Array.prototype.forEach.call(tabList.querySelectorAll('[role="tab"]'), function (button) {
        var active = button === activeButton || (!activeButton && button.classList.contains('active'));
        button.tabIndex = active ? 0 : -1;
        MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']);
      });
    }
    if (groupFilter && query.get('group')) Array.prototype.forEach.call(groupFilter.options, function (option) { if (MIQCommon.view.get(option,"textContent").indexOf(query.get('group')) === 0) option.selected = true; });
    if (query.get('type')) Array.prototype.forEach.call(typeFilter.options, function (option) { if (MIQCommon.view.get(option,"textContent").indexOf(query.get('type')) === 0) option.selected = true; });
    if (query.get('q')) search.value = query.get('q');

    var searchState = managementHeader.bindSearch(search, searchButton, applyCompleteVehicleFilter);

    function applyRole() {
      role = managementRole();
      var canEdit = hasCapability('editVehicle');
      var hideCustomerVehicleFields = role === 'internal' || role === 'dealer_owner' || role === 'dealer_staff';
      var canOpenVehicle = canEdit || role === 'customer_staff';
      Array.prototype.forEach.call(tbody.querySelectorAll('[data-modal-open="vehModal"]'), function (button) {
        button.classList.toggle('is-hidden', !canOpenVehicle);
        button.classList.toggle('btn--pri', canEdit);
        MIQCommon.view.set(button,"textContent",canEdit ? '수정' : '보기');
        button.disabled = !canOpenVehicle;
        MIQCommon.view.call(button,"setAttribute",['aria-label',canEdit ? '차량 정보 수정' : '차량 정보 보기']);
      });
      setColumnVisible(table, 2, !hideCustomerVehicleFields);
      setColumnVisible(table, 3, !hideCustomerVehicleFields);
      setColumnVisible(table, 9, !hideCustomerVehicleFields);
      setColumnVisible(table, 10, role === 'customer_owner');
      setColumnVisible(table, 11, canOpenVehicle);
      var requestButton = document.getElementById('btnReq');
      if (requestButton) requestButton.classList.toggle('is-hidden', !hasCapability('requestVehicle'));
      var requestTab = document.getElementById('tabBtnReq');
      if (requestTab) requestTab.classList.toggle('is-hidden', !hasCapability('requestVehicle'));
      var approvalTab = document.getElementById('tabBtnApproval');
      if (approvalTab) approvalTab.classList.toggle('is-hidden', role !== 'dealer_owner');
      var activeRoleTab = document.querySelector('.mm-vehicle-tabs button.active.is-hidden');
      if (activeRoleTab) {
        var listTab = document.getElementById('tabBtnList');
        if (listTab) listTab.click();
      }
      syncTabStops(document.querySelector('.mm-vehicle-tabs'));
    }
    function allRows() { tbody.querySelectorAll('tr[data-vin]').forEach(function(row){if(cachedVehicleRows.indexOf(row)<0)cachedVehicleRows.push(row)});return cachedVehicleRows; }
    function markInitialDealerStaffScope() {
      var dealerIndex = 0;
      allRows().forEach(function (row) {
        if (MIQCommon.view.get(row.children[0],"textContent").trim() !== '밥캣코리아 중부딜러') return;
        if (row.dataset.dealerStaffScope) return;
        row.dataset.dealerStaffScope = dealerIndex % 2 === 0 ? '1' : '0';
        dealerIndex++;
      });
    }
    function inRoleScope(row) {
      if (onboarding) return row.dataset.approvedNew === '1' && MIQCommon.view.get(row.children[1],"textContent").trim() === onboarding.company;
      if (vehicleScopeRole === 'internal') return true;
      if (vehicleScopeRole === 'dealer_owner') return MIQCommon.view.get(row.children[0],"textContent").trim() === '밥캣코리아 중부딜러';
      if (vehicleScopeRole === 'dealer_staff') return MIQCommon.view.get(row.children[0],"textContent").trim() === '밥캣코리아 중부딜러' && row.dataset.dealerStaffScope === '1';
      if (vehicleScopeRole === 'customer_staff') return vehicleScopeGroup === '전체'
        ? MIQCommon.view.get(row.children[1],"textContent").trim() === (company || '(주)세종물류중부지점')
        : MIQCommon.view.get(row.children[2],"textContent").trim() === vehicleScopeGroup;
      return true;
    }
    function searchableVehicleText(row) {
      /* 권한으로 숨긴 고객 운영그룹·닉네임·사용자명은 검색 대상으로도 사용하지 않는다. */
      return Array.prototype.map.call(row.children, function (cell) {
        return cell.classList.contains('mm-role-hidden') ? '' : MIQCommon.view.get(cell,"textContent").trim();
      }).join(' ');
    }
    function roleTotal() {
      if (onboarding) return allRows().filter(inRoleScope).length;
      if (vehicleScopeRole === 'customer_staff') return allRows().filter(inRoleScope).length;
      var approvedInScope = allRows().filter(function (row) {
        return row.dataset.approvedNew === '1' && inRoleScope(row);
      }).length;
      return (baseRoleTotals[vehicleScopeRole] || baseRoleTotals.customer_owner) + approvedInScope;
    }
    var roleGroupTotals = {
      internal: customerVehicleGroupTotals,
      dealer_owner: { '미배정': 1, '기본그룹': 10, '테스트그룹': 6, '물류1팀': 5 },
      dealer_staff: { '미배정': 1, '기본그룹': 5, '테스트그룹': 3, '물류1팀': 2 },
      customer_owner: customerVehicleGroupTotals,
      customer_staff: { '미배정': 0, '기본그룹': 0, '테스트그룹': 0, '물류1팀': 10 }
    };
    var roleTypeTotals = {
      internal: { '엔진': 32, '납산': 3, '리튬': 7 },
      dealer_owner: { '엔진': 15, '납산': 1, '리튬': 6 },
      dealer_staff: { '엔진': 8, '납산': 0, '리튬': 3 },
      customer_owner: { '엔진': 32, '납산': 3, '리튬': 7 },
      customer_staff: { '엔진': 8, '납산': 1, '리튬': 1 }
    };
    function totalsWithApproved(base, cellIndex) {
      var totals = {};
      Object.keys(base || {}).forEach(function (key) { totals[key] = onboarding ? 0 : base[key]; });
      if (vehicleScopeRole === 'customer_staff') {
        Object.keys(totals).forEach(function (key) { totals[key] = 0; });
        allRows().filter(inRoleScope).forEach(function (row) {
          var key = MIQCommon.view.get(row.children[cellIndex],"textContent").trim();
          totals[key] = (totals[key] || 0) + 1;
        });
        return totals;
      }
      allRows().forEach(function (row) {
        if (row.dataset.approvedNew !== '1' || !inRoleScope(row)) return;
        var key = MIQCommon.view.get(row.children[cellIndex],"textContent").trim();
        if (Object.prototype.hasOwnProperty.call(totals, key)) totals[key]++;
      });
      return totals;
    }
    function updateSelectCounts(select, totals) {
      if (!select) return;
      Array.prototype.forEach.call(select.options, function (option, index) {
        if (!index || !option.value) return;
        MIQCommon.view.set(option,"textContent",option.value + ' (' + (totals[option.value] || 0) + ')');
      });
    }
    function applyFilter() {
      if (!vehicleReady) return;
      clearEmpty(tbody);
      updateSelectCounts(groupFilter, totalsWithApproved(roleGroupTotals[vehicleScopeRole], 2));
      updateSelectCounts(typeFilter, totalsWithApproved(roleTypeTotals[vehicleScopeRole], 5));
      var q = searchState.read();
      var group = groupFilter ? groupFilter.value : '';
      var type = typeFilter.value;
      var shown = 0;
      allRows().forEach(function (row) {
        var pass = inRoleScope(row) && (!q || norm(searchableVehicleText(row)).indexOf(q) > -1) && (!group || MIQCommon.view.get(row.children[2],"textContent").trim() === group) && (!type || MIQCommon.view.get(row.children[5],"textContent").trim() === type) && (!company || MIQCommon.view.get(row.children[1],"textContent").trim() === company);
        row.classList.toggle('mm-filter-hidden', !pass); if (pass) shown++;
      });
      tbody.replaceChildren.apply(tbody,vehiclePager.slice(allRows().filter(function(row){return !row.classList.contains('mm-filter-hidden')})));
      if (!shown) addEmpty(tbody, '조회 조건에 해당하는 차량이 없습니다.');
      if (vehicleResult) MIQCommon.view.set(vehicleResult,"textContent",shown);
      if (vehicleLoaded) MIQCommon.view.set(vehicleLoaded,"textContent",allRows().filter(inRoleScope).length);
      if (vehicleTotal) MIQCommon.view.set(vehicleTotal,"textContent",roleTotal());
      setQuery({ q: searchState.value() || null, group: group || null, type: type || null, company: company || null });
    }
    function applyCompleteVehicleFilter() {
      if (generated < 30) appendMore(30 - generated);
      else applyFilter();
    }
    if (groupFilter) groupFilter.addEventListener('change', applyCompleteVehicleFilter);
    typeFilter.addEventListener('change', applyCompleteVehicleFilter);
    if (roleSelect) roleSelect.addEventListener('change', function () {
      if (onboarding) { location.href = MIQCustomerAccess.url('vehicle', managementRole()); return; }
      applyRole();
    });
    var approvalSubmit = document.getElementById('apSubmit');
    if (approvalSubmit) approvalSubmit.addEventListener('click', function () { window.setTimeout(function () { applyRole(); applyFilter(); }, 0); });
    document.addEventListener('click', function (event) {
      var vehicleOpener = event.target.closest('#tabList [data-modal-open="vehModal"]');
      if (vehicleOpener && (!(hasCapability('editVehicle') || role === 'customer_staff') || !inRoleScope(vehicleOpener.closest('tr')))) {
        event.preventDefault(); event.stopImmediatePropagation(); toast('이 차량의 상세 조회 권한이 없습니다.', 'danger');
      }
      if (event.target.closest('#tabApproval [data-request-process], #requestBulkApprove, #requestBulkReject') && !hasCapability('approveVehicleRequest')) {
        event.preventDefault(); event.stopImmediatePropagation(); toast('딜러 대표만 차량 신청을 처리할 수 있습니다.', 'danger');
      }
      if (event.target.closest('#btnReq') && !hasCapability('requestVehicle')) {
        event.preventDefault(); event.stopImmediatePropagation(); toast('차량 신청 권한이 있는 고객 계정만 신청할 수 있습니다.', 'danger');
      }
    }, true);
    document.addEventListener('change', function (event) {
      if (event.target.matches && event.target.matches('[data-target-company]')) companyQueryLocked = false;
    }, true);
    document.addEventListener('miq:target-change', function (event) {
      var companyId = event.detail && event.detail.companyId;
      if (!companyQueryLocked) {
        var targetCompany = document.querySelector('[data-target-company]');
        company = companyId === 'all' ? '' : (targetCompany && targetCompany.selectedIndex > -1 ? targetCompany.options[targetCompany.selectedIndex].text : company);
      }
      var vin = event.detail && event.detail.equipmentId;
      if (vin) { search.value = vin; searchState.commit(vin); }
      if (vin) applyCompleteVehicleFilter();
      else applyFilter();
    });

    /* Prepare the source catalog once. Filtering and pagination render only
       the current page after requests and role scope have been initialized. */
    var generated = onboarding ? 30 : 0;
    function appendMore(requestedAmount) {
      var remaining = 30 - generated;
      if (remaining <= 0) return;
      /* 고객 직원은 전체 명부 뒤쪽의 배정 그룹만 보이므로 첫 요청에서 해당 7대를 함께 로드한다. */
      var amount = typeof requestedAmount === 'number'
        ? Math.min(Math.max(requestedAmount, 1), remaining)
        : (vehicleScopeRole === 'customer_staff' ? remaining : Math.min(10, remaining));
      for (var i = 0; i < amount; i++) {
        var n = generated + i + 1;
        var model = n <= 2 ? ['B30S-7', '리튬', 'lithium'] : ['D25S-9', '엔진', 'engine'];
        var group = n <= 12 ? '기본그룹' : n <= 21 ? '테스트그룹' : n <= 23 ? '미배정' : '물류1팀';
        var dealerOwned = n % 2 === 1;
        var dealerSequence = dealerOwned ? (n + 1) / 2 : 0;
        var vin = (model[1] === '엔진' ? 'FBD' : 'FBA') + String(16 + n % 20) + '_22426' + String(1000 + n).slice(-4);
        var nickname = group === '미배정' ? '미배정 차량 ' + (n - 21) : (n + 7) + '호기 지게차';
        var operatorName = group === '미배정' ? '-' : '사용자' + (n + 7);
        var shockBadge = group === '미배정' ? '<span class="badge gray">그룹 미배정</span>' : '<span class="badge gray">그룹 기본</span>';
        var tr = document.createElement('tr'); tr.dataset.vin = vin;
        tr.dataset.dealerStaffScope = dealerOwned && dealerSequence % 2 === 0 ? '1' : '0';
        MIQCommon.view.set(tr,"innerHTML",'<td>' + (dealerOwned ? '밥캣코리아 중부딜러' : '대영중기(주)') + '</td><td>(주)세종물류중부지점</td><td>' + group + '</td><td>' + nickname + '</td><td>' + model[0] + '</td><td><span class="cls-badge ' + model[2] + '">' + model[1] + '</span></td><td class="c">202' + (1 + n % 6) + '</td><td class="strong">' + vin + '</td><td>22426' + String(1000 + n).slice(-4) + '</td><td>' + operatorName + '</td><td class="c">' + shockBadge + '</td><td class="c"><button class="btn btn--sm btn--pri" data-modal-open="vehModal" data-vin="' + vin + '" data-model="' + model[0] + '" data-cls="' + model[1] + '" data-year="202' + (1 + n % 6) + '" data-tid="22426' + String(1000 + n).slice(-4) + '" data-group="' + group + '" data-nick="' + nickname + '" data-override="n">수정</button></td>');
        tbody.appendChild(tr);
      }
      generated += amount;
      applyRole(); applyFilter();
    }

    /* Vehicle request workflow: one state powers customer history, dealer approval,
       status summaries, filters, bulk actions, and newly approved vehicle rows. */
    var CURRENT_DEALER = '밥캣코리아 중부딜러';
    var CURRENT_COMPANY = onboarding ? onboarding.company : '(주)세종물류중부지점';
    var CURRENT_DEALER_ID = 151;
    var CURRENT_COMPANY_ID = onboarding ? onboarding.companyId : 33767;
    var FIXTURE_REFERENCE = common.dates.format(common.dates.today()) + ' 00:00';
    var REQUEST_STORAGE_KEY = 'linq.management.vehicleRequests.v5:' + CURRENT_COMPANY_ID + ':' + CURRENT_DEALER_ID;
    var REQUESTER_IDS = {
      customer_owner: 'CUS-OWNER-' + CURRENT_COMPANY_ID,
      customer_staff: 'CUS-STAFF-' + CURRENT_COMPANY_ID + '-01'
    };
    var REQUEST_STATUS = {
      REQ: { label: '신청', cls: 'warn' },
      APRV: { label: '승인', cls: 'ok' },
      RJCT: { label: '반려', cls: 'bad' }
    };
    var requestCatalog = [
      { dealer:CURRENT_DEALER, dealerCompanyId:CURRENT_DEALER_ID, type:'리튬', model:'B28S-7', vin:'FBH28_331470052', terminal:'331470052', year:'2026' },
      { dealer:CURRENT_DEALER, dealerCompanyId:CURRENT_DEALER_ID, type:'리튬', model:'B30S-7', vin:'FBA32_224250533', terminal:'224250533', year:'2026' },
      { dealer:CURRENT_DEALER, dealerCompanyId:CURRENT_DEALER_ID, type:'납산', model:'B18S-7', vin:'FBA18_224250534', terminal:'224250534', year:'2026' },
      { dealer:'대영중기(주)', dealerCompanyId:152, type:'엔진', model:'D25S-9', vin:'FBD25_113920244', terminal:'113920244', year:'2025' },
      { dealer:'대영중기(주)', dealerCompanyId:152, type:'엔진', model:'D30S-9', vin:'FBD30_113920245', terminal:'113920245', year:'2025' }
    ];
    function requestSeed() {
      if (onboarding) return [];
      return [
        { id:'VR-20260706-01', vin:'FBH28_331470041', terminal:'331470041', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-07-06 10:05', processed:'', status:'REQ', processorName:'', processorRole:'', reason:'', model:'B28S-7', type:'리튬', year:'2026' },
        { id:'VR-20260704-01', vin:'FBD22_113920233', terminal:'113920233', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-07-04 14:26', processed:'', status:'REQ', processorName:'', processorRole:'', reason:'', model:'D22S-9', type:'엔진', year:'2025' },
        { id:'VR-20260703-01', vin:'FBA28_224250512', terminal:'224250512', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-07-03 09:12', processed:'', status:'REQ', processorName:'', processorRole:'', reason:'', model:'B28S-7', type:'리튬', year:'2026' },
        { id:'VR-20260616-01', vin:'FBA35_000427', terminal:'224250427', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-06-16 11:40', processed:'2026-06-18 09:22', status:'APRV', processorName:'박민아', processorRole:'딜러 대표', reason:'', model:'B35S-7', type:'리튬', year:'2024' },
        { id:'VR-20260610-01', vin:'FBH30_331470028', terminal:'331470028', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-06-10 09:30', processed:'2026-06-11 15:08', status:'APRV', processorName:'박민아', processorRole:'딜러 대표', reason:'', model:'B30S-7', type:'리튬', year:'2025' },
        { id:'VR-20260527-01', vin:'FBA22_000388', terminal:'224250388', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-05-27 13:12', processed:'2026-05-28 10:44', status:'APRV', processorName:'박민아', processorRole:'딜러 대표', reason:'', model:'B22S-7', type:'납산', year:'2021' },
        { id:'VR-20260513-01', vin:'FBA20_000203', terminal:'224250203', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-05-13 10:05', processed:'2026-05-14 16:30', status:'APRV', processorName:'박민아', processorRole:'딜러 대표', reason:'', model:'B20S-7', type:'리튬', year:'2025' },
        { id:'VR-20260428-01', vin:'FBD18_000156', terminal:'113920156', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-04-28 15:40', processed:'2026-04-29 09:18', status:'APRV', processorName:'박민아', processorRole:'딜러 대표', reason:'', model:'D18S-9', type:'엔진', year:'2023' },
        { id:'VR-20260414-01', vin:'FBA16_000311', terminal:'224250311', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-04-14 15:03', processed:'2026-04-16 10:11', status:'RJCT', processorName:'박민아', processorRole:'딜러 대표', reason:'동일 단말기 ID가 다른 차량에 연결되어 있습니다.', model:'B16S-7', type:'납산', year:'2022' },
        { id:'VR-20260401-01', vin:'FBD25_000901', terminal:'113920901', dealer:CURRENT_DEALER, company:CURRENT_COMPANY, requesterName:'윤태호', requesterRole:'고객 대표', registered:'2026-04-01 17:22', processed:'2026-04-02 11:26', status:'RJCT', processorName:'박민아', processorRole:'딜러 대표', reason:'차대번호와 등록 장비 정보가 일치하지 않습니다.', model:'D25S-9', type:'엔진', year:'2022' }
      ].map(function (record) {
        record.companyId = CURRENT_COMPANY_ID;
        record.dealerCompanyId = CURRENT_DEALER_ID;
        record.rentalCompanyId = null;
        record.rentalCompanyName = '해당 없음';
        record.groupId = null;
        record.requesterId = REQUESTER_IDS.customer_owner;
        return record;
      });
    }
    function currentRequestSeed(legacy) {
      return currentDemoRequests(legacy, [1, 3, 4, 7, 10, 13, 16, 19, 22, 25]);
    }
    function loadRequests() {
      if (query.get('approvalState') === 'empty') return [];
      var legacy = requestSeed(), current = currentRequestSeed(legacy);
      try {
        var stored = JSON.parse(sessionStorage.getItem(REQUEST_STORAGE_KEY) || 'null');
        if (Array.isArray(stored)) {
          var changed = false;
          var migrated = stored.map(function (record) {
            var index = legacy.findIndex(function (seed) { return seed.id === record.id; });
            var seed = legacy[index];
            // Refresh only untouched old fixtures; keep user-created and processed records.
            if (!seed || record.demoDateRevision || record.registered !== seed.registered || record.processed !== seed.processed || record.status !== seed.status) return record;
            changed = true;
            return Object.assign({}, record, {registered:current[index].registered, processed:current[index].processed, demoDateRevision:current[index].demoDateRevision});
          });
          if (changed) { try { sessionStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(migrated)); } catch (ignoreWrite) {} }
          return migrated;
        }
      } catch (ignore) {}
      return current;
    }
    function saveRequests() {
      try { sessionStorage.setItem(REQUEST_STORAGE_KEY, JSON.stringify(requests)); return true; } catch (ignore) { return false; }
    }
    function requestDate(value) {
      var parsed = new Date(String(value || '').replace(' ', 'T') + (String(value || '').length === 16 ? ':00' : ''));
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    function requestDay(value) { return String(value || '').slice(0, 10); }
    function requestToday() {
      var d = new Date();
      function p(n) { return String(n).padStart(2, '0'); }
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    }
    function requestAsOfText() {
      return requests.reduce(function (latest, record) {
        return [record.registered, record.processed].reduce(function (value, candidate) {
          return candidate && candidate > value ? candidate : value;
        }, latest);
      }, FIXTURE_REFERENCE);
    }
    function durationHours(record) {
      var start = requestDate(record.registered), end = requestDate(record.processed);
      return start && end ? Math.max(0, (end - start) / 3600000) : 0;
    }
    function waitingDays(record) {
      var start = requestDate(record.registered);
      var asOf = requestDate(requestAsOfText());
      return start && asOf ? Math.max(0, Math.floor((asOf - start) / 86400000)) : 0;
    }
    function requestStatusBadge(record) {
      var status = REQUEST_STATUS[record.status] || REQUEST_STATUS.REQ;
      return '<span class="badge ' + status.cls + '" data-status-code="' + esc(record.status) + '" data-i18n-key="request.status.' + (record.status === 'APRV' ? 'approved' : record.status === 'RJCT' ? 'rejected' : 'pending') + '">' + status.label + '</span>';
    }
    function requestPerson(name, personRole) {
      if (!name) return '<span class="mute">-</span>';
      return '<span class="mm-request-person">' + esc(name) + '<small>' + esc(personRole || '') + '</small></span>';
    }

    function requestById(id) {
      return requests.filter(function (record) { return record.id === id; })[0] || null;
    }
    function dealerRequests() {
      return requests.filter(function (record) {
        return record.dealerCompanyId != null ? Number(record.dealerCompanyId) === CURRENT_DEALER_ID : record.dealer === CURRENT_DEALER;
      });
    }
    function classBadge(type) {
      var className = type === '엔진' ? 'engine' : type === '납산' ? 'lead' : 'lithium';
      return '<span class="cls-badge ' + className + '">' + esc(type) + '</span>';
    }
    function appendApprovedVehicle(record) {
      if (!record.linkedNew || allRows().some(function(row){return row.dataset.vin===record.vin})) return;
      var linkedGroup = record.linkedGroup || '미배정';
      var linkedNickname = record.linkedNickname || record.model;
      var linkedOverride = record.shockMode === 'override';
      var linkedShock = linkedOverride && record.shockValues ? ' data-shock="' + esc(record.shockValues) + '"' : '';
      var linkedBadge = linkedGroup === '미배정'
        ? '<span class="badge gray">그룹 미배정</span>'
        : (linkedOverride ? '<span class="badge pri">재정의</span>' : '<span class="badge gray">그룹 기본</span>');
      var tr = document.createElement('tr');
      tr.dataset.vin = record.vin;
      tr.dataset.approvedNew = '1';
      tr.dataset.dealerStaffScope = '0';
      MIQCommon.view.set(tr,"innerHTML",'<td>' + esc(record.dealer) + '</td><td>' + esc(record.company) + '</td><td>' + esc(linkedGroup) + '</td><td>' + esc(linkedNickname) + '</td>' +
        '<td>' + esc(record.model) + '</td><td>' + classBadge(record.type) + '</td><td class="c">' + esc(record.year) + '</td>' +
        '<td class="strong">' + esc(record.vin) + '</td><td>' + esc(record.terminal) + '</td><td class="mute">-</td>' +
        '<td class="c">' + linkedBadge + '</td><td class="c"><button class="btn btn--sm btn--pri" type="button" data-modal-open="vehModal" data-vin="' + esc(record.vin) + '" data-model="' + esc(record.model) + '" data-cls="' + esc(record.type) + '" data-year="' + esc(record.year) + '" data-tid="' + esc(record.terminal) + '" data-group="' + esc(linkedGroup) + '" data-nick="' + esc(linkedNickname) + '" data-override="' + (linkedOverride ? 'y' : 'n') + '"' + linkedShock + '>수정</button></td>');
      tbody.insertBefore(tr, tbody.firstChild);
      tr.classList.add('vin-focus');
      window.setTimeout(function () { tr.classList.remove('vin-focus'); }, 1800);
    }

    var requests = loadRequests();
    requests.forEach(appendApprovedVehicle);
    var selectedRequests = {};
    var activeRequestView = 'all';
    var currentRequest = null;
    var bulkMode = 'aprv';
    var requestQueryInput = document.getElementById('requestQuery');
    var requestSearch = managementHeader.bindSearch(requestQueryInput, document.getElementById('requestSearch'), applyRequestFilterInputs);
    var requestStatusSelect = document.getElementById('requestStatus');
    var requestPeriod = initRequestPeriod(applyRequestFilterInputs);
    var initialRequestRange = requestPeriod.read();
    var requestAllBody = document.getElementById('requestAllBody');
    var requestPendingBody = document.getElementById('requestPendingBody');
    var myRequestBody = document.getElementById('myReqBody');
    var myRequestPager=MIQ.createListPager(myRequestBody.closest('.tbl-wrap'),{pageSize:20,presentation:'operations',unit:'건',onChange:renderMyRequests});
    var requestAllPager=MIQ.createListPager(requestAllBody.closest('.tbl-wrap'),{pageSize:20,presentation:'operations',unit:'건',onChange:renderAdminRequests});
    var requestPendingPager=MIQ.createListPager(requestPendingBody.closest('.tbl-wrap'),{pageSize:20,presentation:'operations',unit:'건',onChange:renderAdminRequests});
    var appliedRequestFilters = {
      query: requestSearch.read(),
      status: requestStatusSelect ? requestStatusSelect.value : '',
      from: initialRequestRange.from,
      to: initialRequestRange.to
    };

    function renderMyRequests() {
      if (!myRequestBody) return;
      var requester = onboarding ? onboarding.name : window.MIQ && MIQ.MANAGEMENT_IDENTITY ? MIQ.MANAGEMENT_IDENTITY.operator : '윤태호';
      var requesterId = REQUESTER_IDS[role] || '';
      var mine = requests.filter(function (record) {
        return Number(record.companyId) === CURRENT_COMPANY_ID && (record.requesterId ? record.requesterId === requesterId : record.requesterName === requester);
      }).sort(function (a, b) { return b.registered.localeCompare(a.registered); });
      MIQCommon.view.set(myRequestBody,"innerHTML",myRequestPager.slice(mine).map(function (record) {
        return '<tr data-request-id="' + esc(record.id) + '"><td class="strong">' + esc(record.vin) + '</td><td>' + esc(record.terminal) + '</td><td>' + esc(record.dealer) + '</td><td>' + esc(record.registered) + '</td><td class="c">' + requestStatusBadge(record) + '</td><td class="' + (record.processed ? '' : 'mute') + '">' + esc(record.processed || '-') + '</td><td class="c"><button class="btn btn--sm" type="button" data-request-detail="' + esc(record.id) + '">상세</button></td></tr>';
      }).join(''));
      if (!mine.length) MIQCommon.view.set(myRequestBody,"innerHTML",'<tr class="mm-empty"><td colspan="7">등록한 차량신청이 없습니다.</td></tr>');
      var pending = mine.filter(function (record) { return record.status === 'REQ'; }).length;
      var approved = mine.filter(function (record) { return record.status === 'APRV'; }).length;
      var rejected = mine.filter(function (record) { return record.status === 'RJCT'; }).length;
      var summary = document.getElementById('myRequestSummary');
      if (summary) MIQCommon.view.set(summary,"textContent",'대기 ' + pending + ' · 승인 ' + approved + ' · 반려 ' + rejected + ' · 총 ' + mine.length + '건');
    }
    function renderRequestSummary() {
      var scoped = dealerRequests();
      var pending = scoped.filter(function (record) { return record.status === 'REQ'; });
      var approved = scoped.filter(function (record) { return record.status === 'APRV'; });
      var rejected = scoped.filter(function (record) { return record.status === 'RJCT'; });
      var completed = scoped.filter(function (record) { return record.status !== 'REQ' && record.processed; });
      var average = completed.length ? completed.reduce(function (sum, record) { return sum + durationHours(record); }, 0) / completed.length : 0;
      var oldest = pending.slice().sort(function (a, b) { return a.registered.localeCompare(b.registered); })[0];
      var summary = document.getElementById('requestSummary');
      if (summary) MIQCommon.view.set(summary,"innerHTML",[
        ['신청', pending.length + '건', '처리가 필요한 신청', true],
        ['승인', approved.length + '건', '미배정 차량 연결 완료'],
        ['반려', rejected.length + '건', '사유 확인 가능'],
        ['평균 처리시간', average ? window.MIQCommon.numbers.integer(average) + '시간' : '-', '승인·반려 완료 기준'],
        ['최장 대기', oldest ? waitingDays(oldest) + '일' : '-', oldest ? oldest.vin : '대기 없음']
      ].map(function (item) {
        return '<div class="mm-request-kpi"><span class="mm-request-kpi__label">' + item[0] + '</span><strong class="mm-request-kpi__value' + (item[3] ? ' is-pending' : '') + '">' + esc(item[1]) + '</strong><span class="mm-request-kpi__sub">' + esc(item[2]) + '</span></div>';
      }).join(''));
      var tabCount = document.getElementById('requestTabCount');
      if (tabCount) MIQCommon.view.set(tabCount,"textContent",pending.length);
      var reference = document.getElementById('requestReferenceTime');
      if (reference) MIQCommon.view.set(reference,"textContent",'데이터 기준 ' + requestAsOfText());
    }
    function filteredDealerRequests() {
      var text = appliedRequestFilters.query;
      var status = appliedRequestFilters.status;
      var from = appliedRequestFilters.from;
      var to = appliedRequestFilters.to;
      return dealerRequests().filter(function (record) {
        var haystack = norm([record.vin, record.terminal, record.company, record.requesterName].join(' '));
        var day = requestDay(record.registered);
        return (!text || haystack.indexOf(text) > -1) && (!status || record.status === status) && (!from || day >= from) && (!to || day <= to);
      });
    }
    function applyRequestFilterInputs() {
      var range = requestPeriod.read();
      var next = {
        query: requestSearch.read(),
        status: requestStatusSelect ? requestStatusSelect.value : '',
        from: range.from,
        to: range.to
      };
      appliedRequestFilters = next;
      renderAdminRequests();
      return true;
    }
    function requestAdminAction(record) {
      return record.status === 'REQ'
        ? '<button class="btn btn--sm btn--pri" type="button" data-request-process="' + esc(record.id) + '">처리</button>'
        : '<button class="btn btn--sm" type="button" data-request-detail="' + esc(record.id) + '">상세</button>';
    }
    function requestCheckbox(record) {
      if (record.status !== 'REQ') return '<span class="mute">-</span>';
      return '<input type="checkbox" data-request-select="' + esc(record.id) + '" aria-label="' + esc(record.vin) + ' 선택"' + (selectedRequests[record.id] ? ' checked' : '') + '/>';
    }
    function visiblePendingRecords(filtered) {
      return filtered.filter(function (record) { return record.status === 'REQ'; }).sort(function (a, b) { return a.registered.localeCompare(b.registered); });
    }
    function renderAdminRequests() {
      if (!requestAllBody || !requestPendingBody) return;
      var filtered = filteredDealerRequests().sort(function (a, b) { return b.registered.localeCompare(a.registered); });
      var pending = visiblePendingRecords(filtered);
      var availableIds = {};
      pending.forEach(function (record) { availableIds[record.id] = true; });
      Object.keys(selectedRequests).forEach(function (id) { if (!availableIds[id]) delete selectedRequests[id]; });
      MIQCommon.view.set(requestAllBody,"innerHTML",requestAllPager.slice(filtered).map(function (record) {
        return '<tr data-request-id="' + esc(record.id) + '"><td class="c">' + requestCheckbox(record) + '</td><td class="strong">' + esc(record.vin) + '</td><td class="c">' + requestStatusBadge(record) + '</td><td>' + esc(record.terminal) + '</td><td>' + esc(record.company) + '</td><td>' + requestPerson(record.requesterName, record.requesterRole) + '</td><td>' + esc(record.registered) + '</td><td class="' + (record.processed ? '' : 'mute') + '">' + esc(record.processed || '-') + '</td><td>' + requestPerson(record.processorName, record.processorRole) + '</td><td class="c">' + requestAdminAction(record) + '</td></tr>';
      }).join(''));
      if (!filtered.length) MIQCommon.view.set(requestAllBody,"innerHTML",'<tr class="mm-empty"><td colspan="10">조회 조건에 해당하는 신청이 없습니다.</td></tr>');
      MIQCommon.view.set(requestPendingBody,"innerHTML",requestPendingPager.slice(pending).map(function (record) {
        return '<tr data-request-id="' + esc(record.id) + '"><td class="c">' + requestCheckbox(record) + '</td><td class="strong">' + esc(record.vin) + '</td><td class="c">' + requestStatusBadge(record) + '</td><td>' + esc(record.terminal) + '</td><td>' + esc(record.company) + '</td><td>' + requestPerson(record.requesterName, record.requesterRole) + '</td><td>' + esc(record.registered) + '</td><td class="c mm-request-wait">' + waitingDays(record) + '일</td><td class="c">' + requestAdminAction(record) + '</td></tr>';
      }).join(''));
      if (!pending.length) MIQCommon.view.set(requestPendingBody,"innerHTML",'<tr class="mm-empty"><td colspan="9">신청 중인 신청이 없습니다.</td></tr>');
      var shown = activeRequestView === 'pending' ? pending.length : filtered.length;
      var resultCount = document.getElementById('requestResultCount');
      if (resultCount) MIQCommon.view.set(resultCount,"textContent",shown);
      var allCount = document.getElementById('requestAllCount');
      if (allCount) MIQCommon.view.set(allCount,"textContent",filtered.length);
      var pendingCount = document.getElementById('requestPendingCount');
      if (pendingCount) MIQCommon.view.set(pendingCount,"textContent",pending.length);
      updateBatchState();
    }
    function clearDealerRequestViews() {
      selectedRequests = {};
      currentRequest = null;
      if (requestAllBody) MIQCommon.view.set(requestAllBody,"innerHTML",'');
      if (requestPendingBody) MIQCommon.view.set(requestPendingBody,"innerHTML",'');
      var summary = document.getElementById('requestSummary');
      if (summary) MIQCommon.view.set(summary,"innerHTML",'');
      ['requestResultCount', 'requestAllCount', 'requestPendingCount', 'requestSelectedCount', 'requestTabCount'].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) MIQCommon.view.set(node,"textContent",'0');
      });
      var reference = document.getElementById('requestReferenceTime');
      if (reference) MIQCommon.view.set(reference,"textContent",'');
      updateBatchState();
    }
    function selectedPendingRecords() {
      if (role !== 'dealer_owner') return [];
      var visibleIds = {};
      visiblePendingRecords(filteredDealerRequests()).forEach(function (record) { visibleIds[record.id] = true; });
      return Object.keys(selectedRequests).filter(function (id) { return visibleIds[id]; }).map(requestById).filter(Boolean);
    }
    function updateBatchState() {
      var count = selectedPendingRecords().length;
      var countNode = document.getElementById('requestSelectedCount');
      if (countNode) MIQCommon.view.set(countNode,"textContent",count);
      var approve = document.getElementById('requestBulkApprove');
      var reject = document.getElementById('requestBulkReject');
      if (approve) approve.disabled = !count;
      if (reject) reject.disabled = !count;
      ['requestSelectAll', 'requestSelectPending'].forEach(function (id) {
        var control = document.getElementById(id);
        if (!control) return;
        var viewRecords = visiblePendingRecords(filteredDealerRequests());
        var selectedCount = viewRecords.filter(function (record) { return selectedRequests[record.id]; }).length;
        control.checked = !!viewRecords.length && selectedCount === viewRecords.length;
        control.indeterminate = selectedCount > 0 && selectedCount < viewRecords.length;
      });
    }
    function renderRequests() {
      if (onboarding) MIQCustomerAccess.setVehicleCount(requests.filter(function (record) { return record.status === 'APRV' && record.companyId === CURRENT_COMPANY_ID; }).length);
      if (hasCapability('requestVehicle')) renderMyRequests();
      else if (myRequestBody) {
        MIQCommon.view.set(myRequestBody,"innerHTML",'');
        MIQCommon.view.set(document.getElementById('myRequestSummary'),"textContent",'');
      }
      if (role === 'dealer_owner') {
        renderRequestSummary();
        renderAdminRequests();
      } else clearDealerRequestViews();
      applyRole();
      applyFilter();
    }
    function setRequestView(view) {
      activeRequestView = view === 'pending' ? 'pending' : 'all';
      Array.prototype.forEach.call(document.querySelectorAll('[data-request-view]'), function (button) {
        var active = button.dataset.requestView === activeRequestView;
        button.classList.toggle('active', active);
        MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']);
        button.tabIndex = active ? 0 : -1;
      });
      var allView = document.getElementById('requestViewAll');
      var pendingView = document.getElementById('requestViewPending');
      if (allView) allView.classList.toggle('active', activeRequestView === 'all');
      if (pendingView) pendingView.classList.toggle('active', activeRequestView === 'pending');
      if (allView) MIQCommon.view.call(allView,"setAttribute",['aria-hidden',activeRequestView === 'all' ? 'false' : 'true']);
      if (pendingView) MIQCommon.view.call(pendingView,"setAttribute",['aria-hidden',activeRequestView === 'pending' ? 'false' : 'true']);
      renderAdminRequests();
    }

    var approvalModal = document.getElementById('aprvModal');
    var approvalMode = document.getElementById('apMode');
    var approvalDecision = document.getElementById('apDecisionArea');
    var approvalCompleted = document.getElementById('apCompletedArea');
    var approvalReason = document.getElementById('apReason');
    var approvalReasonWarn = document.getElementById('apReasonWarn');
    var vehicleRejection = initRejectionReason(approvalReason, 'vehicle', approvalReasonWarn);
    var bulkRejection = initRejectionReason(document.getElementById('requestBulkReason'), 'vehicle', document.getElementById('requestBulkReasonWarn'));
    var approvalSubmitButton = document.getElementById('apSubmit');
    function decisionMode() {
      var active = approvalMode && approvalMode.querySelector('button.active');
      return active ? active.dataset.mode : 'aprv';
    }
    function paintDecision() {
      var approve = decisionMode() === 'aprv';
      document.getElementById('apAprvBox').classList.toggle('is-hidden', !approve);
      document.getElementById('apRjctBox').classList.toggle('is-hidden', approve);
      MIQCommon.view.set(approvalSubmitButton,"textContent",approve ? '승인 처리' : '반려 처리');
      approvalSubmitButton.classList.toggle('btn--pri', approve);
      approvalReasonWarn.classList.add('is-hidden');
      if (currentRequest) {
        var validation = validateRequestRecord(currentRequest);
        approvalSubmitButton.disabled = approve && !validation.ok;
      }
    }
    function approvedVehicleConflict(record) {
      var rowConflict = allRows().some(function (row) {
        var terminal = row.children[8] ? MIQCommon.view.get(row.children[8],"textContent").trim() : '';
        return row.dataset.vin === record.vin || (!!record.terminal && terminal === record.terminal);
      });
      var requestConflict = requests.some(function (item) {
        return item.id !== record.id && item.status === 'APRV' && (item.vin === record.vin || (!!record.terminal && item.terminal === record.terminal));
      });
      return rowConflict || requestConflict;
    }
    function validateRequestRecord(record) {
      var checks = [
        { label:'이미 처리된 신청입니다.', ok:!!record && record.status === 'REQ' },
        { label:'차대번호 또는 단말기 ID가 누락되었습니다.', ok:!!record && !!record.vin && !!record.terminal },
        { label:'담당 딜러가 아닌 신청입니다.', ok:!!record && Number(record.dealerCompanyId) === CURRENT_DEALER_ID && record.dealer === CURRENT_DEALER },
        { label:'요청 업체 연결 정보를 확인해 주세요.', ok:!!record && Number(record.companyId) === CURRENT_COMPANY_ID && record.company === CURRENT_COMPANY },
        { label:'이미 등록되었거나 승인된 차량입니다.', ok:!!record && !approvedVehicleConflict(record) }
      ];
      return {
        checks: checks,
        canProcess: checks[0].ok && checks[2].ok && checks[3].ok,
        ok: checks.every(function (check) { return check.ok; })
      };
    }
    function customerVehicleCountAfterApproval() {
      var added = allRows().filter(function (row) {
        return row.dataset.approvedNew === '1' && row.children[1] && MIQCommon.view.get(row.children[1],"textContent").trim() === CURRENT_COMPANY;
      }).length;
      return baseRoleTotals.customer_owner + added + 1;
    }
    function paintApprovalPreview(record, validation) {
      MIQCommon.view.set(document.getElementById('apLinkCompany'),"textContent",record.company || '-');
      MIQCommon.view.set(document.getElementById('apValidationList'),"innerHTML",record.status === 'REQ'
        ? (validation.ok
          ? '<li class="is-ok"><span aria-hidden="true">✓</span>승인에 필요한 차량·업체 연결 정보를 확인했습니다.</li>'
          : validation.checks.filter(function (check) { return !check.ok; }).map(function (check) {
              return '<li class="is-error"><span aria-hidden="true">!</span>' + esc(check.label) + '</li>';
            }).join(''))
        : '<li class="is-ok"><span aria-hidden="true">✓</span>' + (record.status === 'APRV' ? '승인 · 업체 차량 연결 완료' : '반려 처리 완료') + '</li>');
    }
    function openRequestDetail(id, canProcess) {
      var record = requestById(id);
      if (!record) return;
      var operator = window.MIQ && MIQ.MANAGEMENT_IDENTITY ? MIQ.MANAGEMENT_IDENTITY.operator : '';
      var isOwnRequest = hasCapability('requestVehicle') && record.company === CURRENT_COMPANY && record.requesterName === operator;
      if (role !== 'dealer_owner' && !isOwnRequest) return;
      currentRequest = record;
      MIQCommon.view.set(document.getElementById('apVinTitle'),"textContent",record.vin);
      MIQCommon.view.set(document.getElementById('apVin'),"textContent",record.vin);
      MIQCommon.view.set(document.getElementById('apTid'),"textContent",record.terminal);
      MIQCommon.view.set(document.getElementById('apRequester'),"textContent",record.requesterName + ' · ' + record.requesterRole);
      MIQCommon.view.set(document.getElementById('apRegistered'),"textContent",record.registered);
      var validation = validateRequestRecord(record);
      var editable = !!canProcess && record.status === 'REQ' && hasCapability('approveVehicleRequest');
      var connectionPreview = document.getElementById('apConnectionPreview');
      connectionPreview.classList.toggle('is-hidden', record.status === 'RJCT' && !editable);
      paintApprovalPreview(record, validation);
      approvalDecision.classList.toggle('is-hidden', !editable);
      approvalCompleted.classList.toggle('is-hidden', editable);
      approvalSubmitButton.classList.toggle('is-hidden', !editable);
      MIQCommon.view.set(document.getElementById('apClose'),"textContent",editable ? '취소' : '닫기');
      MIQCommon.view.set(document.getElementById('apModalAction'),"textContent",editable ? '차량신청 처리' : '차량신청 상세');
      if (editable) {
        Array.prototype.forEach.call(approvalMode.querySelectorAll('button'), function (button) { button.classList.toggle('active', button.dataset.mode === 'aprv'); });
        vehicleRejection.reset();
        paintDecision();
      } else {
        MIQCommon.view.set(document.getElementById('apCompletedStatus'),"innerHTML",requestStatusBadge(record));
        MIQCommon.view.set(document.getElementById('apProcessed'),"textContent",record.processed || '-');
        MIQCommon.view.set(document.getElementById('apProcessor'),"textContent",record.processorName ? record.processorName + ' · ' + record.processorRole : '-');
        MIQCommon.view.set(document.getElementById('apCompletedReason'),"textContent",record.reason || '-');
      }
      approvalModal.classList.add('open');
      focusManagedModal(approvalModal);
    }
    function processRequestRecords(records, modeValue, reasonValue, reasonType) {
      var operator = window.MIQ && MIQ.MANAGEMENT_IDENTITY ? MIQ.MANAGEMENT_IDENTITY.operator : '박민아';
      var processedRecords = [];
      var blockedRecords = [];
      if (['aprv', 'rjct'].indexOf(modeValue) < 0) return { processed:processedRecords, blocked:records.slice() };
      records.forEach(function (record) {
        var validation = validateRequestRecord(record);
        var allowed = modeValue === 'rjct' ? validation.canProcess : validation.ok;
        if (!allowed) { blockedRecords.push(record); return; }
        record.status = modeValue === 'rjct' ? 'RJCT' : 'APRV';
        record.processed = nowText();
        record.processorName = operator;
        record.processorRole = '딜러 대표';
        record.reason = record.status === 'RJCT' ? reasonValue : '';
        record.reasonType = record.status === 'RJCT' ? reasonType : '';
        if (record.status === 'APRV') {
          record.linkedNew = true;
          if (!record.linkedGroup) record.linkedGroup = '미배정';
          if (!record.linkedNickname) record.linkedNickname = record.model;
          if (!record.shockMode) record.shockMode = 'inherit';
          if (!record.shockValues) record.shockValues = '';
          appendApprovedVehicle(record);
        }
        processedRecords.push(record);
        delete selectedRequests[record.id];
      });
      if (processedRecords.length) {
        saveRequests();
        renderRequests();
      }
      return { processed:processedRecords, blocked:blockedRecords };
    }
    if (approvalMode) approvalMode.addEventListener('click', function (event) {
      var button = event.target.closest('button[data-mode]');
      if (!button) return;
      Array.prototype.forEach.call(approvalMode.querySelectorAll('button'), function (item) { item.classList.toggle('active', item === button); });
      event.stopPropagation();
      paintDecision();
    });
    if (approvalSubmitButton) approvalSubmitButton.addEventListener('click', function () {
      if (!hasCapability('approveVehicleRequest')) { toast('딜러 대표만 차량 신청을 처리할 수 있습니다.', 'danger'); return; }
      if (!currentRequest || currentRequest.status !== 'REQ') return;
      var modeValue = decisionMode();
      var rejection = modeValue === 'rjct' ? vehicleRejection.read() : { type:'', reason:'' };
      if (!rejection) return;
      var result = processRequestRecords([currentRequest], modeValue, rejection.reason, rejection.type);
      if (!result.processed.length) {
        toast('승인 전 중복·소속 검증을 통과하지 못했습니다.', 'danger');
        return;
      }
      approvalModal.classList.remove('open');
      restoreManagedModalFocus();
      toast(currentRequest.vin + (modeValue === 'rjct' ? ' 신청을 반려했습니다.' : ' 차량을 승인하고 미배정 상태로 연결했습니다.'), modeValue === 'rjct' ? 'danger' : 'success');
      currentRequest = null;
    });

    var bulkModal = document.getElementById('requestBulkModal');
    function openBulk(modeValue) {
      if (!hasCapability('approveVehicleRequest')) { toast('딜러 대표만 차량 신청을 처리할 수 있습니다.', 'danger'); return; }
      var records = selectedPendingRecords();
      if (!records.length) return;
      bulkMode = modeValue;
      MIQCommon.view.set(document.getElementById('requestBulkTitle'),"textContent",modeValue === 'rjct' ? '선택 신청 일괄 반려' : '선택 신청 일괄 승인');
      var validations = records.map(function (record) { return { record:record, validation:validateRequestRecord(record) }; });
      var invalidCount = validations.filter(function (item) { return modeValue === 'rjct' ? !item.validation.canProcess : !item.validation.ok; }).length;
      MIQCommon.view.set(document.getElementById('requestBulkSummary'),"textContent",'선택한 ' + records.length + '건을 ' + (modeValue === 'rjct' ? '반려' : '승인하고 업체 미배정 차량으로 연결') + '합니다.');
      MIQCommon.view.set(document.getElementById('requestBulkTargets'),"innerHTML",'<ul>' + validations.map(function (item) {
        var valid = modeValue === 'rjct' ? item.validation.canProcess : item.validation.ok;
        return '<li><span class="badge ' + (valid ? 'ok' : 'bad') + '">' + (valid ? '확인' : '차단') + '</span><b>' + esc(item.record.vin) + '</b><span>' + esc(item.record.company) + '</span></li>';
      }).join('') + '</ul>');
      MIQCommon.view.set(document.getElementById('requestBulkImpact'),"textContent",modeValue === 'rjct'
        ? '공통 반려 사유가 선택한 신청에 기록됩니다.'
        : '승인 후 업체 차량은 ' + (customerVehicleCountAfterApproval() - 1 + records.length) + '대가 되며, 모두 미배정 그룹으로 연결됩니다.');
      document.getElementById('requestBulkReasonArea').classList.toggle('is-hidden', modeValue !== 'rjct');
      bulkRejection.reset();
      document.getElementById('requestBulkReasonWarn').classList.add('is-hidden');
      var bulkSubmit = document.getElementById('requestBulkSubmit');
      MIQCommon.view.set(bulkSubmit,"textContent",modeValue === 'rjct' ? '일괄 반려' : '일괄 승인');
      bulkSubmit.classList.toggle('btn--pri', modeValue !== 'rjct');
      bulkSubmit.disabled = invalidCount > 0;
      bulkModal.classList.add('open');
      focusManagedModal(bulkModal);
    }
    document.getElementById('requestBulkApprove').addEventListener('click', function () { openBulk('aprv'); });
    document.getElementById('requestBulkReject').addEventListener('click', function () { openBulk('rjct'); });
    document.getElementById('requestBulkSubmit').addEventListener('click', function () {
      if (!hasCapability('approveVehicleRequest')) { toast('딜러 대표만 차량 신청을 처리할 수 있습니다.', 'danger'); return; }
      var records = selectedPendingRecords();
      var rejection = bulkMode === 'rjct' ? bulkRejection.read() : { type:'', reason:'' };
      if (!rejection) return;
      var result = processRequestRecords(records, bulkMode, rejection.reason, rejection.type);
      if (!result.processed.length) {
        toast('처리 가능한 신청이 없습니다.', 'danger');
        return;
      }
      bulkModal.classList.remove('open');
      restoreManagedModalFocus();
      toast(result.processed.length + '건을 ' + (bulkMode === 'rjct' ? '반려했습니다.' : '승인했습니다.') + (result.blocked.length ? ' · ' + result.blocked.length + '건은 검증에서 제외했습니다.' : ''), bulkMode === 'rjct' ? 'danger' : 'success');
    });

    document.querySelector('.mm-request-view-tabs').addEventListener('click', function (event) {
      var button = event.target.closest('[data-request-view]');
      if (button) setRequestView(button.dataset.requestView);
    });
    requestStatusSelect.addEventListener('change', function () {
      appliedRequestFilters.status = this.value;
      renderAdminRequests();
    });
    document.getElementById('tabApproval').addEventListener('change', function (event) {
      var checkbox = event.target.closest('[data-request-select]');
      if (!checkbox) return;
      selectedRequests[checkbox.dataset.requestSelect] = checkbox.checked;
      if (!checkbox.checked) delete selectedRequests[checkbox.dataset.requestSelect];
      Array.prototype.forEach.call(document.querySelectorAll('[data-request-select="' + checkbox.dataset.requestSelect + '"]'), function (item) { item.checked = checkbox.checked; });
      updateBatchState();
    });
    ['requestSelectAll', 'requestSelectPending'].forEach(function (id) {
      document.getElementById(id).addEventListener('change', function () {
        var checked = this.checked;
        visiblePendingRecords(filteredDealerRequests()).forEach(function (record) {
          if (checked) selectedRequests[record.id] = true;
          else delete selectedRequests[record.id];
        });
        renderAdminRequests();
      });
    });
    document.addEventListener('click', function (event) {
      var process = event.target.closest('[data-request-process]');
      if (process) { openRequestDetail(process.dataset.requestProcess, true); return; }
      var detail = event.target.closest('[data-request-detail]');
      if (detail) openRequestDetail(detail.dataset.requestDetail, false);
    });

    document.getElementById('requestExport').addEventListener('click', function () {
      if (!hasCapability('approveVehicleRequest')) { toast('딜러 대표만 신청 목록을 내보낼 수 있습니다.', 'danger'); return; }
      var filtered = filteredDealerRequests();
      var rows = activeRequestView === 'pending' ? visiblePendingRecords(filtered) : filtered;
      var values = [['차대번호','처리상태','단말기 ID','업체명','신청자','신청일시','처리일시','처리 담당자','반려 사유']].concat(rows.map(function (record) {
        var status = REQUEST_STATUS[record.status] || { label:'확인 필요' };
        return [record.vin, status.label, record.terminal, record.company, record.requesterName + ' · ' + record.requesterRole, record.registered, record.processed || '', record.processorName ? record.processorName + ' · ' + record.processorRole : '', record.reason || ''];
      }));
      var csv = '\ufeff' + values.map(function (row) { return row.map(function (value) { return '"' + String(value).replace(/"/g, '""') + '"'; }).join(','); }).join('\r\n');
      var url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8' }));
      var link = document.createElement('a');
      link.href = url; link.download = '차량신청_목록_' + requestToday() + '.csv';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    });
    document.addEventListener('miq:vehicle-edit', function (event) {
      var detail = event.detail || {};
      var record = requests.filter(function (item) { return item.vin === detail.vin && item.linkedNew; })[0];
      if (!record) return;
      record.linkedGroup = detail.group || '미배정';
      record.linkedNickname = detail.nickname || record.model;
      record.shockMode = detail.shockMode === 'override' ? 'override' : 'inherit';
      record.shockValues = record.shockMode === 'override' ? (detail.shockValues || '') : '';
      saveRequests();
      applyFilter();
    });

    /* Customer registration: direct identifiers, lookup, then confirmation. */
    var reqModal = document.getElementById('reqModal');
    var requestSerial = document.getElementById('reqSerial');
    var requestTerminal = document.getElementById('reqTerminal');
    var requestPreview = document.getElementById('requestPreview');
    var requestStatus = document.getElementById('requestLookupStatus');
    var requestSubmit = document.getElementById('requestSubmit');
    var requestLookup = window.MIQVehicleRegistration.create(requestCatalog, function () { return requests; }, function () {
      return allRows().map(function (row) { return { vin:row.dataset.vin, terminal:row.children[8] ? MIQCommon.view.get(row.children[8],"textContent").trim() : '' }; });
    });
    function clearRequestPreview(message) {
      MIQCommon.view.set(requestPreview,"innerHTML",'<td colspan="4" class="mute">' + esc(message || '차량 시리얼번호와 터미널 ID를 입력한 후 조회해 주세요.') + '</td>');
      requestSubmit.disabled = true;
    }
    function setLookupStatus(message, error) {
      MIQCommon.view.set(requestStatus,"textContent",message || '');
      requestStatus.dataset.error = error ? 'true' : 'false';
    }
    function invalidateRequestLookup() {
      var hadResult = !requestSubmit.disabled;
      requestLookup.invalidate();
      clearRequestPreview();
      requestSerial.removeAttribute('aria-invalid');
      requestTerminal.removeAttribute('aria-invalid');
      setLookupStatus(hadResult ? '입력 정보가 변경되었습니다. 다시 조회해 주세요.' : '', false);
    }
    function resetRequestLookup() {
      requestSerial.value = '';
      requestTerminal.value = '';
      invalidateRequestLookup();
      setLookupStatus('', false);
    }
    function showLookupFailure(result) {
      clearRequestPreview('조회된 차량 정보가 없습니다.');
      setLookupStatus(result.message, true);
      var field = result.field === 'terminal' ? requestTerminal : requestSerial;
      if (result.field) MIQCommon.view.call(field,"setAttribute",['aria-invalid','true']);
      field.focus();
    }
    requestSerial.addEventListener('input', invalidateRequestLookup);
    requestTerminal.addEventListener('input', invalidateRequestLookup);
    document.getElementById('btnReq').addEventListener('click', resetRequestLookup);
    document.getElementById('requestLookupForm').addEventListener('submit', function (event) {
      event.preventDefault();
      if (!hasCapability('requestVehicle')) return;
      requestSerial.removeAttribute('aria-invalid');
      requestTerminal.removeAttribute('aria-invalid');
      var result = requestLookup.search(requestSerial.value, requestTerminal.value);
      if (!result.ok) { showLookupFailure(result); return; }
      var item = result.item;
      MIQCommon.view.set(requestPreview,"innerHTML",'<td>' + esc(item.model) + '</td><td class="strong">' + esc(item.vin) + '</td><td>' + esc(item.terminal) + '</td><td>' + esc(item.dealer) + '</td>');
      setLookupStatus(result.message, false);
      requestSubmit.disabled = false;
    });
    requestSubmit.addEventListener('click', function () {
      if (!hasCapability('requestVehicle')) { toast('차량 신청 권한이 있는 고객 계정만 신청할 수 있습니다.', 'danger'); return; }
      var result = requestLookup.confirm(requestSerial.value, requestTerminal.value);
      if (!result.ok) { showLookupFailure(result); return; }
      var item = result.item;
      requestSubmit.disabled = true;
      var requester = onboarding ? onboarding.name : window.MIQ && MIQ.MANAGEMENT_IDENTITY ? MIQ.MANAGEMENT_IDENTITY.operator : '윤태호';
      var requesterRole = role === 'customer_staff' ? '고객 직원' : '고객 대표';
      requests.unshift({ id:'VR-' + Date.now(), vin:item.vin, terminal:item.terminal, dealer:item.dealer, dealerCompanyId:item.dealerCompanyId, company:CURRENT_COMPANY, companyId:CURRENT_COMPANY_ID, rentalCompanyId:null, rentalCompanyName:'해당 없음', groupId:null, requesterId:REQUESTER_IDS[role] || '', requesterName:requester, requesterRole:requesterRole, registered:nowText(), processed:'', status:'REQ', processorName:'', processorRole:'', reason:'', model:item.model, type:item.type, year:item.year });
      if (!saveRequests()) {
        requests.shift();
        requestSubmit.disabled = false;
        setLookupStatus('등록 신청을 저장하지 못했습니다. 브라우저 저장 설정을 확인한 후 다시 시도해 주세요.', true);
        return;
      }
      renderRequests();
      resetRequestLookup();
      reqModal.classList.remove('open');
      document.dispatchEvent(new CustomEvent('miq:modal-closed'));
      document.getElementById('tabBtnReq').click();
      document.getElementById('tabBtnReq').focus();
      toast(item.vin + ' 차량 등록을 신청했습니다.', 'success');
    });


    document.querySelector('.mm-vehicle-tabs').addEventListener('click', function (event) {
      var button = event.target.closest('button[data-tab]');
      if (!button) return;
      window.setTimeout(function () {
        syncTabStops(document.querySelector('.mm-vehicle-tabs'), button);
        var controlContext = button.dataset.tab === 'tabList' ? 'list' : button.dataset.tab === 'tabApproval' ? 'approval' : 'none';
        if (managementHeader && typeof managementHeader.setControlContext === 'function') {
          managementHeader.setControlContext(controlContext);
        } else {
          var listControls = document.querySelector('[data-mgmt-list-controls]');
          if (listControls) listControls.classList.toggle('is-hidden', controlContext !== 'list');
        }
      }, 0);
    });
    bindTabArrowKeys(document.querySelector('.mm-vehicle-tabs'));
    bindTabArrowKeys(document.querySelector('.mm-request-view-tabs'));
    resetRequestLookup();
    renderRequests();

    /* Complete the catalog before the single initial page render. */
    if (generated < 30) appendMore(30 - generated);

    var deepVin = query.get('veh') || query.get('vin');
    if (deepVin && generated < 30) appendMore(30 - generated);
    if (deepVin) window.setTimeout(function () {
      var row = Array.prototype.filter.call(tbody.querySelectorAll('tr[data-vin]'), function (tr) { return tr.dataset.vin === deepVin; })[0];
      if (row) { row.classList.add('vin-focus'); row.scrollIntoView({ block: 'center' }); var edit = row.querySelector('[data-modal-open="vehModal"]'); if (edit) edit.click(); }
      else toast('요청한 차량이 현재 권한의 목록에 없습니다.', 'danger');
    }, 0);
    markInitialDealerStaffScope();
    applyRole();
    vehicleReady = true;
    if (query.get('q') || query.get('group') || query.get('type')) applyCompleteVehicleFilter();
    else applyFilter();
    if (query.get('register') === '1' && hasCapability('requestVehicle')) {
      var requestEntry = document.getElementById('btnReq');
      if (requestEntry) requestEntry.click();
      query.delete('register');
      var registrationUrl = new URL(location.href);
      registrationUrl.searchParams.delete('register');
      history.replaceState(history.state, '', registrationUrl.href);
    }
  }

  function start() {
    if (section === 'map' && page === 'map') initMap();
    if (section === 'mgmt' && page === 'user') initUser();
    if (section === 'mgmt' && page === 'company') initCompany();
    if (section === 'mgmt' && page === 'group') initGroup();
    if (section === 'mgmt' && page === 'vehicle') initVehicle();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
