(function () {
  'use strict';

  var body = document.body;
  if (!body || body.dataset.gnb !== 'rpt') return;

  var main = document.querySelector('.main');
  if (!main) return;

  var feedback = document.createElement('div');
  feedback.className = 'report-feedback';
  feedback.id = 'reportFeedback';
  MIQCommon.view.call(feedback,"setAttribute",['role','status']);
  MIQCommon.view.call(feedback,"setAttribute",['aria-live','polite']);
  var filter = main.querySelector('.filter-bar');
  if (filter) {
    var feedbackHost = filter.closest('.miq-title-period-row') || filter;
    feedbackHost.insertAdjacentElement('afterend', feedback);
  }

  var live = document.createElement('div');
  live.className = 'miq-sr-only';
  MIQCommon.view.call(live,"setAttribute",['aria-live','polite']);
  document.body.appendChild(live);

  function normalize(value) {
    return String(value || '').toUpperCase().replace(/[^0-9A-Z가-힣]/g, '');
  }

  var REPORT_COMPANY_IDS = {
    '1933': '(주)세종물류중부지점',
    'rpt-jinwoo': '(주)진우아이엔씨',
    'rpt-daesung': '(주)대성테크',
    'rpt-geumseong': '금성건설기계',
    'rpt-daehan': '대한제지(주)',
    'rpt-daeho': '대호지게차'
  };
  var reportRole = MIQCommon.roles.resolve(body.dataset.managementRole || new URLSearchParams(location.search).get('role'));
  var reportPolicy = MIQCommon.roles.targetPolicy(reportRole);
  var dashboardSource = window.MIQ_MOCK_DATA && window.MIQ_MOCK_DATA.fleet;
  if (!MIQCommon.roles.isCustomer(reportRole) && dashboardSource && Array.isArray(dashboardSource.dashboardCompanies)) {
    dashboardSource.dashboardCompanies.forEach(function (company) {
      if (!company.companyId || !company.companyName
        || (Array.isArray(company.dashboardRoles) && company.dashboardRoles.indexOf(reportRole) < 0)
        || (reportPolicy.companyIds && reportPolicy.companyIds.indexOf(company.companyId) < 0)) return;
      REPORT_COMPANY_IDS[String(company.companyId)] = company.companyName;
    });
  }
  var syncingCompany = false;

  function targetCompanySelect() {
    return document.querySelector('.miq-target-selector [data-target-company]');
  }

  function targetCompanyName(companyId) {
    var select = targetCompanySelect();
    if (select && select.selectedIndex >= 0) return MIQCommon.view.get(select.options[select.selectedIndex],"textContent").trim();
    return REPORT_COMPANY_IDS[companyId] || '';
  }

  function companyIdForName(name) {
    var wanted = normalize(name);
    var currentId = new URLSearchParams(location.search).get('companyId');
    if (currentId && REPORT_COMPANY_IDS[currentId] && normalize(REPORT_COMPANY_IDS[currentId]) === wanted) return currentId;
    return Object.keys(REPORT_COMPANY_IDS).filter(function (id) {
      return normalize(REPORT_COMPANY_IDS[id]) === wanted;
    })[0] || '';
  }

  function relocateCompanyControls() {
    var source = main.querySelector('.filter-bar');
    if (!source || main.querySelector('.miq-report-company-controls')) return;

    var isStatus = body.dataset.sub === 'rptstatus';
    var row = document.createElement('div');
    row.className = 'miq-report-company-controls' + (isStatus ? ' is-single' : '');
    MIQCommon.view.call(row,"setAttribute",['role','group']);
    MIQCommon.view.call(row,"setAttribute",['aria-label',isStatus ? '조회 업체 설정' : (body.dataset.sub === 'rptheat' ? '히트맵 업체 설정' : '비교 업체 설정')]);
    (isStatus ? ['.co-k', '#coSel'] : ['.co-k', '#btnAdd', '#btnDel', '#coWrap', '#coHint']).forEach(function (selector) {
      var node = source.querySelector(selector);
      if (node) row.appendChild(node);
    });
    var label = row.querySelector('.co-k');
    if (label) MIQCommon.view.set(label,"textContent",isStatus ? '조회 업체' : (body.dataset.sub === 'rptheat' ? '히트맵 업체' : '비교 업체'));
    if (isStatus) {
      var hint = document.createElement('span');
      hint.className = 'co-hint';
      MIQCommon.view.set(hint,"textContent",'1개 업체 조회');
      row.appendChild(hint);
    }
    var filterHost = source.closest('.miq-title-period-row') || source;
    filterHost.insertAdjacentElement('afterend', row);
  }

  function reportCompanySelects() {
    if (body.dataset.sub === 'rptstatus') {
      var one = document.getElementById('coSel');
      return one ? [one] : [];
    }
    return Array.prototype.slice.call(document.querySelectorAll('#coWrap select'));
  }

  function syncMultiCompanyPrimary(name) {
    var selects = reportCompanySelects();
    if (!selects.length || !name) return;
    var selectedIndex = selects.map(function (select) { return select.value; }).indexOf(name);
    if (selectedIndex > 0) {
      var priorPrimary = selects[0].value;
      selects[selectedIndex].value = priorPrimary;
      selects[selectedIndex].dispatchEvent(new Event('change', { bubbles: true }));
      selects = reportCompanySelects();
    }
    if (selects[0] && selects[0].value !== name) selectOption(selects[0], name);
  }

  function syncReportFromTarget(detail) {
    if (syncingCompany || (window.MIQReportScope && MIQReportScope.customer)) return;
    var id = detail && detail.companyId;
    var name = targetCompanyName(id);
    if (!name) return;
    syncingCompany = true;
    try {
      if (body.dataset.sub === 'rptstatus') selectOption(document.getElementById('coSel'), name);
      else syncMultiCompanyPrimary(name);
    } finally {
      syncingCompany = false;
    }
  }

  function targetIdForCompany(name) {
    var select = targetCompanySelect();
    if (!select) return '';
    var option = Array.prototype.filter.call(select.options, function (item) {
      return normalize(MIQCommon.view.get(item,"textContent")) === normalize(name);
    })[0];
    return option ? option.value : '';
  }

  function syncTargetFromReportPrimary() {
    if (syncingCompany || (window.MIQReportScope && MIQReportScope.customer)) return;
    var selects = reportCompanySelects();
    var target = targetCompanySelect();
    if (!selects.length || !target) return;
    var id = targetIdForCompany(selects[0].value);
    if (!id || target.value === id) return;
    syncingCompany = true;
    try {
      target.value = id;
      target.dispatchEvent(new Event('change', { bubbles: true }));
    } finally {
      syncingCompany = false;
    }
  }

  function contextParams() {
    var params = new URLSearchParams(location.search);
    var company = targetCompanySelect();
    var vehicle = document.querySelector('.miq-target-selector [data-target-vehicle]');
    var selectedCompanies = reportCompanySelects().map(function (select) { return select.value; }).filter(Boolean);
    var activePeriod = document.querySelector('.period-tabs button.active');
    var from = document.getElementById('dFrom');
    var to = document.getElementById('dTo');

    if (company && company.value) params.set('companyId', company.value);
    else if (body.dataset.sub === 'rptstatus' && selectedCompanies.length) {
      var statusCompanyId = companyIdForName(selectedCompanies[0]);
      if (statusCompanyId) params.set('companyId', statusCompanyId);
      else params.delete('companyId');
    }
    if (vehicle && vehicle.value) params.set('veh', vehicle.value);
    else params.delete('veh');
    if (body.dataset.sub !== 'rptstatus' && selectedCompanies.length) params.set('companies', selectedCompanies.join('|'));
    else params.delete('companies');
    var applied = MIQ.getAppliedPeriod();
    if (applied) {
      params.set('period', applied.period); params.set('from', applied.from); params.set('to', applied.to);
    } else {
      if (activePeriod && activePeriod.dataset.period) params.set('period', activePeriod.dataset.period);
      if (from && from.value) params.set('from', from.value);
      if (to && to.value) params.set('to', to.value);
    }
    params.delete('company');
    if (reportPolicy.group) {
      params.set('companyId', reportPolicy.companyId);
      params.set('group', reportPolicy.group);
    }
    return params;
  }

  function syncContext(updateAddress) {
    var params = contextParams();
    if (updateAddress && window.history && typeof window.history.replaceState === 'function') {
      var current = new URL(location.href);
      current.search = params.toString();
      try {
        window.history.replaceState(null, '', current.href);
      } catch (error) {
        /* 일부 file:// 브라우저는 opaque origin에서 주소 변경을 막는다.
           이 경우에도 LNB 링크 문맥과 화면 데이터 동기화는 그대로 유지한다. */
      }
    }
  }

  function setFeedback(message, error) {
    MIQCommon.view.set(feedback,"textContent",message || '');
    feedback.classList.toggle('is-error', !!error);
  }

  function syncTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.period-tabs'), function (tabs) {
      MIQCommon.view.call(tabs,"setAttribute",['role','group']);
      MIQCommon.view.call(tabs,"setAttribute",['aria-label','조회 기간']);
      Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (button) {
        MIQCommon.view.call(button,"setAttribute",['aria-pressed',button.classList.contains('active') ? 'true' : 'false']);
      });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.metric-tabs'), function (tabs) {
      MIQCommon.view.call(tabs,"setAttribute",['role','tablist']);
      MIQCommon.view.call(tabs,"setAttribute",['aria-label','리포트 지표']);
      Array.prototype.forEach.call(tabs.querySelectorAll('button'), function (button) {
        var active = button.classList.contains('active');
        MIQCommon.view.call(button,"setAttribute",['role','tab']);
        MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']);
        button.tabIndex = active ? 0 : -1;
      });
    });
  }

  function chartColumnLabel(node, index) {
    var labelNode = node.nextElementSibling;
    var label = labelNode && labelNode.tagName && labelNode.tagName.toLowerCase() === 'text'
      ? MIQCommon.view.get(labelNode,"textContent").trim() : '';
    return (label || (index + 1) + '번째 구간') + ' 데이터. 포커스하면 상세 값이 표시됩니다.';
  }

  function showFocusedTooltip(node) {
    var rect = node.getBoundingClientRect();
    node.dispatchEvent(new MouseEvent('mouseenter', {
      bubbles: false,
      clientX: rect.left + Math.max(1, rect.width / 2),
      clientY: rect.top + Math.max(1, rect.height / 2)
    }));
    window.setTimeout(function () {
      var tip = node.closest('.chart-wrap, .hm-wrap');
      tip = tip && tip.querySelector('.tip-box');
      if (tip && MIQCommon.view.get(tip,"textContent").trim()) {
        MIQCommon.view.call(node,"setAttribute",['aria-label',MIQCommon.view.get(tip,"textContent").replace(/\s+/g, ' ').trim()]);
        MIQCommon.view.set(live,"textContent",MIQCommon.view.call(node,"getAttribute",['aria-label']));
      }
    }, 0);
  }

  function hideFocusedTooltip(node) {
    node.dispatchEvent(new MouseEvent('mouseleave', { bubbles: false }));
  }

  function enhanceInteractiveNode(node, label) {
    if (node.dataset.reportA11y === 'true') return;
    node.dataset.reportA11y = 'true';
    node.tabIndex = 0;
    if (!node.hasAttribute('role')) MIQCommon.view.call(node,"setAttribute",['role','button']);
    if (label) MIQCommon.view.call(node,"setAttribute",['aria-label',label]);
    node.addEventListener('focus', function () { showFocusedTooltip(node); });
    node.addEventListener('blur', function () { hideFocusedTooltip(node); });
    node.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        showFocusedTooltip(node);
      } else if (event.key === 'Escape') {
        hideFocusedTooltip(node);
      }
    });
  }

  function enhanceChartAccessibility() {
    Array.prototype.forEach.call(document.querySelectorAll('.bar-chart g.col, .line-chart g.col'), function (node, index) {
      enhanceInteractiveNode(node, chartColumnLabel(node, index));
    });

    var heatmap = document.getElementById('hm');
    if (heatmap) {
      MIQCommon.view.call(heatmap,"setAttribute",['role','grid']);
      MIQCommon.view.call(heatmap,"setAttribute",['aria-label','업체별 일자별 지표 히트맵']);
      var companies = Array.prototype.map.call(heatmap.querySelectorAll('.hm__rh'), function (node) {
        return MIQCommon.view.get(node,"textContent").trim();
      }).filter(Boolean);
      var labels = Array.prototype.map.call(heatmap.querySelectorAll('.hm__x'), function (node) {
        return MIQCommon.view.call(node,"getAttribute",['data-full-label']) || MIQCommon.view.get(node,"textContent").trim();
      });
      Array.prototype.forEach.call(heatmap.querySelectorAll('.hm__c'), function (cell) {
        var ri = Number(MIQCommon.view.call(cell,"getAttribute",['data-r']));
        var ci = Number(MIQCommon.view.call(cell,"getAttribute",['data-c']));
        var label = (companies[ri] || '업체') + ', ' + (labels[ci] || (ci + 1) + '번째 구간')
          + ', 값 ' + MIQCommon.view.get(cell,"textContent").trim();
        MIQCommon.view.call(cell,"setAttribute",['role','gridcell']);
        enhanceInteractiveNode(cell, label);
      });
    }
  }

  function enhanceComparisonMarkers() {
    if (body.dataset.sub !== 'rptcompare') return;
    Array.prototype.forEach.call(document.querySelectorAll('.cmp-tbl td.best'), function (cell) {
      if (cell.querySelector('.best-marker')) return;
      var marker = document.createElement('span');
      marker.className = 'best-marker';
      MIQCommon.view.set(marker,"textContent",'최적');
      MIQCommon.view.call(marker,"setAttribute",['aria-label','비교 업체 중 최적 값']);
      cell.appendChild(marker);
    });
    Array.prototype.forEach.call(document.querySelectorAll('#chartLg .sw'), function (swatch, index) {
      swatch.classList.add('line-swatch', 'line-swatch--' + index);
      var color = swatch.style.backgroundColor || swatch.style.background || '#333';
      swatch.style.setProperty('--series', color);
    });
  }

  function enhanceAll() {
    syncTabs();
    enhanceChartAccessibility();
    enhanceComparisonMarkers();
    Array.prototype.forEach.call(document.querySelectorAll('#dFrom, #dTo'), function (input) {
      input.required = true;
      MIQCommon.view.call(input,"setAttribute",['aria-describedby',feedback.id]);
    });
  }

  var queued = false;
  var observer = new MutationObserver(function () {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      // Decoration changes classes too. Do not observe our own writes and
      // schedule another frame forever while the report is otherwise idle.
      observer.disconnect();
      enhanceAll();
      observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    });
  });
  observer.observe(main, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  document.addEventListener('click', function (event) {
    var search = event.target.closest('#btnSearch');
    if (!search) return;
    var from = document.getElementById('dFrom');
    var to = document.getElementById('dTo');
    if (!from || !to) return;
    if (!from.value || !to.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setFeedback('조회 시작일과 종료일을 모두 입력해 주세요.', true);
      (!from.value ? from : to).focus();
      return;
    }
    if (from.value > to.value) {
      event.preventDefault();
      event.stopImmediatePropagation();
      setFeedback('조회 시작일은 종료일보다 늦을 수 없습니다.', true);
      from.focus();
      return;
    }
    setFeedback(from.value + ' ~ ' + to.value + ' 조건을 적용했습니다.', false);
    window.setTimeout(function () { syncContext(true); }, 0);
  }, true);

  document.addEventListener('change', function (event) {
    if (event.target.matches('#dFrom, #dTo')) setFeedback('', false);
    if (event.target.matches('#coSel, #coWrap select[data-ci="0"]')) syncTargetFromReportPrimary();
    if (event.target.matches('#coSel, #coWrap select')) {
      window.setTimeout(function () { syncContext(true); }, 0);
    }
  });
  document.addEventListener('click', function (event) {
    if (event.target.closest('.period-tabs button')) { window.setTimeout(syncTabs, 0); return; }
    if (event.target.closest('.metric-tabs button, #btnAdd, #btnDel')) {
      window.setTimeout(syncTabs, 0);
      window.setTimeout(function () { syncContext(true); }, 0);
    }
  });
  document.addEventListener('miq:target-change', function (event) {
    syncReportFromTarget(event.detail || {});
    window.setTimeout(function () { syncContext(true); }, 0);
  });
  document.addEventListener('miq:period-change', function () {
    window.setTimeout(function () { syncContext(true); }, 0);
  });

  function selectOption(select, wanted) {
    if (!select || !wanted) return false;
    var option = Array.prototype.filter.call(select.options, function (item) {
      return item.value === wanted
        || normalize(MIQCommon.view.get(item,"textContent")) === normalize(wanted)
        || normalize(MIQCommon.view.get(item,"textContent")).indexOf(normalize(wanted)) > -1;
    })[0];
    if (!option) return false;
    select.value = option.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function applyCompanyQuery(params) {
    if (reportPolicy.group) {
      selectOption(document.getElementById('coSel'), reportPolicy.group);
      return;
    }
    var requestedId = params.get('companyId');
    var exactCompanyName = !MIQCommon.roles.isCustomer(reportRole) && REPORT_COMPANY_IDS[requestedId];
    var single = exactCompanyName || params.get('company') || REPORT_COMPANY_IDS[requestedId] || requestedId || '';
    var statusSelect = document.getElementById('coSel');
    if (statusSelect && single) selectOption(statusSelect, single);

    var requested = params.get('companies');
    if (!requested && body.dataset.sub !== 'rptstatus' && single) requested = single;
    if (!requested) return;
    var values = requested.split(/[|,]/).map(function (value) { return value.trim(); }).filter(Boolean);
    if (!values.length) return;

    var max = body.dataset.sub === 'rptheat' ? 5 : 3;
    values = values.slice(0, max);
    while (document.querySelectorAll('#coWrap select').length < values.length) {
      var add = document.getElementById('btnAdd');
      if (!add || add.disabled) break;
      add.click();
    }
    values.forEach(function (value, index) {
      /* 각 change가 목록을 다시 그리므로 매번 최신 select를 다시 찾는다. */
      var select = document.querySelectorAll('#coWrap select')[index];
      if (select) selectOption(select, REPORT_COMPANY_IDS[value] || value);
    });
  }

  function applyQuery() {
    var params = new URLSearchParams(location.search);
    applyCompanyQuery(params);

    var period = (params.get('period') || '').toLowerCase();
    var labels = { day: '일', d: '일', week: '주', w: '주', month: '월', m: '월', custom: '사용자설정', c: '사용자설정' };
    var wanted = labels[period];
    if (wanted) {
      var button = Array.prototype.filter.call(document.querySelectorAll('.period-tabs button'), function (item) {
        return MIQCommon.view.get(item,"textContent").replace(/\s+/g, '') === wanted;
      })[0];
      if (button) {
        Array.prototype.forEach.call(button.parentNode.querySelectorAll('button'), function (item) {
          item.classList.toggle('active', item === button);
        });
        button.click();
      }
    }

    var from = document.getElementById('dFrom');
    var to = document.getElementById('dTo');
    if (from && params.get('from')) from.value = params.get('from');
    if (to && params.get('to')) to.value = params.get('to');
    if ((params.get('from') || params.get('to')) && document.getElementById('btnSearch')) {
      document.getElementById('btnSearch').click();
    }
  }

  relocateCompanyControls();
  enhanceAll();
  applyQuery();
  syncReportFromTarget(window.MIQ_TARGET_CONTEXT || {});
  if (window.MIQReportInit) window.MIQReportInit();
  enhanceAll();
  syncContext(true);
})();
