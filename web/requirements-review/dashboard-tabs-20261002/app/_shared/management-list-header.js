/* MACHINE IQ management list header / search controls.
   Role selection lives once in the GNB. The four management pages consume the
   same role state and only render filters/actions allowed for that role. */
(function () {
  'use strict';

  var body = document.body;
  var page = MIQCommon.view.call(body,"getAttribute",['data-sub']) || '';
  if (MIQCommon.view.call(body,"getAttribute",['data-gnb']) !== 'mgmt' || MIQCommon.view.call(body,"getAttribute",['data-variant']) !== 'tobe') return;

  var roleRules = window.MIQCommon.roles;
  var roles = roleRules.list();
  var queryRole = new URLSearchParams(location.search).get('role');
  var roleCode = roleRules.resolve(queryRole);
  var roleLabel = roleRules.label(roleCode);

  var CONFIG = {
    user: {
      title: '사용자', titleEn: 'User',
      searchPlaceholder: '사용자명 · 사용자 ID · 연락처', searchFieldKo: '통합 검색어', searchFieldEn: 'query',
      filters: [
        { key: 'userGroup', label: '사용자 그룹', fieldKo: '그룹명', fieldEn: 'groupName', width: 140,
          roles: ['internal', 'customer_owner'],
          options: [['', '그룹 전체'], ['전체', '전체'], ['기본그룹', '기본그룹'], ['테스트그룹', '테스트그룹'], ['물류1팀', '물류1팀']] }
      ]
    },
    company: {
      title: '업체', titleEn: 'Company',
      searchPlaceholder: '업체명 · 대표자 ID', searchFieldKo: '통합 검색어', searchFieldEn: 'query'
    },
    group: {
      title: '그룹', titleEn: 'Group',
      searchPlaceholder: '그룹명 · 위치', searchFieldKo: '통합 검색어', searchFieldEn: 'query',
      filters: [
        { key: 'timezone', label: 'Timezone', fieldKo: '시간대', fieldEn: 'timezone', width: 170,
          options: [['', 'Timezone 전체 (4)'], ['Asia/Seoul', 'Asia/Seoul (4)']],
          optionsByRole: { customer_staff: [['', 'Timezone 전체 (1)'], ['Asia/Seoul', 'Asia/Seoul (1)']] } }
      ],
      action: { id: 'btnCreateGroup', label: '＋ 그룹 등록', modal: 'grpModal', mode: 'create', capability: 'manageGroup' }
    },
    vehicle: {
      title: '차량', titleEn: 'Vehicle',
      searchPlaceholder: '차대번호 · 닉네임 · 그룹명 검색', searchFieldKo: '통합 검색어', searchFieldEn: 'query',
      searchPlaceholderByRole: {
        internal: '차대번호 · 기종 · 분류 검색',
        dealer_owner: '차대번호 · 기종 · 분류 검색',
        dealer_staff: '차대번호 · 기종 · 분류 검색'
      },
      filters: [
        { key: 'vehicleGroup', label: '그룹', fieldKo: '그룹명', fieldEn: 'groupName', width: 150,
          roles: ['customer_owner'],
          options: [['', '그룹 전체'], ['미배정', '미배정 (2)'], ['기본그룹', '기본그룹 (18)'], ['테스트그룹', '테스트그룹 (12)'], ['물류1팀', '물류1팀 (10)']] },
        { key: 'powerType', label: '분류', fieldKo: '동력 유형', fieldEn: 'powerType', width: 130,
          options: [['', '분류 전체'], ['엔진', '엔진 (32)'], ['납산', '납산 (3)'], ['리튬', '리튬 (7)']] }
      ]
    }
  };

  var config = CONFIG[page];
  if (!config) return;
  body.dataset.managementRole = roleCode;
  var activeControlContext = 'list';

  function hasCapability(capability) {
    return roleRules.hasCapability(roleCode, capability);
  }
  function roleAllows(definition) {
    return !definition.roles || definition.roles.indexOf(roleCode) > -1;
  }
  function setFieldMeta(node, fieldKo, fieldEn) {
    node.dataset.fieldKo = fieldKo;
    node.dataset.fieldEn = fieldEn;
    return node;
  }
  function addOptions(select, options) {
    options.forEach(function (item) {
      var option = document.createElement('option');
      option.value = item[0];
      MIQCommon.view.set(option,"textContent",item[1]);
      select.appendChild(option);
    });
  }
  function makeSelect(definition) {
    var select = setFieldMeta(document.createElement('select'), definition.fieldKo, definition.fieldEn);
    select.className = 'inp';
    select.dataset.mgmtFilter = definition.key;
    select.style.width = definition.width + 'px';
    MIQCommon.view.call(select,"setAttribute",['aria-label',definition.label]);
    addOptions(select, definition.optionsByRole && definition.optionsByRole[roleCode] || definition.options);
    return select;
  }
  function makeAction(definition) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn--pri role-gated' + (hasCapability(definition.capability) ? '' : ' is-hidden');
    button.id = definition.id;
    MIQCommon.view.set(button,"textContent",definition.label);
    button.dataset.capability = definition.capability || '';
    if (definition.modal) button.dataset.modalOpen = definition.modal;
    if (definition.mode) button.dataset.groupMode = definition.mode;
    return button;
  }
  function withRole(path, values) {
    var url = new URL(path, location.href);
    url.searchParams.set('role', roleCode);
    Object.keys(values || {}).forEach(function (key) {
      var value = values[key];
      if (value === '' || value == null) url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    });
    return url.href;
  }
  function setControlContext(context) {
    activeControlContext = ['list', 'approval', 'none'].indexOf(context) > -1 ? context : 'list';
    Array.prototype.forEach.call(document.querySelectorAll('[data-mgmt-control-context]'), function (node) {
      var visible = activeControlContext !== 'none' && node.dataset.mgmtControlContext === activeControlContext;
      node.classList.toggle('is-hidden', !visible);
      MIQCommon.view.call(node,"setAttribute",['aria-hidden',visible ? 'false' : 'true']);
    });
  }
  function makeTabFilters(context) {
    var filters = document.createElement('div');
    filters.className = 'miq-mgmt-filter-bar';
    filters.dataset.mgmtControlContext = context;
    MIQCommon.view.call(filters,"setAttribute",['role','group']);
    MIQCommon.view.call(filters,"setAttribute",['aria-label',config.title + ' 목록 필터']);
    return filters;
  }
  function registerContextControls(pageHead, taskbar, listControls) {
    listControls.dataset.mgmtControlContext = 'list';
    Array.prototype.forEach.call(document.querySelectorAll('[data-mgmt-context-controls]'), function (node) {
      var context = MIQCommon.view.call(node,"getAttribute",['data-mgmt-context-controls']) || 'none';
      node.classList.add('miq-mgmt-filter-bar');
      node.dataset.mgmtControlContext = context;
      var filters = makeTabFilters(context);
      if (context === 'approval') {
        var periods = document.createElement('div');
        periods.className = 'mm-request-period';
        periods.dataset.requestPeriodControl = '';
        MIQCommon.view.call(periods,"setAttribute",['role','group']);
        MIQCommon.view.call(periods,"setAttribute",['aria-label','신청일 기간']);
        [['w', '1주일'], ['m', '1개월'], ['q', '3개월'], ['all', '전체']].forEach(function (item) {
          var button = document.createElement('button');
          button.type = 'button';
          button.dataset.requestPeriod = item[0];
          MIQCommon.view.set(button,"textContent",item[1]);
          button.classList.toggle('active', item[0] === 'm');
          MIQCommon.view.call(button,"setAttribute",['aria-pressed',item[0] === 'm' ? 'true' : 'false']);
          periods.appendChild(button);
        });
        filters.appendChild(periods);
      }
      Array.prototype.forEach.call(node.querySelectorAll('select.inp'), function (control) { filters.appendChild(control); });
      if (filters.children.length) taskbar.appendChild(filters);
      if (pageHead && node.parentNode !== pageHead) pageHead.appendChild(node);
    });
    setControlContext(activeControlContext);
  }
  function ensureTaskbar(controls) {
    var taskbar = document.querySelector('[data-mgmt-taskbar]');
    if (taskbar) return taskbar;

    taskbar = document.createElement('div');
    taskbar.className = 'miq-mgmt-taskbar miq-mgmt-taskbar--single';
    taskbar.dataset.mgmtTaskbar = '';

    var label = document.createElement('span');
    label.className = 'miq-mgmt-taskbar__label';
    MIQCommon.view.set(label,"textContent",config.title + ' 목록');
    taskbar.appendChild(label);

    if (controls && controls.parentNode) controls.parentNode.insertBefore(taskbar, controls.nextSibling);
    return taskbar;
  }
  function normalizeTaskbar() {
    var taskbar = document.querySelector('[data-mgmt-taskbar]');
    if (!taskbar) return;
    taskbar.classList.add('miq-mgmt-taskbar');
    var tablist = taskbar.querySelector('[data-mgmt-tabs]');
    if (!tablist) return;
    var hadTabContract = MIQCommon.view.call(tablist,"getAttribute",['role']) === 'tablist';
    MIQCommon.view.call(tablist,"setAttribute",['role','tablist']);
    if (!MIQCommon.view.call(tablist,"getAttribute",['aria-label'])) MIQCommon.view.call(tablist,"setAttribute",['aria-label',config.title + ' 관리 업무']);
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('button[data-tab], button[data-user-tab]'));
    tabs.forEach(function (button, index) {
      var panelId = MIQCommon.view.call(button,"getAttribute",['aria-controls']) || button.dataset.tab || '';
      button.type = 'button';
      MIQCommon.view.call(button,"setAttribute",['role','tab']);
      MIQCommon.view.call(button,"setAttribute",['aria-selected',button.classList.contains('active') ? 'true' : 'false']);
      button.tabIndex = button.classList.contains('active') || (!tabs.some(function (tab) { return tab.classList.contains('active'); }) && index === 0) ? 0 : -1;
      if (panelId) {
        MIQCommon.view.call(button,"setAttribute",['aria-controls',panelId]);
        var panel = document.getElementById(panelId);
        if (panel) {
          MIQCommon.view.call(panel,"setAttribute",['role','tabpanel']);
          if (button.id) MIQCommon.view.call(panel,"setAttribute",['aria-labelledby',button.id]);
          MIQCommon.view.call(panel,"setAttribute",['aria-hidden',button.classList.contains('active') ? 'false' : 'true']);
        }
      }
    });
    tablist.addEventListener('click', function (event) {
      var selected = event.target.closest('button[data-tab], button[data-user-tab]');
      if (!selected || tabs.indexOf(selected) < 0) return;
      tabs.forEach(function (button) {
        var active = button === selected;
        MIQCommon.view.call(button,"setAttribute",['aria-selected',active ? 'true' : 'false']);
        button.tabIndex = active ? 0 : -1;
        var panelId = MIQCommon.view.call(button,"getAttribute",['aria-controls']) || button.dataset.tab || '';
        var panel = panelId ? document.getElementById(panelId) : null;
        if (panel) MIQCommon.view.call(panel,"setAttribute",['aria-hidden',active ? 'false' : 'true']);
      });
    });
    if (hadTabContract && page !== 'group') return;
    tablist.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Home' && event.key !== 'End') return;
      var visible = tabs.filter(function (button) { return !button.classList.contains('is-hidden') && !button.hidden; });
      if (!visible.length) return;
      event.preventDefault();
      var current = Math.max(0, visible.indexOf(document.activeElement));
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? visible.length - 1 : event.key === 'ArrowRight' ? (current + 1) % visible.length : (current - 1 + visible.length) % visible.length;
      visible[next].click();
      visible[next].focus();
    });
  }
  function build() {
    var title = document.querySelector('[data-mgmt-page-title]');
    var controls = document.querySelector('[data-mgmt-list-controls]');
    if (!title || !controls || controls.dataset.mgmtReady === 'true') return;

    MIQCommon.view.set(title,"textContent",config.title);
    title.dataset.fieldKo = config.title;
    title.dataset.fieldEn = config.titleEn;

    var roleSelect = document.getElementById('account-role');
    if (roleSelect) {
      setFieldMeta(roleSelect, '검수 권한', 'previewRole');
      roleSelect.value = roleCode;
    }

    controls.className = 'filter-bar miq-mgmt-filter-bar';
    controls.dataset.mgmtReady = 'true';
    MIQCommon.view.call(controls,"setAttribute",['role','search']);
    MIQCommon.view.call(controls,"setAttribute",['aria-label',config.title + ' 목록 조회']);

    var search = setFieldMeta(document.createElement('input'), config.searchFieldKo, config.searchFieldEn);
    search.type = 'search';
    search.className = 'inp';
    search.id = 'mgmtSearchQuery';
    search.name = 'query';
    search.maxLength = 100;
    search.autocomplete = 'off';
    var searchPlaceholder = config.searchPlaceholderByRole && config.searchPlaceholderByRole[roleCode] || config.searchPlaceholder;
    search.placeholder = searchPlaceholder;
    MIQCommon.view.call(search,"setAttribute",['aria-label',searchPlaceholder]);
    controls.appendChild(search);

    var listFilters = makeTabFilters('list');
    (config.filters || []).filter(roleAllows).forEach(function (filter) { listFilters.appendChild(makeSelect(filter)); });

    var submit = document.createElement('button');
    submit.type = 'button';
    submit.className = 'btn-search';
    submit.dataset.mgmtSearchSubmit = '';
    MIQCommon.view.set(submit,"textContent",'조회');
    controls.appendChild(submit);
    if (config.action) {
      var primaryAction = makeAction(config.action);
      var primaryActionHost = document.querySelector('[data-mgmt-primary-actions]') || document.querySelector('#tabList > .list-head .tools');
      if (primaryActionHost) primaryActionHost.appendChild(primaryAction);
      else controls.appendChild(primaryAction);
    }

    var taskbar = ensureTaskbar(controls);
    var pageHead = title.closest('.page-head');
    if (pageHead) {
      pageHead.classList.add('miq-mgmt-page-head');
      pageHead.appendChild(controls);
    }
    if (listFilters.children.length) taskbar.appendChild(listFilters);
    registerContextControls(pageHead, taskbar, controls);
    normalizeTaskbar();
  }

  /* Map and management lists share the same committed-search adapter. */
  var bindSearch = window.MIQCommon.search.bind;

  window.MIQManagementHeader = {
    config: config,
    roleCode: roleCode,
    roleLabel: roleLabel,
    roles: roles,
    hasCapability: hasCapability,
    bindSearch: bindSearch,
    getControl: function (fieldEn) { return document.querySelector('[data-field-en="' + fieldEn + '"]'); },
    withRole: withRole,
    setControlContext: setControlContext,
    build: build
  };

  if (document.querySelector('[data-mgmt-list-controls]')) build();
  else document.addEventListener('DOMContentLoaded', build, { once: true });
}());
