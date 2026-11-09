/* 운영관리 > 차량 소속 관리 (Admin preview).
   차량의 업체·그룹·딜러를 여러 대 한 번에 이관한다: 대상 선택 → 받을 소속 선택 → 사전 점검 → 실행(이력 기록) → 이력 조회.
   차량·업체·그룹은 fleet master(fleet.generated.js), 딜러는 관리 화면 사용자 예시(admin-authority-seed.js)를 그대로 쓴다.
   업체·그룹·딜러의 사용 여부와 추가 이관 대상 업체 3곳은 사전 점검 케이스를 보여 주기 위한 이 화면 전용 예시다.
   결과는 브라우저 저장소(vehicle-affiliation.v1)에만 남는다. 실제 차량 테이블·SAP·EAI에는 반영되지 않는다. */
(function () {
  'use strict';
  var O = window.MIQOps, fleet = window.MIQ_MOCK_DATA && window.MIQ_MOCK_DATA.fleet, seed = window.MIQAdminAuthoritySeed;
  if (!O || !fleet) return;

  var storageKey = 'vehicle-affiliation.v1';
  var MAX_VEHICLES = 200;
  var ACTOR = '어드민 (시연)';

  // ---------- 기준 데이터 ----------
  // 이관받을 수 있는 업체: 차량이 있는 업체 + 차량 없는 예시 업체 3곳 (그중 1곳은 사용 중지)
  var EXTRA_COMPANIES = { 'demo-company-006': true, 'demo-company-007': true, 'demo-company-013': false };
  // 업체별 담당 딜러 (딜러 대표 계정의 업체명)
  var DEALER_OF = { '1933': '세종모터스', '12894': '세종모터스', '33767': '한빛상사', '364': '한빛상사', '3703': '한빛상사',
    'demo-company-006': '세종모터스', 'demo-company-007': '한빛상사', 'demo-company-013': '경남지게차서비스' };
  // 그룹 사용 여부 예시: 사용 안 함 그룹에 넣으면 고객·딜러 화면에서 차량이 보이지 않는다
  var EXTRA_GROUPS = [['12894', '물류3팀', false], ['1933', '임시보관', false], ['demo-company-006', '기본그룹', true], ['demo-company-006', '물류1팀', true], ['demo-company-007', '기본그룹', true], ['demo-company-013', '기본그룹', true]];

  function clone(v) { return JSON.parse(JSON.stringify(v)); }
  function e(v) { return O.esc(v == null ? '' : v); }
  function norm(v) { return String(v || '').replace(/\s/g, '').toUpperCase(); }
  function now() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 19).replace('T', ' '); }

  function master() {
    var used = {};
    fleet.vehicles.forEach(function (v) { used[v.companyId] = true; });
    var companies = fleet.dashboardCompanies.filter(function (c) { return used[c.companyId] || EXTRA_COMPANIES.hasOwnProperty(c.companyId); })
      .map(function (c) { return { id: String(c.companyId), name: c.companyName, active: used[c.companyId] ? true : EXTRA_COMPANIES[c.companyId] }; });
    var groups = [];
    fleet.vehicles.forEach(function (v) { if (!groups.some(function (g) { return g.companyId === v.companyId && g.name === v.group; })) groups.push({ companyId: String(v.companyId), name: v.group || '기본그룹', active: true }); });
    EXTRA_GROUPS.forEach(function (x) { if (!groups.some(function (g) { return g.companyId === x[0] && g.name === x[1]; })) groups.push({ companyId: x[0], name: x[1], active: x[2] }); });
    var dealers = (seed ? seed.users : []).filter(function (u) { return u.role === '딜러 대표'; }).map(function (u) { return { name: u.company, owner: u.name, active: true }; });
    dealers.push({ name: '경남지게차서비스', owner: '-', active: false });
    return { companies: companies, groups: groups, dealers: dealers };
  }
  var M = master();
  function seedData() {
    return {
      vehicles: fleet.vehicles.map(function (v) { return { vin: v.vin, model: v.model, type: v.type, companyId: String(v.companyId), group: v.group || '기본그룹', dealer: DEALER_OF[v.companyId] || '' }; }),
      history: []
    };
  }
  function company(id) { return M.companies.find(function (c) { return c.id === id; }); }
  function companyName(id) { var c = company(id); return c ? c.name : '(없는 업체 ' + id + ')'; }
  function group(companyId, name) { return M.groups.find(function (g) { return g.companyId === companyId && g.name === name; }); }
  function dealer(name) { return M.dealers.find(function (d) { return d.name === name; }); }
  function where(v) { return companyName(v.companyId) + ' / ' + v.group + ' / ' + (v.dealer || '딜러 없음'); }

  O.register('affiliation', function (ctx) {
    var data = O.read(storageKey, seedData());
    var tab = 'transfer';
    var draft = { vins: '', companyId: '', group: '', dealer: '' }, checked = null;   // checked: 사전 점검 결과
    var listFilter = { companyId: '', q: '' }, histQ = '', picked = new Set();
    var tabs = [['transfer', '이관 실행'], ['vehicles', '차량 소속 현황'], ['history', '이관 이력']];
    function save() { O.write(storageKey, data); }
    function findVehicle(vin) { return data.vehicles.find(function (v) { return norm(v.vin) === norm(vin); }); }
    function field(label, control, full) { return '<label class="ops-field' + (full ? ' ops-field--full col-2' : '') + '"><span>' + e(label) + '</span>' + control + '</label>'; }
    function opts(items, value, all) { return (all != null ? '<option value="">' + e(all) + '</option>' : '') + items.map(function (x) { return '<option value="' + e(x[0]) + '"' + (String(x[0]) === String(value) ? ' selected' : '') + '>' + e(x[1]) + '</option>'; }).join(''); }

    function render() {
      ctx.el.innerHTML = '<div class="tabs" role="tablist" aria-label="차량 소속 관리">' + tabs.map(function (t) {
        return '<button type="button" role="tab" id="vafTab-' + t[0] + '" data-vaf-tab="' + t[0] + '" aria-selected="' + (tab === t[0]) + '" aria-controls="vafPane" tabindex="' + (tab === t[0] ? 0 : -1) + '"' + (tab === t[0] ? ' class="active"' : '') + '>' + t[1] + '</button>';
      }).join('') + '</div><section id="vafPane" role="tabpanel" aria-labelledby="vafTab-' + tab + '"></section>';
      var buttons = ctx.el.querySelectorAll('[data-vaf-tab]');
      buttons.forEach(function (b, i) {
        b.addEventListener('click', function () { if (tab !== b.dataset.vafTab) { tab = b.dataset.vafTab; render(); ctx.el.querySelector('[data-vaf-tab="' + tab + '"]').focus(); } });
        b.addEventListener('keydown', function (ev) {
          if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].indexOf(ev.key) < 0) return; ev.preventDefault();
          buttons[ev.key === 'Home' ? 0 : ev.key === 'End' ? buttons.length - 1 : (i + (ev.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length].click();
        });
      });
      var pane = ctx.el.querySelector('#vafPane');
      if (tab === 'transfer') renderTransfer(pane); else if (tab === 'vehicles') renderVehicles(pane); else renderHistory(pane);
    }

    // ---------- ① 대상 + ② 받을 소속 + ③ 사전 점검 ----------
    function renderTransfer(pane) {
      var companyOpts = M.companies.map(function (c) { return [c.id, c.name + (c.active ? '' : ' (사용 중지)')]; });
      var groupOpts = M.groups.filter(function (g) { return g.companyId === draft.companyId; }).map(function (g) { return [g.name, g.name + (g.active ? '' : ' (사용 안 함)')]; });
      var dealerOpts = M.dealers.map(function (d) { return [d.name, d.name + (d.active ? '' : ' (사용 중지)')]; });
      pane.innerHTML =
        '<form class="vaf-steps" data-vaf-form novalidate>' +
          '<div class="vaf-step"><h3 class="vaf-step__title"><span class="vaf-no">1</span>대상 차량</h3>' +
            field('차대번호 붙여넣기 (줄바꿈·쉼표로 구분, 최대 ' + MAX_VEHICLES + '대)', '<textarea class="inp vaf-vins" name="vins" rows="7" placeholder="FBA32_224250271&#10;FBD25_113920044">' + e(draft.vins) + '</textarea>', true) +
            '<p class="ops-inline-message">차량 소속 현황 탭에서 골라 넣을 수도 있습니다.</p>' +
            '<div class="ops-inline-actions"><button type="button" class="btn btn--sm" data-vaf-sample>예시 넣기</button><button type="button" class="btn btn--sm" data-vaf-clear>지우기</button></div></div>' +
          '<div class="vaf-step"><h3 class="vaf-step__title"><span class="vaf-no">2</span>이관받을 소속</h3>' +
            '<div class="vaf-fields">' + field('업체', '<select class="inp" name="companyId">' + opts(companyOpts, draft.companyId, '업체 선택') + '</select>') +
            field('그룹', '<select class="inp" name="group"' + (draft.companyId ? '' : ' disabled') + '>' + opts(groupOpts, draft.group, draft.companyId ? '그룹 선택' : '업체를 먼저 선택') + '</select>') +
            field('딜러', '<select class="inp" name="dealer">' + opts(dealerOpts, draft.dealer, '딜러 선택') + '</select>') + '</div>' +
            '<p class="ops-inline-message">업체를 고르면 그 업체의 담당 딜러가 먼저 선택됩니다.</p>' +
            '<div class="ops-inline-actions"><button type="submit" class="btn btn--pri">사전 점검</button></div></div>' +
        '</form>' +
        '<div class="vaf-result" data-vaf-result></div>';
      var form = pane.querySelector('[data-vaf-form]');
      form.addEventListener('change', function (ev) {
        var n = ev.target.name; if (!n) return;
        draft[n] = ev.target.value; checked = null;
        if (n === 'companyId') {
          draft.group = (M.groups.find(function (g) { return g.companyId === draft.companyId && g.active; }) || {}).name || '';
          draft.dealer = DEALER_OF[draft.companyId] || '';
          renderTransfer(pane); pane.querySelector('[name="companyId"]').focus(); return;
        }
        renderResult(pane);
      });
      form.addEventListener('input', function (ev) { if (ev.target.name === 'vins') { draft.vins = ev.target.value; if (checked) { checked = null; renderResult(pane); } } });
      pane.querySelector('[data-vaf-sample]').addEventListener('click', function () {
        draft.vins = data.vehicles.filter(function (v) { return v.companyId === '1933'; }).slice(0, 3).map(function (v) { return v.vin; }).concat(['FBA32_999999999']).join('\n');
        checked = null; renderTransfer(pane);
      });
      pane.querySelector('[data-vaf-clear]').addEventListener('click', function () { draft.vins = ''; checked = null; renderTransfer(pane); pane.querySelector('[name="vins"]').focus(); });
      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var vins = parseVins(draft.vins);
        if (!vins.length) { O.notify('대상 차량의 차대번호를 입력해 주세요.'); form.elements.vins.focus(); return; }
        if (vins.length > MAX_VEHICLES) { O.notify('한 번에 최대 ' + MAX_VEHICLES + '대까지 이관할 수 있습니다.'); return; }
        if (!draft.companyId || !draft.group || !draft.dealer) { O.notify('이관받을 업체·그룹·딜러를 모두 선택해 주세요.'); return; }
        checked = precheck(vins); renderResult(pane);
        var r = pane.querySelector('[data-vaf-result]'); if (r) r.scrollIntoView({ block: 'nearest' });
      });
      renderResult(pane);
    }
    function parseVins(text) {
      var list = String(text || '').split(/[\s,;]+/).map(function (x) { return x.trim(); }).filter(Boolean);
      return list.filter(function (x, i) { return list.map(norm).indexOf(norm(x)) === i; });
    }

    // 사전 점검: 차량 존재 · 받을 업체 사용 · 그룹 존재/사용 · 딜러 존재/사용 · 변경 여부
    function precheck(vins) {
      var c = company(draft.companyId), g = group(draft.companyId, draft.group), d = dealer(draft.dealer);
      var common = [];
      if (!c) common.push(['bad', '받을 업체가 없습니다']); else if (!c.active) common.push(['bad', '받을 업체가 사용 중지 상태입니다']);
      if (!g) common.push(['bad', '받을 업체에 해당 그룹이 없습니다']); else if (!g.active) common.push(['warn', '그룹이 사용 안 함 상태라 고객·딜러 화면에서 차량이 보이지 않습니다']);
      if (!d) common.push(['bad', '딜러 업체가 없습니다']); else if (!d.active) common.push(['bad', '딜러 업체가 사용 중지 상태입니다']);
      var rows = vins.map(function (vin) {
        var v = findVehicle(vin), notes = [];
        if (!v) notes.push(['bad', '등록된 차량이 없습니다']);
        else {
          notes = notes.concat(common);
          if (v.companyId === draft.companyId && v.group === draft.group && v.dealer === draft.dealer) notes = [['same', '이미 같은 소속입니다']];
        }
        var level = notes.some(function (n) { return n[0] === 'bad'; }) ? 'bad' : notes.some(function (n) { return n[0] === 'same'; }) ? 'same' : notes.some(function (n) { return n[0] === 'warn'; }) ? 'warn' : 'ok';
        return { vin: v ? v.vin : vin, model: v ? v.model : '', before: v ? where(v) : '—', after: companyName(draft.companyId) + ' / ' + draft.group + ' / ' + draft.dealer, level: level, note: notes.map(function (n) { return n[1]; }).join(' · ') || '이관 가능' };
      });
      return { target: { companyId: draft.companyId, group: draft.group, dealer: draft.dealer }, rows: rows, checks: [
        ['받을 업체 사용 여부', !c ? '없음' : c.active ? '사용' : '사용 중지', c && c.active],
        ['받을 그룹', !g ? '없음' : g.active ? '사용' : '사용 안 함 (화면에 안 보임)', g ? (g.active ? true : null) : false],
        ['딜러 업체', !d ? '없음' : d.active ? '사용' : '사용 중지', d && d.active],
        ['차량 존재', rows.filter(function (r) { return r.model; }).length + ' / ' + rows.length + '대', rows.every(function (r) { return r.model; }) ? true : null]
      ] };
    }
    var LEVEL = { ok: ['ok', '가능'], warn: ['warn', '주의'], bad: ['bad', '불가'], same: ['gray', '변경 없음'] };
    function renderResult(pane) {
      var host = pane.querySelector('[data-vaf-result]'); if (!host) return;
      if (!checked) { host.innerHTML = '<div class="vaf-step vaf-step--wide"><h3 class="vaf-step__title"><span class="vaf-no">3</span>사전 점검</h3><p class="ops-inline-message">대상 차량과 받을 소속을 정한 뒤 [사전 점검]을 누르면 이관 가능 여부가 여기에 표시됩니다.</p></div>'; return; }
      var count = function (l) { return checked.rows.filter(function (r) { return r.level === l; }).length; };
      var runnable = count('ok') + count('warn');
      host.innerHTML = '<div class="vaf-step vaf-step--wide"><h3 class="vaf-step__title"><span class="vaf-no">3</span>사전 점검 결과</h3>' +
        '<ul class="vaf-checks">' + checked.checks.map(function (c) { return '<li class="' + (c[2] === true ? 'is-ok' : c[2] === false ? 'is-bad' : 'is-warn') + '"><span aria-hidden="true">' + (c[2] === true ? '✓' : c[2] === false ? '✕' : '!') + '</span>' + e(c[0]) + ' <b>' + e(c[1]) + '</b></li>'; }).join('') + '</ul>' +
        '<p class="vaf-summary">가능 <b>' + count('ok') + '</b> · 주의 <b>' + count('warn') + '</b> · 불가 <b>' + count('bad') + '</b> · 변경 없음 <b>' + count('same') + '</b> <span class="vaf-sep">|</span> 실행하면 가능·주의 차량 <b>' + runnable + '</b>대가 이관됩니다.</p>' +
        '<div data-vaf-grid></div></div>';
      O.grid(host.querySelector('[data-vaf-grid]'), {
        rows: checked.rows, pageSize: 15, caption: '사전 점검 결과', exportName: '차량소속이관_사전점검', emptyText: '점검할 차량이 없습니다.',
        toolbar: '<button type="button" class="btn btn--pri" data-vaf-run' + (runnable ? '' : ' disabled title="이관할 수 있는 차량이 없습니다."') + '>이관 실행</button>',
        defaultSort: { key: 'result', dir: 'asc' },
        columns: [
          { key: 'vin', label: '차대번호', minWidth: 170 },
          { key: 'model', label: '모델', minWidth: 80, render: function (r) { return e(r.model || '—'); } },
          { key: 'before', label: '현재 소속 (업체 / 그룹 / 딜러)', minWidth: 240 },
          { key: 'after', label: '변경 후', minWidth: 240 },
          { key: 'result', label: '점검', className: 'c', minWidth: 76, sortValue: function (r) { return ['bad', 'warn', 'ok', 'same'].indexOf(r.level); }, render: function (r) { return '<span class="badge ' + LEVEL[r.level][0] + '">' + LEVEL[r.level][1] + '</span>'; }, exportValue: function (r) { return LEVEL[r.level][1]; } },
          { key: 'note', label: '사유', minWidth: 200 }
        ]
      });
      var run = host.querySelector('[data-vaf-run]'); if (run) run.addEventListener('click', confirmRun);
    }

    // ---------- ④ 실행 + 이력 기록 ----------
    function confirmRun() {
      var targets = checked.rows.filter(function (r) { return r.level === 'ok' || r.level === 'warn'; }), warns = targets.filter(function (r) { return r.level === 'warn'; });
      if (!targets.length) return;
      var t = checked.target;
      O.modal({ title: '차량 소속 이관', wide: true, submitLabel: targets.length + '대 이관',
        body: '<dl class="ops-dl"><dt>대상</dt><dd>' + targets.length + '대' + (checked.rows.length > targets.length ? ' <span class="vaf-muted">(불가·변경 없음 ' + (checked.rows.length - targets.length) + '대 제외)</span>' : '') + '</dd><dt>변경 후</dt><dd>' + e(companyName(t.companyId) + ' / ' + t.group + ' / ' + t.dealer) + '</dd></dl>' +
          '<div class="vaf-form">' +
          (warns.length ? '<label class="vaf-check"><input type="checkbox" name="warnOk" required> 주의 ' + warns.length + '대: 그룹이 사용 안 함 상태라 고객·딜러 화면에서 보이지 않는 것을 확인했습니다.</label>' : '') +
          '<div class="vaf-sap vaf-sap--inline"><b>SAP 되돌림</b> 다음 EAI 호출 때 SAP 값으로 덮어써질 수 있습니다.</div>' +
          field('SAP 마스터 수정 요청번호 (있으면 입력)', '<input class="inp" name="sapReq" maxlength="40" placeholder="예) SR-2026-11-0412">', true) +
          '<label class="vaf-check"><input type="checkbox" name="sapOk" required> SAP 마스터 수정을 요청했거나, 덮어써질 수 있음을 확인했습니다.</label>' +
          field('이관 사유 (이관 이력에 남습니다)', '<textarea class="inp" name="reason" rows="3" maxlength="200" required placeholder="예) 고객사 합병으로 소속 이관"></textarea>', true) + '</div>',
        onSubmit: function (form, close) {
          var fd = new FormData(form), reason = String(fd.get('reason') || '').trim(), sapReq = String(fd.get('sapReq') || '').trim();
          if (!reason) throw new Error('이관 사유를 입력해 주세요.');
          data = O.read(storageKey, data);
          var at = now(), batch = 'B' + Date.now(), done = 0;
          targets.forEach(function (r) {
            var v = findVehicle(r.vin); if (!v) return;
            var before = { companyId: v.companyId, company: companyName(v.companyId), group: v.group, dealer: v.dealer };
            if (before.companyId === t.companyId && before.group === t.group && before.dealer === t.dealer) return;
            v.companyId = t.companyId; v.group = t.group; v.dealer = t.dealer; done++;
            data.history.push({ id: batch + '-' + done, batch: batch, at: at, vin: v.vin, before: before, after: { companyId: t.companyId, company: companyName(t.companyId), group: t.group, dealer: t.dealer },
              by: ACTOR, reason: reason, sap: sapReq ? '요청 ' + sapReq : '미요청 (되돌림 확인)', warn: r.level === 'warn' });
          });
          if (!done) throw new Error('이관할 차량이 없습니다. 사전 점검을 다시 해 주세요.');
          save(); close();
          draft.vins = ''; checked = null; tab = 'history'; histQ = ''; render();
          O.notify(done + '대를 ' + companyName(t.companyId) + ' / ' + t.group + '(으)로 이관했습니다.');
        } });
    }

    // ---------- 차량 소속 현황 (골라서 이관 대상에 넣기) ----------
    function renderVehicles(pane) {
      pane.innerHTML = '<div data-vaf-filters></div><div data-vaf-grid></div>';
      var area = pane.querySelector('[data-vaf-filters]');
      area.innerHTML = '<form class="ops-filters" aria-label="차량 소속 조회">' + field('업체', '<select class="inp" name="companyId">' + opts(M.companies.map(function (c) { return [c.id, c.name]; }), listFilter.companyId, '전체') + '</select>') +
        field('검색', '<input class="inp" type="search" name="q" maxlength="60" value="' + e(listFilter.q) + '" placeholder="차대번호·모델·그룹·딜러">') + '<button type="submit" class="btn-search">조회</button></form>';
      area.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); var fd = new FormData(ev.currentTarget); listFilter.companyId = String(fd.get('companyId') || ''); listFilter.q = String(fd.get('q') || '').trim(); picked.clear(); renderVehicles(pane); });
      var q = norm(listFilter.q);
      var rows = data.vehicles.filter(function (v) { return (!listFilter.companyId || v.companyId === listFilter.companyId) && (!q || [v.vin, v.model, v.group, v.dealer].some(function (x) { return norm(x).indexOf(q) >= 0; })); })
        .map(function (v) { var g = group(v.companyId, v.group); return Object.assign({}, v, { company: companyName(v.companyId), groupState: g && g.active ? '사용' : '사용 안 함' }); });
      var host = pane.querySelector('[data-vaf-grid]');
      function allPicked() { return rows.length > 0 && rows.every(function (r) { return picked.has(r.vin); }); }
      O.grid(host, {
        rows: rows, pageSize: 15, caption: '차량 소속 현황', exportName: '차량소속현황', defaultSort: { key: 'company', dir: 'asc' }, emptyText: '조회 조건에 해당하는 차량이 없습니다.',
        toolbar: '<span class="vaf-picked" role="status">선택 <b>' + picked.size + '</b>대</span><button type="button" class="btn" data-vaf-pick-all>' + (allPicked() ? '전체 해제' : '전체 선택') + '</button><button type="button" class="btn btn--pri" data-vaf-add' + (picked.size ? '' : ' disabled') + '>선택 차량 이관하기</button>',
        columns: [
          { key: 'pick', label: '선택', sortable: false, export: false, className: 'c', minWidth: 48, render: function (r) { return '<input type="checkbox" class="vaf-pick" data-vaf-pick="' + e(r.vin) + '"' + (picked.has(r.vin) ? ' checked' : '') + ' aria-label="' + e(r.vin + ' 선택') + '">'; } },
          { key: 'vin', label: '차대번호', minWidth: 160 }, { key: 'model', label: '모델', minWidth: 80 }, { key: 'type', label: '동력', minWidth: 64 },
          { key: 'company', label: '업체', minWidth: 180 }, { key: 'group', label: '그룹', minWidth: 90 },
          { key: 'groupState', label: '그룹 사용', className: 'c', minWidth: 88, render: function (r) { return r.groupState === '사용' ? '사용' : '<span class="badge warn">사용 안 함</span>'; } },
          { key: 'dealer', label: '딜러', minWidth: 90, render: function (r) { return e(r.dealer || '—'); } }
        ]
      });
      // 조회된 차량이 모두 선택돼 있으면 버튼이 '전체 해제'로 바뀐다. 표는 다시 그리지 않아 보던 페이지가 유지된다
      function sync() {
        host.querySelector('.vaf-picked b').textContent = picked.size; host.querySelector('[data-vaf-add]').disabled = !picked.size;
        host.querySelector('[data-vaf-pick-all]').textContent = allPicked() ? '전체 해제' : '전체 선택';
        host.querySelectorAll('[data-vaf-pick]').forEach(function (b) { b.checked = picked.has(b.dataset.vafPick); });
      }
      host.onchange = function (ev) { var b = ev.target.closest('[data-vaf-pick]'); if (!b) return; b.checked ? picked.add(b.dataset.vafPick) : picked.delete(b.dataset.vafPick); sync(); };
      host.querySelector('[data-vaf-pick-all]').addEventListener('click', function () {
        var clear = allPicked();
        rows.forEach(function (r) { clear ? picked.delete(r.vin) : picked.add(r.vin); });
        sync();
      });
      host.querySelector('[data-vaf-add]').addEventListener('click', function () {
        var current = parseVins(draft.vins); picked.forEach(function (vin) { if (current.map(norm).indexOf(norm(vin)) < 0) current.push(vin); });
        draft.vins = current.join('\n'); checked = null; O.notify('이관 대상에 ' + picked.size + '대를 넣었습니다.'); picked.clear(); tab = 'transfer'; render();
      });
    }

    // ---------- ⑤ 이관 이력 ----------
    function renderHistory(pane) {
      pane.innerHTML = '<div data-vaf-filters></div><div data-vaf-grid></div>';
      var area = pane.querySelector('[data-vaf-filters]');
      area.innerHTML = '<form class="ops-filters" aria-label="이관 이력 조회">' + field('검색', '<input class="inp" type="search" name="q" maxlength="60" value="' + e(histQ) + '" placeholder="차대번호·업체·처리자">') + '<button type="submit" class="btn-search">조회</button></form>';
      area.querySelector('form').addEventListener('submit', function (ev) { ev.preventDefault(); histQ = String(new FormData(ev.currentTarget).get('q') || '').trim(); renderHistory(pane); });
      var q = norm(histQ);
      var rows = data.history.filter(function (h) { return !q || [h.vin, h.before.company, h.after.company, h.by].some(function (x) { return norm(x).indexOf(q) >= 0; }); })
        .map(function (h) { return Object.assign({}, h, { from: h.before.company + ' / ' + h.before.group + ' / ' + (h.before.dealer || '—'), to: h.after.company + ' / ' + h.after.group + ' / ' + h.after.dealer }); });
      O.grid(pane.querySelector('[data-vaf-grid]'), {
        rows: rows, pageSize: 15, caption: '이관 이력', exportName: '차량소속_이관이력', defaultSort: { key: 'at', dir: 'desc' }, emptyText: '이관 이력이 없습니다.',
        toolbar: '<button type="button" class="btn" data-vaf-reset>시연 데이터 초기화</button>',
        columns: [
          { key: 'at', label: '이관 일시', minWidth: 130 }, { key: 'vin', label: '차대번호', minWidth: 150 },
          { key: 'from', label: '변경 전 (업체 / 그룹 / 딜러)', minWidth: 200 }, { key: 'to', label: '변경 후', minWidth: 200, render: function (r) { return e(r.to) + (r.warn ? ' <span class="badge warn">그룹 사용 안 함</span>' : ''); } },
          { key: 'by', label: '처리자', minWidth: 90 }, { key: 'reason', label: '사유', minWidth: 130 }, { key: 'sap', label: 'SAP 반영', minWidth: 130 }
        ]
      });
      pane.querySelector('[data-vaf-reset]').addEventListener('click', function () {
        O.confirm({ title: '시연 데이터 초기화', body: '<p>이 브라우저에 저장된 이관 결과와 이관 이력을 지우고 처음 소속으로 되돌립니다.</p>', submitLabel: '초기화', onConfirm: function () { data = seedData(); save(); checked = null; picked.clear(); tab = 'transfer'; render(); O.notify('처음 상태로 되돌렸습니다.'); } });
      });
    }

    render();
  });
}());
