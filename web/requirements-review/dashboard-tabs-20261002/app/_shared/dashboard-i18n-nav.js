/* ══════════════════════════════════════════════════════════════
   Bobcat MachineIQ '26 — Mock-up 공용 내비게이션 / 인터랙션
   사용법:
     <body data-gnb="anlz" data-sub="usage" data-variant="tobe" data-base="../">
     <div id="gnb"></div>            ← GNB 자동 주입
     <script src="../_shared/nav.js?rev=font-black-20261012"></script>  (body 끝)

   MVP 메뉴 정책 (2026-08-05 확정 · 2026-08-13 보강)
     · asisOnly:true    → 현행(AS-IS)에만 존재. TO-BE GNB에서는 숨김.
     · hidden:true      → 두 변형 모두 GNB 드롭다운에 노출하지 않는 숨은 화면.
                          차량 상세는 운행이력>요약정보에서만 진입.
     · hiddenTobe:true  → 현행 기록은 AS-IS 드롭다운에 남기고 TO-BE 에서만 숨김.
                          충격·엔진·리튬은 TO-BE 에서 차량 상세의 지표·패널 클릭으로만 진입.
     · from:'…'         → 숨은 화면을 보고 있을 때 드롭다운에 표시할 진입 경로 안내.
   제공 인터랙션:
     .period-tabs button / .tabs button[data-tab] / .pill-tabs button
     .lnb__group-title (접기) / .lnb__item (선택)
     [data-modal-open="id"] / [data-modal-close] / .dim 배경 클릭
     [data-toggle-row="id"] 아코디언
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 사이트맵: 한 곳에서만 관리 ── */
  var MENU = [
    { key: 'dash', label: '대시보드', dir: 'Dashboard',
      subs: [{ key: 'group', label: '그룹별 대시보드', tobe: 'group-dashboard-tobe-v2.html' }] },

    /* 차량관리 = 현행 전용. 차량정보 리스트는 운행이력>요약정보로 병합됨 */
    { key: 'equip', label: '차량관리', dir: 'Vehicle Detail', asisOnly: true,
      subs: [{ key: 'detail', label: '차량 정보', tobe: 'vehicle-detail-tobe.html' }] },

    { key: 'anlz', label: '운행이력',
      subs: [
        { key: 'summary', label: '요약정보', dir: 'Vehicle Summary', tobe: 'vehicle-summary-tobe-3.html' },
        /* 차량 상세 = 숨은 화면. 요약정보에서만 진입 */
        { key: 'detail', label: '차량 상세', dir: 'Vehicle Detail', tobe: 'vehicle-detail-tobe.html', hidden: true, from: '요약정보' },
        { key: 'usage', label: '운행시간', dir: 'Usage Time', tobe: 'usage-time-tobe.html' },
        { key: 'oper', label: '운영효율', dir: 'Operational Efficiency', tobe: 'operational-efficiency-tobe-option-b.html' },
        { key: 'vehicleeff', label: '차량별 효율', dir: 'Operational Efficiency', tobe: 'vehicle-efficiency-tobe.html', tobeOnly: true },
        /* 충격 · 엔진 · 리튬 = TO-BE 에서는 GNB 에서 감추고 차량 상세에서만 진입
           (충격 = 충격 횟수 지표 클릭 / 리튬 = 에너지 상세 정보 클릭 / 엔진 = 엔진 상세 정보 클릭) */
        { key: 'shock', label: '충격', dir: 'Shock', tobe: 'shock-tobe.html' },
        { key: 'engine', label: '엔진', dir: 'Engine', tobe: 'engine-tobe.html', hiddenTobe: true, from: '차량 상세' },
        { key: 'lithium', label: '리튬배터리', dir: 'Lithium', tobe: 'lithium-list-tobe.html' }
      ] },

    { key: 'srvc', label: '서비스', dir: 'Service',
      subs: [
        { key: 'all', label: '전체', tobe: 'service-tobe-v2.html' },
        { key: 'maintenance', label: '수리이력', tobe: 'service-maintenance-tobe.html' },
        { key: 'supply', label: '소모품관리', tobe: 'service-supply-tobe.html' },
        { key: 'error', label: '차량 에러', tobe: 'service-error-tobe.html' }
      ] },

    { key: 'rpt', label: '리포트',
      subs: [
        { key: 'rptstatus', label: '업체별 현황', dir: 'Report Status', tobe: 'report-status-tobe.html' },
        { key: 'rptcompare', label: '업체별 비교', dir: 'Report Comparison', tobe: 'report-comparison-tobe.html' },
        { key: 'rptheat', label: '업체별 히트맵', dir: 'Report Heatmap', tobe: 'report-heatmap-tobe.html' },
        /* 3화면 통합 시도판 — 반려됨. 참조용으로만 보존 */
        { key: 'report', label: '(구) 통합 리포트', dir: 'Report', asisOnly: true, hidden: true }
      ] },

    { key: 'map', label: '지도', dir: 'Map',
      subs: [{ key: 'map', label: '지도 · 이동경로', tobe: 'map-tobe.html' }] },

    { key: 'mgmt', label: '관리기능',
      subs: [
        { key: 'user', label: '사용자', dir: 'Mgmt User', tobe: 'mgmt-user-tobe.html' },
        { key: 'company', label: '업체', dir: 'Mgmt Company', tobe: 'mgmt-company-tobe.html' },
        { key: 'group', label: '그룹', dir: 'Mgmt Group', tobe: 'mgmt-group-tobe.html' },
        { key: 'geofence', label: 'Geofence', dir: 'Mgmt Geofence', tobe: 'mgmt-geofence-tobe.html', hiddenTobe: true },
        { key: 'vehicle', label: '차량', dir: 'Mgmt Vehicle', tobe: 'mgmt-vehicle-tobe.html' },
        { key: 'acctreq', label: '계정신청관리', dir: 'Mgmt Account Request', tobe: 'mgmt-account-request-tobe.html', hiddenTobe: true },
        { key: 'equipreq', label: '차량신청관리', dir: 'Mgmt Vehicle Request', tobe: 'mgmt-vehicle-request-tobe.html', hiddenTobe: true }
      ] },

    { key: 'ops', label: '운영관리', dir: 'Operations',
      subs: [
        { key: 'data', label: '차량 데이터 관리', tobe: 'operations-data.html' },
        { key: 'equipment', label: '장비코드 관리', tobe: 'operations-equipment.html' },
        { key: 'codes', label: '공통코드 관리', tobe: 'operations-codes.html' },
        { key: 'languages', label: '다국어 관리', tobe: 'operations-languages.html' },
        { key: 'notices', label: '공지사항 관리', tobe: 'operations-notices.html' },
        { key: 'accounts', label: '내부 계정 관리', tobe: 'operations-accounts.html' },
        { key: 'menus', label: '메뉴·접근권한 관리', tobe: 'operations-menus.html' },
        { key: 'history', label: '메뉴 접속이력', tobe: 'operations-history.html' }
      ] },

    { key: 'interest', label: '관심차량',
      subs: [
        { key: 'summary', label: '관심차량 현황', dir: 'Interest Vehicles', tobe: 'interest-vehicles-status-tobe.html' },
        { key: 'favorites', label: '관심차량 관리', dir: 'Mgmt Favorites', tobe: 'mgmt-favorites-tobe.html' },
        { key: 'categories', label: '구분 관리', dir: 'Mgmt Favorites', tobe: 'favorite-categories-tobe.html' }
      ] },

    /* GNB 우측 사용자 영역에서 진입 — 상단 메뉴 줄에는 노출하지 않는다 */
    { key: 'myacct', label: '마이페이지', dir: 'My Account', userMenu: true,
      subs: [{ key: 'account', label: '내 계정', tobe: 'my-account-tobe.html' }] },

    /* 로그인 이전 화면 — GNB 없음. 사이트맵/검증 용도로만 등록 */
    { key: 'login', label: '로그인', dir: 'Login', preLogin: true,
      subs: [{ key: 'login', label: '로그인', tobe: 'login-tobe.html' }] },
    { key: 'findpw', label: '비밀번호 찾기', dir: 'Find Password', preLogin: true,
      subs: [{ key: 'findpw', label: '비밀번호 찾기', tobe: 'find-password-tobe.html' }] }
  ];

  var body = document.body;
  var d = body.dataset;
  /* 화면별 스크립트가 초기 렌더 중 URL을 바꾸기 전, 실제 진입 조건을 보존한다. */
  var INITIAL_QUERY = new URLSearchParams(location.search);
  window.MIQ_ENTRY_QUERY = INITIAL_QUERY.toString();
  var BASE = d.base || '../';
  var VARIANT = d.variant === 'asis' ? 'asis' : 'tobe';
  var ACT = d.gnb || '';
  var ACTSUB = d.sub || '';
  /* Chart pages expose day/week/month only. Normalize old custom links before page scripts read them. */
  if (d.periodPresets === 'dwm' && /^(c|custom)$/i.test(INITIAL_QUERY.get('period') || '')) {
    var chartRange = window.MIQCommon.dates.operatingRange('m');
    INITIAL_QUERY.set('period', 'm');
    INITIAL_QUERY.set('from', chartRange.from);
    INITIAL_QUERY.set('to', chartRange.to);
    history.replaceState(null, '', location.pathname + '?' + INITIAL_QUERY.toString() + location.hash);
  }
  var roleRules = window.MIQCommon.roles;
  var MANAGEMENT_ROLES = roleRules.list();
  var MANAGEMENT_ROLE_CODES = MANAGEMENT_ROLES.map(function (role) { return role.code; });
  var managementRoleQuery = new URLSearchParams(location.search).get('role');
  var MANAGEMENT_ROLE = roleRules.resolve(managementRoleQuery);
  var MANAGEMENT_IDENTITIES = {
    internal: { account: '밥캣 운영 - 내부', operator: '김정수' },
    dealer_owner: { account: '중부딜러 - 대표', operator: '박민아' },
    dealer_staff: { account: '중부딜러 - 직원', operator: '정도현' },
    customer_owner: { account: '세종물류 - 대표', operator: '윤태호' },
    customer_staff: { account: '세종물류 - 직원', operator: '오하늘' }
  };
  var MANAGEMENT_IDENTITY = MANAGEMENT_IDENTITIES[MANAGEMENT_ROLE];
  var registeredAccount = window.MIQCustomerAccess && window.MIQCustomerAccess.current(MANAGEMENT_ROLE);
  if (registeredAccount) {
    MANAGEMENT_IDENTITY = { account: (registeredAccount.company || registeredAccount.name) + ' - ' + (MANAGEMENT_ROLE === 'customer_owner' ? '대표' : '직원'), operator: registeredAccount.name };
  }
  var accountLabel = document.createElement('span');
  MIQCommon.view.set(accountLabel,"textContent",MANAGEMENT_IDENTITY.account);
  if (VARIANT === 'tobe') {
    MENU.forEach(function(menu){
      menu.subs=menu.subs.filter(function(sub){return sub.key!=='engine';});
      if(menu.key==='rpt' && roleRules.isCustomer(MANAGEMENT_ROLE))menu.subs.forEach(function(sub){
        sub.label=sub.label.replace(/업체/g,'그룹');
        if(MANAGEMENT_ROLE==='customer_staff')sub.label=sub.label.replace('그룹별 비교','내 그룹 현황');
      });
    });
  }

  body.dataset.managementRole = MANAGEMENT_ROLE;
  function isDealerManagementRole(role) { return roleRules.isDealer(role); }
  function canUseInterest(role) { return roleRules.canUseFavorites(role); }
  function managementRoleLabel(role) {
    return roleRules.label(role);
  }
  function defaultScopeLabel() {
    return roleRules.scopeLabel(MANAGEMENT_ROLE);
  }
  function defaultScopeResetLabel() {
    return defaultScopeLabel() === '전체 차량' ? '전체 차량으로' : '전체 업체로';
  }
  /* 본문 스크립트가 초기 렌더 중 URL 기본값을 먼저 기록하더라도, 사용자가 실제로
     진입할 때 전달한 조회 조건을 공통 선택기의 초기값으로 보존한다. */
  var TARGET_INITIAL_QUERY = new URLSearchParams(location.search);

  /* 화면별 배치는 달라도 조회 범위 문자열과 건수 표기 규칙은 한 곳에서 만든다.
     전체 단계는 경로에서 반복하지 않고 실제로 선택된 단계만 계층 순서로 보여준다. */
  function compactScopePath(target, options) {
    target = target || {};
    options = options || {};
    var includeVehicle = options.includeVehicle !== false;
    var explicit = {
      company: Object.prototype.hasOwnProperty.call(target, 'companyId')
        ? !!target.companyId && target.companyId !== 'all' : null,
      group: Object.prototype.hasOwnProperty.call(target, 'group') ? !!target.group : null,
      type: Object.prototype.hasOwnProperty.call(target, 'type') ? !!target.type : null,
      vehicle: Object.prototype.hasOwnProperty.call(target, 'equipmentId') ? !!target.equipmentId : null
    };
    var overallLabel = /^(?:전체|전체\s*(?:업체|그룹|분류|차량)|전체차량|차량을\s*선택하세요)(?:\s*·\s*\d+대)?$/;
    var segments = Array.isArray(target.scopeSegments) ? target.scopeSegments.slice() : [];

    if (!segments.length && target.scopePath) {
      segments = String(target.scopePath).split('›').map(function (label) {
        return { key: '', label: label.trim() };
      });
    }

    var labels = segments.filter(function (segment) {
      if (!segment || !segment.label) return false;
      if (!includeVehicle && segment.key === 'vehicle') return false;
      if (segment.key && Object.prototype.hasOwnProperty.call(explicit, segment.key) && explicit[segment.key] !== null) {
        return explicit[segment.key];
      }
      return !overallLabel.test(String(segment.label).trim());
    }).map(function (segment) { return String(segment.label).trim(); });

    return labels.length ? labels.join(' › ') : defaultScopeLabel();
  }

  /* 조회 결과 범위는 제목 옆 pill로 읽는다. 요약정보는 기존 titlebar를 사용하고,
     사용시간·운영효율·지도는 화면에서 명시적으로 opt-in한 경우에만 공통 제목 행으로 옮긴다. */
  function placeScopeBesideTitle(host) {
    if (!host || VARIANT !== 'tobe') return;

    var container = null;
    var title = null;
    var heading = null;
    if ((ACTSUB === 'summary' || ACTSUB === 'summary2' || ACTSUB === 'summary3') && body.classList.contains('miq-content-summary')) {
      container = document.querySelector('.summary-titlebar');
      title = container && container.querySelector('.miq-page-title');
      if (!container || !title) return;
      heading = title.closest('.summary-heading');
      if (!heading || !container.contains(heading)) {
        heading = document.createElement('div');
        heading.className = 'summary-heading';
        title.parentNode.insertBefore(heading, title);
        heading.appendChild(title);
      }
      MIQCommon.view.call(host,"setAttribute",['data-miq-summary-title-scope','']);
    } else {
      if (MIQCommon.view.call(host,"getAttribute",['data-miq-scope-placement']) !== 'title') return;
      container = document.querySelector('.main .miq-title-period-row, .main .miq-service-header-row');
      title = container && container.querySelector('.page-head__title, .page-title');
      if ((!container || !title) && (ACT === 'map' || (ACTSUB === 'lithium' && MIQCommon.view.call(body,"getAttribute",['data-lithium-list']) !== 'true'))) {
        title = document.querySelector('.main .page-head .page-head__title');
        container = title && title.closest('.page-head');
      }
      if (!container || !title) return;
      heading = title.closest('.miq-title-scope-heading');
      if (!heading || !container.contains(heading)) {
        heading = document.createElement('div');
        heading.className = 'miq-title-scope-heading';
        title.parentNode.insertBefore(heading, title);
        heading.appendChild(title);
      }
    }

    var oldParent = host.parentElement;
    var previous = heading.querySelector('[data-miq-title-scope]');
    if (previous && previous !== host) previous.remove();
    MIQCommon.view.call(host,"setAttribute",['data-miq-title-scope','']);
    heading.appendChild(host);
    if (oldParent && oldParent !== heading && oldParent !== container && !oldParent.children.length) oldParent.remove();
  }

  function renderScopeSummary(host, target, options) {
    if (!host) return;
    target = target || {};
    options = options || {};
    var hasExplicitPath = Object.prototype.hasOwnProperty.call(options, 'path');
    var path = hasExplicitPath ? options.path : compactScopePath(target, options);
    if (path === '전체 업체' && defaultScopeLabel() === '전체 차량') path = '전체 차량';
    var count = options.count === 0 || options.count ? options.count : target.selectedCount;
    var countLabel = options.countLabel || '차량';
    var countUnit = options.countUnit || '대';
    var countText = count === 0 || count ? countLabel + ' ' + count + countUnit : '';
    var resettable = options.resettable !== false &&
      !target.requiredVehicle && !target.vehicleScoped && target.profile !== 'vehicle' &&
      !!path && path !== defaultScopeLabel();

    MIQCommon.view.set(host,"textContent",'');
    host.classList.add('miq-scope-summary');
    host.classList.toggle('is-path-first', !!options.pathFirst);
    function append(className, text) {
      if (!text) return;
      var node = document.createElement('span');
      node.className = className;
      MIQCommon.view.set(node,"textContent",text);
      node.title = text;
      host.appendChild(node);
      return node;
    }
    function appendPath() {
      if (!path) return;
      var node = document.createElement('span');
      var label = document.createElement('span');
      node.className = 'miq-scope-summary__path';
      label.className = 'miq-scope-summary__path-label';
      MIQCommon.view.set(label,"textContent",path);
      label.title = path;
      node.appendChild(label);
      if (resettable) {
        var reset = document.createElement('button');
        reset.type = 'button';
        reset.className = 'miq-scope-summary__reset';
        MIQCommon.view.call(reset,"setAttribute",['data-miq-scope-reset','']);
        MIQCommon.view.call(reset,"setAttribute",['aria-label','조회 범위를 ' + defaultScopeResetLabel() + ' 초기화']);
        reset.title = defaultScopeResetLabel() + ' 초기화';
        MIQCommon.view.set(reset,"textContent",'×');
        reset.addEventListener('click', function (event) {
          event.preventDefault();
          event.stopPropagation();
          document.dispatchEvent(new CustomEvent('miq:scope-reset-request'));
        });
        node.appendChild(reset);
      }
      host.appendChild(node);
    }
    if (options.pathFirst) {
      appendPath();
      if (path && countText) append('miq-scope-summary__separator', '·');
      append('miq-scope-summary__count', countText);
    } else {
      append('miq-scope-summary__count', countText);
      if (path && countText) append('miq-scope-summary__separator', '·');
      appendPath();
    }
    placeScopeBesideTitle(host);
  }
  window.MIQ = window.MIQ || {};
  window.MIQ.compactScopePath = compactScopePath;
  window.MIQ.renderScopeSummary = renderScopeSummary;

  /* 현재 운영 화면의 공통 셸을 마지막 스타일로 적용한다. 요구사항 본문은 변경하지 않는다. */
  if (document.getElementById('gnb')) {
    body.classList.add('miq-current-shell');
    if (!document.querySelector('link[data-current-shell]')) {
      var shellCss = document.createElement('link');
      shellCss.rel = 'stylesheet';
      shellCss.href = BASE + '_shared/current-shell.css?v=fc90bc42e4ac&rev=font-black-20261012';
      MIQCommon.view.call(shellCss,"setAttribute",['data-current-shell','']);
      document.head.appendChild(shellCss);
    }
    if (VARIANT === 'tobe' && MANAGEMENT_ROLE === 'internal') {
      body.classList.add('miq-has-operations');
      if (!document.querySelector('link[data-operations-navigation]')) {
      var opsNavCss = document.createElement('link');
      opsNavCss.rel = 'stylesheet';
      opsNavCss.href = BASE + '_shared/operations-navigation.css?rev=20260911-2';
      document.head.appendChild(opsNavCss);
      }
    }
  }

  /* MVP 정책 필터 */
  function menuVisible(m) {
    if (m.preLogin || m.userMenu) return false;          // 상단 메뉴 줄에는 노출하지 않음
    if (m.key === 'ops') return VARIANT === 'tobe' && MANAGEMENT_ROLE === 'internal';
    if (m.key === 'interest') return VARIANT === 'tobe' && canUseInterest(MANAGEMENT_ROLE);
    if (m.key === 'equip') return VARIANT === 'asis';    // TO-BE는 요약정보로 통합되어 상단 차량관리 제거
    return !(m.asisOnly && VARIANT !== 'asis');
  }
  function subVisible(s) { return !(s.asisOnly && VARIANT !== 'asis') && !(s.tobeOnly && VARIANT !== 'tobe'); }
  function subHidden(s) { return (s.key === 'favorites' && !canUseInterest(MANAGEMENT_ROLE)) || !!s.hidden || (s.hiddenTobe && VARIANT !== 'asis'); }
  function subInDropdown(s) { return subVisible(s) && !subHidden(s); }

  function enc(s) { return s.replace(/ /g, '%20'); }
  function href(menu, sub) {
    var dir = sub.dir || menu.dir;
    var file = sub[VARIANT] || sub.tobe;
    return BASE + enc(dir) + '/' + file;
  }

  var ANALYSIS_CHILD_PAGES = { detail: true, shock: true, engine: true, lithium: true };

  function contextualParams(target, destinationSubKey) {
    var params = new URLSearchParams(location.search);
    if (target) {
      if (target.companyId) params.set('companyId', target.companyId);
      if (target.group) params.set('group', target.group); else params.delete('group');
      if (target.type) params.set('type', target.type); else params.delete('type');
      if (Object.prototype.hasOwnProperty.call(target, 'equipmentId')) {
        if (target.equipmentId) params.set('veh', target.equipmentId);
        else params.delete('veh');
        params.delete('equipmentId');
      }
    }
    if (destinationSubKey === 'summary' && ACT === 'anlz' && ANALYSIS_CHILD_PAGES[ACTSUB]) {
      params.delete('veh');
      params.delete('equipmentId');
      params.delete('vehicleId');
      params.delete('vin');
    }
    return params;
  }

  function contextualHref(menu, sub, target) {
    var url = new URL(href(menu, sub), location.href);
    if (VARIANT === 'tobe' && (menu.key === 'mgmt' || menu.key === 'ops' || menu.key === 'interest' && sub.key === 'favorites')) {
      url.searchParams.set('role', MANAGEMENT_ROLE);
    } else if (VARIANT === 'tobe') {
      url.search = contextualParams(target, sub.key).toString();
    }
    return url.pathname + (url.search ? url.search : '') + url.hash;
  }

  function menuEntryHref(menu, sub) {
    if (VARIANT === 'tobe' && ACT === 'srvc' && menu.key === 'srvc') {
      return window.MIQCommon.navigation.serviceMenuHref(href(menu, sub), MANAGEMENT_ROLE, location.href, window.MIQ_SERVICE_QUERY);
    }
    return VARIANT === 'tobe' ? window.MIQCommon.navigation.menuHref(href(menu, sub), MANAGEMENT_ROLE, location.href) : href(menu, sub);
  }

  /* Service siblings share a committed scope; other menus start a fresh query. */
  ['click', 'auxclick'].forEach(function (eventName) {
    document.addEventListener(eventName, function (event) {
      if (VARIANT !== 'tobe') return;
      var anchor = event.target.closest('[data-miq-side-sub]');
      if (!anchor) return;
      anchor.href = ACT === 'srvc'
        ? window.MIQCommon.navigation.serviceMenuHref(anchor.href, MANAGEMENT_ROLE, location.href, window.MIQ_SERVICE_QUERY)
        : window.MIQCommon.navigation.menuHref(anchor.href, MANAGEMENT_ROLE, location.href);
      event.stopImmediatePropagation();
    }, true);
  });

  /* 고객 운영 그룹은 고객사 내부의 현장·작업조 관리 기능이다. 내부·딜러 계정은
     메뉴뿐 아니라 직접 주소로도 진입하지 못하도록 관리 사용자 화면으로 돌린다. */
  if (VARIANT === 'tobe' && ACT === 'mgmt' && ACTSUB === 'group' && !roleRules.isCustomer(MANAGEMENT_ROLE)) {
    var blockedGroupTarget = new URL(BASE + enc('Mgmt User') + '/mgmt-user-tobe.html', location.href);
    blockedGroupTarget.searchParams.set('role', MANAGEMENT_ROLE);
    location.replace(blockedGroupTarget.href);
    return;
  }

  // New operations pages are isolated from the existing management policy.
  if (ACT === 'ops' && (VARIANT !== 'tobe' || MANAGEMENT_ROLE !== 'internal')) {
    var blockedOpsTarget = new URL(BASE + 'Dashboard/group-dashboard-tobe-v2.html', location.href);
    blockedOpsTarget.searchParams.set('role', MANAGEMENT_ROLE);
    location.replace(blockedOpsTarget.href);
    return;
  }

  /* ── GNB 렌더 ── */
  var mount = document.getElementById('gnb');
  if (mount) {
    var logo = '<img src="' + BASE + '_shared/machine-iq-material-handling-white.svg" alt="Bobcat MACHINE IQ MATERIAL HANDLING">';
    var logoHref = BASE + enc('Dashboard') + '/group-dashboard-' + VARIANT + (VARIANT === 'tobe' ? '-v2' : '') + '.html';
    if (VARIANT === 'tobe') logoHref += '?role=' + encodeURIComponent(MANAGEMENT_ROLE);

    var html = '<div class="gnb' + (VARIANT === 'asis' ? ' gnb--asis' : '') + '">' +
      '<a class="gnb__logo" href="' + logoHref + '">' + logo + '</a><nav class="gnb__menu">';

    MENU.forEach(function (m) {
      if (!menuVisible(m)) return;
      var shown = m.subs.filter(subInDropdown);
      var landing = shown.length ? shown[0] : m.subs.filter(subVisible)[0];
      if (!landing) return;

      var landingHref = href(m, landing);
      if (VARIANT === 'tobe') landingHref += '?role=' + encodeURIComponent(MANAGEMENT_ROLE);
      html += '<div class="gnb__item' + (m.key === ACT ? ' active' : '') + '">' +
        '<a href="' + landingHref + '">' + m.label + '</a></div>';
    });

    /* 우측: 마이페이지 + 사이트맵 + 로그아웃
       (2026-08-13) 현행 화면은 실제 운영 웹사이트에서 확인하므로 AS-IS / TO-BE 전환 버튼은 제거한다. */
    var acct = null;
    MENU.forEach(function (m) { if (m.key === 'myacct') acct = m; });
    var acctHref = acct ? href(acct, acct.subs[0]) : '';
    if (acctHref && VARIANT === 'tobe') acctHref += '?role=' + encodeURIComponent(MANAGEMENT_ROLE);

    var managementRoleControl = '';
    if (VARIANT === 'tobe') {
      managementRoleControl = '<label class="gnb__role"><span>권한 설정</span>' +
        '<select id="account-role" data-account-role aria-label="화면 권한 설정">' +
        MANAGEMENT_ROLES.map(function (role) {
          return '<option value="' + role.code + '"' + (role.code === MANAGEMENT_ROLE ? ' selected' : '') + '>' + role.label + '</option>';
        }).join('') + '</select></label>';
    }

    html += '</nav><div class="gnb__right">' + managementRoleControl +
      '<label class="gnb__language"><span class="miq-sr-only">언어 선택</span>' +
        '<select aria-label="언어 선택">'+(window.MIQI18n ? MIQI18n.options(true) : '<option value="ko">KO</option><option value="en">EN</option>')+'</select></label>' +
      (acctHref ? '<a class="home gnb__account" href="' + acctHref + '"' + (VARIANT === 'tobe' ? ' data-account-modal aria-haspopup="dialog"' : '') + (ACT === 'myacct' ? ' style="background:rgba(255,255,255,.22)"' : '') +
        '>' + (VARIANT === 'tobe' ? MIQCommon.view.get(accountLabel,"innerHTML") : '세종물류 - 관리자') + '</a>' : '<span>세종물류 - 관리자</span>') +
      '<a class="home gnb__logout" href="' + BASE + enc('Login') + '/login-' + VARIANT + '.html">로그아웃</a></div></div>';

    MIQCommon.view.set(mount,"outerHTML",html);
    var accountLink = document.querySelector('.gnb__account[data-account-modal]');
    if (accountLink) {
      var accountModalLoading = false;
      accountLink.addEventListener('click', function (event) {
        event.preventDefault();
        if (window.MIQ_ACCOUNT_MODAL && typeof window.MIQ_ACCOUNT_MODAL.open === 'function') {
          window.MIQ_ACCOUNT_MODAL.open(accountLink);
          return;
        }
        if (accountModalLoading) return;
        accountModalLoading = true;
        var component = document.createElement('script');
        component.src = BASE + '_shared/account-modal-component.js?rev=font-black-20261012';
        component.dataset.base = BASE;
        component.addEventListener('load', function () {
          accountModalLoading = false;
          if (window.MIQ_ACCOUNT_MODAL && typeof window.MIQ_ACCOUNT_MODAL.open === 'function') {
            window.MIQ_ACCOUNT_MODAL.open(accountLink);
          }
        }, { once: true });
        component.addEventListener('error', function () {
          location.href = accountLink.href;
        }, { once: true });
        document.body.appendChild(component);
      });
    }
    var managementRoleSelect = document.getElementById('account-role');
    if (managementRoleSelect) {
      managementRoleSelect.addEventListener('change', function () {
        var nextRole = roleRules.resolve(this.value);
        var nextUrl = new URL(location.href);
        if (ACT === 'mgmt') {
          nextUrl.search = '';
        } else {
          /* 권한을 바꿀 때 이전 권한의 업체·그룹·차량 조건을 새 권한으로 넘기지 않는다.
             기간 조건은 유지하고 조회 범위만 새 권한의 기본값으로 다시 계산한다. */
          ['companyId', 'company', 'group', 'groupName', 'groupId', 'type', 'fuelType', 'powerType',
            'veh', 'equipmentId', 'vehicleId', 'vehicle', 'vin'].forEach(function (key) {
            nextUrl.searchParams.delete(key);
          });
        }
        nextUrl.searchParams.set('role', nextRole);
        if (ACT === 'ops' && nextRole !== 'internal') {
          nextUrl = new URL(BASE + 'Dashboard/group-dashboard-tobe-v2.html', location.href);
          nextUrl.searchParams.set('role', nextRole);
        }
        if (ACT === 'interest' && !canUseInterest(nextRole)) {
          nextUrl = new URL(BASE + enc('Vehicle Summary') + '/vehicle-summary-tobe-3.html', location.href);
          nextUrl.searchParams.set('role', nextRole);
        }
        if (ACT === 'mgmt' && ACTSUB === 'group' && !roleRules.isCustomer(nextRole)) {
          nextUrl = new URL(BASE + enc('Mgmt User') + '/mgmt-user-tobe.html', location.href);
          nextUrl.searchParams.set('role', nextRole);
        }
        location.href = nextUrl.href;
      });
    }
    if (VARIANT === 'tobe') {
      /* 대부분의 화면은 nav.js 뒤에서 fleet.js를 불러온다. 공통 차량 명부가 준비된
         뒤 한 번만 그려야 조회 건수와 본문 데이터가 어긋나지 않는다. */
      if (document.readyState === 'loading' && body.dataset.currentBootstrap !== 'ready') {
        document.addEventListener('DOMContentLoaded', renderTargetSelector, { once: true });
      } else {
        renderTargetSelector();
      }
    } else {
      /* AS-IS 화면의 기존 2단 조회 영역은 시각·동작을 그대로 보존한다. */
      renderLegacyTargetSelector();
    }
  }

  /* ── 요구사항 반영 공통 조회 대상 ──
     운영 화면에서 사용 중인 GNB 바로 아래의 업체/차량 선택 구조를 재사용한다.
     로그인 이전 화면에는 표시하지 않으며, 상세검색은 명시적으로 펼쳤을 때만 노출한다. */
  function renderLegacyTargetSelector() {
    if (!document.querySelector('.gnb')) return;
    if (MIQCommon.view.call(body,"getAttribute",['data-target-selector']) === 'none') return;
    if (ACT === 'dash' || ACT === 'mgmt') return;
    /* 리포트 세 화면은 화면 안의 업체 도구가 조회 기준이다. */
    if (ACT === 'rpt') return;
    if (document.querySelector('.miq-target-selector')) return;

    var companies = [
      ['all', '전체차량'], ['1933', '(주)세종물류중부지점'], ['20119', '김현종'],
      ['167', '두산물류 주식회사'], ['34317', '두산밥캣코리아 주식회사'],
      ['15857', '두산지게차 경남중부영업소'], ['33767', '두산지게차 경남중부판매 주식회사'],
      ['11214', '두산지게차 마창영업소'], ['6057', '에스엔케이중공업'],
      ['364', '온양지게차(호성건설중기)'], ['12894', '중원건기'], ['20289', '창녕지게차'],
      ['20106', '창원중기'], ['20120', '최재민'], ['3703', '태형금속공업(주)'],
      ['7690', '팔팔지게차서비스'], ['8246', '한일중기(주)']
    ];
    var vehicles = [
      ['FBA32_224250271', 'FBA32_224250271 · B30S-7'], ['FBA32_224250383', 'FBA32_224250383 · B30S-7'],
      ['FBD25_113920044', 'FBD25_113920044 · D25S-9'],
      ['FBA18_224250094', 'FBA18_224250094 · B18S-7'], ['FBA20_224250312', 'FBA20_224250312 · B20S-7'],
      ['FBA25_224250188', 'FBA25_224250188 · B25S-7'], ['FBD30_113920117', 'FBD30_113920117 · D30S-9'],
      ['FBA16_224250045', 'FBA16_224250045 · B16S-7'], ['FBA35_224250403', 'FBA35_224250403 · B35S-7'],
      ['FBD18_113920062', 'FBD18_113920062 · D18S-9'], ['FBA22_224250226', 'FBA22_224250226 · B22S-7'],
      ['FBA32_032068', 'FBA32_032068 · B30S-7'], ['FBA32_032042', 'FBA32_032042 · B30S-7'],
      ['FBA32-002038', 'FBA32-002038 · B30S-7'], ['FBA32-002039', 'FBA32-002039 · B30S-7'],
      ['FBA32-002040', 'FBA32-002040 · B30S-7'], ['FBA32-002043', 'FBA32-002043 · B30S-7'],
      ['FBA32-002044', 'FBA32-002044 · B30S-7'], ['FBA32-002045', 'FBA32-002045 · B30S-7'],
      ['FBA32-002065', 'FBA32-002065 · B30S-7'], ['FBA32-002067', 'FBA32-002067 · B30S-7'],
      ['FBA32-002068', 'FBA32-002068 · B30S-7'], ['FBA32-002069', 'FBA32-002069 · B30S-7'],
      ['FBA32-002071', 'FBA32-002071 · B30S-7'], ['FBA32-002073', 'FBA32-002073 · B30S-7'],
      ['FBA32-002074', 'FBA32-002074 · B30S-7'], ['FBA34_224030249', 'FBA34_224030249 · B35S-7'],
      ['FBA34_224250279', 'FBA34_224250279 · B35S-7'], ['FBA34-000509', 'FBA34-000509 · B35S-7'],
      ['FBA34-000518', 'FBA34-000518 · B35S-7'], ['FBA34-000520', 'FBA34-000520 · B35S-7'],
      ['FBA34-000522', 'FBA34-000522 · B35S-7']
    ];

    /* 사용시간은 월 집계와 일별 상세가 전체 차량 명부를 사용한다. 조회 대상에도
       동일 명부만 노출해 선택값과 실제 집계 범위가 어긋나지 않게 한다. */
    if (ACT === 'anlz' && ACTSUB === 'usage' && window.MIQ &&
        Array.isArray(window.MIQ.FLEET_CATALOG) && window.MIQ.FLEET_CATALOG.length) {
      vehicles = window.MIQ.FLEET_CATALOG.map(function (vehicle) {
        return [vehicle.vin, vehicle.vin + ' · ' + vehicle.model];
      });
    }

    /* 목록 화면은 업체/차량을 바꿔 조회하고, 차량 상세 계열은 진입 시 받은
       업체/차량 문맥을 유지한다. 상세 화면에 빈 차량 선택값이 노출되면 현재
       데이터의 기준이 불명확해지므로 해당 화면에서만 선택값을 고정한다. */
    var scopedVehicleByPage = {
      detail: 'FBA32_224250271',
      shock: 'FBA32_224250271',
      engine: 'FBD25_113920044',
      lithium: 'FBA32_224250271'
    };
    var query = new URLSearchParams(location.search);
    var isVehicleScoped = ACT === 'anlz' && !!scopedVehicleByPage[ACTSUB];
    var scopedVehicle = '';
    if (isVehicleScoped) {
      var queryVehicle = query.get('veh');
      var lnbVehicle = document.querySelector('[data-lnb-tree][data-vin]');
      scopedVehicle = queryVehicle || (lnbVehicle && MIQCommon.view.call(lnbVehicle,"getAttribute",['data-vin'])) || scopedVehicleByPage[ACTSUB];
      if (!vehicles.some(function (item) { return item[0] === scopedVehicle; })) scopedVehicle = scopedVehicleByPage[ACTSUB];
    }

    function options(items, selected) {
      return items.map(function (item) {
        return '<option value="' + item[0] + '"' + (item[0] === selected ? ' selected' : '') + '>' + item[1] + '</option>';
      }).join('');
    }

    var wrap = document.createElement('section');
    wrap.className = 'miq-target-selector' + (isVehicleScoped ? ' is-vehicle-scope' : '');
    var queryCompany = query.get('companyId');
    if (!companies.some(function (item) { return item[0] === queryCompany; })) queryCompany = '1933';
    if (!isVehicleScoped && query.get('veh')) {
      var requestedVehicle = query.get('veh');
      var normalizedVehicle = requestedVehicle.replace(/[-_]/g, '').toLowerCase();
      var requestedMatch = vehicles.filter(function (item) {
        return item[0].replace(/[-_]/g, '').toLowerCase() === normalizedVehicle;
      })[0];
      scopedVehicle = requestedMatch ? requestedMatch[0] : '';
    }

    MIQCommon.view.set(wrap,"innerHTML",'<div class="miq-target-selector__row">' +
        '<strong>조회 대상</strong>' +
        '<label>업체 <select data-target-company>' + options(companies, queryCompany) + '</select></label>' +
        '<label>차량 <select data-target-vehicle>' + (isVehicleScoped ? '' : '<option value="">차량을 선택하세요</option>') + options(vehicles, scopedVehicle) + '</select></label>' +
        '<span class="miq-target-selector__current" data-target-current></span>' +
        '<button type="button" class="miq-target-selector__detail" data-target-detail aria-expanded="false">' +
          '<svg class="miq-target-selector__detail-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>' +
          '<span>차량 상세검색</span>' +
        '</button>' +
      '</div>' +
      '<div class="miq-target-selector__panel" data-target-panel hidden>' +
        '<div class="miq-target-selector__search-field">' +
          '<span>전체 업체 차량번호 검색</span>' +
          '<div class="miq-target-selector__search-control"><input type="search" data-target-search placeholder="차량번호 5자 이상 입력 (예: FBA32)"><button type="button" data-target-search-button>조회</button></div>' +
          '<small>업체 선택과 관계없이 전체 차량에서 차량번호가 일부 일치하는 차량을 조회합니다. 5자 이상 입력해 주세요.</small>' +
        '</div>' +
        '<div class="miq-target-selector__result-area">' +
          '<div class="miq-target-selector__result-head"><strong data-target-result-count>검색 결과</strong><span>차량번호 · 소속 업체 · 모델 · 동력 유형</span></div>' +
          '<div class="miq-target-selector__results" data-target-results><p class="miq-target-selector__result-guide">차량번호를 입력하고 조회해 주세요.</p></div>' +
        '</div>' +
      '</div>');

    document.querySelector('.gnb').insertAdjacentElement('afterend', wrap);

    var company = wrap.querySelector('[data-target-company]');
    var vehicle = wrap.querySelector('[data-target-vehicle]');
    var current = wrap.querySelector('[data-target-current]');
    var panel = wrap.querySelector('[data-target-panel]');
    var input = wrap.querySelector('[data-target-search]');
    var results = wrap.querySelector('[data-target-results]');
    var resultCount = wrap.querySelector('[data-target-result-count]');
    var detailButton = wrap.querySelector('[data-target-detail]');

    if (isVehicleScoped) {
      company.disabled = true;
      vehicle.disabled = true;
      detailButton.hidden = true;
    }

    function companyName() { return company.options[company.selectedIndex].text; }
    function vehicleName() { return vehicle.value ? vehicle.options[vehicle.selectedIndex].text.split(' · ')[0] : ''; }
    function updateCurrent() {
      MIQCommon.view.set(current,"textContent",vehicle.value ? '현재 조회 · 차량 ' + vehicleName() : '현재 조회 · 업체 ' + companyName());
      window.MIQ_TARGET_CONTEXT = {
        companyId: company.value,
        equipmentId: vehicle.value || null,
        vehicleScoped: isVehicleScoped
      };
      document.dispatchEvent(new CustomEvent('miq:target-change', {
        detail: window.MIQ_TARGET_CONTEXT
      }));
    }
    function runSearch() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 5) {
        MIQCommon.view.set(resultCount,"textContent",'검색 결과');
        MIQCommon.view.set(results,"innerHTML",'<p class="miq-target-selector__result-guide">차량번호를 5자 이상 입력해 주세요.</p>');
        return;
      }
      var found = vehicles.filter(function (item) { return item[1].toLowerCase().indexOf(q) > -1; });
      MIQCommon.view.set(resultCount,"textContent",'검색 결과 ' + found.length + '대');
      MIQCommon.view.set(results,"innerHTML",found.length ? found.map(function (item) {
        var parts = item[1].split(' · ');
        var model = parts[1] || '-';
        var power = /^B/i.test(model) ? '리튬' : (/^D/i.test(model) ? '엔진' : '-');
        return '<button type="button" data-result-vehicle="' + item[0] + '"><strong>' + item[0] + '</strong><span>(주)세종물류중부지점 · ' + model + ' · ' + power + '</span></button>';
      }).join('') : '<p class="miq-target-selector__result-guide">일치하는 차량이 없습니다.</p>');
    }

    company.addEventListener('change', function () {
      vehicle.value = '';
      updateCurrent();
    });
    vehicle.addEventListener('change', updateCurrent);
    detailButton.addEventListener('click', function () {
      panel.hidden = !panel.hidden;
      MIQCommon.view.call(detailButton,"setAttribute",['aria-expanded',panel.hidden ? 'false' : 'true']);
      if (!panel.hidden) input.focus();
    });
    wrap.querySelector('[data-target-search-button]').addEventListener('click', runSearch);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') runSearch(); });
    results.addEventListener('click', function (e) {
      var button = e.target.closest('[data-result-vehicle]');
      if (!button) return;
      company.value = '1933';
      vehicle.value = button.dataset.resultVehicle;
      updateCurrent();
      panel.hidden = true;
      MIQCommon.view.call(detailButton,"setAttribute",['aria-expanded','false']);
    });
    updateCurrent();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', updateCurrent, { once: true });
    }
  }

  /* ── TO-BE 공통 조회 범위 ──
     화면 성격에 따라 동일 컴포넌트의 허용 단계만 바꾼다.
       full      : 업체 → 그룹 → 분류 → 차량
       aggregate : 업체 → 그룹 → 분류 (차량 단위 조회 없음)
       vehicle   : 업체 → 그룹 → 분류 → 차량을 모두 실제 값으로 선택하는 차량 상세
     조회 선택지·건수와 차량 목록/집계는 동일한 전체 차량 마스터
     (MIQ.FLEET_CATALOG)를 사용하며, 값이 없는 지표만 화면에서 미수집으로 처리한다. */
  function renderTargetSelector() {
    if (!document.querySelector('.gnb')) return;
    if (MIQCommon.view.call(body,"getAttribute",['data-target-selector']) === 'none') return;
    if (ACT === 'dash' || ACT === 'mgmt' || ACT === 'rpt') return;
    if (ACT === 'interest' && (ACTSUB !== 'summary' || !canUseInterest(MANAGEMENT_ROLE))) return;
    if (document.querySelector('.miq-target-selector')) return;

    var explicitProfile = MIQCommon.view.call(body,"getAttribute",['data-target-profile']);
    var profile = explicitProfile || 'full';
    var lithiumList = MIQCommon.view.call(body,"getAttribute",['data-lithium-list']) === 'true';
    /* 사용시간·운영효율은 full: 전체 범위와 차량 한 대를 모두 조회한다. */
    if (!explicitProfile && ACT === 'anlz' && ['detail', 'engine', 'lithium'].indexOf(ACTSUB) > -1) profile = 'vehicle';

    var query = new URLSearchParams(TARGET_INITIAL_QUERY.toString());
    /* 권한별 조회 계층은 화면마다 임의로 감추지 않고 이 정책 한 곳에서 결정한다.
       - 내부/딜러: 업체 → 분류 → 차량 (그룹은 업무 범위가 아니므로 숨김)
       - 고객 대표: 자기 업체(숨김) → 그룹 → 분류 → 차량
       - 고객 직원: 자기 업체·배정 그룹(숨김) → 분류 → 차량 */
    var roleTargetPolicy = roleRules.targetPolicy(MANAGEMENT_ROLE);
    var companyCatalog = [
      { id: '1933', name: '(주)세종물류중부지점' }, { id: '20119', name: '김현종' },
      { id: '167', name: '두산물류 주식회사' }, { id: '34317', name: '두산밥캣코리아 주식회사' },
      { id: '15857', name: '두산지게차 경남중부영업소' }, { id: '33767', name: '두산지게차 경남중부판매 주식회사' },
      { id: '11214', name: '두산지게차 마창영업소' }, { id: '6057', name: '에스엔케이중공업' },
      { id: '364', name: '온양지게차(호성건설중기)' }, { id: '12894', name: '중원건기' },
      { id: '20289', name: '창녕지게차' }, { id: '20106', name: '창원중기' },
      { id: '20120', name: '최재민' }, { id: '3703', name: '태형금속공업(주)' },
      { id: '7690', name: '팔팔지게차서비스' }, { id: '8246', name: '한일중기(주)' }
    ];
    /* Permitted dashboard preview companies can have no detailed vehicle records.
       Retain a permitted company scope instead of silently opening all vehicles. */
    var previewCompanyIds = [];
    var dashboardSource = window.MIQ_MOCK_DATA && window.MIQ_MOCK_DATA.fleet;
    if (['internal', 'dealer_owner', 'dealer_staff'].indexOf(MANAGEMENT_ROLE) > -1 && profile !== 'vehicle' && dashboardSource && Array.isArray(dashboardSource.dashboardCompanies)) {
      dashboardSource.dashboardCompanies.forEach(function (item) {
        if (!item.demo || !item.companyId || !item.companyName || !Array.isArray(item.dashboardRoles)
          || item.dashboardRoles.indexOf(MANAGEMENT_ROLE) < 0
          || (roleTargetPolicy.companyIds && roleTargetPolicy.companyIds.indexOf(item.companyId) < 0)) return;
        var id = String(item.companyId);
        if (previewCompanyIds.indexOf(id) < 0) previewCompanyIds.push(id);
        if (!companyCatalog.some(function (company) { return company.id === id; })) {
          companyCatalog.push({ id: id, name: item.companyName });
        }
      });
    }
    var fallbackFleet = [
      { vin: 'FBA32_224250271', model: 'B30S-7', group: '기본그룹', type: '리튬' },
      { vin: 'FBD25_113920044', model: 'D25S-9', group: '기본그룹', type: '엔진' },
      { vin: 'FBA18_224250094', model: 'B18S-7', group: '테스트그룹', type: '납산' }
    ];
    var sourceFleet = window.MIQ && Array.isArray(window.MIQ.FLEET_CATALOG) && window.MIQ.FLEET_CATALOG.length
      ? window.MIQ.FLEET_CATALOG
      : window.MIQ && Array.isArray(window.MIQ.FLEET) && window.MIQ.FLEET.length
        ? window.MIQ.FLEET : fallbackFleet;
    if (body.dataset.favoriteSummary === 'true') {
      try {
        var favoriteIds = window.MIQFavorites.read(MANAGEMENT_ROLE, sourceFleet, query.get('favoriteCategory'));
        sourceFleet = sourceFleet.filter(function (item) { return favoriteIds.indexOf(item.vin) > -1; });
      } catch (error) { sourceFleet = []; }
    }
    var fleet = sourceFleet.map(function (item) {
      return {
        vin: item.vin,
        model: item.model || '-',
        group: item.group || '미지정 그룹',
        type: item.type || '미분류',
        companyId: item.companyId || '1933',
        companyName: item.companyName || (item.companyId && item.companyId !== '1933' ? item.companyName : '(주)세종물류중부지점')
      };
    }).filter(function (item) { return !!item.vin; });
    fleet = roleRules.filterVehicles(MANAGEMENT_ROLE, fleet);
    if (lithiumList) fleet = fleet.filter(function (item) { return item.type === '리튬'; });
    var typeCatalog = window.MIQ && Array.isArray(window.MIQ.TYPES) && window.MIQ.TYPES.length
      ? window.MIQ.TYPES.slice() : ['엔진', '납산', '리튬'];
    if (lithiumList) typeCatalog = ['리튬'];

    function unique(values) {
      return values.filter(function (value, index, array) { return value && array.indexOf(value) === index; });
    }
    function normalizeVin(value) { return String(value || '').replace(/[-_]/g, '').toLowerCase(); }
    function vehicleByVin(value, pool) {
      var normalized = normalizeVin(value);
      return (pool || fleet).filter(function (item) { return normalizeVin(item.vin) === normalized; })[0] || null;
    }
    function companyById(id) {
      return companyCatalog.filter(function (item) { return item.id === id; })[0] || null;
    }
    function countLabel(label, count) { return label + ' · ' + count + '대'; }
    function rowsFor(companyId, group, type, pool) {
      return (pool || fleet).filter(function (item) {
        if (companyId && companyId !== 'all' && item.companyId !== companyId) return false;
        if (group && item.group !== group) return false;
        if (type && item.type !== type) return false;
        return true;
      });
    }
    function icon(name) {
      var paths = {
        company: '<rect x="4" y="3" width="16" height="18" rx="2"></rect><path d="M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M10 21v-3h4v3"></path>',
        group: '<circle cx="9" cy="8" r="3"></circle><circle cx="17" cy="9" r="2.5"></circle><path d="M3.5 20v-2.2c0-3 2.4-5.3 5.5-5.3s5.5 2.3 5.5 5.3V20M14 14c3.6 0 6.5 2 6.5 4.8V20"></path>',
        type: '<path d="M3 11V5a2 2 0 0 1 2-2h6l10 10-8 8L3 11Z"></path><circle cx="8" cy="8" r="1.5"></circle>',
        vehicle: '<path d="M3 16V9.5l2.2-4h11.6l2.2 4V16M5 16v2m14-2v2M3 11h18M7 14h.01M17 14h.01"></path>'
      };
      return '<span class="miq-target-selector__icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + paths[name] + '</svg></span>';
    }

    var vehiclePool = fleet;
    if (profile === 'vehicle' && ACTSUB === 'engine') vehiclePool = fleet.filter(function (item) { return item.type === '엔진'; });
    if (profile === 'vehicle' && ACTSUB === 'lithium') vehiclePool = fleet.filter(function (item) { return item.type === '리튬'; });

    var defaultVehicle = { detail: 'FBA32_224250271', engine: 'FBD25_113920044', lithium: 'FBA32_224250271' }[ACTSUB] || '';
    var requestedVehicle = query.get('veh') || query.get('equipmentId') || '';
    /* 서비스 이력의 호기는 현재 차량 카탈로그에 없을 수도 있다. 차량 레코드를
       만들지 않고 조회 조건만 보존해, 이력이 0건이어도 다른 차량으로 바뀌지 않게 한다. */
    var historyRecords = window.MIQServiceRecords && MIQServiceRecords.records || [];
    var allowedHistory = ['dealer_staff', 'customer_staff'].indexOf(MANAGEMENT_ROLE) < 0 || roleRules.filterVehicles(MANAGEMENT_ROLE, historyRecords).some(function (record) {
      return String(record.vin).replace(/[^0-9A-Z]/gi, '').toUpperCase() === String(requestedVehicle).replace(/[^0-9A-Z]/gi, '').toUpperCase();
    });
    var serviceHistoryVin = ACT === 'srvc' && profile === 'full' && requestedVehicle && allowedHistory && !vehicleByVin(requestedVehicle, fleet)
      ? requestedVehicle : '';
    function hasServiceHistoryVin() { return !!serviceHistoryVin && state.vin === serviceHistoryVin; }
    var initialVehicle = vehicleByVin(requestedVehicle, vehiclePool) || vehicleByVin(defaultVehicle, vehiclePool) || vehiclePool[0] || null;
    var requestedCompany = query.get('companyId');
    var knownCompany = requestedCompany === 'all' || !!companyById(requestedCompany);
    var state = {
      companyId: profile === 'vehicle'
        ? (initialVehicle ? initialVehicle.companyId : '1933')
        : roleTargetPolicy.companyId || (knownCompany ? requestedCompany : 'all'),
      group: roleTargetPolicy.hideGroup ? '' : (query.get('group') || query.get('groupName') || ''),
      type: lithiumList ? '리튬' : query.get('type') || query.get('fuelType') || '',
      vin: profile === 'vehicle' ? (initialVehicle ? initialVehicle.vin : '')
        : profile === 'aggregate' ? '' : (vehicleByVin(requestedVehicle, fleet) || {}).vin || serviceHistoryVin
    };
    if (profile === 'vehicle' && initialVehicle) {
      state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : initialVehicle.group);
      state.type = initialVehicle.type;
    }

    var wrap = document.createElement('section');
    wrap.className = 'miq-target-selector is-hierarchy is-profile-' + profile;
    MIQCommon.view.call(wrap,"setAttribute",['data-target-profile',profile]);
    MIQCommon.view.call(wrap,"setAttribute",['aria-label','공통 조회 범위']);
    MIQCommon.view.set(wrap,"innerHTML",'<div class="miq-target-selector__row">' +
        '<label class="miq-target-selector__control" data-target-slot="company">' + icon('company') + '<span class="miq-sr-only">업체</span><select data-target-company aria-label="업체 선택"></select></label>' +
        '<label class="miq-target-selector__control" data-target-slot="group">' + icon('group') + '<span class="miq-sr-only">그룹</span><select data-target-group aria-label="그룹 선택"></select></label>' +
        '<label class="miq-target-selector__control" data-target-slot="type">' + icon('type') + '<span class="miq-sr-only">분류</span><select data-target-type aria-label="분류 선택"></select></label>' +
        '<label class="miq-target-selector__control" data-target-slot="vehicle">' + icon('vehicle') + '<span class="miq-sr-only">차량</span><select data-target-vehicle aria-label="차량 선택"></select></label>' +
        '<button type="button" class="miq-target-selector__detail" data-target-detail aria-label="차량 상세검색" title="차량 상세검색" aria-expanded="false">' +
          '<svg class="miq-target-selector__detail-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path></svg>' +
          '<span>차량 상세검색</span>' +
        '</button>' +
      '</div>' +
      '<div class="miq-target-selector__panel" data-target-panel hidden>' +
        '<div class="miq-target-selector__search-field">' +
          '<span>전체 업체 차량번호 검색</span>' +
          '<div class="miq-target-selector__search-control"><input type="search" data-target-search placeholder="차량번호 5자 이상 입력 (예: FBA32)"><button type="button" data-target-search-button>조회</button></div>' +
          '<small>현재 선택 범위와 관계없이 전체 차량에서 차량번호가 일부 일치하는 차량을 조회합니다.</small>' +
        '</div>' +
        '<div class="miq-target-selector__result-area">' +
          '<div class="miq-target-selector__result-head"><strong data-target-result-count>검색 결과</strong><span>차량번호 · 소속 업체 · 모델 · 동력 유형</span></div>' +
          '<div class="miq-target-selector__results" data-target-results><p class="miq-target-selector__result-guide">차량번호를 입력하고 조회해 주세요.</p></div>' +
        '</div>' +
      '</div>');
    var leadingControl = document.querySelector('[data-target-leading-control]');
    if (leadingControl) {
      wrap.querySelector('.miq-target-selector__row').prepend(leadingControl);
      leadingControl.hidden = false;
    }
    document.querySelector('.gnb').insertAdjacentElement('afterend', wrap);

    if (MIQCommon.view.call(body,"getAttribute",['data-summary-layout']) === 'content-search') {
      var summaryLayout = document.querySelector('.layout');
      summaryLayout.insertBefore(wrap, summaryLayout.firstChild);
    }

    var company = wrap.querySelector('[data-target-company]');
    var group = wrap.querySelector('[data-target-group]');
    var type = wrap.querySelector('[data-target-type]');
    var vehicle = wrap.querySelector('[data-target-vehicle]');
    var groupControl = wrap.querySelector('[data-target-slot="group"]');
    var panel = wrap.querySelector('[data-target-panel]');
    var input = wrap.querySelector('[data-target-search]');
    var results = wrap.querySelector('[data-target-results]');
    var resultCount = wrap.querySelector('[data-target-result-count]');
    var detailButton = wrap.querySelector('[data-target-detail]');
    var companyControl = wrap.querySelector('[data-target-slot="company"]');

    function setSearchPanelOpen(open) {
      var label = open ? '상세검색 닫기' : '차량 상세검색';
      panel.hidden = !open;
      MIQCommon.view.call(detailButton,"setAttribute",['aria-expanded',open ? 'true' : 'false']);
      MIQCommon.view.call(detailButton,"setAttribute",['aria-label',label]);
      MIQCommon.view.call(detailButton,"setAttribute",['title',label]);
      MIQCommon.view.set(detailButton.querySelector('span'),"textContent",label);
      MIQCommon.view.set(detailButton.querySelector('svg'),"innerHTML",open
        ? '<path d="m6 6 12 12M18 6 6 18"></path>'
        : '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.5 15.5 5 5"></path>');
    }
    setSearchPanelOpen(false);

    if (profile === 'aggregate') {
      wrap.querySelector('[data-target-slot="vehicle"]').hidden = true;
    }
    if (roleTargetPolicy.hideCompany || roleTargetPolicy.hideGroup) {
      wrap.classList.add('is-role-fixed-scope');
      companyControl.hidden = roleTargetPolicy.hideCompany;
      groupControl.hidden = roleTargetPolicy.hideGroup;
    }
    function setOptions(select, items, selected) {
      MIQCommon.view.set(select,"textContent",'');
      items.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item.value;
        MIQCommon.view.set(option,"textContent",item.label);
        MIQCommon.view.call(option,"setAttribute",['data-label',item.rawLabel || item.label]);
        if (item.value === selected) option.selected = true;
        select.appendChild(option);
      });
      if (select.selectedIndex < 0 && select.options.length) select.selectedIndex = 0;
    }

    function setGroupAvailability(disabled) {
      group.disabled = !!disabled;
      groupControl.classList.toggle('is-disabled', !!disabled);
      MIQCommon.view.call(groupControl,"setAttribute",['aria-disabled',disabled ? 'true' : 'false']);
      groupControl.title = disabled ? '업체를 선택하면 해당 업체의 그룹을 선택할 수 있습니다.' : '';
    }

    /* 그룹은 업체의 하위 식별자다. 같은 그룹명이 여러 업체에 존재할 수 있으므로
       전체 업체에서 그룹명만으로 합산하거나, 다른 업체의 그룹을 재사용하지 않는다. */
    function normalizeTargetState(changed) {
      if (profile === 'vehicle') return;

      if (changed === 'company') { state.group = ''; state.type = ''; state.vin = ''; }
      if (changed === 'group') { state.type = ''; state.vin = ''; }
      if (changed === 'type') state.vin = '';
      if (profile === 'aggregate') state.vin = '';
      if (roleTargetPolicy.companyId) state.companyId = roleTargetPolicy.companyId;
      if (roleTargetPolicy.hideGroup) state.group = roleTargetPolicy.group || '';
      if (lithiumList) state.type = '리튬';

      var selected = profile === 'aggregate' ? null : vehicleByVin(state.vin, fleet);
      if (selected) {
        state.companyId = selected.companyId;
        state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : selected.group);
        state.type = selected.type;
        state.vin = selected.vin;
        return;
      }
      if (!hasServiceHistoryVin()) state.vin = '';

      if (state.companyId !== 'all' && !companyById(state.companyId)) state.companyId = 'all';
      if (!state.companyId) state.companyId = 'all';
      if (state.companyId !== 'all' && !rowsFor(state.companyId, '', '', fleet).length && previewCompanyIds.indexOf(state.companyId) < 0) {
        state.companyId = roleTargetPolicy.companyId || 'all';
      }

      if (state.companyId === 'all') {
        /* 분류는 전사 공통 분류이므로 유지할 수 있지만 그룹은 반드시 해제한다. */
        state.group = '';
      } else {
        var companyRows = rowsFor(state.companyId, '', '', fleet);
        if (!roleTargetPolicy.group && state.group && !companyRows.some(function (item) { return item.group === state.group; })) {
          state.group = '';
        }
      }

      var scopedRows = rowsFor(state.companyId, state.group, '', fleet);
      if (!lithiumList && state.type && !scopedRows.some(function (item) { return item.type === state.type; })) state.type = '';
    }

    function refreshControls(changed) {
      if (profile === 'vehicle') {
        if (changed === 'company') { state.group = ''; state.type = ''; state.vin = ''; }
        if (changed === 'group') { state.type = ''; state.vin = ''; }
        if (changed === 'type') state.vin = '';
        if (roleTargetPolicy.hideGroup) state.group = roleTargetPolicy.group || '';

        var requiredCompanies = companyCatalog.filter(function (item) {
          return rowsFor(item.id, '', '', vehiclePool).length > 0;
        });
        if (!requiredCompanies.some(function (item) { return item.id === state.companyId; })) {
          state.companyId = requiredCompanies.length ? requiredCompanies[0].id : (vehiclePool[0] || {}).companyId || '1933';
        }
        setOptions(company, requiredCompanies.map(function (item) {
          return { value: item.id, label: countLabel(item.name, rowsFor(item.id, '', '', vehiclePool).length), rawLabel: item.name };
        }), state.companyId);

        var requiredCompanyRows = rowsFor(state.companyId, '', '', vehiclePool);
        var requiredGroups = unique(requiredCompanyRows.map(function (item) { return item.group; }));
        if (roleTargetPolicy.hideGroup) {
          state.group = roleTargetPolicy.group || '';
          var fixedGroupName = roleTargetPolicy.group || '전체 그룹';
          setOptions(group, [{ value: state.group, label: countLabel(fixedGroupName, requiredCompanyRows.length), rawLabel: fixedGroupName }], state.group);
        } else {
          if (requiredGroups.indexOf(state.group) < 0) state.group = requiredGroups[0] || '';
          setOptions(group, requiredGroups.map(function (name) {
            return { value: name, label: countLabel(name, rowsFor(state.companyId, name, '', vehiclePool).length), rawLabel: name };
          }), state.group);
        }

        var requiredGroupRows = rowsFor(state.companyId, roleTargetPolicy.hideGroup ? '' : state.group, '', vehiclePool);
        var requiredTypes = unique(requiredGroupRows.map(function (item) { return item.type; }));
        if (requiredTypes.indexOf(state.type) < 0) state.type = requiredTypes[0] || '';
        setOptions(type, requiredTypes.map(function (name) {
          return { value: name, label: countLabel(name, rowsFor(state.companyId, state.group, name, vehiclePool).length), rawLabel: name };
        }), state.type);

        var requiredVehicles = rowsFor(state.companyId, roleTargetPolicy.hideGroup ? '' : state.group, state.type, vehiclePool);
        if (!vehicleByVin(state.vin, requiredVehicles)) state.vin = requiredVehicles.length ? requiredVehicles[0].vin : '';
        setOptions(vehicle, requiredVehicles.map(function (item) {
          return { value: item.vin, label: item.vin + ' · ' + item.model, rawLabel: item.vin };
        }), state.vin);

        var requiredVehicle = vehicleByVin(state.vin, requiredVehicles);
        if (requiredVehicle) {
          state.companyId = requiredVehicle.companyId;
          state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : requiredVehicle.group);
          state.type = requiredVehicle.type;
        }
        setGroupAvailability(false);
        return;
      }

      normalizeTargetState(changed);

      var availableCompanies = companyCatalog.filter(function (item) {
        return rowsFor(item.id, '', '', fleet).length > 0 || item.id === roleTargetPolicy.companyId
          || (item.id === state.companyId && previewCompanyIds.indexOf(item.id) >= 0);
      });
      setOptions(company, [{ value: 'all', label: countLabel('전체 업체', fleet.length), rawLabel: '전체 업체' }].concat(availableCompanies.map(function (item) {
        return { value: item.id, label: countLabel(item.name, rowsFor(item.id, '', '', fleet).length), rawLabel: item.name };
      })), state.companyId);

      var companyRows = rowsFor(state.companyId, '', '', fleet);
      var groupNames = unique(companyRows.map(function (item) { return item.group; }));
      var groupOptions = [{ value: '', label: countLabel('전체 그룹', companyRows.length), rawLabel: '전체 그룹' }];
      if (roleTargetPolicy.group) {
        groupOptions = [{ value: roleTargetPolicy.group, label: countLabel(roleTargetPolicy.group, companyRows.length), rawLabel: roleTargetPolicy.group }];
      } else if (state.companyId !== 'all') {
        groupOptions = groupOptions.concat(groupNames.map(function (name) {
          return { value: name, label: countLabel(name, rowsFor(state.companyId, name, '', fleet).length), rawLabel: name };
        }));
      }
      setOptions(group, groupOptions, state.group);
      setGroupAvailability(state.companyId === 'all');

      var groupRows = rowsFor(state.companyId, state.group, '', fleet);
      setOptions(type, (lithiumList ? [] : [{ value: '', label: countLabel('전체 분류', groupRows.length), rawLabel: '전체 분류' }]).concat(typeCatalog.map(function (name) {
        return { value: name, label: countLabel(name, rowsFor(state.companyId, state.group, name, fleet).length), rawLabel: name };
      })), state.type);

      var availableVehicles = profile === 'vehicle' ? vehiclePool : rowsFor(state.companyId, state.group, state.type, fleet);
      var vehicleOptions = profile === 'vehicle' ? [] : [{ value: '', label: countLabel('전체 차량', availableVehicles.length), rawLabel: '전체 차량' }];
      vehicleOptions = vehicleOptions.concat(availableVehicles.map(function (item) {
        return { value: item.vin, label: item.vin + ' · ' + item.model, rawLabel: item.vin };
      }));
      if (hasServiceHistoryVin()) vehicleOptions.push({ value: state.vin, label: state.vin, rawLabel: state.vin });
      setOptions(vehicle, vehicleOptions, state.vin);
    }

    function targetDetail() {
      var selectedVehicle = vehicleByVin(state.vin, fleet);
      var selectedCompany = companyById(state.companyId);
      var companyName = state.companyId === 'all'
        ? '전체 업체'
        : (selectedCompany && selectedCompany.name) || (selectedVehicle && selectedVehicle.companyName) || '선택 업체';
      var groupName = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : (state.group || '전체 그룹'));
      var typeName = state.type || '전체 분류';
      var vehicleName = selectedVehicle ? selectedVehicle.vin + ' · ' + selectedVehicle.model : hasServiceHistoryVin() ? state.vin : '전체 차량';
      var scopeSegments = [];
      if (!roleTargetPolicy.hideCompany) scopeSegments.push({ key: 'company', label: companyName });
      if (!roleTargetPolicy.hideGroup) scopeSegments.push({ key: 'group', label: groupName });
      scopeSegments.push({ key: 'type', label: typeName });
      if (profile !== 'aggregate') scopeSegments.push({ key: 'vehicle', label: vehicleName });
      var selectedRows = selectedVehicle ? [selectedVehicle] : rowsFor(state.companyId, state.group, state.type, fleet);
      return {
        companyId: state.companyId,
        companyName: companyName,
        group: roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? null : (state.group || null)),
        groupName: groupName,
        type: state.type || null,
        typeName: typeName,
        equipmentId: state.vin || null,
        vehicleModel: selectedVehicle ? selectedVehicle.model : null,
        vehicleLabel: vehicleName,
        selectedCount: hasServiceHistoryVin() ? 1 : selectedRows.length,
        scopeSegments: scopeSegments,
        scopePath: scopeSegments.map(function (segment) { return segment.label; }).join(' › '),
        vehicleScoped: profile === 'vehicle',
        requiredVehicle: profile === 'vehicle',
        profile: profile
      };
    }

    function addressForState() {
      var url = new URL(location.href);
      url.searchParams.set('companyId', state.companyId);
      if (roleTargetPolicy.group || (!roleTargetPolicy.hideGroup && state.group)) url.searchParams.set('group', roleTargetPolicy.group || state.group); else url.searchParams.delete('group');
      if (state.type) url.searchParams.set('type', state.type); else url.searchParams.delete('type');
      if (state.vin) url.searchParams.set('veh', state.vin); else url.searchParams.delete('veh');
      ['groupName', 'groupId', 'fuelType', 'powerType', 'equipmentId', 'vehicleId', 'vehicle', 'vin'].forEach(function (key) {
        url.searchParams.delete(key);
      });
      return url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
    }

    function dispatchTargetChange() {
      window.MIQ_TARGET_CONTEXT = targetDetail();
      document.dispatchEvent(new CustomEvent('miq:target-change', { detail: window.MIQ_TARGET_CONTEXT }));
    }

    function commit(changed, userInitiated) {
      refreshControls(changed);
      if (userInitiated && profile === 'vehicle') {
        location.assign(addressForState());
        return;
      }
      if (userInitiated) history.replaceState({}, '', addressForState());
      dispatchTargetChange();
    }

    company.addEventListener('change', function () {
      state.companyId = company.value;
      commit('company', true);
    });
    group.addEventListener('change', function () {
      state.group = group.value;
      commit('group', true);
    });
    type.addEventListener('change', function () {
      state.type = type.value;
      commit('type', true);
    });
    vehicle.addEventListener('change', function () {
      state.vin = vehicle.value;
      var selected = vehicleByVin(state.vin, fleet);
      if (selected) {
        state.companyId = selected.companyId;
        state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : selected.group);
        state.type = selected.type;
      }
      commit('vehicle', true);
    });
    document.addEventListener('miq:scope-reset-request', function () {
      if (profile === 'vehicle') return;
      state.companyId = 'all';
      state.group = '';
      state.type = '';
      state.vin = '';
      setSearchPanelOpen(false);
      commit('company', true);
      if (company && typeof company.focus === 'function') company.focus();
    });
    document.addEventListener('miq:lnb-target-change', function (event) {
      var target = event.detail || {};
      if (profile === 'vehicle') {
        var detailVehicle = vehicleByVin(target.equipmentId, vehiclePool);
        if (!detailVehicle || detailVehicle.vin === state.vin) return;
        state.companyId = detailVehicle.companyId;
        state.group = detailVehicle.group;
        state.type = detailVehicle.type;
        state.vin = detailVehicle.vin;
        commit('lnb', true);
        return;
      }
      state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : (target.group || ''));
      state.type = target.type || '';
      state.vin = target.equipmentId || '';
      var selected = vehicleByVin(state.vin, fleet);
      if (selected) {
        state.companyId = selected.companyId;
        state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : selected.group);
        state.type = selected.type;
      }
      commit('lnb', true);
    });
    document.addEventListener('miq:vehicle-context-change', function (event) {
      if (profile !== 'vehicle') return;
      var selected = vehicleByVin(event.detail && event.detail.equipmentId, vehiclePool);
      if (!selected) return;
      state.companyId = selected.companyId;
      state.group = roleTargetPolicy.group || (roleTargetPolicy.hideGroup ? '' : selected.group);
      state.type = selected.type;
      state.vin = selected.vin;
      refreshControls('vehicle');
      history.replaceState({}, '', addressForState());
      dispatchTargetChange();
    });

    function runSearch() {
      var q = input.value.trim().toLowerCase();
      if (q.length < 5) {
        MIQCommon.view.set(resultCount,"textContent",'검색 결과');
        MIQCommon.view.set(results,"innerHTML",'<p class="miq-target-selector__result-guide">차량번호를 5자 이상 입력해 주세요.</p>');
        return;
      }
      var searchPool = profile === 'vehicle' ? vehiclePool : fleet;
      var found = searchPool.filter(function (item) { return (item.vin + ' ' + item.model).toLowerCase().indexOf(q) > -1; });
      MIQCommon.view.set(resultCount,"textContent",'검색 결과 ' + found.length + '대');
      MIQCommon.view.set(results,"textContent",'');
      if (!found.length) {
        var empty = document.createElement('p');
        empty.className = 'miq-target-selector__result-guide';
        MIQCommon.view.set(empty,"textContent",'일치하는 차량이 없습니다.');
        results.appendChild(empty);
        return;
      }
      found.forEach(function (item) {
        var companyMeta = companyById(item.companyId);
        var button = document.createElement('button');
        var vin = document.createElement('strong');
        var meta = document.createElement('span');
        button.type = 'button';
        MIQCommon.view.call(button,"setAttribute",['data-result-vehicle',item.vin]);
        MIQCommon.view.set(vin,"textContent",item.vin);
        MIQCommon.view.set(meta,"textContent",(companyMeta ? companyMeta.name : item.companyName) + ' · ' + item.model + ' · ' + item.type);
        button.appendChild(vin);
        button.appendChild(meta);
        results.appendChild(button);
      });
    }

    detailButton.addEventListener('click', function () {
      setSearchPanelOpen(panel.hidden);
      if (!panel.hidden) input.focus();
    });
    wrap.querySelector('[data-target-search-button]').addEventListener('click', runSearch);
    input.addEventListener('keydown', function (event) { if (event.key === 'Enter') runSearch(); });
    results.addEventListener('click', function (event) {
      var button = event.target.closest('[data-result-vehicle]');
      if (!button) return;
      var selected = vehicleByVin(MIQCommon.view.call(button,"getAttribute",['data-result-vehicle']), fleet);
      if (!selected) return;
      state.companyId = selected.companyId;
      state.group = roleTargetPolicy.hideGroup ? '' : selected.group;
      state.type = selected.type;
      state.vin = selected.vin;
      setSearchPanelOpen(false);
      if (profile === 'aggregate') {
        var analysisMenu = MENU.filter(function (item) { return item.key === 'anlz'; })[0];
        var detailPage = analysisMenu && analysisMenu.subs.filter(function (item) { return item.key === 'detail'; })[0];
        if (analysisMenu && detailPage) {
          location.assign(contextualHref(analysisMenu, detailPage, targetDetail()));
          return;
        }
      }
      commit('vehicle', true);
    });

    refreshControls('initial');
    /* 직접 유입 URL의 잘못된 업체-그룹 조합, 집계 화면의 차량 조건, 별칭 key를
       첫 렌더 전에 정규 주소로 치환해 본문과 공유 링크가 같은 범위를 가리키게 한다. */
    history.replaceState({}, '', addressForState());
    dispatchTargetChange();
  }

  function removeMockupAnnotations() {
    document.title = document.title
      .replace(/\s*TO-BE\s*v?\d*\s*\(Mock-up\)/gi, '')
      .replace(/\s*\(Mock-up\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    Array.prototype.forEach.call(document.querySelectorAll('.change-tag, .new-tag, .remove-tag, .draft-tag'), function (tag) {
      tag.remove();
    });
    /*
       고객 목업을 검토하기 위해 넣었던 권한 선택기·설명 말풍선은 실제 구현 화면의
       기능이 아니다. 화면별로 복제하지 않고 공통 셸에서 일괄 제거해 원본 레이아웃과
       실제 버튼/필터만 남긴다.
    */
    Array.prototype.forEach.call(document.querySelectorAll('.role-picker'), function (node) {
      /* 목업용 권한 전환기는 화면에서 감추되 기존 페이지 스크립트의 참조는 보존한다. */
      node.hidden = true;
      MIQCommon.view.call(node,"setAttribute",['aria-hidden','true']);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.hidden-note, .merged-note, .web-only'), function (node) {
      node.remove();
    });
    Array.prototype.forEach.call(document.querySelectorAll('.note, .policy-callout'), function (note) {
      var text = MIQCommon.view.get(note,"textContent").replace(/\s+/g, ' ').trim();
      /*
         policy-callout은 처리 결과·삭제 영향처럼 실제 동작 피드백에도 사용한다.
         클래스만 보고 전부 지우지 않고, 고객에게 노출할 이유가 없는 목업 설명만 제거한다.
      */
      if (/TO-BE 개선 사항|개발 참고|화면 설명|화면 병합 안내|권한 노출 대상|계정 권한 종류|노출 대상|목업 확인|확인용|가안|본 목업|내부 처리 안내|내부 사용자.*전체 딜러.*조회 전용|위 권한을 바꾸어|계정신청관리 패널.*계정에만 노출|그룹 셀에서 대상 그룹을 선택/.test(text)) {
        note.hidden = true;
        MIQCommon.view.call(note,"setAttribute",['aria-hidden','true']);
      }
    });
    /* 숨긴 목업 설명만 담고 있던 래퍼도 함께 접어 화면마다 남던 빈 여백을 제거한다. */
    Array.prototype.forEach.call(document.querySelectorAll('.policy-callout[hidden]'), function (note) {
      var parent = note.parentElement;
      if (!parent || parent === document.body) return;
      var hasVisibleChild = Array.prototype.some.call(parent.children, function (child) {
        return !child.hidden && MIQCommon.view.call(child,"getAttribute",['aria-hidden']) !== 'true';
      });
      if (!hasVisibleChild) {
        parent.hidden = true;
        MIQCommon.view.call(parent,"setAttribute",['aria-hidden','true']);
      }
    });
    /* 검토 포털에서만 쓰던 AS-IS·사이트맵 링크는 실제 구현 화면에서 노출하지 않는다. */
    Array.prototype.forEach.call(document.querySelectorAll('.pre__links a'), function (link) {
      var href = MIQCommon.view.call(link,"getAttribute",['href']) || '';
      if (/-asis\.html|\.\.\/index\.html/.test(href)) link.remove();
    });

    /* 로그인 화면의 시나리오 전환 탭은 검토용 제어 UI다. 실제 화면은 기본 로그인만 노출한다. */
    var loginBasicButton = document.querySelector('[data-tab="stBasic"]');
    if (loginBasicButton) {
      var loginTabs = loginBasicButton.closest('.tabs');
      if (loginTabs) loginTabs.remove();
      var basicPane = document.getElementById('stBasic');
      if (basicPane) basicPane.classList.add('active');
      var lockPane = document.getElementById('stLock');
      if (lockPane) lockPane.remove();
    }

    /* 연 단위 기간 탭은 제공하지 않는다. */
    Array.prototype.forEach.call(document.querySelectorAll('button'), function (button) {
      if (MIQCommon.view.get(button,"textContent").replace(/\s+/g, '') !== '\uB144') return;
      var group = button.parentElement;
      if (!group) return;
      var labels = Array.prototype.map.call(group.querySelectorAll('button'), function (item) {
        return MIQCommon.view.get(item,"textContent").replace(/\s+/g, '');
      });
      if (labels.indexOf('\uC77C') > -1 && labels.indexOf('\uC8FC') > -1 && labels.indexOf('\uC6D4') > -1) {
        button.remove();
      }
    });
  }

  /* ── 현재 화면형 LNB / 접기 / 푸터 ── */
  function readServiceCounts() {
    return ACT === 'srvc' ? (window.MIQ_SERVICE_COUNTS || {}) : {};
  }

  function removeServiceKpiRows() {
    if (ACT !== 'srvc') return;
    Array.prototype.forEach.call(document.querySelectorAll('.count-row'), function (row) {
      row.remove();
    });
  }

  function enhanceServiceHeader() {
    if (ACT !== 'srvc') return;

    var labels = {
      all: '서비스',
      maintenance: '수리이력',
      supply: '소모품관리',
      error: '차량 에러'
    };
    var title = document.querySelector('.main .page-title');
    if (!title) return;

    var label = labels[ACTSUB] || labels.all;
    /* 제목은 화면의 의미만 표시한다. 현재 범위는 목록 상단 공통 범위 요약이 담당한다. */
    MIQCommon.view.set(title,"textContent",label);

    /* 기준 미확정 상태에서 추가됐던 31일 안내 문구는 제거한다. */
    Array.prototype.forEach.call(document.querySelectorAll('.period-note, .period-help, .miq-period-guide'), function (node) {
      if (/31일|조회\s*기간/.test(MIQCommon.view.get(node,"textContent"))) node.remove();
    });

    var sectionTop = document.querySelector('.main .section-top');
    if (!sectionTop) return;
    var action = sectionTop.querySelector('.finder, .section-actions');
    var rolePicker = sectionTop.querySelector('.role-picker');
    var row = title.closest('.miq-service-header-row');

    if (!row) {
      row = document.createElement('div');
      row.className = 'miq-service-header-row';
      title.parentNode.insertBefore(row, title);
      row.appendChild(title);
    }
    if (action && rolePicker && rolePicker.parentNode !== action) action.insertBefore(rolePicker, action.firstChild);
    if (action && action.parentNode !== row) row.appendChild(action);

    Array.prototype.forEach.call(sectionTop.querySelectorAll('.section-top__title'), function (heading) {
      heading.remove();
    });
    var hasVisibleChild = Array.prototype.some.call(sectionTop.children, function (child) {
      return !child.hidden && getComputedStyle(child).display !== 'none';
    });
    sectionTop.classList.toggle('miq-empty-section-top', !hasVisibleChild);
  }

  function enhancePeriodControls() {
    var MIQCommon = window.MIQCommon;
    var controllers = [];
    var query = INITIAL_QUERY;
    var dateRules = window.MIQCommon.dates;
    var formatDate = dateRules.format;

    function parseDate(value, fallback) {
      return dateRules.parse(value) || new Date(fallback.getTime());
    }

    function yesterday() {
      return dateRules.yesterday();
    }

    function normalizeMode(value) {
      var key = String(value || '').toLowerCase();
      var aliases = { day: 'd', d: 'd', week: 'w', w: 'w', month: 'm', m: 'm', custom: 'c', c: 'c' };
      return aliases[key] || '';
    }

    function modeFromButton(button) {
      if (!button) return '';
      var dataMode = normalizeMode(MIQCommon.view.call(button,"getAttribute",['data-period']));
      if (dataMode) return dataMode;
      var label = MIQCommon.view.get(button,"textContent").replace(/\s+/g, '');
      return { '일': 'd', '주': 'w', '월': 'm', '사용자설정': 'c', '기간': 'c', '사용자검색': 'c', '사용자': 'c' }[label] || '';
    }

    function presetRange(mode, anchor) {
      return dateRules.operatingRange(mode, anchor);
    }

    Array.prototype.forEach.call(document.querySelectorAll('.period-tabs'), function (tabs) {
      var bar = tabs.closest('.finder, .filter-bar') || tabs.parentElement;
      if (!bar) return;
      if (bar.dataset.periodReady === 'true') {
        if (bar.__miqPeriodController) {
          bar.__miqPeriodController.restore(false);
          return;
        }
        delete bar.dataset.periodReady;
      }
      bar.dataset.periodReady = 'true';
      bar.classList.add('miq-period-filter');

      var range = bar.querySelector('.date-range');
      if (range && !bar.querySelector('input[type="date"]')) {
        var raw = MIQCommon.view.get(range,"textContent").trim().replace(/\./g, '-');
        var dates = raw.match(/\d{4}-\d{2}-\d{2}/g) || ['2026-07-01', '2026-07-31'];
        var start = document.createElement('input');
        var end = document.createElement('input');
        var sep = document.createElement('span');
        start.type = end.type = 'date';
        start.className = end.className = 'miq-date-input';
        start.value = dates[0] || '2026-07-01';
        end.value = dates[1] || dates[0] || '2026-07-31';
        sep.className = 'miq-date-separator';
        MIQCommon.view.set(sep,"textContent",'~');
        range.replaceWith(start, sep, end);
      }

      var inputs = bar.querySelectorAll('input[type="date"], input[data-from], input[data-to]');
      if (inputs.length === 1) {
        var addedEnd = document.createElement('input');
        addedEnd.type = 'date';
        addedEnd.className = 'miq-date-input';
        addedEnd.value = inputs[0].value;
        var addedSeparator = document.createElement('span');
        addedSeparator.className = 'miq-date-separator';
        MIQCommon.view.set(addedSeparator,"textContent",'~');
        inputs[0].insertAdjacentElement('afterend', addedSeparator);
        addedSeparator.insertAdjacentElement('afterend', addedEnd);
        inputs = bar.querySelectorAll('input[type="date"], input[data-from], input[data-to]');
      }
      Array.prototype.forEach.call(inputs, function (input, index) {
        if (input.type !== 'date') input.type = 'date';
        input.classList.add('miq-date-input');
        input.removeAttribute('disabled');
        input.removeAttribute('readonly');
        input.classList.add('is-enabled');
        input.dataset.miqDateRole = index === 0 ? 'start' : 'end';
        if (!MIQCommon.view.call(input,"getAttribute",['aria-label'])) {
          MIQCommon.view.call(input,"setAttribute",['aria-label',index === 0 ? '조회 시작일' : '조회 종료일']);
        }
      });
      Array.prototype.forEach.call(bar.querySelectorAll('.date-range span, .sep, .chart-head__tools > span:not(.period-tabs)'), function (separator) {
        if (MIQCommon.view.get(separator,"textContent").trim() === '~') separator.classList.add('miq-date-separator');
      });
      var buttons = Array.prototype.slice.call(tabs.querySelectorAll('button'));
      var searchButton = Array.prototype.filter.call(bar.querySelectorAll('button'), function (button) {
        var label = MIQCommon.view.get(button,"textContent").replace(/\s+/g, '');
        return label === '조회' || button.classList.contains('btn-search') || button.id === 'btnSearch';
      })[0];
      var startInput = inputs[0];
      var endInput = inputs[1] || inputs[0];
      var separators = Array.prototype.filter.call(bar.querySelectorAll('.miq-date-separator, .sep'), function (node) {
        return MIQCommon.view.get(node,"textContent").trim() === '~';
      });
      var periodCodes = { d: 'D', w: 'W', m: 'M', c: 'C' };

      buttons.forEach(function (button) {
        var label = MIQCommon.view.get(button,"textContent").replace(/\s+/g, '');
        if (label === '기간' || label === '사용자검색' || label === '사용자') {
          MIQCommon.view.set(button,"textContent",'사용자설정');
        }
        var mode = modeFromButton(button);
        if (mode) MIQCommon.view.call(button,"setAttribute",['data-period',mode]);
      });
      if (searchButton) searchButton.classList.add('btn-search');

      function activeMode() {
        return modeFromButton(tabs.querySelector('button.active')) || 'm';
      }

      function activateMode(mode) {
        buttons.forEach(function (item) { item.classList.toggle('active', modeFromButton(item) === mode); });
      }

      function setDateVisibility(mode) {
        bar.classList.toggle('miq-period-mode-d', mode === 'd');
        startInput.hidden = false;
        MIQCommon.view.call(startInput,"setAttribute",['aria-label',mode === 'd' ? '조회일' : '조회 시작일']);
        if (endInput !== startInput) endInput.hidden = mode === 'd';
        separators.forEach(function (separator) { separator.hidden = mode === 'd'; });
        [startInput, endInput].forEach(function (input) {
          input.disabled = false;
          input.readOnly = false;
          input.removeAttribute('disabled');
          input.removeAttribute('readonly');
          input.classList.add('is-enabled');
        });
      }

      var state = {
        mode: activeMode(),
        from: startInput.value,
        to: endInput.value || startInput.value,
        customFrom: startInput.value,
        customTo: endInput.value || startInput.value
      };

      function writeRange(mode, from, to) {
        state.mode = mode;
        state.from = from;
        state.to = to;
        startInput.value = from;
        endInput.value = to;
        activateMode(mode);
        setDateVisibility(mode);
      }

      // Inputs are draft conditions. Results, URLs and exports use this snapshot.
      var applied = null;
      function snapshot() { return { period: state.mode, from: state.from, to: state.to }; }
      function validateDraft() {
        MIQCommon.view.call(startInput,"setCustomValidity",['']); MIQCommon.view.call(endInput,"setCustomValidity",['']);
        var from = dateRules.parse(startInput.value), to = dateRules.parse(endInput.value);
        var invalid = !from ? startInput : !to ? endInput : from > to ? startInput : null;
        var message = !from || !to ? '조회 시작일과 종료일을 모두 입력해 주세요.' : '조회 시작일은 종료일보다 늦을 수 없습니다.';
        if (!invalid && state.mode === 'c' && dateRules.dayCount(from, to) > 366) {
          invalid = endInput; message = '사용자설정 기간은 최대 366일까지 조회할 수 있습니다.';
        }
        if (invalid) { MIQCommon.view.call(invalid,"setCustomValidity",[message]); invalid.reportValidity(); return false; }
        state.from = startInput.value; state.to = state.mode === 'd' ? state.from : endInput.value;
        return true;
      }
      function emitPeriodChange() {
        applied = snapshot();
        if (ACTSUB === 'lithium') controllers.forEach(function (other) { other.setApplied(applied); });
        var nextUrl = new URL(location.href);
        nextUrl.searchParams.set('period', state.mode);
        nextUrl.searchParams.set('from', state.from);
        nextUrl.searchParams.set('to', state.to);
        history.replaceState({}, '', nextUrl.pathname + '?' + nextUrl.searchParams.toString() + nextUrl.hash);
        bar.dispatchEvent(new CustomEvent('miq:period-change', {
          bubbles: true,
          detail: {
            period: state.mode,
            periodTypeCode: periodCodes[state.mode] || 'C',
            startDate: state.from,
            endDate: state.to
          }
        }));
      }

      function restoreState(shouldEmit) {
        writeRange(state.mode, state.from, state.to);
        if (shouldEmit) emitPeriodChange();
      }

      function selectMode(mode) {
        if (mode === 'c') {
          writeRange('c', state.customFrom || state.from, state.customTo || state.to);
        } else {
          var rangeValue = presetRange(mode, yesterday());
          writeRange(mode, rangeValue.from, rangeValue.to);
        }
      }

      function syncLinkedControls() {
        if (ACTSUB !== 'lithium') return;
        controllers.forEach(function (controller) {
          if (controller.bar === bar) return;
          controller.writeRange(state.mode, state.from, state.to);
        });
      }

      tabs.addEventListener('click', function (event) {
        var button = event.target.closest('button');
        if (!button) return;
        var mode = modeFromButton(button);
        if (!mode) return;
        selectMode(mode);
        syncLinkedControls();
        window.setTimeout(function () {
          restoreState(false);
          syncLinkedControls();
        }, 0);
        if (mode === 'c') {
          startInput.focus();
          if (typeof startInput.showPicker === 'function') {
            try { startInput.showPicker(); } catch (error) { /* 브라우저 사용자 제스처 정책에 따른 선택기 차단은 무시 */ }
          }
        }
      });

      Array.prototype.forEach.call([startInput, endInput], function (input) {
        input.addEventListener('input', function () { MIQCommon.view.call(startInput,"setCustomValidity",['']); MIQCommon.view.call(endInput,"setCustomValidity",['']); });
        input.addEventListener('change', function () {
          MIQCommon.view.call(startInput,"setCustomValidity",['']); MIQCommon.view.call(endInput,"setCustomValidity",['']);
          var mode = state.mode;
          if (!dateRules.parse(input.value)) {
            state.from = startInput.value; state.to = endInput.value;
            syncLinkedControls();
            return;
          }
          if (mode === 'd') {
            state.from = input.value;
            state.to = input.value;
          } else if (mode === 'w') {
            var changed = parseDate(input.value, yesterday());
            var weekRange = dateRules.linkedWeek(changed, input === startInput ? 'start' : 'end');
            state.from = weekRange.from;
            state.to = weekRange.to;
          } else if (mode === 'm') {
            var monthAnchor = parseDate(input.value, yesterday());
            var selectedMonth = dateRules.monthRange(monthAnchor, yesterday());
            state.from = selectedMonth.from;
            state.to = selectedMonth.to;
          } else {
            state.from = startInput.value;
            state.to = endInput.value || startInput.value;
            state.customFrom = state.from;
            state.customTo = state.to;
          }
          restoreState(false);
          syncLinkedControls();
          window.setTimeout(function () { restoreState(false); syncLinkedControls(); }, 0);
        });
        input.addEventListener('click', function () {
          if (typeof input.showPicker === 'function') {
            try { input.showPicker(); } catch (error) { /* 브라우저 사용자 제스처 정책에 따른 선택기 차단은 무시 */ }
          }
        });
      });

      if (searchButton) {
        searchButton.addEventListener('click', function () {
          if (!validateDraft()) return;
          restoreState(true);
          syncLinkedControls();
        });
        [startInput, endInput].forEach(function (input) {
          input.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') { event.preventDefault(); searchButton.click(); }
          });
        });
      }

      var controller = {
        bar: bar, writeRange: writeRange, restore: restoreState,
        readApplied: function () { return applied && Object.assign({}, applied); },
        setApplied: function (value) { applied = Object.assign({}, value); }
      };
      controllers.push(controller);
      bar.__miqPeriodController = controller;

      var queryMode = normalizeMode(query.get('period'));
      var hasQueryMode = queryMode && buttons.some(function (button) { return modeFromButton(button) === queryMode; });
      var initialMode = hasQueryMode ? queryMode : state.mode;
      var queryFrom = query.get('from');
      var queryTo = query.get('to');
      var hasQueryRange = /^\d{4}-\d{2}-\d{2}$/.test(queryFrom || '') && /^\d{4}-\d{2}-\d{2}$/.test(queryTo || '');
      if (hasQueryMode && hasQueryRange) {
        writeRange(initialMode, queryFrom, initialMode === 'd' ? queryFrom : queryTo);
        if (initialMode === 'c') {
          state.customFrom = queryFrom;
          state.customTo = queryTo;
        }
      } else if (initialMode === 'c') {
        state.customFrom = startInput.value;
        state.customTo = endInput.value || startInput.value;
        writeRange('c', state.customFrom, state.customTo);
      } else {
        selectMode(initialMode);
      }
      applied = snapshot();
    });
  }

  function enhanceTitlePeriodHeader() {
    var main = document.querySelector('.main');
    if (!main) return;

    /* 본문 카드/그래프 내부의 기간 필터는 이동하지 않는다.
       페이지 제목과 함께 쓰는 상단 조회 영역만 공통 행으로 묶는다. */
    var periodFilters = Array.prototype.slice.call(main.querySelectorAll('.miq-period-filter'));
    var periodFilter = periodFilters.filter(function (filter) {
      var parent = filter.parentElement;
      if (!parent) return false;
      if (filter.closest('.miq-title-period-row, .miq-service-header-row')) return true;
      if (parent === main) return true;
      if (parent.classList.contains('page-head') || parent.classList.contains('section-top')) return true;
      return false;
    })[0];
    var title = main.querySelector('.page-head__title, .page-title');
    if (!periodFilter || !title) return;

    var row = title.closest('.miq-title-period-row, .miq-service-header-row');
    var titleHost = title.parentElement;

    if (!row && titleHost && titleHost.classList.contains('page-head') && !titleHost.querySelector('.page-head__bc')) {
      row = titleHost;
      row.classList.add('miq-title-period-row');
    }

    if (!row) {
      row = document.createElement('div');
      row.className = 'miq-title-period-row';
      if (titleHost && titleHost.classList.contains('page-head')) {
        titleHost.insertAdjacentElement('afterend', row);
      } else {
        title.parentNode.insertBefore(row, title);
      }
      row.appendChild(title);
    } else {
      row.classList.add('miq-title-period-row');
    }

    var filterHost = periodFilter.parentElement;
    if (periodFilter.parentNode !== row) row.appendChild(periodFilter);

    if (titleHost && titleHost !== row && titleHost !== main && !titleHost.children.length) titleHost.remove();
    if (filterHost && filterHost !== row && filterHost !== main && !filterHost.children.length) filterHost.remove();
  }

  function placeTargetSelectorBelowTitle() {
    if (VARIANT !== 'tobe' || body.classList.contains('miq-vehicle-scoped')) return;
    /* 이전 비교안 파일만 보존한다. 현재 메뉴의 조회 영역은 같은 배치를 사용한다. */
    if (MIQCommon.view.call(body,"getAttribute",['data-summary-layout']) === 'content-search') return;
    var main = document.querySelector('.main');
    var selector = document.querySelector('.miq-target-selector.is-hierarchy');
    if (!main || !selector) return;
    var heading = main.querySelector('.summary-titlebar, .miq-service-header-row, .miq-title-period-row');
    if (!heading) {
      var title = main.querySelector('.page-head__title, .page-title');
      heading = title && title.closest('.page-head');
    }
    if (!heading) return;
    body.classList.add('miq-content-target-search');
    heading.classList.add('miq-target-search-heading');
    if (heading.nextElementSibling !== selector) heading.insertAdjacentElement('afterend', selector);
  }

  function normalizeBreadcrumb() {
    if (VARIANT !== 'tobe' || ACT === 'dash') return;

    var main = document.querySelector('.main');
    var menu = MENU.filter(function (item) { return item.key === ACT; })[0];
    if (!main || !menu || menu.preLogin) return;

    var current = menu.subs.filter(function (item) { return item.key === ACTSUB; })[0];
    var landing = menu.subs.filter(subInDropdown)[0] || menu.subs.filter(subVisible)[0] || current;
    if (!current || !landing) return;

    var candidates = Array.prototype.slice.call(main.querySelectorAll('.miq-breadcrumb, .page-head__bc, .breadcrumb'));
    var breadcrumb = candidates[0] || document.createElement('nav');
    var oldParent = breadcrumb.parentElement;
    candidates.slice(1).forEach(function (node) {
      var parent = node.parentElement;
      node.remove();
      if (parent && parent !== main && !parent.children.length) parent.remove();
    });

    breadcrumb.className = 'miq-breadcrumb';
    MIQCommon.view.call(breadcrumb,"setAttribute",['role','navigation']);
    MIQCommon.view.call(breadcrumb,"setAttribute",['aria-label','현재 위치']);
    MIQCommon.view.set(breadcrumb,"textContent",'');
    var home = document.createElement('a');
    MIQCommon.view.call(home,"setAttribute",['data-miq-breadcrumb-home',landing.key]);
    MIQCommon.view.set(home,"textContent",menu.label);
    home.href = contextualHref(menu, landing, window.MIQ_TARGET_CONTEXT || null);
    var separator = document.createElement('span');
    separator.className = 'miq-breadcrumb__separator';
    MIQCommon.view.call(separator,"setAttribute",['aria-hidden','true']);
    MIQCommon.view.set(separator,"textContent",'›');
    var currentLabel = document.createElement('span');
    MIQCommon.view.call(currentLabel,"setAttribute",['aria-current','page']);
    MIQCommon.view.set(currentLabel,"textContent",current.label);
    breadcrumb.appendChild(home);
    breadcrumb.appendChild(separator);
    breadcrumb.appendChild(currentLabel);
    main.insertBefore(breadcrumb, main.firstChild);

    if (oldParent && oldParent !== main && !oldParent.children.length) oldParent.remove();
  }

  function enhanceAnalysisReturnLink() {
    var analysisChild = { shock: true, engine: true, lithium: true };
    if (VARIANT !== 'tobe' || ACT !== 'anlz' || !analysisChild[ACTSUB]) return;
    var main = document.querySelector('.main');
    if (!main || main.querySelector('.miq-analysis-return')) return;
    var fromVehicleDetail = (ACTSUB === 'shock' || ACTSUB === 'lithium') && INITIAL_QUERY.get('origin') === 'vehicle-detail';
    var lithiumDetail = ACTSUB === 'lithium' && MIQCommon.view.call(body,"getAttribute",['data-lithium-list']) !== 'true';
    /* 목록과 제목 옆 범위 표시가 있는 집계 화면에는 빈 상세 복귀 행을 만들지 않는다. */
    if (MIQCommon.view.call(body,"getAttribute",['data-lithium-list']) === 'true' || (!fromVehicleDetail && !lithiumDetail && main.querySelector('[data-miq-scope-placement="title"]'))) return;

    var row = document.createElement('div');
    row.className = 'miq-analysis-return';
    MIQCommon.view.set(row,"innerHTML",'<a class="miq-analysis-return__link">‹ 요약정보 목록</a>' +
      '<div class="miq-analysis-return__scope" data-analysis-return-scope aria-live="polite"></div>');
    var breadcrumb = main.querySelector('.miq-breadcrumb');
    if (breadcrumb) breadcrumb.insertAdjacentElement('afterend', row);
    else main.insertBefore(row, main.firstChild);

    var link = row.querySelector('a');
    var scope = row.querySelector('[data-analysis-return-scope]');
    var fromLithiumList = lithiumDetail && !fromVehicleDetail;
    if (fromLithiumList) {
      MIQCommon.view.call(link,"setAttribute",['data-lithium-list-return','true']);
      MIQCommon.view.set(link,"textContent",'‹ 이전 목록');
    }
    if (fromVehicleDetail) {
      MIQCommon.view.call(link,"setAttribute",['data-vehicle-detail-return','true']);
      MIQCommon.view.set(link,"textContent",'‹ 이전 목록');
    }
    /* 집계 화면이 제목 옆 공통 범위 pill을 명시한 경우에는
       목록 복귀 안내 행에 같은 범위를 다시 만들지 않는다. */
    if (scope && main.querySelector('[data-miq-scope-placement="title"]')) {
      scope.remove();
      scope = null;
    }
    if (scope && lithiumDetail) {
      MIQCommon.view.call(scope,"setAttribute",['data-miq-scope-placement','title']);
      MIQCommon.view.call(scope,"setAttribute",['aria-label','현재 조회 범위']);
    }
    function update(target) {
      target = target || window.MIQ_TARGET_CONTEXT || {};
      var analysisMenu = MENU.filter(function (item) { return item.key === 'anlz'; })[0];
      var summary = analysisMenu.subs.filter(function (item) { return item.key === 'summary'; })[0];
      link.href = contextualHref(analysisMenu, summary, target);
      if (fromLithiumList) {
        var savedList = new URLSearchParams(INITIAL_QUERY.get('lithiumListQuery') || '');
        var listUrl = new URL(BASE + 'Lithium/lithium-list-tobe.html', location.href);
        ['companyId', 'group', 'type', 'veh', 'period', 'from', 'to', 'sort', 'dir', 'abnormal', 'q'].forEach(function (key) {
          if (savedList.has(key)) listUrl.searchParams.set(key, savedList.get(key));
        });
        listUrl.searchParams.set('role', MANAGEMENT_ROLE);
        link.href = listUrl.href;
      }
      if (fromVehicleDetail) {
        link.href = window.MIQCommon.navigation.vehicleDetailReturnHref(
          INITIAL_QUERY.get('vehicleDetailQuery') || INITIAL_QUERY.toString(), MANAGEMENT_ROLE, location.href);
      }
      if (scope) {
        renderScopeSummary(scope, target, {
          countLabel: '차량',
          count: target.selectedCount,
          countUnit: '대',
          pathFirst: !lithiumDetail,
          includeVehicle: true,
          resettable: false
        });
      }
    }
    update(window.MIQ_TARGET_CONTEXT);
    document.addEventListener('miq:target-change', function (event) { update(event.detail); });
    document.addEventListener('miq:query-change', function () { update(window.MIQ_TARGET_CONTEXT); });
  }

  function syncContextualNavigation(target) {
    if (VARIANT !== 'tobe') return;
    target = target || window.MIQ_TARGET_CONTEXT || null;
    var menu = MENU.filter(function (item) { return item.key === ACT; })[0];
    if (!menu) return;

    Array.prototype.forEach.call(document.querySelectorAll('[data-miq-side-sub]'), function (anchor) {
      var key = MIQCommon.view.call(anchor,"getAttribute",['data-miq-side-sub']);
      var sub = menu.subs.filter(function (item) { return item.key === key; })[0];
      if (sub) anchor.href = menuEntryHref(menu, sub);
    });

    var home = document.querySelector('[data-miq-breadcrumb-home]');
    if (home) {
      var homeKey = MIQCommon.view.call(home,"getAttribute",['data-miq-breadcrumb-home']);
      var landing = menu.subs.filter(function (item) { return item.key === homeKey; })[0];
      if (landing) home.href = contextualHref(menu, landing, target);
    }

    if (ACT === 'anlz' && ACTSUB === 'detail') {
      var analysisMenu = MENU.filter(function (item) { return item.key === 'anlz'; })[0];
      var summary = analysisMenu.subs.filter(function (item) { return item.key === 'summary'; })[0];
      var detailBack = document.querySelector('.main .back-link');
      if (detailBack) detailBack.href = window.MIQCommon.navigation.listReturnHref(
        INITIAL_QUERY.get('returnTo'), contextualHref(analysisMenu, summary, target), MANAGEMENT_ROLE, location.href);
    }
  }

  function normalizeManagementFilterOrder() {
    if (VARIANT !== 'tobe' || ACT !== 'mgmt') return;

    var main = document.querySelector('.layout > .main');
    if (!main) return;

    var children = Array.prototype.slice.call(main.children);
    var filter = children.filter(function (node) {
      return node.classList && node.classList.contains('filter-bar');
    })[0];
    var description = children.filter(function (node) {
      return node.classList && node.classList.contains('page-desc');
    })[0];

    if (!filter || !description || filter.nextElementSibling === description) return;
    filter.insertAdjacentElement('afterend', description);
  }

  function renderCurrentSideMenu() {
    var serviceCounts = readServiceCounts();
    var layout = document.querySelector('.layout');
    if (!layout) return {};

    var aside = layout.querySelector('aside.lnb');
    if (aside && MIQCommon.view.call(aside,"getAttribute",['data-miq-side-menu']) === 'true') {
      aside.querySelectorAll('[data-miq-side-sub]').forEach(function(link){
        var count=link.querySelector('.miq-side-count'),key=link.dataset.miqSideSub;
        if(count && Object.prototype.hasOwnProperty.call(serviceCounts,key))MIQCommon.view.set(count,"textContent",serviceCounts[key]);
      });
      return {layout:layout,aside:aside};
    }
    var sideMenus = {
      anlz: {
        title: '운행이력',
        items: [
          ['summary', '요약정보']
        ].concat([
          ['usage', VARIANT === 'tobe' ? '운행시간' : '사용시간'], ['oper', '운영효율']
        ]).concat(VARIANT === 'tobe' ? [['vehicleeff', '차량별 효율'], ['shock', '충격'], ['lithium', '리튬배터리']] : [])
      },
      srvc: {
        title: '서비스',
        items: [['all', '전체'], ['maintenance', '수리이력'], ['supply', '소모품관리'], ['error', '차량 에러']]
      },
      mgmt: {
        title: '관리기능',
        items: [
          ['user', '사용자'], ['company', '업체'], ['group', '그룹'], ['vehicle', '차량']
        ]
      },
      ops: {
        title: '운영관리',
        items: [['data', '차량 데이터 관리'], ['equipment', '장비코드 관리'],
          ['codes', '공통코드 관리'], ['languages', '다국어 관리'],
          ['notices', '공지사항 관리'], ['accounts', '내부 계정 관리'],
          ['menus', '메뉴·접근권한 관리'], ['history', '메뉴 접속이력']]
      },
      interest: {
        title: '관심차량',
        items: canUseInterest(MANAGEMENT_ROLE) ? [['summary', '관심차량 현황'], ['favorites', '관심차량 관리'], ['categories', '구분 관리']] : []
      },
      rpt: {
        title: '리포트',
        items: [['rptstatus', '업체별 현황'], ['rptcompare', '업체별 비교'], ['rptheat', '업체별 히트맵']]
      }
    };

    if (!aside && sideMenus[ACT]) {
      aside = document.createElement('aside');
      aside.className = 'lnb';
      layout.insertBefore(aside, layout.firstChild);
    }

    var noSideMenus = { dash: true, map: true };
    if (aside && noSideMenus[ACT]) {
      aside.hidden = true;
      layout.classList.add('miq-no-side');
    } else if (aside) {
      /* 공통 메뉴 대상이 아닌 화면이 자체 LNB를 보유하면 그대로 유지한다. */
      aside.hidden = false;
      layout.classList.remove('miq-no-side');
    } else if (noSideMenus[ACT]) {
      layout.classList.add('miq-no-side');
    }

    if (aside && sideMenus[ACT]) {
      aside.hidden = false;
      layout.classList.remove('miq-no-side');
      var config = sideMenus[ACT];
      var roleAwareItems = config.items.filter(function(item){return item[0]!=='favorites' || canUseInterest(MANAGEMENT_ROLE);});
      if (ACT === 'mgmt' && !roleRules.isCustomer(MANAGEMENT_ROLE)) {
        roleAwareItems = roleAwareItems.filter(function (item) { return item[0] !== 'group'; });
      }
      /* 차량 상세·충격·엔진·배터리는 요약정보에서만 진입하는 숨은 화면이다.
         LNB에 새 메뉴를 만들지 않고 진입 경로만 유지한다. */
      var activeKey = ACTSUB === 'detail' || ACTSUB === 'engine' ? 'summary' : ACTSUB;
      var menu = MENU.filter(function (m) { return m.key === ACT; })[0];
      var links = roleAwareItems.map(function (item) {
        if(ACT==='rpt' && roleRules.isCustomer(MANAGEMENT_ROLE)){item=item.slice();item[1]=item[1].replace(/업체/g,'그룹');if(MANAGEMENT_ROLE==='customer_staff')item[1]=item[1].replace('그룹별 비교','내 그룹 현황');}
        var sub = menu.subs.filter(function (s) { return s.key === item[0]; })[0];
        if (!sub) return '';
        var badge = ACT === 'srvc' && Object.prototype.hasOwnProperty.call(serviceCounts, item[0])
          ? '<span class="miq-side-count">' + serviceCounts[item[0]] + '</span>'
          : '';
        var sideHref = menuEntryHref(menu, sub);
        var current = item[0] === activeKey;
        return '<a class="miq-side-item' + (current ? ' active' : '') + '" data-miq-side-sub="' + item[0] + '"' + (current ? ' aria-current="page"' : '') + ' href="' + sideHref + '"><span>' + item[1] + '</span>' + badge + '</a>';
      }).join('');
      aside.__miqLnbDisabled = true;
      MIQCommon.view.call(aside,"setAttribute",['data-miq-side-menu','true']);
      aside.removeAttribute('data-lnb-tree');
      MIQCommon.view.set(aside,"innerHTML",'<h2 class="miq-side-title">' + config.title + '</h2><nav class="miq-side-menu">' + links + '</nav>');
    }

    return {layout:layout,aside:aside};
  }

  function enhanceCurrentShell() {
    var serviceCounts = readServiceCounts();
    removeMockupAnnotations();
    document.body.classList.add('miq-section-' + ACT, 'miq-page-' + ACTSUB);
    var vehicleScopedPages = { detail: true, engine: true, lithium: true };
    var lithiumList = MIQCommon.view.call(body,"getAttribute",['data-lithium-list']) === 'true';
    if (vehicleScopedPages[ACTSUB] && !lithiumList) document.body.classList.add('miq-vehicle-scoped');
    if (ACTSUB === 'lithium' && !lithiumList) document.body.classList.add('miq-lithium-detail');

    var shell = renderCurrentSideMenu();
    var layout = shell.layout, aside = shell.aside;
    if (!layout) return;

    removeServiceKpiRows();
    enhanceServiceHeader();
    enhancePeriodControls();
    normalizeManagementFilterOrder();
    normalizeBreadcrumb();
    enhanceAnalysisReturnLink();
    enhanceTitlePeriodHeader();
    placeTargetSelectorBelowTitle();
    Array.prototype.forEach.call(document.querySelectorAll('[data-miq-scope-placement="title"]'), placeScopeBesideTitle);
    syncContextualNavigation(window.MIQ_TARGET_CONTEXT || null);

    if (aside && !aside.hidden && !layout.querySelector('.miq-side-toggle')) {
      var toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'miq-side-toggle';
      MIQCommon.view.call(toggle,"setAttribute",['aria-label','좌측 메뉴 접기']);
      MIQCommon.view.call(toggle,"setAttribute",['aria-expanded','true']);
      MIQCommon.view.set(toggle,"innerHTML",'<span>‹</span>');
      toggle.addEventListener('click', function () {
        var collapsed = layout.classList.toggle('miq-side-collapsed');
        MIQCommon.view.set(toggle,"innerHTML",'<span>' + (collapsed ? '›' : '‹') + '</span>');
        MIQCommon.view.call(toggle,"setAttribute",['aria-label',collapsed ? '좌측 메뉴 펴기' : '좌측 메뉴 접기']);
        MIQCommon.view.call(toggle,"setAttribute",['aria-expanded',collapsed ? 'false' : 'true']);
        window.requestAnimationFrame(function () {
          /* 창 크기는 그대로여도 본문 폭은 바뀐다. 동적 차트가 새 실폭으로 다시 그리도록 공통 신호를 보낸다. */
          window.dispatchEvent(new Event('resize'));
          document.dispatchEvent(new CustomEvent('miq:layout-resize', {
            detail: { collapsed: collapsed }
          }));
        });
      });
      layout.appendChild(toggle);
    }

    if (!document.querySelector('.miq-page-foot')) {
      var foot = document.createElement('footer');
      foot.className = 'miq-page-foot';
      MIQCommon.view.set(foot,"innerHTML",'<div class="miq-page-foot__brand"><img src="' + BASE + '_shared/bobcat-logo-white.svg" alt="Bobcat"></div>' +
        '<div class="miq-page-foot__links"><button type="button" data-miq-legal="terms" aria-haspopup="dialog">이용약관</button><button type="button" data-miq-legal="location" aria-haspopup="dialog">위치정보 및 위치기반서비스 이용약관</button><button type="button" data-miq-legal="privacy" aria-haspopup="dialog">개인(위치)정보 처리방침</button><button type="button" data-miq-legal="license" aria-haspopup="dialog">오픈소스 고지</button>' +
        '<small>©2024 Bobcat Company. ALL RIGHTS RESERVED.</small></div>' +
        '<div class="miq-page-foot__help"><strong>HELP</strong><span>help.machineiq@doosan.com</span><small>최종접속 : 2026-08-31 21:00</small></div>');
      document.body.appendChild(foot);
      var legalLoading;
      foot.addEventListener('click', function (event) {
        var button = event.target.closest('[data-miq-legal]');
        if (!button) return;
        if (window.MIQFooterLegal) { window.MIQFooterLegal.open(button.dataset.miqLegal, button); return; }
        if (!legalLoading) legalLoading = new Promise(function (resolve, reject) {
          var script = document.createElement('script');
          script.src = BASE + '_shared/footer-legal.js?v=footer-legal-20260928';
          script.onload = function () {
            if (window.MIQFooterLegal) resolve();
            else { script.remove(); legalLoading = null; reject(new Error('Missing legal dialog')); }
          };
          script.onerror = function () { script.remove(); legalLoading = null; reject(new Error('Legal dialog load failed')); };
          document.head.appendChild(script);
        });
        button.setAttribute('aria-busy', 'true');
        legalLoading.then(function () {
          button.removeAttribute('aria-busy');
          var status = foot.querySelector('[data-legal-status]');
          if (status) status.remove();
          if (window.MIQFooterLegal) window.MIQFooterLegal.open(button.dataset.miqLegal, button);
        }).catch(function () {
          button.removeAttribute('aria-busy');
          var status = foot.querySelector('[data-legal-status]');
          if (!status) { status = document.createElement('small'); status.dataset.legalStatus = ''; status.setAttribute('role', 'status'); foot.querySelector('.miq-page-foot__links').appendChild(status); }
          status.textContent = '내용을 불러오지 못했습니다. 다시 눌러 주세요.';
        });
      });
    }

    /* 기간 조회는 현행 화면의 우측 정렬 패턴으로 통일한다. */
    Array.prototype.forEach.call(document.querySelectorAll('.filter-bar'), function (bar) {
      if (bar.querySelector('.period-tabs')) bar.classList.add('miq-period-filter');
    });
  }

  if (!document.__miqContextNavigationBound) {
    document.__miqContextNavigationBound = true;
    document.addEventListener('miq:target-change', function (event) {
      syncContextualNavigation(event.detail);
    });
    document.addEventListener('miq:query-change', function () {
      syncContextualNavigation(window.MIQ_TARGET_CONTEXT || null);
    });
  }

  renderCurrentSideMenu();
  if (document.readyState === 'loading' && body.dataset.currentBootstrap !== 'ready') {
    document.addEventListener('DOMContentLoaded', enhanceCurrentShell, {once:true});
  } else {
    enhanceCurrentShell();
  }


  /* One shared navigation fitter; translated labels never trigger page queries. */
  (function () {
    var shell = document.querySelector('.gnb'), pending = false, lastWidth = -1;
    if (!shell) return;
    function fit() {
      pending = false;
      shell.removeAttribute('data-locale-rows');
      if (document.documentElement.lang !== 'ko') {
        var menu = shell.querySelector('.gnb__menu'), right = shell.querySelector('.gnb__right');
        var last = menu && Array.from(menu.querySelectorAll('.gnb__item')).filter(function (el) { return el.getBoundingClientRect().width > 0; }).pop();
        if (menu && right && last && (menu.scrollWidth > menu.clientWidth + 2 || last.getBoundingClientRect().right > right.getBoundingClientRect().left + 1)) shell.dataset.localeRows = '2';
      }
      shell.dataset.localeFit = document.documentElement.lang;
    }
    function schedule() { if (!pending) { pending = true; requestAnimationFrame(fit); } }
    new ResizeObserver(function (entries) {
      var width = Math.round(entries[0].contentRect.width);
      if (width !== lastWidth) { lastWidth = width; schedule(); }
    }).observe(shell);
    new MutationObserver(schedule).observe(shell, {childList:true,subtree:true,characterData:true});
    document.addEventListener('miq:languagechange', schedule);
    window.addEventListener('load', schedule, {once:true});
    document.fonts.ready.then(schedule);
    schedule();
  })();

  /* ── 공통 인터랙션 ── */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-modal-open], [data-modal-close], .lnb__group-title, .lnb__item, [data-toggle-row]');
    if (!t) return;

    /* 기간 탭 / pill 탭 : 형제 중 하나만 active */
    if (t.matches('.period-tabs button, .pill-tabs button, .map-type button, .seg button')) {
      Array.prototype.forEach.call(t.parentNode.children, function (b) { b.classList.remove('active'); });
      t.classList.add('active');
      var lab = t.closest('[data-period-target]');
      if (lab) {
        var tgt = document.querySelector(lab.dataset.periodTarget);
        if (tgt && t.dataset.range) MIQCommon.view.set(tgt,"textContent",t.dataset.range);
      }
    }

    /* 콘텐츠 탭 : 패널이 .tabs 의 형제가 아닌 경우도 안전하게 처리 */
    if (t.matches('.tabs button[data-tab]')) {
      var wrap = t.closest('.tabs');
      Array.prototype.forEach.call(wrap.querySelectorAll('button'), function (b) { b.classList.remove('active'); });
      t.classList.add('active');
      var pane = document.getElementById(t.dataset.tab);
      if (pane) {
        Array.prototype.forEach.call(pane.parentNode.children, function (p) {
          if (p.classList.contains('tab-pane')) p.classList.remove('active');
        });
        pane.classList.add('active');
      }
    }

    /* LNB */
    if (t.matches('.lnb__group-title')) {
      var open = t.dataset.open !== 'n';
      t.dataset.open = open ? 'n' : 'y';
      var ar = t.querySelector('span'); if (ar) MIQCommon.view.set(ar,"textContent",open ? '▼' : '▲');
      var n = t.nextElementSibling;
      while (n && !n.classList.contains('lnb__group-title')) { n.style.display = open ? 'none' : ''; n = n.nextElementSibling; }
    }
    if (t.matches('.lnb__item')) {
      var lnb = t.closest('.lnb');
      if (lnb) Array.prototype.forEach.call(lnb.querySelectorAll('.lnb__item'), function (i) { i.classList.remove('active'); });
      t.classList.add('active');
      var out = document.querySelector('[data-lnb-label]');
      if (out) MIQCommon.view.set(out,"textContent",'- ' + (t.dataset.label || MIQCommon.view.get(t,"textContent").trim()));
    }

    /* 모달 */
    if (t.dataset.modalOpen) {
      var m1 = document.getElementById(t.dataset.modalOpen);
      if (m1) m1.classList.add('open');
    }
    if (t.hasAttribute('data-modal-close')) {
      var m2 = t.closest('.dim'); if (m2) m2.classList.remove('open');
    }

    /* 아코디언 행 */
    if (t.dataset.toggleRow) {
      var row = document.getElementById(t.dataset.toggleRow);
      if (row) row.style.display = row.style.display === 'none' || !row.style.display ? 'table-row' : 'none';
    }
  });

  /* dim 배경 클릭으로 닫기 */
  document.addEventListener('mousedown', function (e) {
    if (e.target.classList && e.target.classList.contains('dim')) e.target.classList.remove('open');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') Array.prototype.forEach.call(document.querySelectorAll('.dim.open'), function (m) { m.classList.remove('open'); });
  });

  /* 화면별 데이터가 먼저 로드된 경우에도 공통 네비게이션 공개값을 병합해
     기존 MIQ.FLEET/COMPANY 등의 데이터 네임스페이스를 보존한다. */
  window.MIQ = window.MIQ || {};
  window.MIQ.MENU = MENU;
  window.MIQ.BASE = BASE;
  window.MIQ.VARIANT = VARIANT;
  window.MIQ.MANAGEMENT_ROLES = MANAGEMENT_ROLES;
  window.MIQ.MANAGEMENT_ROLE = MANAGEMENT_ROLE;
  window.MIQ.MANAGEMENT_IDENTITY = MANAGEMENT_IDENTITY;
  window.MIQ.managementRoleLabel = managementRoleLabel;
  window.MIQ.isDealerManagementRole = isDealerManagementRole;
  window.MIQ.enhanceCurrentShell = enhanceCurrentShell;
  window.MIQ.getAppliedPeriod = function (bar) {
    bar = bar || document.querySelector('.miq-period-filter');
    return bar && bar.__miqPeriodController ? bar.__miqPeriodController.readApplied() : null;
  };
})();
