/* Operations-only demonstration ledgers. No existing fleet, customer, group,
   user or dashboard records are read or changed. No external command is sent. */
(function () {
  'use strict';
  var O = window.MIQOps;
  if (!O) return;
  var serial = 0;
  var KEYS = { terminals: 'data-terminals', equipment: 'equipment-codes', history: 'equipment-history', accounts: 'internal-accounts' };
  var TYPES = [ ['working', '운행 데이터'], ['gps', 'GPS 데이터'], ['lithium', '리튬배터리 데이터'], ['error', '차량 에러 데이터'], ['lithiumError', '리튬배터리 에러 데이터'] ];
  var COMPANIES = ['한빛물류', '대성산업', '중앙렌탈', '동우운수'];
  var GROUPS = ['기본그룹', '물류1팀', '물류2팀'];
  var FUELS = ['LI', 'LA', 'LM'];
  var BASE_CODES = [ ['FBA32', 'B30S-7', 'MOTOR', 'LI'], ['FBA18', 'B18S-7', 'MOTOR', 'LA'], ['FDB30', 'D30S-9', 'ENGINE', 'LM'] ];
  function e(value) { return O.esc(value == null ? '' : String(value)); }
  function pad(value) { return String(value).padStart(2, '0'); }
  function today() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 10); }
  function stamp() { return new Date(Date.now() + 9 * 3600000).toISOString().slice(0, 19).replace('T', ' '); }
  function dayOffset(day, count) { return new Date(Date.parse(day + 'T00:00:00Z') + count * 86400000).toISOString().slice(0, 10); }
  function uid(prefix) { serial += 1; return prefix + '-' + Date.now() + '-' + serial; }
  function same(a, b) { return String(a || '').trim().toUpperCase() === String(b || '').trim().toUpperCase(); }
  function search(row, value, keys) { var q = value.trim().toLocaleLowerCase(); return !q || keys.some(function (key) { return String(row[key] || '').toLocaleLowerCase().indexOf(q) >= 0; }); }
  function options(items, value, all) { return (all !== undefined ? '<option value="">' + e(all) + '</option>' : '') + items.map(function (item) { var key = Array.isArray(item) ? item[0] : item; var label = Array.isArray(item) ? item[1] : item; return '<option value="' + e(key) + '"' + (String(key) === String(value) ? ' selected' : '') + '>' + e(label) + '</option>'; }).join(''); }
  function field(label, input, full) { return '<label class="ops-field' + (full ? ' ops-field--full col-2' : '') + '"><span>' + e(label) + '</span>' + input + '</label>'; }
  function input(name, value, attributes) { return '<input class="inp" name="' + e(name) + '" value="' + e(value) + '" ' + (attributes || '') + '>'; }
  function select(name, items, value, all) { return '<select class="inp" name="' + e(name) + '">' + options(items, value, all) + '</select>'; }
  function button(action, text, primary, extra) { return '<button type="button" class="btn btn--sm' + (primary ? ' btn--pri' : '') + '" data-action="' + e(action) + '" ' + (extra || '') + '>' + e(text) + '</button>'; }
  function actions(items) { return '<div class="mm-inline-actions">' + items.join('') + '</div>'; }
  function dl(items) { return '<dl class="ops-dl">' + items.map(function (item) { return '<dt>' + e(item[0]) + '</dt><dd>' + e(item[1] == null || item[1] === '' ? '—' : item[1]) + '</dd>'; }).join('') + '</dl>'; }
  function formValue(form, name) { return String(new FormData(form).get(name) || '').trim(); }
  function save(key, value) { return O.write(key, value) !== false; }
  function notifyError(form, name, message) { var control = form.elements.namedItem(name); if (control && control.setCustomValidity) { MIQCommon.view.call(control,"setCustomValidity",[message]); control.reportValidity(); control.addEventListener('input', function clear() { MIQCommon.view.call(control,"setCustomValidity",['']); control.removeEventListener('input', clear); }); } else O.notify(message); }
  function codeSeeds() {
    // Skip the retired fourth seed slot without renumbering the other records.
    return Array.from({ length: 24 }, function (_, i) { return i; }).filter(function (i) { return i % 4 < BASE_CODES.length; }).map(function (i) {
      var basis = BASE_CODES[i % 4];
      return { id: 'EC-' + (i + 1), code: i < 4 ? basis[0] : basis[0] + '-' + pad(i + 1), name: i < 4 ? basis[1] : basis[1] + ' ' + (i + 1), type: basis[2], maker: i % 5 === 0 ? 'DOOSAN' : 'BOBCAT', fuel: basis[3], weight: 1800 + (i % 6) * 500, power: 20 + (i % 7) * 5, imageUrl: '', comment: i < 4 ? '표준 장비코드' : '', eaiYn: i % 7 === 6 ? 'N' : 'Y', useYn: i % 8 === 7 ? 'N' : 'Y', createdAt: '2026-08-01 09:00:00', updatedAt: '2026-09-01 10:00:00' };
    });
  }
  function terminalSeeds() {
    var basisDay = today();
    return Array.from({ length: 36 }, function (_, i) { return i; }).filter(function (i) { return i % 4 < BASE_CODES.length; }).map(function (i) {
      var fuel = FUELS[i % 4], code = BASE_CODES[i % 4], registered = i < 28;
      var date = dayOffset(basisDay, i % 9 === 7 ? -3 : i % 9 === 8 ? -1 : 0);
      var at = date + ' ' + pad(8 + i % 6) + ':' + pad((i * 7) % 60) + ':00';
      return { id: 'TM-' + (i + 1), terminalId: String(826110001 + i), vin: registered ? 'OPS_' + code[0] + '_' + (1001 + i) : '', company: registered ? COMPANIES[i % 4] : '', group: registered ? GROUPS[i % 3] : '', fuel: fuel, equipmentCode: code[0], model: code[1], registered: registered, mesReady: i % 6 !== 5, registeredAt: registered ? '2026-08-01 09:00:00' : '', last: { working: i % 11 === 10 ? null : at, gps: i % 7 === 6 ? null : at, lithium: fuel === 'LI' ? at : null, error: i % 5 === 0 ? date + ' 08:15:00' : null, lithiumError: fuel === 'LI' && i % 8 === 0 ? date + ' 08:20:00' : null }, eaiAt: i % 6 !== 5 ? at : null };
    });
  }
  function supportedVehicle(row) { return !/^(HI|HY|hydrogen|수소)$/i.test(String(row.fuel || row.type || '').trim()); }
  function terminals() { return O.read(KEYS.terminals, terminalSeeds()).filter(supportedVehicle); }
  function equipment() { return O.read(KEYS.equipment, codeSeeds()).filter(supportedVehicle); }
  function ensureDateRange(form, from, to) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) { notifyError(form, 'from', '조회 기간을 선택해 주세요.'); return false; }
    var days = (Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000 + 1;
    if (days < 1 || days > 31 || to > today()) { notifyError(form, 'to', '오늘까지의 기간 중 최대 31일을 선택해 주세요.'); return false; }
    return true;
  }

  O.register('data', function (ctx) {
    var tab = 'latest', bulkIds = null;
    var filters = { company: '', group: '', fuel: '', state: '', q: '' };
    var firstTerminal = terminals()[0];
    var raw = { kind: 'working', terminal: firstTerminal ? firstTerminal.terminalId : '', from: dayOffset(today(), -6), to: today() };
    var tabs = [ ['latest', '최종 수집현황'], ['raw', '원시 데이터 조회'], ['terminal', '단말 등록·연동 점검'] ];
    function health(row) { if (!row.last.working) return '미수집'; return row.last.working.slice(0, 10) < dayOffset(today(), -1) ? '수집 지연' : '정상'; }
    function filtered() {
      return terminals().filter(function (row) {
        return (!bulkIds || bulkIds.indexOf(row.terminalId) >= 0) && (!filters.company || row.company === filters.company) && (!filters.group || row.group === filters.group) && (!filters.fuel || row.fuel === filters.fuel) && (!filters.state || (tab === 'terminal' ? (row.registered ? '등록' : '미등록') : health(row)) === filters.state) && search(row, filters.q, ['terminalId', 'vin', 'company', 'group']);
      });
    }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",'<div class="tabs" role="tablist" aria-label="차량 데이터 관리">' + tabs.map(function (item) { return '<button type="button" role="tab" data-ops-data-tab="' + item[0] + '" aria-selected="' + (tab === item[0]) + '" aria-controls="opsDataPane"' + (tab === item[0] ? ' class="active"' : '') + '>' + item[1] + '</button>'; }).join('') + '</div><section id="opsDataPane" role="tabpanel" aria-label="' + e(tabs.filter(function (item) { return item[0] === tab; })[0][1]) + '"><div data-ops-filters></div><div data-ops-table></div></section>');
      ctx.el.querySelectorAll('[data-ops-data-tab]').forEach(function (node) { node.addEventListener('click', function () { if (tab === node.dataset.opsDataTab) return; tab = node.dataset.opsDataTab; filters.state = ''; render(); }); });
      if (tab === 'raw') renderRaw(); else renderTerminals();
    }
    function renderTerminals() {
      var area = ctx.el.querySelector('[data-ops-filters]');
      MIQCommon.view.set(area,"innerHTML",'<form class="ops-filters" aria-label="' + (tab === 'terminal' ? '단말' : '수집현황') + ' 조회">' + field('업체', select('company', COMPANIES, filters.company, '전체 업체')) + field('그룹', select('group', GROUPS, filters.group, '전체 그룹')) + field('연료', select('fuel', FUELS, filters.fuel, '전체 연료')) + field('상태', select('state', tab === 'terminal' ? ['등록', '미등록'] : ['정상', '수집 지연', '미수집'], filters.state, '전체 상태')) + field('검색', input('q', filters.q, 'type="search" maxlength="100" placeholder="단말 ID · 차량 ID"')) + '<button class="btn-search" type="submit">조회</button></form>' + (bulkIds ? '<div class="ops-inline-message" role="status">단말 ' + bulkIds.length + '개 일괄조회 적용 중 <button type="button" class="btn btn--sm" data-ops-bulk-clear>해제</button></div>' : ''));
      area.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); var form = event.currentTarget; Object.keys(filters).forEach(function (key) { filters[key] = formValue(form, key); }); renderTerminals(); });
      var clear = area.querySelector('[data-ops-bulk-clear]'); if (clear) clear.addEventListener('click', function () { bulkIds = null; renderTerminals(); });
      var rows = filtered().map(function (row) { return Object.assign({}, row, { company: row.company || '미배정', group: row.group || '미배정', status: tab === 'terminal' ? (row.registered ? '등록' : '미등록') : health(row), working: row.last.working || '—', gps: row.last.gps || '—', lithium: row.last.lithium || '—', lastError: row.last.error || '—', lithiumError: row.last.lithiumError || '—', mesStatus: row.mesReady ? '정상' : '확인 필요' }); });
      var columns = [ { key: 'company', label: '업체' }, { key: 'group', label: '그룹' }, { key: 'terminalId', label: '단말 ID', render: function (row) { return '<button type="button" class="mm-cell-link ops-text-button" data-action="detail">' + e(row.terminalId) + '</button>'; } }, { key: 'vin', label: '차량 ID', render: function (row) { return e(row.vin || '미등록'); } }, { key: 'fuel', label: '연료' } ];
      if (tab === 'latest') columns = columns.concat([ { key: 'status', label: '운행 수집 상태' }, { key: 'working', label: '운행 수집일시' }, { key: 'gps', label: 'GPS 수집일시' }, { key: 'lithium', label: '리튬 수집일시' }, { key: 'lastError', label: '차량 에러 수집일시' }, { key: 'lithiumError', label: '리튬 에러 수집일시' }, { key: 'eaiAt', label: 'EAI 확인일시', render: function (row) { return e(row.eaiAt || '—'); } } ]);
      else columns = columns.concat([ { key: 'status', label: '등록 상태' }, { key: 'mesStatus', label: 'MES 상태' }, { key: 'eaiAt', label: 'EAI 확인일시', render: function (row) { return e(row.eaiAt || '—'); } }, { key: 'manage', label: '관리', className: 'c', sortable: false, export: false, render: function () { return button('detail', '상세 / MES 조회'); } } ]);
      var host = ctx.el.querySelector('[data-ops-table]');
      O.grid(host, { rows: rows, columns: columns, pageSize: 15, toolbar: '<button type="button" class="btn btn--sm" data-ops-bulk>단말 일괄조회</button>', emptyText: '조회 조건에 해당하는 단말이 없습니다.', defaultSort: { key: 'terminalId', dir: 'asc' }, onAction: function (action, row) { if (action === 'detail' && row) terminalModal(row.id); } });
      var bulk = host.querySelector('[data-ops-bulk]'); if (bulk) bulk.addEventListener('click', bulkModal);
    }
    function bulkModal() {
      var id = uid('opsBulk');
      O.modal({ title: '단말 일괄조회', body: '<div id="' + id + '">' + field('단말 ID', '<textarea class="inp" name="terminalIds" rows="7" placeholder="단말 ID를 한 줄에 하나씩 입력해 주세요." required></textarea>', true) + field('파일 선택', '<input class="inp" type="file" accept=".csv,.txt" data-ops-bulk-file>', true) + '<p class="ops-inline-message">CSV 첫 번째 열 또는 줄바꿈·쉼표로 구분한 단말 ID를 최대 500개까지 조회합니다.</p></div>', submitLabel: '조회', onSubmit: function (form, close) {
        var ids = formValue(form, 'terminalIds').split(/[\s,;]+/).map(function (value) { return value.replace(/^"|"$/g, ''); }).filter(Boolean);
        ids = ids.filter(function (value, index) { return ids.indexOf(value) === index; });
        if (!ids.length || ids.length > 500 || ids.some(function (value) { return !/^\d{9,20}$/.test(value); })) { notifyError(form, 'terminalIds', '9~20자리 숫자 단말 ID를 최대 500개까지 입력해 주세요.'); return; }
        var found = terminals().filter(function (row) { return ids.indexOf(row.terminalId) >= 0; }).length;
        bulkIds = ids; Object.keys(filters).forEach(function (key) { filters[key] = ''; }); close(); renderTerminals(); O.notify('입력 ' + ids.length + '개 중 ' + found + '개 단말을 찾았습니다.');
      } });
      var node = document.getElementById(id); if (!node) return;
      node.querySelector('[data-ops-bulk-file]').addEventListener('change', function (event) {
        var file = event.target.files && event.target.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024 || !/\.(csv|txt)$/i.test(file.name)) { O.notify('2MB 이하 CSV 또는 TXT 파일을 선택해 주세요.'); event.target.value = ''; return; }
        file.text().then(function (text) {
          var values = text.replace(/^\uFEFF/, '').split(/\r?\n/).map(function (line) { var match = line.match(/^\s*"([^"]*)"|^\s*([^,;\t]*)/); return match ? (match[1] || match[2] || '').trim() : ''; }).filter(Boolean);
          if (values.length && /^(terminal.?id|단말\s*id|단말기\s*id|터미널\s*id)$/i.test(values[0])) values.shift();
          var control = node.querySelector('[name="terminalIds"]'); control.value = values.join('\n'); MIQCommon.view.call(control,"setCustomValidity",['']);
        }).catch(function () { O.notify('파일을 읽지 못했습니다. 다시 선택해 주세요.'); });
      });
    }
    function terminalModal(recordId) {
      var row = terminals().filter(function (item) { return item.id === recordId; })[0]; if (!row) return;
      var id = uid('opsTerminal'), checked = false, canRegister = false;
      var body = '<div id="' + id + '">' + dl([ ['단말 ID', row.terminalId], ['차량 ID', row.vin || '미등록'], ['업체 / 그룹', (row.company || '미배정') + ' / ' + (row.group || '미배정')], ['장비코드 / 차종', row.equipmentCode + ' / ' + row.model], ['등록 상태', row.registered ? '등록' : '미등록'] ]) + '<div class="ops-inline-actions">' + button('mes', 'MES 조회', true, 'data-ops-mes') + '</div><p class="ops-inline-message" data-ops-mes-result role="status">MES 조회 후 등록 가능 여부를 확인해 주세요.</p>' + dl(TYPES.map(function (type) { return [type[1] + ' 최종 수집', row.last[type[0]]]; })) + (row.registered ? '' : '<div class="form-grid ops-form-grid">' + field('등록 업체', select('company', COMPANIES, COMPANIES[0])) + field('등록 그룹', select('group', GROUPS, GROUPS[0])) + '</div>') + '</div>';
      O.modal({ title: '단말 상세', body: body, wide: true, submitLabel: row.registered ? '닫기' : '장비 등록', onSubmit: function (form, close) {
        if (row.registered) { close(); return; }
        if (!checked || !canRegister) { O.notify(checked ? 'MES 상태와 장비코드를 확인한 뒤 등록해 주세요.' : 'MES 조회를 먼저 진행해 주세요.'); return; }
        if (!equipment().some(function (item) { return same(item.code, row.equipmentCode) && item.useYn === 'Y'; })) { O.notify('장비코드가 없거나 미사용 상태입니다. 장비코드를 다시 확인해 주세요.'); return; }
        var list = terminals(), current = list.filter(function (item) { return item.id === row.id; })[0];
        if (!current || current.registered) { O.notify('이미 등록된 단말입니다. 목록을 다시 확인해 주세요.'); close(); renderTerminals(); return; }
        current.company = formValue(form, 'company'); current.group = formValue(form, 'group'); current.vin = 'OPS_' + current.equipmentCode + '_' + current.terminalId.slice(-4); current.registered = true; current.registeredAt = stamp(); current.eaiAt = stamp();
        if (!save(KEYS.terminals, list)) return;
        close(); renderTerminals(); O.notify('선택한 업체·그룹에 장비를 등록했습니다.');
      } });
      var node = document.getElementById(id); if (!node) return;
      var registerButton = node.closest('form').querySelector('button[type="submit"]');
      if (registerButton) registerButton.disabled = true;
      node.querySelector('[data-ops-mes]').addEventListener('click', function () {
        checked = true;
        var code = equipment().filter(function (item) { return same(item.code, row.equipmentCode) && item.useYn === 'Y'; })[0];
        canRegister = row.mesReady && !!code && !row.registered;
        if (registerButton) registerButton.disabled = !canRegister;
        MIQCommon.view.set(node.querySelector('[data-ops-mes-result]'),"textContent",row.registered ? '등록된 장비입니다. MES ' + (row.mesReady ? '정상' : '확인 필요') + ' · 장비코드 ' + (code ? '확인 완료' : '미등록 또는 미사용') : !row.mesReady ? 'MES에서 장비 정보를 확인하지 못했습니다. 등록할 수 없습니다.' : !code ? '장비코드가 없거나 미사용 상태입니다. 장비코드 관리에서 확인해 주세요.' : 'MES 정상 · 장비코드 확인 완료. 업체·그룹을 선택하고 장비를 등록해 주세요.');
      });
    }
    function rawRows() {
      var result = [], days = Math.floor((Date.parse(raw.to) - Date.parse(raw.from)) / 86400000) + 1;
      terminals().filter(function (row) { return row.last[raw.kind] && (!raw.terminal || row.terminalId === raw.terminal) && (!/^lithium/.test(raw.kind) || row.fuel === 'LI'); }).forEach(function (row) {
        for (var d = 0; d < days; d++) {
          var date = dayOffset(raw.from, d), error = /error/i.test(raw.kind), samples = error ? 1 : 4;
          for (var s = 0; s < samples; s++) {
            var seed = Number(row.terminalId.slice(-3)) + d * 7 + s * 3;
            if (error && seed % 3 !== 0) continue;
            var data = { id: row.terminalId + '-' + date + '-' + s + '-' + raw.kind, time: date + ' ' + pad(9 + s * 2) + ':00:00', terminalId: row.terminalId, vin: row.vin || '미등록', company: row.company || '미배정', kindName: TYPES.filter(function (type) { return type[0] === raw.kind; })[0][1] };
            if (data.time > row.last[raw.kind]) continue;
            if (raw.kind === 'working') Object.assign(data, { runMinutes: 30 + seed % 25, workMinutes: 25 + seed % 25 - seed % 7, distance: Number((1.2 + seed % 18 / 10).toFixed(1)), shock: seed % 9 === 0 ? 1 : 0 });
            else if (raw.kind === 'gps') Object.assign(data, { latitude: (37.035 + seed % 20 / 10000).toFixed(6), longitude: (126.787 + seed % 13 / 10000).toFixed(6), speed: seed % 12, bearing: seed * 13 % 360 });
            else if (!error) Object.assign(data, { soc: 45 + seed % 50, soh: 90 + seed % 10, voltage: Number((48 + seed % 20 / 10).toFixed(1)), temperature: 23 + seed % 14, current: seed % 25 });
            else Object.assign(data, { code: (raw.kind === 'error' ? 'ECU' : 'BMS-LI') + '-' + pad(1 + seed % 4), severity: seed % 2 ? '주의' : '경고', state: seed % 2 ? '해제' : '발생', message: seed % 2 ? '전압 신호 점검' : '온도 신호 점검' });
            result.push(data);
          }
        }
      });
      return result;
    }
    function renderRaw() {
      var area = ctx.el.querySelector('[data-ops-filters]');
      MIQCommon.view.set(area,"innerHTML",'<form class="ops-filters" aria-label="수집 데이터 조회">' + field('데이터 종류', select('kind', TYPES, raw.kind)) + field('단말 ID', select('terminal', terminals().map(function (row) { return [row.terminalId, row.terminalId + ' · ' + row.model]; }), raw.terminal, '전체 단말')) + field('시작일', input('from', raw.from, 'type="date" required max="' + today() + '"')) + field('종료일', input('to', raw.to, 'type="date" required max="' + today() + '"')) + '<button class="btn-search" type="submit">조회</button></form>');
      area.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); var form = event.currentTarget, from = formValue(form, 'from'), to = formValue(form, 'to'); if (!ensureDateRange(form, from, to)) return; raw = { kind: formValue(form, 'kind'), terminal: formValue(form, 'terminal'), from: from, to: to }; renderRaw(); });
      var columns = [ { key: 'time', label: '수집일시' }, { key: 'terminalId', label: '단말 ID' }, { key: 'vin', label: '차량 ID' }, { key: 'company', label: '업체' } ];
      var extra = raw.kind === 'working' ? [['runMinutes', '가동시간(분)'], ['workMinutes', '작업시간(분)'], ['distance', '이동거리(km)'], ['shock', '충격(회)']] : raw.kind === 'gps' ? [['latitude', '위도'], ['longitude', '경도'], ['speed', '속도(km/h)'], ['bearing', '방향(°)']] : /error/i.test(raw.kind) ? [['code', '에러코드'], ['severity', '등급'], ['state', '상태'], ['message', '내용']] : [['soc', '잔량(%)'], ['soh', '성능(%)'], ['voltage', '전압(V)'], ['temperature', '온도(℃)'], ['current', '전류(A)']];
      columns = columns.concat(extra.map(function (item) { return { key: item[0], label: item[1] }; }), [{ key: 'detail', label: '상세', className: 'c', sortable: false, export: false, render: function () { return button('raw-detail', '보기'); } }]);
      O.grid(ctx.el.querySelector('[data-ops-table]'), { rows: rawRows(), columns: columns, pageSize: 15, defaultSort: { key: 'time', dir: 'desc' }, emptyText: '선택한 단말·데이터 종류·기간에 수집된 기록이 없습니다.', onAction: function (action, row) {
        if (action !== 'raw-detail' || !row) return;
        O.modal({ title: '수집 데이터 상세', body: dl([['데이터 종류', row.kindName]].concat(columns.filter(function (col) { return col.key !== 'detail'; }).map(function (col) { return [col.label, row[col.key]]; }))), submitLabel: '닫기', onSubmit: function (form, close) { close(); } });
      } });
    }
    render();
  });

  O.register('equipment', function (ctx) {
    var filters = { q: '', type: '', fuel: '', state: '' };
    function used(code) { return terminals().filter(function (row) { return row.registered && same(row.equipmentCode, code); }).length; }
    function addHistory(row, action, before, after) {
      var list = O.read(KEYS.history, []); list.unshift({ id: uid('EH'), codeId: row.id, code: row.code, action: action, at: stamp(), actor: '내부 사용자', before: before || null, after: after || null }); return save(KEYS.history, list);
    }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",'<form class="ops-filters" aria-label="장비코드 조회">' + field('검색', input('q', filters.q, 'type="search" placeholder="장비코드 · 차종명 · 제조사" maxlength="100"')) + field('유형', select('type', [['MOTOR', '전동'], ['ENGINE', '엔진'], ['LPG', 'LPG']], filters.type, '전체 유형')) + field('연료', select('fuel', FUELS, filters.fuel, '전체 연료')) + field('사용여부', select('state', [['Y', '사용'], ['N', '미사용']], filters.state, '전체')) + '<button class="btn-search" type="submit">조회</button></form><div data-ops-table></div>');
      ctx.el.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); Object.keys(filters).forEach(function (key) { filters[key] = formValue(event.currentTarget, key); }); render(); });
      var rows = equipment().filter(function (row) { return search(row, filters.q, ['code', 'name', 'maker']) && (!filters.type || row.type === filters.type) && (!filters.fuel || row.fuel === filters.fuel) && (!filters.state || row.useYn === filters.state); }).map(function (row) { return Object.assign({}, row, { count: used(row.code), typeName: { MOTOR: '전동', ENGINE: '엔진', LPG: 'LPG' }[row.type], status: row.useYn === 'Y' ? '사용' : '미사용' }); });
      var host = ctx.el.querySelector('[data-ops-table]');
      O.grid(host, { rows: rows, pageSize: 15, defaultSort: { key: 'code', dir: 'asc' }, toolbar: '<button type="button" class="btn btn--sm btn--pri" data-ops-code-add>장비코드 등록</button>', columns: [ { key: 'code', label: '장비코드' }, { key: 'name', label: '차종명' }, { key: 'count', label: '장비대수', className: 'r' }, { key: 'typeName', label: '유형' }, { key: 'maker', label: '제조사' }, { key: 'fuel', label: '연료' }, { key: 'status', label: '사용여부' }, { key: 'updatedAt', label: '수정일시' }, { key: 'manage', label: '관리', className: 'c', sortable: false, export: false, render: function () { return actions([button('edit', '수정'), button('history', '이력')]); } } ], emptyText: '조회 조건에 해당하는 장비코드가 없습니다.', onAction: function (action, row) { if (!row) return; if (action === 'edit') edit(row.id); if (action === 'history') history(row); } });
      host.querySelector('[data-ops-code-add]').addEventListener('click', function () { edit(null); });
    }
    function edit(recordId) {
      var original = equipment().filter(function (row) { return row.id === recordId; })[0], row = original || { code: '', name: '', type: 'MOTOR', maker: 'BOBCAT', fuel: 'LI', weight: '', power: '', imageUrl: '', comment: '', eaiYn: 'Y', useYn: 'Y' };
      var checkedCode = original ? row.code : '', id = uid('opsCode');
      var codeInput = input('code', row.code, 'required maxlength="40"' + (original ? ' readonly' : '')) + (!original ? button('duplicate', '중복 확인', false, 'data-ops-code-check') + '<span class="ops-inline-message" data-ops-code-check-result role="status"></span>' : '');
      var body = '<div class="form-grid ops-form-grid" id="' + id + '">' + field('장비코드 *', codeInput) + field('차종명 *', input('name', row.name, 'required maxlength="60"')) + field('유형 *', select('type', [['MOTOR', '전동'], ['ENGINE', '엔진'], ['LPG', 'LPG']], row.type)) + field('제조사 *', input('maker', row.maker, 'required maxlength="40"')) + field('연료 *', select('fuel', FUELS, row.fuel)) + field('중량(kg)', input('weight', row.weight, 'type="number" min="0" max="100000" step="0.1"')) + field('최대출력(kW)', input('power', row.power, 'type="number" min="0" max="10000" step="0.1"')) + field('EAI 연동', select('eaiYn', [['Y', '사용'], ['N', '미사용']], row.eaiYn)) + field('사용여부', select('useYn', [['Y', '사용'], ['N', '미사용']], row.useYn)) + field('이미지 URL', input('imageUrl', row.imageUrl, 'type="url" maxlength="500" placeholder="https://"')) + field('코멘트', '<textarea class="inp" name="comment" rows="3" maxlength="300">' + e(row.comment) + '</textarea>', true) + '</div>';
      O.modal({ title: original ? '장비코드 수정' : '장비코드 등록', body: body, wide: true, submitLabel: '저장', onSubmit: function (form, close) {
        var list = equipment(), code = formValue(form, 'code').toUpperCase(), name = formValue(form, 'name'), maker = formValue(form, 'maker');
        if (!/^[A-Z0-9_-]{1,40}$/.test(code)) { notifyError(form, 'code', '영문·숫자·하이픈·밑줄로 장비코드를 입력해 주세요.'); return; }
        if (!name || !maker) { notifyError(form, !name ? 'name' : 'maker', '공백만 입력할 수 없습니다.'); return; }
        if (list.some(function (item) { return item.id !== recordId && same(item.code, code); })) { notifyError(form, 'code', '이미 등록된 장비코드입니다.'); return; }
        if (!original && !same(checkedCode, code)) { notifyError(form, 'code', '장비코드 중복 확인을 해 주세요.'); return; }
        var next = Object.assign({}, original || {}, { id: recordId || uid('EC'), code: code, name: name, maker: maker, type: formValue(form, 'type'), fuel: formValue(form, 'fuel'), weight: formValue(form, 'weight') === '' ? null : Number(formValue(form, 'weight')), power: formValue(form, 'power') === '' ? null : Number(formValue(form, 'power')), imageUrl: formValue(form, 'imageUrl'), comment: formValue(form, 'comment'), eaiYn: formValue(form, 'eaiYn'), useYn: formValue(form, 'useYn'), createdAt: original ? original.createdAt : stamp(), updatedAt: stamp() });
        if (original) list = list.map(function (item) { return item.id === recordId ? next : item; }); else list.unshift(next);
        if (!save(KEYS.equipment, list)) return; addHistory(next, original ? '수정' : '등록', original, next); close(); render(); O.notify('장비코드를 저장했습니다.');
      } });
      var node = document.getElementById(id); if (!node || original) return;
      var codeControl = node.querySelector('[name="code"]');
      codeControl.addEventListener('input', function () { checkedCode = ''; MIQCommon.view.call(codeControl,"setCustomValidity",['']); MIQCommon.view.set(node.querySelector('[data-ops-code-check-result]'),"textContent",''); });
      node.querySelector('[data-ops-code-check]').addEventListener('click', function () {
        codeControl.value = codeControl.value.trim().toUpperCase(); MIQCommon.view.call(codeControl,"setCustomValidity",['']); if (!codeControl.reportValidity()) return;
        if (!/^[A-Z0-9_-]{1,40}$/.test(codeControl.value)) { notifyError(codeControl.form, 'code', '영문·숫자·하이픈·밑줄로 장비코드를 입력해 주세요.'); return; }
        var exists = equipment().some(function (item) { return same(item.code, codeControl.value); }); checkedCode = exists ? '' : codeControl.value;
        MIQCommon.view.set(node.querySelector('[data-ops-code-check-result]'),"textContent",exists ? '이미 등록된 장비코드입니다.' : '사용할 수 있는 장비코드입니다.');
      });
    }
    function history(row) {
      var rows = O.read(KEYS.history, []).filter(function (item) { return item.codeId === row.id; });
      if (!rows.length) rows = [{ action: '등록', at: row.createdAt, actor: '내부 사용자', before: null, after: row }];
      var labels = { name: '차종명', type: '유형', maker: '제조사', fuel: '연료', weight: '중량', power: '최대출력', imageUrl: '이미지 URL', comment: '코멘트', eaiYn: 'EAI 연동', useYn: '사용여부' };
      var body = '<p class="ops-inline-message"><strong>' + e(row.code) + '</strong> · ' + e(row.name) + '</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>일시</th><th>구분</th><th>처리자</th><th>변경 내용</th></tr></thead><tbody>' + rows.map(function (item) {
        var changes = item.before && item.after ? Object.keys(labels).filter(function (key) { return item.before[key] !== item.after[key]; }).map(function (key) { return labels[key] + ': ' + (item.before[key] == null || item.before[key] === '' ? '—' : item.before[key]) + ' → ' + (item.after[key] == null || item.after[key] === '' ? '—' : item.after[key]); }) : [item.action === '등록' ? '장비코드 최초 등록' : '장비코드 상태 변경'];
        return '<tr><td>' + e(item.at) + '</td><td>' + e(item.action) + '</td><td>' + e(item.actor) + '</td><td>' + (changes.length ? changes.map(e).join('<br>') : '변경 항목 없음') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
      O.modal({ title: '장비코드 변경이력', body: body, wide: true, submitLabel: '닫기', onSubmit: function (form, close) { close(); } });
    }
    render();
  });

  function accountSeeds() {
    var names = ['김현우', '이서연', '박지훈', '최민서', '정도윤', '강수진', '조유진', '윤서준', '장하은', '임도현', '한지우', '오민준', '서예린', '신태호', '권수빈', '황준서', '안채원', '송지민'];
    return names.map(function (name, i) { return { id: 'OA-' + (i + 1), userId: (i < 3 ? 'admin' : 'service') + pad(i + 1) + '@machineiq.example', name: name, role: i < 3 ? 'ADMIN' : 'SERVICE', phone: '010-' + (3400 + i) + '-' + (7100 + i * 13), email: 'operator' + pad(i + 1) + '@machineiq.example', useYn: i > 15 ? 'N' : 'Y', department: i < 3 ? '시스템 운영' : '서비스 지원', createdAt: '2026-08-' + pad(i + 1) + ' 09:00:00', updatedAt: '2026-09-01 10:00:00', deactivatedAt: i > 15 ? '2026-09-01' : '', credentialSetAt: '2026-08-' + pad(i + 1) + ' 09:00:00' }; });
  }
  O.register('accounts', function (ctx) {
    var filters = { q: '', role: '', state: 'Y' };
    function accounts() { return O.read(KEYS.accounts, accountSeeds()); }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",'<form class="ops-filters" aria-label="내부 계정 조회">' + field('검색', input('q', filters.q, 'type="search" maxlength="100" placeholder="사용자 ID · 이름 · 부서"')) + field('권한', select('role', [['ADMIN', 'Admin'], ['SERVICE', 'Service']], filters.role, '전체 권한')) + field('사용여부', select('state', [['Y', '사용'], ['N', '미사용']], filters.state, '전체')) + '<button class="btn-search" type="submit">조회</button></form><div data-ops-table></div>');
      ctx.el.querySelector('form').addEventListener('submit', function (event) { event.preventDefault(); Object.keys(filters).forEach(function (key) { filters[key] = formValue(event.currentTarget, key); }); render(); });
      var rows = accounts().filter(function (row) { return (!filters.role || row.role === filters.role) && (!filters.state || row.useYn === filters.state) && search(row, filters.q, ['userId', 'name', 'department']); }).map(function (row) { return Object.assign({}, row, { roleName: row.role === 'ADMIN' ? 'Admin' : 'Service', status: row.useYn === 'Y' ? '사용' : '미사용' }); });
      var host = ctx.el.querySelector('[data-ops-table]');
      O.grid(host, { rows: rows, pageSize: 15, defaultSort: { key: 'userId', dir: 'asc' }, toolbar: '<button type="button" class="btn btn--sm btn--pri" data-ops-account-add>내부 계정 등록</button>', emptyText: '조회 조건에 해당하는 내부 계정이 없습니다.', columns: [ { key: 'userId', label: '사용자 ID' }, { key: 'name', label: '이름' }, { key: 'roleName', label: '권한' }, { key: 'department', label: '부서' }, { key: 'phone', label: '연락처' }, { key: 'status', label: '사용여부' }, { key: 'createdAt', label: '등록일시' }, { key: 'deactivatedAt', label: '미사용 적용일', render: function (row) { return e(row.deactivatedAt || '—'); } }, { key: 'manage', label: '관리', className: 'c', sortable: false, export: false, render: function (row) { return actions([button('edit', '수정'), button('state', row.useYn === 'Y' ? '미사용' : '사용')]); } } ], onAction: function (action, row) { if (!row) return; if (action === 'edit') edit(row.id); if (action === 'state') changeState(row); } });
      host.querySelector('[data-ops-account-add]').addEventListener('click', function () { edit(null); });
    }
    function edit(recordId) {
      var original = accounts().filter(function (row) { return row.id === recordId; })[0], row = original || { userId: '', name: '', role: 'SERVICE', department: '', phone: '', email: '' };
      var body = '<div class="form-grid ops-form-grid">' + field('사용자 ID *', input('userId', row.userId, 'type="email" required maxlength="100" autocomplete="off"' + (original ? ' readonly' : ''))) + field('이름 *', input('name', row.name, 'required maxlength="30"')) + field('권한 *', select('role', [['ADMIN', 'Admin'], ['SERVICE', 'Service']], row.role)) + field('부서', input('department', row.department, 'maxlength="60"')) + field('연락처 *', input('phone', row.phone, 'type="tel" required minlength="8" maxlength="20"')) + field('이메일 *', input('email', row.email, 'type="email" required maxlength="100"')) + field(original ? '새 비밀번호' : '비밀번호 *', input('password', '', 'type="password" minlength="8" maxlength="64" autocomplete="new-password"' + (original ? '' : ' required'))) + field(original ? '새 비밀번호 확인' : '비밀번호 확인 *', input('passwordConfirm', '', 'type="password" maxlength="64" autocomplete="new-password"' + (original ? '' : ' required'))) + '<p class="ops-inline-message col-2">비밀번호는 영문·숫자를 포함해 8자 이상 입력해 주세요.' + (original ? ' 변경하지 않을 경우 비워 두세요.' : '') + '</p></div>';
      O.modal({ title: original ? '내부 계정 수정' : '내부 계정 등록', body: body, wide: true, submitLabel: '저장', onSubmit: function (form, close) {
        var list = accounts(), userId = formValue(form, 'userId').toLowerCase(), name = formValue(form, 'name'), password = form.elements.password.value, confirmation = form.elements.passwordConfirm.value;
        if (!name) { notifyError(form, 'name', '이름을 입력해 주세요.'); return; }
        if (!/^[0-9+()\s-]{8,20}$/.test(formValue(form, 'phone'))) { notifyError(form, 'phone', '연락처 형식을 확인해 주세요.'); return; }
        if (list.some(function (item) { return item.id !== recordId && same(item.userId, userId); })) { notifyError(form, 'userId', '이미 등록된 사용자 ID입니다.'); return; }
        if ((!original || password) && (!/[a-z]/i.test(password) || !/\d/.test(password) || password.length < 8)) { notifyError(form, 'password', '영문·숫자를 포함해 8자 이상 입력해 주세요.'); return; }
        if (password !== confirmation) { notifyError(form, 'passwordConfirm', '비밀번호가 일치하지 않습니다.'); return; }
        var role = formValue(form, 'role');
        if (original && original.role === 'ADMIN' && original.useYn === 'Y' && role !== 'ADMIN' && list.filter(function (item) { return item.role === 'ADMIN' && item.useYn === 'Y'; }).length <= 1) { O.notify('사용 중인 Admin 계정이 최소 1개 필요합니다.'); return; }
        var next = Object.assign({}, original || {}, { id: recordId || uid('OA'), userId: userId, name: name, role: role, department: formValue(form, 'department'), phone: formValue(form, 'phone'), email: formValue(form, 'email'), useYn: original ? original.useYn : 'Y', deactivatedAt: original ? original.deactivatedAt : '', createdAt: original ? original.createdAt : stamp(), updatedAt: stamp(), credentialSetAt: password ? stamp() : original.credentialSetAt });
        // Password input is validated for this local flow but never persisted or exported.
        if (original) list = list.map(function (item) { return item.id === recordId ? next : item; }); else list.unshift(next);
        if (!save(KEYS.accounts, list)) return; close(); render(); O.notify('내부 계정을 저장했습니다.');
      } });
    }
    function changeState(row) {
      var active = row.useYn === 'Y';
      O.confirm({ title: active ? '내부 계정 미사용' : '내부 계정 사용', body: '<p><strong>' + e(row.name) + '</strong> (' + e(row.userId) + ') 계정을 ' + (active ? '미사용' : '사용') + '으로 변경하시겠습니까?</p>', onConfirm: function () {
        var list = accounts(), current = list.filter(function (item) { return item.id === row.id; })[0]; if (!current) return;
        if (active && current.role === 'ADMIN' && list.filter(function (item) { return item.role === 'ADMIN' && item.useYn === 'Y'; }).length <= 1) { O.notify('사용 중인 Admin 계정이 최소 1개 필요합니다.'); return; }
        current.useYn = active ? 'N' : 'Y'; current.deactivatedAt = active ? today() : ''; current.updatedAt = stamp(); if (!save(KEYS.accounts, list)) return; render(); O.notify('계정 사용 상태를 변경했습니다.');
      } });
    }
    render();
  });
})();
