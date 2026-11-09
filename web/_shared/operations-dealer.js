/* 운영관리 > 딜러 업체 생성 (Admin preview).
   업체 → 기본 그룹 → 대표 계정을 한 화면 단계식(위저드)으로 한 번에 만든다.
   권한관리에는 업체 생성 기능이 없어서 Fleet(고객) 업체도 여기서 만들 수 있게 했다.
   대표 계정의 모바일(APP) 메뉴 권한은 메뉴/접근권한 관리(settings.menus.v1)의 역할별 설정을 그대로 따라 자동 저장한다.
   결과는 브라우저 저장소(dealer-onboarding.v1)에만 남는다. 실제 DB·SAP·메일에는 반영되지 않는다. */
(function () {
  'use strict';
  var O = window.MIQOps, fleet = window.MIQ_MOCK_DATA && window.MIQ_MOCK_DATA.fleet, seed = window.MIQAdminAuthoritySeed;
  if (!O) return;

  var storageKey = 'dealer-onboarding.v1';
  var ACTOR = '어드민 (시연)';
  var KINDS = {
    D: { label: '딜러 업체', role: 'DEALER', roleCode: 'ROLE_DEALER', roleLabel: '딜러 대표' },
    F: { label: 'Fleet(고객) 업체', role: 'FLEET', roleCode: 'ROLE_FLEET', roleLabel: '고객 대표' }
  };
  var COUNTRIES = [['KR', '대한민국', 'Asia/Seoul'], ['CN', '중국', 'Asia/Shanghai'], ['JP', '일본', 'Asia/Tokyo'], ['VN', '베트남', 'Asia/Ho_Chi_Minh'], ['US', '미국', 'America/New_York'], ['DE', '독일', 'Europe/Berlin'], ['AU', '호주', 'Australia/Sydney']];
  var TIMEZONES = ['Asia/Seoul', 'Asia/Shanghai', 'Asia/Tokyo', 'Asia/Ho_Chi_Minh', 'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Europe/Berlin', 'Australia/Sydney'];
  // 메뉴/접근권한 관리의 모바일(APP) 메뉴 기본 목록. 그 화면에서 바꿔 저장한 값이 있으면 그것을 우선한다.
  var APP_MENUS = [['APP_HOME', '홈'], ['APP_VEHICLE', '차량'], ['APP_SCAN', '차량 조회'], ['APP_SERVICE', '서비스'], ['APP_NOTICE', '공지'], ['APP_ACCOUNT', '내 정보']];
  var APP_DEFAULT_ROLES = ['FLEET', 'FLEET_GROUP', 'DEALER', 'DEALER_GROUP'];
  // 이미 등록된 SAP 고객번호 (차량 EAI 응답 예시에 나오는 번호)
  var KNOWN_SAP = { '0000102231': '서울중장비', '0000104410': '부산건기', '0000104588': '경남서비스', '0000103077': '중부장비', '0001345891': '㈜한빛건설', '0001402276': '㈜동남토건' };

  function e(v) { return O.esc(v == null ? '' : v); }
  function norm(v) { return String(v || '').replace(/\s/g, '').toLocaleLowerCase(); }
  function now() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 19).replace('T', ' '); }
  function field(label, control, full) { return '<label class="ops-field' + (full ? ' ops-field--full col-2' : '') + '"><span>' + e(label) + '</span>' + control + '</label>'; }
  function opts(items, value) { return items.map(function (x) { return '<option value="' + e(x[0]) + '"' + (String(x[0]) === String(value) ? ' selected' : '') + '>' + e(x[1]) + '</option>'; }).join(''); }

  // 모바일 메뉴 자동 세팅 대상: 메뉴/접근권한 관리 저장값 → 없으면 기본 목록
  function appMenusFor(role) {
    var stored = O.read('settings.menus.v1', null);
    if (Array.isArray(stored)) {
      var list = stored.filter(function (m) { return m.site === 'APP' && m.active !== false && m.access && m.access[role]; })
        .sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (m) { return [m.id, m.name]; });
      return { source: '메뉴/접근권한 관리 설정', menus: list };
    }
    return { source: '메뉴/접근권한 관리 기본값', menus: APP_DEFAULT_ROLES.indexOf(role) >= 0 ? APP_MENUS : [] };
  }

  O.register('dealer', function (ctx) {
    var data = O.read(storageKey, { created: [] });
    var tab = 'create', step = 1, draft = blank(), sapChecked = '', emailChecked = '';
    var steps = [[1, '업체'], [2, '기본 그룹'], [3, '대표 계정'], [4, '확인·생성']];
    function blank() { return { kind: 'D', name: '', sap: '', country: 'KR', tz: 'Asia/Seoul', group: '기본그룹', email: '', person: '', phone: '' }; }
    function save() { O.write(storageKey, data); }

    // 중복 확인 대상: 기존 업체명·SAP 번호·계정 + 이 화면에서 만든 것
    function companyNames() {
      var names = (fleet ? fleet.dashboardCompanies.map(function (c) { return c.companyName; }) : []);
      if (seed) seed.users.forEach(function (u) { names.push(u.company); });
      data.created.forEach(function (c) { names.push(c.name); });
      return names;
    }
    function sapOwner(code) { if (KNOWN_SAP[code]) return KNOWN_SAP[code]; var c = data.created.find(function (x) { return x.sap === code; }); return c ? c.name : ''; }
    function emailTaken(mail) { return (seed ? seed.users : []).some(function (u) { return norm(u.email) === norm(mail); }) || data.created.some(function (c) { return norm(c.account.email) === norm(mail); }); }

    function render() {
      ctx.el.innerHTML = '<div class="tabs" role="tablist" aria-label="딜러 업체 생성">' + [['create', '신규 생성'], ['history', '생성 이력']].map(function (t) {
        return '<button type="button" role="tab" id="dlrTab-' + t[0] + '" data-dlr-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '" aria-controls="dlrPane" tabindex="' + (tab === t[0] ? 0 : -1) + '"' + (tab === t[0] ? ' class="active"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div><section id="dlrPane" role="tabpanel" aria-labelledby="dlrTab-' + tab + '"></section>';
      var buttons = ctx.el.querySelectorAll('[data-dlr-tab]');
      buttons.forEach(function (b, i) {
        b.addEventListener('click', function () { if (tab !== b.dataset.dlrTab) { tab = b.dataset.dlrTab; render(); ctx.el.querySelector('[data-dlr-tab="' + tab + '"]').focus(); } });
        b.addEventListener('keydown', function (ev) { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(ev.key) < 0) return; ev.preventDefault(); buttons[ev.key === 'Home' ? 0 : ev.key === 'End' ? 1 : 1 - i].click(); });
      });
      var pane = ctx.el.querySelector('#dlrPane');
      if (tab === 'create') renderWizard(pane); else renderHistory(pane);
    }

    // ---------- 위저드 ----------
    function renderWizard(pane) {
      var k = KINDS[draft.kind];
      var head = '<ol class="dlr-steps" aria-label="생성 단계">' + steps.map(function (s) {
        return '<li class="' + (s[0] === step ? 'is-current' : s[0] < step ? 'is-done' : '') + '"' + (s[0] === step ? ' aria-current="step"' : '') + '><span class="dlr-no">' + (s[0] < step ? '✓' : s[0]) + '</span>' + s[1] + '</li>';
      }).join('') + '</ol>';
      var body = '';
      if (step === 1) {
        body = '<div class="dlr-kind" role="radiogroup" aria-label="업체 구분">' + Object.keys(KINDS).map(function (key) {
            return '<label class="dlr-kind__item' + (draft.kind === key ? ' is-on' : '') + '"><input type="radio" name="kind" value="' + key + '"' + (draft.kind === key ? ' checked' : '') + '><b>' + KINDS[key].label + '</b><span class="dlr-code">DATA_KIND = ' + key + '</span></label>';
          }).join('') + '</div>' +
          '<div class="dlr-grid">' + field('업체명', '<input class="inp" name="name" maxlength="100" required value="' + e(draft.name) + '" placeholder="예) 남부지게차(주)">') +
          field('SAP 고객번호', '<div class="dlr-inline"><input class="inp mono" name="sap" maxlength="10" inputmode="numeric" required value="' + e(draft.sap) + '" placeholder="10자리 숫자"><button type="button" class="btn" data-dlr-check="sap">중복 확인</button></div><p class="dlr-hint" data-dlr-msg="sap">' + checkMsg('sap') + '</p>') +
          field('국가', '<select class="inp" name="country">' + opts(COUNTRIES.map(function (c) { return [c[0], c[1] + ' (' + c[0] + ')']; }), draft.country) + '</select>') +
          field('시간대', '<select class="inp" name="tz">' + opts(TIMEZONES.map(function (t) { return [t, t]; }), draft.tz) + '</select>') + '</div>' +
          '<p class="ops-inline-message">국가를 고르면 시간대가 그 나라 기준으로 먼저 선택됩니다.</p>';
      } else if (step === 2) {
        body = '<div class="dlr-grid">' + field('기본 그룹명', '<input class="inp" name="group" maxlength="80" required value="' + e(draft.group) + '">') +
          field('사용 여부', '<input class="inp" value="사용 (활성)" readonly>') + '</div>' +
          '<p class="ops-inline-message">업체를 만들면 이 그룹이 함께 생성됩니다. 그룹이 사용 안 함이면 고객·딜러 화면에서 차량이 보이지 않으므로 기본 그룹은 항상 사용 상태로 만듭니다.</p>';
      } else if (step === 3) {
        body = '<div class="dlr-grid">' + field('대표 계정 ID (이메일)', '<div class="dlr-inline"><input class="inp" type="email" name="email" maxlength="100" required value="' + e(draft.email) + '" placeholder="예) owner@dealer.co.kr"><button type="button" class="btn" data-dlr-check="email">중복 확인</button></div><p class="dlr-hint" data-dlr-msg="email">' + checkMsg('email') + '</p>') +
          field('대표자명', '<input class="inp" name="person" maxlength="40" required value="' + e(draft.person) + '">') +
          field('연락처', '<input class="inp" name="phone" maxlength="30" value="' + e(draft.phone) + '" placeholder="예) 010-1234-5678">') +
          field('권한', '<input class="inp" value="' + e(k.roleLabel + ' (' + k.roleCode + ')') + '" readonly>') + '</div>' +
          '<div class="dlr-auto"><h4>계정 생성 시 함께 저장되는 설정</h4><ul>' +
            '<li><b>소속</b> ' + e(draft.name || '(업체명)') + ' / ' + e(draft.group) + '</li>' +
            '<li><b>초기 비밀번호</b> 임시 비밀번호를 대표 계정 이메일로 발송, 첫 로그인 때 변경</li>' +
          '</ul></div>';
      } else {
        var mm = appMenusFor(k.role);
        body = '<dl class="ops-dl">' + [
          ['업체 구분', k.label + ' · DATA_KIND = ' + draft.kind], ['업체명', draft.name], ['SAP 고객번호', draft.sap], ['국가 / 시간대', countryName(draft.country) + ' (' + draft.country + ') / ' + draft.tz],
          ['기본 그룹', draft.group + ' · 사용'], ['대표 계정', draft.email + ' · ' + draft.person + (draft.phone ? ' · ' + draft.phone : '')], ['권한', k.roleLabel + ' (' + k.roleCode + ')'],
          ['모바일 메뉴 권한', mm.menus.map(function (x) { return x[1]; }).join(', ') || '없음']
        ].map(function (x) { return '<dt>' + e(x[0]) + '</dt><dd>' + e(x[1]) + '</dd>'; }).join('') + '</dl>' +
          '<p class="ops-inline-message">[생성]을 누르면 업체 → 기본 그룹 → 대표 계정 순서로 한 번에 만들어집니다. 하나라도 실패하면 아무것도 만들지 않습니다.</p>';
      }
      pane.innerHTML = '<div class="dlr-wizard">' + head + '<form class="dlr-card" data-dlr-form novalidate><h3 class="dlr-title">' + e(steps[step - 1][1]) + '</h3>' + body +
        '<div class="dlr-actions">' + (step > 1 ? '<button type="button" class="btn" data-dlr-prev>이전</button>' : '<button type="button" class="btn" data-dlr-reset>처음부터</button>') +
        '<button type="submit" class="btn btn--pri">' + (step < 4 ? '다음' : '생성') + '</button></div></form></div>';
      var form = pane.querySelector('[data-dlr-form]');
      form.addEventListener('change', function (ev) {
        var n = ev.target.name; if (!n) return;
        draft[n] = ev.target.value;
        if (n === 'kind') { renderWizard(pane); pane.querySelector('[name="kind"]:checked').focus(); return; }
        if (n === 'country') { var c = COUNTRIES.find(function (x) { return x[0] === draft.country; }); if (c) { draft.tz = c[2]; form.elements.tz.value = c[2]; } }
      });
      form.addEventListener('input', function (ev) {
        var n = ev.target.name; if (!n) return; draft[n] = ev.target.value.trim ? ev.target.value : ev.target.value;
        if (n === 'sap' && sapChecked !== draft.sap) { sapChecked = ''; setMsg(pane, 'sap'); }
        if (n === 'email' && emailChecked !== draft.email) { emailChecked = ''; setMsg(pane, 'email'); }
      });
      pane.querySelectorAll('[data-dlr-check]').forEach(function (b) { b.addEventListener('click', function () { runCheck(b.dataset.dlrCheck, pane); }); });
      var prev = pane.querySelector('[data-dlr-prev]'); if (prev) prev.addEventListener('click', function () { step--; renderWizard(pane); });
      var reset = pane.querySelector('[data-dlr-reset]'); if (reset) reset.addEventListener('click', function () { draft = blank(); sapChecked = emailChecked = ''; renderWizard(pane); });
      form.addEventListener('submit', function (ev) { ev.preventDefault(); next(form, pane); });
      var first = form.querySelector('input:not([readonly]):not([type="radio"]), select'); if (first && step > 1) first.focus();
    }
    function countryName(code) { var c = COUNTRIES.find(function (x) { return x[0] === code; }); return c ? c[1] : code; }
    function checkMsg(kind) {
      if (kind === 'sap') return sapChecked && sapChecked === draft.sap ? '<span class="dlr-ok">✓ 사용할 수 있는 SAP 고객번호입니다.</span>' : '중복 확인을 해 주세요.';
      return emailChecked && emailChecked === draft.email ? '<span class="dlr-ok">✓ 사용할 수 있는 계정 ID입니다.</span>' : '중복 확인을 해 주세요.';
    }
    function setMsg(pane, kind, html) { var n = pane.querySelector('[data-dlr-msg="' + kind + '"]'); if (n) n.innerHTML = html || checkMsg(kind); }
    function runCheck(kind, pane) {
      if (kind === 'sap') {
        var code = draft.sap.trim();
        if (!/^\d{10}$/.test(code)) { setMsg(pane, 'sap', '<span class="dlr-bad">✕ SAP 고객번호는 10자리 숫자입니다.</span>'); return; }
        var owner = sapOwner(code);
        if (owner) { sapChecked = ''; setMsg(pane, 'sap', '<span class="dlr-bad">✕ 이미 등록된 번호입니다 (' + e(owner) + ').</span>'); return; }
        sapChecked = code; setMsg(pane, 'sap');
      } else {
        var mail = draft.email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) { setMsg(pane, 'email', '<span class="dlr-bad">✕ 이메일 형식으로 입력해 주세요.</span>'); return; }
        if (emailTaken(mail)) { emailChecked = ''; setMsg(pane, 'email', '<span class="dlr-bad">✕ 이미 사용 중인 계정 ID입니다.</span>'); return; }
        emailChecked = mail; setMsg(pane, 'email');
      }
    }
    function fail(form, name, msg) { O.notify(msg); var c = form.elements.namedItem(name); if (c && c.focus) c.focus(); }
    function next(form, pane) {
      if (step === 1) {
        draft.name = draft.name.trim(); draft.sap = draft.sap.trim();
        if (!draft.name) return fail(form, 'name', '업체명을 입력해 주세요.');
        if (companyNames().some(function (n) { return norm(n) === norm(draft.name); })) return fail(form, 'name', '이미 등록된 업체명입니다.');
        if (!sapChecked || sapChecked !== draft.sap) return fail(form, 'sap', 'SAP 고객번호 중복 확인을 해 주세요.');
      }
      if (step === 2 && !draft.group.trim()) return fail(form, 'group', '기본 그룹명을 입력해 주세요.');
      if (step === 3) {
        draft.email = draft.email.trim(); draft.person = draft.person.trim();
        if (!emailChecked || emailChecked !== draft.email) return fail(form, 'email', '대표 계정 ID 중복 확인을 해 주세요.');
        if (!draft.person) return fail(form, 'person', '대표자명을 입력해 주세요.');
      }
      if (step < 4) { step++; renderWizard(pane); return; }
      create();
    }
    function create() {
      data = O.read(storageKey, data);
      // 생성 직전 다시 확인 (다른 탭에서 같은 값으로 만든 경우)
      if (sapOwner(draft.sap) || emailTaken(draft.email) || companyNames().some(function (n) { return norm(n) === norm(draft.name); })) { O.notify('다른 곳에서 같은 업체명·SAP 번호·계정이 먼저 만들어졌습니다. 1단계부터 다시 확인해 주세요.'); step = 1; sapChecked = emailChecked = ''; render(); return; }
      var k = KINDS[draft.kind], menus = appMenusFor(k.role), at = now();
      var rec = { id: 'NEW-' + Date.now(), kind: draft.kind, name: draft.name, sap: draft.sap, country: draft.country, tz: draft.tz,
        group: { name: draft.group.trim(), active: true },
        account: { email: draft.email, name: draft.person, phone: draft.phone.trim(), role: k.roleCode, roleLabel: k.roleLabel, mustChange: true },
        mobileMenus: menus.menus.map(function (x) { return x[1]; }), menuSource: menus.source, at: at, by: ACTOR };
      data.created.push(rec); save();
      var done = rec;
      draft = blank(); step = 1; sapChecked = emailChecked = ''; tab = 'history'; render();
      O.notify(done.name + ' 업체·기본 그룹·대표 계정을 만들었습니다. 임시 비밀번호를 ' + done.account.email + '(으)로 발송했습니다(시연).');
    }

    // ---------- 생성 이력 ----------
    function renderHistory(pane) {
      pane.innerHTML = '<div data-dlr-grid></div>';
      var rows = data.created.map(function (c) { return Object.assign({}, c, { kindLabel: KINDS[c.kind].label, place: countryName(c.country) + ' / ' + c.tz, groupName: c.group.name, owner: c.account.email, menuCount: c.mobileMenus.length + '개' }); });
      O.grid(pane.querySelector('[data-dlr-grid]'), {
        rows: rows, pageSize: 15, caption: '업체 생성 이력', exportName: '업체생성이력', defaultSort: { key: 'at', dir: 'desc' }, emptyText: '아직 이 화면에서 만든 업체가 없습니다.',
        toolbar: rows.length ? '<button type="button" class="btn" data-dlr-clear>시연 데이터 초기화</button>' : '',
        columns: [
          { key: 'at', label: '생성 일시', minWidth: 140 }, { key: 'kindLabel', label: '구분', minWidth: 110 }, { key: 'name', label: '업체명', minWidth: 150 },
          { key: 'sap', label: 'SAP 고객번호', minWidth: 110 }, { key: 'place', label: '국가 / 시간대', minWidth: 150 }, { key: 'groupName', label: '기본 그룹', minWidth: 90 },
          { key: 'owner', label: '대표 계정', minWidth: 170 }, { key: 'detail', label: '관리', sortable: false, export: false, render: function () { return '<button type="button" class="btn btn--sm" data-action="detail">상세</button>'; } }
        ],
        onAction: function (action, row) { if (action === 'detail' && row) detail(row); }
      });
      var clear = pane.querySelector('[data-dlr-clear]');
      if (clear) clear.addEventListener('click', function () {
        O.confirm({ title: '시연 데이터 초기화', body: '<p>이 브라우저에서 만든 업체 생성 이력을 모두 지웁니다.</p>', submitLabel: '초기화', onConfirm: function () { data = { created: [] }; save(); render(); O.notify('생성 이력을 지웠습니다.'); } });
      });
    }
    function detail(c) {
      O.modal({ title: '생성 내역', wide: true, submitLabel: '닫기', body: '<dl class="ops-dl">' + [
        ['생성 일시', c.at + ' · ' + c.by], ['업체 구분', KINDS[c.kind].label + ' · DATA_KIND = ' + c.kind], ['업체명', c.name], ['SAP 고객번호', c.sap], ['국가 / 시간대', countryName(c.country) + ' (' + c.country + ') / ' + c.tz],
        ['기본 그룹', c.group.name + ' · 사용'], ['대표 계정', c.account.email + ' · ' + c.account.name + (c.account.phone ? ' · ' + c.account.phone : '')], ['권한', c.account.roleLabel + ' (' + c.account.role + ')'],
        ['모바일 메뉴 권한', (c.mobileMenus.join(', ') || '없음') + ' · ' + c.menuSource + ' 기준'], ['초기 비밀번호', '임시 비밀번호 메일 발송 · 첫 로그인 때 변경']
      ].map(function (x) { return '<dt>' + e(x[0]) + '</dt><dd>' + e(x[1]) + '</dd>'; }).join('') + '</dl>' });
    }

    render();
  });
}());
