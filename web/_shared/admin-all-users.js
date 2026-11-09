/* 현황관리 > 전체 사용자 (Admin preview).
   업체 구분 없이 전체 계정의 잠금·휴면 현황을 보고 보안 조치를 처리한다.
   휴면은 두 가지다: 1년 미접속이면 시스템이 자동 전환(자동 휴면), 운영자가 직접 로그인을 막으면 수동 휴면.
   사용자 기본 정보는 admin-authority-seed.js(관리 화면 사용자 예시)를 그대로 쓰고, 보안 상태와 추가 예시 계정만 이 파일에 둔다.
   처리 결과는 브라우저 저장소(admin-all-users.v1)에만 남는다. 실제 계정·메일·서버에는 반영되지 않는다.
   임시 비밀번호는 저장하지 않고 발급 직후 한 번만 화면에 보여 준다. */
(function () {
  'use strict';
  var O = window.MIQOps, seed = window.MIQAdminAuthoritySeed;
  if (!O || !seed) return;

  // ---------- 정책 기준 (화면 하단 안내와 같은 값) ----------
  var BASE = '2026-11-09';          // 목업 기준일: 미접속 일수·비밀번호 만료 계산 기준
  var LOCK_FAILS = 5;               // 비밀번호 연속 실패 시 잠금
  var INACTIVE_DAYS = 365;          // 1년 미접속
  var PW_CYCLE = 90;                // 비밀번호 변경 주기
  var PW_SOON = 14;                 // 만료 임박 표시
  var EXTEND_OPTIONS = ['30', '60', '90'];
  var ACTOR = '어드민 (시연)';
  var storageKey = 'admin-all-users.v2';   // v2: 1년 미접속 자동 휴면
  var ROLES = ['내부 사용자', '딜러 대표', '딜러 직원', '고객 대표', '고객 직원'];

  // 기존 사용자 예시(10명)에 붙이는 보안 상태
  var SECURITY = {
    'admin@sejonglog.co.kr': { pwChangedAt: '2026-09-01' },
    'cs.lee@sejonglog.co.kr': { pwChangedAt: '2026-08-14' },
    'dealer.park@sejonglog.co.kr': { pwChangedAt: '2026-10-02' },
    'dealer.choi@sejonglog.co.kr': { pwChangedAt: '2026-07-20', locked: true, failCount: 5, lockedAt: '2026-11-08 16:42' },
    'staff.jung@sejonglog.co.kr': { pwChangedAt: '2026-04-27' },
    'staff.kang@sejonglog.co.kr': { pwChangedAt: '2026-09-15' },
    'leader.yoon@customer.co.kr': { pwChangedAt: '2026-03-11' },
    'leader.shin@customer.co.kr': { pwChangedAt: '2026-08-30' },
    'user.oh@customer.co.kr': { pwChangedAt: '2026-02-18' },
    'user.lim@customer.co.kr': { pwChangedAt: '2026-10-11' }
  };
  // 보안 조치 케이스를 보여 주기 위한 추가 예시 계정 (같은 업체명 사용)
  var EXTRA = [
    ['kim.hj@sejonglog.co.kr', '김현주', '내부 사용자', '(주)세종물류중부지점', '2023-02-14 10:20', '2025-08-21 18:02', { pwChangedAt: '2025-06-30' }],
    ['ops.han@sejonglog.co.kr', '한지민', '내부 사용자', '(주)세종물류중부지점', '2024-09-02 09:00', '2026-11-08 09:12', { pwChangedAt: '2026-09-28', locked: true, failCount: 5, lockedAt: '2026-11-09 08:41' }],
    ['staff.seo@sejonglog.co.kr', '서민호', '딜러 직원', '세종모터스', '2024-04-18 14:10', '2025-06-30 11:25', { pwChangedAt: '2025-05-02' }],
    ['staff.moon@sejonglog.co.kr', '문가영', '딜러 직원', '한빛상사', '2025-03-10 09:40', '2026-11-01 13:05', { pwChangedAt: '2026-08-05', locked: true, failCount: 5, lockedAt: '2026-11-07 17:20' }],
    ['staff.bae@sejonglog.co.kr', '배준호', '딜러 직원', '세종모터스', '2023-11-06 10:00', '2026-08-11 15:47', { pwChangedAt: '2026-06-20', dormant: true, dormantAt: '2026-10-15 10:14:00', dormantBy: '운영자 김정수', dormantReason: '딜러 요청: 퇴사 예정자 로그인 차단' }],
    ['leader.kwon@customer.co.kr', '권나래', '고객 대표', '나래로지스', '2025-05-12 13:30', '', { pwChangedAt: '2025-05-12' }],
    ['user.jang@customer.co.kr', '장우진', '고객 직원', '(주)세종물류중부지점', '2024-08-01 08:50', '2025-10-02 09:31', { pwChangedAt: '2025-07-15', locked: true, failCount: 5, lockedAt: '2026-11-05 10:03' }],
    ['user.song@customer.co.kr', '송다은', '고객 직원', '동욱운수', '2024-06-11 11:00', '2024-12-19 17:22', { pwChangedAt: '2024-10-01' }],
    ['user.ryu@customer.co.kr', '류성민', '고객 직원', '동욱운수', '2023-09-19 16:20', '2024-11-20 08:15', { pwChangedAt: '2024-08-08' }],
    ['user.ahn@customer.co.kr', '안소희', '고객 직원', '(주)세종물류중부지점', '2025-07-07 10:45', '2026-11-06 14:12', { pwChangedAt: '2026-08-20' }],
    ['user.go@customer.co.kr', '고은비', '고객 직원', '동욱운수', '2025-02-24 09:15', '2026-10-30 16:40', { pwChangedAt: '2026-07-01' }],
    ['user.nam@customer.co.kr', '남기훈', '고객 직원', '나래로지스', '2026-10-20 15:05', '', { pwChangedAt: '2026-10-20' }],
    ['user.yoo@customer.co.kr', '유채원', '고객 직원', '동욱운수', '2024-03-04 13:10', '2025-06-01 10:02', { pwChangedAt: '2025-03-01' }],
    ['leader.baek@customer.co.kr', '백승호', '고객 대표', '백상운수', '2024-10-28 09:30', '2025-11-03 08:44', { pwChangedAt: '2025-09-01' }]
  ];

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function e(v) { return O.esc(v == null ? '' : v); }
  function norm(v) { return String(v || '').replace(/\s/g, '').toLocaleLowerCase(); }
  function seedData() {
    var users = clone(seed.users).map(function (u) {
      return Object.assign({ id: u.email, email: u.email, name: u.name, role: u.role, company: u.company, created: u.created, lastLogin: u.lastLogin || '',
        locked: false, failCount: 0, lockedAt: '', dormant: false, dormantAt: '', dormantBy: '', dormantReason: '', releasedAt: '', mustChange: false, pwExpireOverride: '' }, SECURITY[u.email] || {});
    });
    EXTRA.forEach(function (x) {
      users.push(Object.assign({ id: x[0], email: x[0], name: x[1], role: x[2], company: x[3], created: x[4], lastLogin: x[5],
        locked: false, failCount: 0, lockedAt: '', dormant: false, dormantAt: '', dormantBy: '', dormantReason: '', releasedAt: '', mustChange: false, pwExpireOverride: '' }, x[6]));
    });
    var logs = [];
    users.filter(function (u) { return u.dormant; }).forEach(function (u) {
      logs.push({ id: 'seed-' + u.id, at: u.dormantAt, action: '휴면 처리', users: [{ id: u.id, name: u.name }], by: u.dormantBy, reason: u.dormantReason, detail: '수동 휴면 · 로그인 차단' });
    });
    // 자동 휴면 전환은 시스템 배치(매일 02:00)가 처리한 것으로 기록
    users.filter(autoDormant).forEach(function (u) {
      logs.push({ id: 'seed-auto-' + u.id, at: autoDate(u) + ' 02:00:00', action: '자동 휴면 전환', users: [{ id: u.id, name: u.name }], by: '시스템', reason: '1년 미접속 (' + INACTIVE_DAYS + '일)', detail: '자동 휴면 · 로그인 차단' });
    });
    return { users: users, logs: logs };
  }

  // ---------- 날짜 계산 ----------
  function dayMs(d) { return Date.parse(String(d).slice(0, 10) + 'T00:00:00Z'); }
  function daysSince(d) { return Math.floor((dayMs(BASE) - dayMs(d)) / 86400000); }
  function addDays(d, n) { var t = new Date(dayMs(d) + n * 86400000); return t.toISOString().slice(0, 10); }
  function now() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 19).replace('T', ' '); }
  // 미접속 기준일: 마지막 로그인 → 없으면 계정 생성일. 휴면 해제 이후는 해제일부터 다시 계산
  function idleFrom(u) {
    var from = u.lastLogin || u.created;
    if (u.releasedAt && u.releasedAt > from) from = u.releasedAt;
    return from;
  }
  function idleDays(u) { return daysSince(idleFrom(u)); }
  // 1년 미접속이면 시스템이 자동으로 휴면 전환한다 (수동 휴면이 아닌 계정만)
  function autoDormant(u) { return !u.dormant && idleDays(u) >= INACTIVE_DAYS; }
  function autoDate(u) { return addDays(idleFrom(u), INACTIVE_DAYS); }
  function isDormant(u) { return u.dormant || autoDormant(u); }
  function pwExpire(u) { return u.mustChange ? '' : (u.pwExpireOverride || addDays(u.pwChangedAt || u.created, PW_CYCLE)); }
  function status(u) { return isDormant(u) ? '휴면' : u.locked ? '잠금' : '정상'; }

  // ---------- 처리 종류 ----------
  var ACTIONS = {
    unlock: { label: '잠금 해제', can: function (u) { return u.locked && !isDormant(u); }, why: '잠금 상태인 계정만 해제할 수 있습니다.' },
    temp: { label: '임시 비밀번호 발급', can: function (u) { return !isDormant(u); }, why: '휴면 계정은 휴면 해제 후 발급할 수 있습니다.' },
    extend: { label: '비밀번호 기한 연기', can: function (u) { return !isDormant(u) && !u.mustChange; }, why: '휴면 계정이거나 다음 로그인 때 비밀번호를 바꿔야 하는 계정은 연기할 수 없습니다.' },
    dormant: { label: '휴면 처리', can: function (u) { return !isDormant(u); }, why: '이미 휴면 상태인 계정입니다.' },
    release: { label: '휴면 해제', can: function (u) { return isDormant(u); }, why: '휴면 상태인 계정만 해제할 수 있습니다.' }
  };

  O.register('admin-all-users', function (ctx) {
    var data = O.read(storageKey, seedData());
    var tab = 'all', filters = { role: '', company: '', q: '' };
    var tabs = [['all', '전체 사용자'], ['locked', '잠금 계정'], ['inactive', '자동 휴면 (1년 미접속)'], ['dormant', '수동 휴면'], ['logs', '처리 이력']];
    function save() { O.write(storageKey, data); }
    function find(id) { return data.users.find(function (u) { return u.id === id; }); }
    function inTab(u, key) { return key === 'locked' ? (u.locked && !isDormant(u)) : key === 'inactive' ? autoDormant(u) : key === 'dormant' ? u.dormant : true; }
    function companies() { return data.users.map(function (u) { return u.company; }).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).sort(function (a, b) { return a.localeCompare(b, 'ko'); }); }
    function opts(items, value, all) { return '<option value="">' + e(all) + '</option>' + items.map(function (x) { return '<option value="' + e(x) + '"' + (x === value ? ' selected' : '') + '>' + e(x) + '</option>'; }).join(''); }
    function field(label, control, full) { return '<label class="ops-field' + (full ? ' ops-field--full col-2' : '') + '"><span>' + e(label) + '</span>' + control + '</label>'; }
    function badge(u) { var s = status(u); return '<span class="badge ' + (s === '정상' ? 'ok' : s === '잠금' ? 'bad' : 'gray') + '">' + s + '</span>'; }

    function render() {
      ctx.el.innerHTML = '<div class="tabs" role="tablist" aria-label="전체 사용자">' + tabs.map(function (t) {
        return '<button type="button" role="tab" id="aauTab-' + t[0] + '" data-aau-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '" aria-controls="aauPane" tabindex="' + (tab === t[0] ? 0 : -1) + '"' + (tab === t[0] ? ' class="active"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div><section id="aauPane" role="tabpanel" aria-labelledby="aauTab-' + tab + '"><div data-aau-filters></div><div data-aau-table></div></section>';
      var tabButtons = ctx.el.querySelectorAll('[data-aau-tab]');
      tabButtons.forEach(function (b, i) {
        b.addEventListener('click', function () { if (tab !== b.dataset.aauTab) { tab = b.dataset.aauTab; render(); ctx.el.querySelector('[data-aau-tab="' + tab + '"]').focus(); } });
        b.addEventListener('keydown', function (ev) {
          if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(ev.key) < 0) return;
          ev.preventDefault();
          var n = ev.key === 'Home' ? 0 : ev.key === 'End' ? tabs.length - 1 : (i + (ev.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          tabButtons[n].click();
        });
      });
      if (tab === 'logs') renderLogs(); else renderUsers();
    }

    function filterForm(withSelects) {
      var area = ctx.el.querySelector('[data-aau-filters]');
      area.innerHTML = '<form class="ops-filters" aria-label="' + (tab === 'logs' ? '처리 이력' : '사용자') + ' 조회">' +
        (withSelects ? field('권한', '<select class="inp" name="role">' + opts(ROLES, filters.role, '전체') + '</select>') + field('업체', '<select class="inp" name="company">' + opts(companies(), filters.company, '전체') + '</select>') : '') +
        field('검색', '<input class="inp" type="search" name="q" maxlength="100" value="' + e(filters.q) + '" placeholder="' + (tab === 'logs' ? '사용자 ID·이름·처리자' : '사용자 ID·이름') + '">') +
        '<button type="submit" class="btn-search">조회</button></form>';
      area.querySelector('form').addEventListener('submit', function (ev) {
        ev.preventDefault(); var fd = new FormData(ev.currentTarget);
        filters.role = String(fd.get('role') || ''); filters.company = String(fd.get('company') || ''); filters.q = String(fd.get('q') || '').trim();
        tab === 'logs' ? renderLogs() : renderUsers();
      });
    }

    function rows() {
      var q = norm(filters.q);
      return data.users.filter(function (u) {
        return inTab(u, tab) && (!filters.role || u.role === filters.role) && (!filters.company || u.company === filters.company) && (!q || norm(u.email).indexOf(q) >= 0 || norm(u.name).indexOf(q) >= 0);
      }).map(function (u) { return Object.assign({}, u, { status: status(u), idle: idleDays(u), pwExpire: pwExpire(u), autoAt: autoDormant(u) ? autoDate(u) : '' }); });
    }

    function renderUsers() {
      filterForm(true);
      var list = rows();
      var columns = [
        { key: 'email', label: '사용자 ID(이메일)', minWidth: 210 },
        { key: 'name', label: '사용자명', minWidth: 80 },
        { key: 'role', label: '권한', minWidth: 96 },
        { key: 'company', label: '업체명', minWidth: 120 },
        { key: 'status', label: '계정 상태', minWidth: 80, render: badge },
        { key: 'lastLogin', label: '마지막 로그인', minWidth: 128, render: function (r) { return r.lastLogin ? e(r.lastLogin) : '<span class="aau-muted">로그인 이력 없음</span>'; }, exportValue: function (r) { return r.lastLogin || '로그인 이력 없음'; } },
        { key: 'idle', label: '미접속', className: 'c', minWidth: 72, sortValue: function (r) { return r.idle; }, render: function (r) { return '<span class="' + (r.idle >= INACTIVE_DAYS ? 'aau-risk' : '') + '">' + r.idle + '일</span>'; }, exportValue: function (r) { return r.idle; } }
      ];
      // 탭마다 모든 행이 같은 값인 칸은 빼고, 그 탭에 필요한 칸을 붙인다 (1440px에서 가로 스크롤 없이)
      if (tab === 'locked') columns = columns.filter(function (c) { return c.key !== 'status'; }).concat([{ key: 'lockedAt', label: '잠금 일시', minWidth: 128 }, { key: 'failCount', label: '실패 횟수', className: 'c', minWidth: 72, render: function (r) { return e(r.failCount) + '회'; } }]);
      else if (tab === 'dormant') columns = columns.filter(function (c) { return ['status', 'idle', 'role'].indexOf(c.key) < 0; }).concat([{ key: 'dormantAt', label: '휴면 처리일시', minWidth: 128 }, { key: 'dormantBy', label: '처리자', minWidth: 90 }, { key: 'dormantReason', label: '사유', minWidth: 150 }]);
      else if (tab === 'inactive') columns = columns.filter(function (c) { return c.key !== 'status'; }).concat([{ key: 'autoAt', label: '휴면 전환일', minWidth: 100 }]);
      else columns.push({ key: 'pwExpire', label: '비밀번호 만료일', minWidth: 130, sortValue: function (r) { return r.pwExpire || '0'; }, render: pwCell, exportValue: function (r) { return r.mustChange ? '다음 로그인 시 변경' : r.pwExpire; } });
      columns.push({ key: 'detail', label: '관리', sortable: false, export: false, render: function () { return '<button type="button" class="btn btn--sm" data-action="detail">상세</button>'; } });

      // 처리(잠금 해제·임시 비밀번호·기한 연기·휴면 처리/해제)는 목록이 아니라 [상세]에서만 한다
      var toolbar = (tab === 'inactive' ? '<button type="button" class="btn" data-aau-review>엑셀 다운로드</button>' : '');
      var host = ctx.el.querySelector('[data-aau-table]');
      O.grid(host, {
        rows: list, columns: columns, pageSize: 15, toolbar: toolbar, export: tab !== 'inactive',
        caption: tabs.find(function (t) { return t[0] === tab; })[1] + ' 목록', exportName: '전체사용자_' + tabs.find(function (t) { return t[0] === tab; })[1].replace(/[\s()]/g, '') + '_' + BASE.replace(/-/g, ''),
        defaultSort: tab === 'inactive' ? { key: 'autoAt', dir: 'desc' } : tab === 'locked' ? { key: 'lockedAt', dir: 'desc' } : tab === 'dormant' ? { key: 'dormantAt', dir: 'desc' } : { key: 'email', dir: 'asc' },
        emptyText: { all: '조회 조건에 해당하는 사용자가 없습니다.', locked: '잠금 상태인 계정이 없습니다.', inactive: '자동 휴면(1년 미접속) 계정이 없습니다.', dormant: '수동 휴면 계정이 없습니다.' }[tab],
        onAction: function (action, row) { if (action === 'detail' && row) detail(row.id); }
      });
      var review = host.querySelector('[data-aau-review]'); if (review) review.addEventListener('click', function () { exportReview(list); });
    }
    function pwCell(r) {
      if (r.mustChange) return '<span class="aau-muted">다음 로그인 시 변경</span>';
      var left = -daysSince(r.pwExpire);
      return e(r.pwExpire) + (left < 0 ? ' <span class="badge warn">만료</span>' : left <= PW_SOON ? ' <span class="badge pri">D-' + left + '</span>' : '');
    }

    // 자동 휴면(1년 미접속) 정기 검토용 다운로드: 검토 결과 칸을 비워 두고, 다운로드 자체를 처리 이력에 남긴다
    function exportReview(list) {
      if (!list.length) { O.notify('다운로드할 계정이 없습니다.'); return; }
      O.exportCsv('자동휴면_1년미접속_정기검토_' + BASE.replace(/-/g, ''),
        ['사용자 ID(이메일)', '사용자명', '권한', '업체명', '계정 상태', '마지막 로그인', '미접속 일수', '휴면 전환일', '계정 생성일', '검토 결과(휴면 유지/계정 삭제)', '검토자', '검토일'],
        list.slice().sort(function (a, b) { return b.idle - a.idle; }).map(function (r) { return [r.email, r.name, r.role, r.company, r.status, r.lastLogin || '로그인 이력 없음', r.idle, r.autoAt, String(r.created).slice(0, 10), '', '', '']; }));
      data.logs.push({ id: 'log-' + Date.now(), at: now(), action: '자동 휴면(1년 미접속) 목록 다운로드', users: list.map(function (r) { return { id: r.id, name: r.name }; }), by: ACTOR, reason: '보안 감사 정기 검토', detail: list.length + '명' });
      save(); render();
    }

    // ---------- 상세 ----------
    function detail(id) {
      var u = find(id); if (!u) return;
      var items = [['사용자 ID(이메일)', u.email], ['사용자명', u.name], ['권한', u.role], ['업체명', u.company], ['계정 상태', status(u)],
        ['마지막 로그인', u.lastLogin || '로그인 이력 없음'], ['미접속', idleDays(u) + '일 (' + idleFrom(u).slice(0, 10) + ' 기준)'], ['계정 생성일', u.created],
        ['비밀번호 만료일', u.mustChange ? '다음 로그인 시 변경' : pwExpire(u)]];
      if (u.locked) items.push(['잠금', u.lockedAt + ' · 연속 실패 ' + u.failCount + '회']);
      if (u.dormant) items.push(['휴면', '수동 · ' + u.dormantAt + ' · ' + u.dormantBy + ' · ' + u.dormantReason]);
      else if (autoDormant(u)) items.push(['휴면', '자동 · ' + autoDate(u) + ' 전환 · 1년 미접속']);
      var hist = data.logs.filter(function (l) { return l.users.some(function (x) { return x.id === u.id; }); }).slice(-5).reverse();
      var body = '<dl class="ops-dl">' + items.map(function (x) { return '<dt>' + e(x[0]) + '</dt><dd>' + e(x[1]) + '</dd>'; }).join('') + '</dl>' +
        '<div class="ops-inline-actions aau-detail-actions">' + Object.keys(ACTIONS).filter(function (k) { return ACTIONS[k].can(u); }).map(function (k) { return '<button type="button" class="btn btn--sm" data-aau-detail-act="' + k + '">' + ACTIONS[k].label + '</button>'; }).join('') + '</div>' +
        '<h3 class="aau-subtitle">최근 처리 이력</h3>' + (hist.length ? '<ul class="aau-history">' + hist.map(function (l) { return '<li><b>' + e(l.action) + '</b> · ' + e(l.at) + ' · ' + e(l.by) + (l.reason ? ' · ' + e(l.reason) : '') + '</li>'; }).join('') + '</ul>' : '<p class="ops-inline-message">처리 이력이 없습니다.</p>');
      O.modal({ title: '사용자 상세', body: body, wide: true, submitLabel: '닫기', onOpen: function (form, close) {
        form.querySelectorAll('[data-aau-detail-act]').forEach(function (b) { b.addEventListener('click', function () { close(); openAction(b.dataset.aauDetailAct, [u.id]); }); });
      } });
    }

    // ---------- 처리 ----------
    function openAction(kind, ids) {
      var a = ACTIONS[kind], users = ids.map(find).filter(Boolean);
      if (!users.length) { O.notify('사용자를 찾지 못했습니다. 목록을 다시 조회해 주세요.'); return; }
      var ok = users.filter(a.can), skip = users.filter(function (u) { return !a.can(u); });
      if (!ok.length) { O.notify(a.why); return; }
      var names = function (list) { return list.map(function (u) { return e(u.name) + ' <span class="aau-muted">' + e(u.email) + '</span>'; }).join('<br>'); };
      var notes = {
        unlock: '연속 실패 횟수를 0으로 되돌리고 로그인을 다시 허용합니다. 비밀번호는 바뀌지 않습니다.',
        temp: '임시 비밀번호를 만들어 이 화면에 한 번만 보여 주고, 사용자 이메일로도 자동 발송합니다. 잠금 상태면 함께 해제되고, 사용자는 다음 로그인 때 비밀번호를 바꿔야 합니다.',
        extend: '비밀번호 만료일을 늦춥니다. 이미 만료된 계정은 기준일(' + BASE + ')부터 연기합니다.',
        dormant: '운영자가 직접 로그인을 차단합니다(수동 휴면). 1년 미접속 계정은 시스템이 자동으로 휴면 전환하므로 따로 처리하지 않아도 됩니다. 데이터는 삭제되지 않으며, 본인 요청이 있으면 운영자가 해제할 수 있습니다.',
        release: '본인 요청을 확인한 경우에만 해제합니다. 해제하면 로그인이 다시 가능하고, 미접속 일수는 해제일부터 다시 계산합니다.'
      };
      var extra = '';
      if (kind === 'extend') extra = field('연기 기간', '<select class="inp" name="days">' + EXTEND_OPTIONS.map(function (d) { return '<option value="' + d + '"' + (d === '90' ? ' selected' : '') + '>' + d + '일</option>'; }).join('') + '</select>');
      if (kind === 'release') extra = field('본인 확인 방법', '<select class="inp" name="verify" required><option value="">선택해 주세요</option><option>전화</option><option>이메일</option><option>방문</option></select>') +
        '<label class="aau-check"><input type="checkbox" name="confirmed" required> 본인이 직접 해제를 요청한 것을 확인했습니다.</label>';
      var body = '<p class="ops-inline-message">' + e(notes[kind]) + '</p>' +
        '<dl class="ops-dl"><dt>대상 ' + ok.length + '명</dt><dd>' + names(ok) + '</dd>' + (skip.length ? '<dt>제외 ' + skip.length + '명</dt><dd>' + names(skip) + '<br><span class="aau-muted">' + e(a.why) + '</span></dd>' : '') + '</dl>' +
        '<div class="aau-form">' + extra + field('처리 사유 (처리 이력에 남습니다)', '<textarea class="inp" name="reason" rows="3" maxlength="200" required placeholder="예) 본인 전화 요청으로 잠금 해제"></textarea>', true) + '</div>';
      O.modal({ title: a.label, body: body, wide: true, submitLabel: a.label, onSubmit: function (form, close) {
        var fd = new FormData(form), reason = String(fd.get('reason') || '').trim();
        if (!reason) throw new Error('처리 사유를 입력해 주세요.');
        data = O.read(storageKey, data);   // 다른 탭에서 바뀐 상태 반영
        var targets = ok.map(function (u) { return find(u.id); }).filter(function (u) { return u && a.can(u); });
        if (!targets.length) throw new Error('처리할 수 있는 계정이 없습니다. 목록을 다시 확인해 주세요.');
        var at = now(), detailText = '', issued = [];
        targets.forEach(function (u) {
          if (kind === 'unlock') { u.locked = false; u.failCount = 0; u.lockedAt = ''; detailText = '연속 실패 횟수 초기화'; }
          if (kind === 'temp') { u.locked = false; u.failCount = 0; u.lockedAt = ''; u.mustChange = true; u.pwExpireOverride = ''; issued.push({ user: u, pw: tempPassword() }); detailText = '임시 비밀번호 발급 · 메일 발송 · 다음 로그인 시 변경'; }
          if (kind === 'extend') { var days = Number(fd.get('days')) || 90, cur = pwExpire(u), from = cur && cur > BASE ? cur : BASE; u.pwExpireOverride = addDays(from, days); detailText = days + '일 연기'; }
          if (kind === 'dormant') { u.dormant = true; u.dormantAt = at; u.dormantBy = ACTOR; u.dormantReason = reason; detailText = '수동 휴면 · 로그인 차단'; }
          if (kind === 'release') { var wasManual = u.dormant; u.dormant = false; u.releasedAt = at.slice(0, 10); u.dormantAt = ''; u.dormantBy = ''; u.dormantReason = ''; detailText = (wasManual ? '수동' : '자동') + ' 휴면 해제 · 본인 확인: ' + fd.get('verify'); }
        });
        data.logs.push({ id: 'log-' + Date.now(), at: at, action: a.label, users: targets.map(function (u) { return { id: u.id, name: u.name }; }), by: ACTOR, reason: reason, detail: detailText });
        save(); close(); render();
        if (kind === 'temp') showPasswords(issued);
        else O.notify(a.label + ' ' + targets.length + '명을 처리했습니다.');
      } });
    }
    function tempPassword() {
      var sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnpqrstuvwxyz', '23456789', '!@#$%*'], all = sets.join(''), out = [];
      var buf = new Uint32Array(12); (window.crypto || window.msCrypto).getRandomValues(buf);
      for (var i = 0; i < 12; i++) out.push((i < 4 ? sets[i] : all).charAt(buf[i] % (i < 4 ? sets[i] : all).length));
      for (var j = out.length - 1; j > 0; j--) { var k = buf[j] % (j + 1), t = out[j]; out[j] = out[k]; out[k] = t; }
      return out.join('');
    }
    // 임시 비밀번호는 저장하지 않는다. 이 창을 닫으면 다시 볼 수 없다
    function showPasswords(list) {
      O.modal({ title: '임시 비밀번호 발급 결과', wide: true, submitLabel: '닫기',
        body: '<p class="ops-inline-message aau-warn">이 창을 닫으면 임시 비밀번호를 다시 볼 수 없습니다. 사용자 이메일로도 발송했습니다(시연: 실제 발송 없음).</p>' +
          '<table class="tbl aau-pw-table"><thead><tr><th scope="col">사용자</th><th scope="col">사용자 ID(이메일)</th><th scope="col">임시 비밀번호</th><th scope="col">메일 발송</th></tr></thead><tbody>' +
          list.map(function (x) { return '<tr><td>' + e(x.user.name) + '</td><td>' + e(x.user.email) + '</td><td><code class="aau-pw">' + e(x.pw) + '</code> <button type="button" class="btn btn--sm" data-aau-copy="' + e(x.pw) + '">복사</button></td><td><span class="badge ok">발송 완료</span></td></tr>'; }).join('') + '</tbody></table>',
        onOpen: function (form) {
          form.addEventListener('click', function (ev) {
            var b = ev.target.closest('[data-aau-copy]'); if (!b) return;
            var text = b.dataset.aauCopy;
            (navigator.clipboard && window.isSecureContext ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { O.notify('임시 비밀번호를 복사했습니다.'); }).catch(function () { O.notify('복사하지 못했습니다. 직접 선택해 복사해 주세요.'); });
          });
        } });
    }

    // ---------- 처리 이력 ----------
    function renderLogs() {
      filterForm(false);
      var q = norm(filters.q);
      var list = data.logs.filter(function (l) { return !q || norm(l.by).indexOf(q) >= 0 || l.users.some(function (x) { return norm(x.id).indexOf(q) >= 0 || norm(x.name).indexOf(q) >= 0; }); })
        .map(function (l) { return Object.assign({}, l, { target: l.users.length === 1 ? l.users[0].name + ' (' + l.users[0].id + ')' : l.users[0].name + ' 외 ' + (l.users.length - 1) + '명' }); });
      O.grid(ctx.el.querySelector('[data-aau-table]'), {
        rows: list, pageSize: 15, caption: '처리 이력', exportName: '전체사용자_처리이력_' + BASE.replace(/-/g, ''), defaultSort: { key: 'at', dir: 'desc' },
        toolbar: '<button type="button" class="btn" data-aau-reset>시연 데이터 초기화</button>',
        emptyText: '처리 이력이 없습니다.',
        columns: [
          { key: 'at', label: '처리 일시', minWidth: 140 },
          { key: 'action', label: '처리', minWidth: 130 },
          { key: 'target', label: '대상', minWidth: 200, render: function (r) { return '<span title="' + e(r.users.map(function (x) { return x.name + ' ' + x.id; }).join(', ')) + '">' + e(r.target) + '</span>'; }, exportValue: function (r) { return r.users.map(function (x) { return x.name + ' ' + x.id; }).join(', '); } },
          { key: 'by', label: '처리자', minWidth: 100 },
          { key: 'reason', label: '사유', minWidth: 200 },
          { key: 'note', label: '내용', minWidth: 160, render: function (r) { return e(r.detail || '—'); }, exportValue: function (r) { return r.detail; } }
        ]
      });
      ctx.el.querySelector('[data-aau-reset]').addEventListener('click', function () {
        O.confirm({ title: '시연 데이터 초기화', body: '<p>이 브라우저에 저장된 전체 사용자 처리 결과와 처리 이력을 지우고 처음 예시 상태로 되돌립니다.</p>', submitLabel: '초기화', onConfirm: function () { data = seedData(); save(); tab = 'all'; render(); O.notify('처음 예시 상태로 되돌렸습니다.'); } });
      });
    }

    render();
  });
}());
