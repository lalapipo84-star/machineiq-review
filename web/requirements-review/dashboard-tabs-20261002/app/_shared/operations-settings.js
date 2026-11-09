(function () {
  'use strict';
  var api = window.MIQOps;
  if (!api) return;
  var KEYS = { codes: 'settings.codes.v1', languages: 'settings.languages.v1', notices: 'settings.notices.v1', menus: 'settings.menus.v1', history: 'settings.history.v1' };
  var sites = [['ADMIN', '운영관리'], ['FLEET', '차량관제'], ['RENTAL', '렌탈'], ['APP', '모바일']];
  var roles = [['ADMIN', '관리자'], ['SERVICE', '서비스'], ['SALES', '영업'], ['MANAGER', '내부 담당자'], ['FLEET', '고객 대표'], ['FLEET_GROUP', '고객 직원'], ['DEALER', '딜러 대표'], ['DEALER_GROUP', '딜러 직원'], ['RENTAL', '렌탈 대표'], ['RENTAL_GROUP', '렌탈 직원']];
  function esc(value) { return api.esc(value == null ? '' : String(value)); }
  function now() { var d = new Date(); return dateString(d) + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function dateString(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function day(offset) { var d = new Date(); d.setDate(d.getDate() + offset); return dateString(d); }
  function uid(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8); }
  function value(form, name) { var el = form.elements.namedItem(name); return el ? String(el.value || '').trim() : ''; }
  function requiredText(form, name, label) { var text = value(form, name); if (!text) throw new Error(label + '을(를) 입력해 주세요.'); return text; }
  function option(list, current) { return list.map(function (item) { return '<option value="' + esc(item[0]) + '"' + (String(current) === String(item[0]) ? ' selected' : '') + '>' + esc(item[1]) + '</option>'; }).join(''); }
  function field(label, content, full) { return '<label class="ops-form-field' + (full ? ' col-2' : '') + '"><span>' + esc(label) + '</span>' + content + '</label>'; }
  function input(name, val, attrs) { return '<input class="inp" name="' + esc(name) + '" value="' + esc(val) + '" ' + (attrs || '') + '>'; }
  function select(name, list, current) { return '<select class="inp" name="' + esc(name) + '">' + option(list, current) + '</select>'; }
  function button(action, label, primary) { return '<button type="button" class="btn' + (primary ? ' btn--pri' : '') + '" data-action="' + esc(action) + '">' + esc(label) + '</button>'; }
  function rowButton(action, label) { return '<button type="button" class="btn btn--sm" data-action="' + esc(action) + '">' + esc(label) + '</button>'; }
  function actions(items) { return '<span class="mm-inline-actions">' + items.join('') + '</span>'; }
  function status(active) { return active ? '사용' : '중지'; }
  function matches(text, query) { return String(text || '').toLocaleLowerCase().indexOf(String(query || '').toLocaleLowerCase()) >= 0; }
  function positiveOrder(form) { var n = Number(value(form, 'order')); if (!Number.isInteger(n) || n < 1 || n > 9999) { api.notify('표시 순서는 1~9999 사이의 정수로 입력해 주세요.'); return null; } return n; }
  function codeValid(code) { return /^[A-Z][A-Z0-9_.-]{0,39}$/.test(code); }
  function validRange(from, to) { return !from || !to || from <= to; }
  function read(key, seed) { return api.read(KEYS[key], seed); }
  function save(key, data, action, target) {
    api.write(KEYS[key], data);
    var records = read('history', historySeed());
    records.unshift({ id: uid('LOG'), date: now(), user: '운영 담당자', role: 'ADMIN', site: 'ADMIN', menu: target, action: action, result: '성공', ip: '현재 브라우저', detail: target + ' ' + action + ' 완료' });
    api.write(KEYS.history, records.slice(0, 500));
  }
  function filters(html) { return '<form class="ops-filters">' + html + '<button type="submit" class="btn-search">조회</button></form>'; }
  function bindFilters(host, commit) {
    var form = host.querySelector('.ops-filters');
    form.addEventListener('submit', function (event) { event.preventDefault(); commit(form); });
  }
  function actionHost(host, handler) { host.addEventListener('click', function (event) { var node = event.target.closest('[data-ops-action]'); if (node && host.contains(node)) handler(node.dataset.opsAction); }); }
  function tool(action, label, primary) { return button(action, label, primary).replace('data-action=', 'data-ops-action='); }
  function grid(host, config) {
    var header = host.previousElementSibling;
    while (header && header.matches('input[hidden]')) header = header.previousElementSibling;
    api.grid(host, Object.assign({ pageSize: 15, actionHeader: header && header.matches('.list-head') ? header : null }, config));
  }

  function codeSeed() {
    var groups = [
      { id: 'FUEL', name: '동력 유형', en: 'Power type', ja: '動力種類', order: 1, active: true },
      { id: 'STATUS', name: '차량 상태', en: 'Vehicle status', ja: '車両状態', order: 2, active: true },
      { id: 'ROLE', name: '사용자 역할', en: 'User role', ja: '利用者権限', order: 3, active: true },
      { id: 'EVENT', name: '이벤트 분류', en: 'Event category', ja: 'イベント区分', order: 4, active: true },
      { id: 'REGION', name: '서비스 권역', en: 'Service region', ja: 'サービス地域', order: 5, active: true },
      { id: 'LEGACY', name: '이전 분류', en: 'Previous category', ja: '旧区分', order: 6, active: false }
    ];
    var seeds = {
      FUEL: [['LI', '리튬', 'Lithium', 'リチウム'], ['PB', '납산', 'Lead-acid', '鉛蓄電池'], ['DI', '디젤', 'Diesel', 'ディーゼル'], ['LP', 'LPG', 'LPG', 'LPG']],
      STATUS: [['RUN', '가동', 'Running', '稼働'], ['IDLE', '유휴', 'Idle', '待機'], ['OFF', '미연결', 'Disconnected', '未接続'], ['FAULT', '고장', 'Fault', '故障'], ['WAIT', '대기', 'Waiting', '待機中']],
      ROLE: roles.map(function (r) { return [r[0], r[1], r[0], '']; }),
      EVENT: [['SHOCK', '충격', 'Shock', '衝撃'], ['ERROR', '차량 에러', 'Vehicle error', '車両エラー'], ['SUPPLY', '소모품', 'Consumable', '消耗品'], ['BATTERY', '배터리', 'Battery', 'バッテリー'], ['CONNECTION', '통신', 'Connection', '通信']],
      REGION: [['SEOUL', '서울', 'Seoul', 'ソウル'], ['GYEONGGI', '경기', 'Gyeonggi', '京畿'], ['INCHEON', '인천', 'Incheon', '仁川'], ['BUSAN', '부산', 'Busan', '釜山'], ['DAEGU', '대구', 'Daegu', '大邱'], ['DAEJEON', '대전', 'Daejeon', '大田'], ['GWANGJU', '광주', 'Gwangju', '光州'], ['ULSAN', '울산', 'Ulsan', '蔚山'], ['SEJONG', '세종', 'Sejong', '世宗'], ['GANGWON', '강원', 'Gangwon', '江原'], ['CHUNGBUK', '충북', 'Chungbuk', '忠北'], ['CHUNGNAM', '충남', 'Chungnam', '忠南'], ['JEONBUK', '전북', 'Jeonbuk', '全北'], ['JEONNAM', '전남', 'Jeonnam', '全南'], ['GYEONGBUK', '경북', 'Gyeongbuk', '慶北'], ['GYEONGNAM', '경남', 'Gyeongnam', '慶南'], ['JEJU', '제주', 'Jeju', '済州']],
      LEGACY: [['OLD_A', '이전 상태 A', 'Previous A', ''], ['OLD_B', '이전 상태 B', 'Previous B', '']]
    };
    var codes = [];
    Object.keys(seeds).forEach(function (group) { seeds[group].forEach(function (item, index) { codes.push({ id: group + ':' + item[0], group: group, code: item[0], name: item[1], en: item[2], ja: item[3], order: index + 1, active: group !== 'LEGACY', updated: day(-3) }); }); });
    return { groups: groups, codes: codes };
  }

  api.register('codes', function (ctx) {
    var data = read('codes', codeSeed()), state = { group: 'FUEL', query: '', active: '' };
    // Old browser ledgers must not restore a retired power type.
    data.codes = data.codes.filter(function (row) { return row.group !== 'FUEL' || !/^(HI|HY|hydrogen|수소)$/i.test(String(row.code)) && !/^(hydrogen|수소|水素)$/i.test(String(row.name)); });
    function editGroup(existing) {
      var item = existing || { id: '', name: '', en: '', ja: '', order: data.groups.length + 1, active: true };
      api.modal({ title: existing ? '코드 그룹 수정' : '코드 그룹 추가', body: '<div class="form-grid">' +
        field('그룹 코드', input('id', item.id, 'required maxlength="40" ' + (existing ? 'readonly' : 'placeholder="영문 대문자·숫자"'))) +
        field('그룹명', input('name', item.name, 'required maxlength="80"')) +
        field('English', input('en', item.en, 'maxlength="120"')) + field('日本語', input('ja', item.ja, 'maxlength="120"')) +
        field('표시 순서', input('order', item.order, 'type="number" min="1" max="9999" required')) + field('사용 여부', select('active', [['Y', '사용'], ['N', '중지']], item.active ? 'Y' : 'N')) + '</div>',
        submitLabel: '저장', onSubmit: function (form, close) {
          var id = value(form, 'id'), order = positiveOrder(form); if (order === null) return;
          if (!codeValid(id)) return api.notify('그룹 코드는 영문 대문자로 시작하며 영문·숫자·점·밑줄·하이픈을 사용할 수 있습니다.');
          if (!existing && data.groups.some(function (g) { return g.id === id; })) return api.notify('이미 등록된 그룹 코드입니다.');
          var next = { id: id, name: requiredText(form, 'name', '그룹명'), en: value(form, 'en'), ja: value(form, 'ja'), order: order, active: value(form, 'active') === 'Y' };
          if (existing) Object.assign(existing, next); else data.groups.push(next);
          save('codes', data, existing ? '수정' : '등록', '코드 그룹 ' + next.name); state.group = id; close(); render(); api.notify('저장했습니다.');
        } });
    }
    function editCode(existing) {
      var group = data.groups.find(function (g) { return g.id === state.group; }); if (!group) return;
      var item = existing || { code: '', name: '', en: '', ja: '', order: data.codes.filter(function (r) { return r.group === group.id; }).length + 1, active: true };
      api.modal({ title: existing ? '하위 코드 수정' : '하위 코드 추가', body: '<div class="form-grid">' +
        field('코드 그룹', input('group', group.name, 'readonly')) + field('코드', input('code', item.code, 'required maxlength="40" ' + (existing ? 'readonly' : ''))) +
        field('한국어명', input('name', item.name, 'required maxlength="100"'), true) + field('English', input('en', item.en, 'maxlength="150"')) + field('日本語', input('ja', item.ja, 'maxlength="150"')) +
        field('표시 순서', input('order', item.order, 'type="number" min="1" max="9999" required')) + field('사용 여부', select('active', [['Y', '사용'], ['N', '중지']], item.active ? 'Y' : 'N')) + '</div>',
        submitLabel: '저장', onSubmit: function (form, close) {
          var code = value(form, 'code'), order = positiveOrder(form); if (order === null) return;
          if (!codeValid(code)) return api.notify('코드는 영문 대문자로 시작하며 영문·숫자·점·밑줄·하이픈을 사용할 수 있습니다.');
          if (!existing && data.codes.some(function (r) { return r.group === group.id && r.code === code; })) return api.notify('이 그룹에 같은 코드가 있습니다.');
          var next = { id: group.id + ':' + code, group: group.id, code: code, name: requiredText(form, 'name', '한국어명'), en: value(form, 'en'), ja: value(form, 'ja'), order: order, active: value(form, 'active') === 'Y', updated: day(0) };
          if (existing) Object.assign(existing, next); else data.codes.push(next);
          save('codes', data, existing ? '수정' : '등록', '하위 코드 ' + code); close(); render(); api.notify('저장했습니다.');
        } });
    }
    function render() {
      var groups = data.groups.slice().sort(function (a, b) { return a.order - b.order; }), group = groups.find(function (g) { return g.id === state.group; }) || groups[0]; state.group = group ? group.id : '';
      var groupOptions = groups.length ? groups.map(function (g) { return [g.id, g.name + (g.active ? '' : ' · 중지')]; }) : [['', '등록된 코드 그룹 없음']];
      MIQCommon.view.set(ctx.el,"innerHTML",filters(field('코드 그룹', select('group', groupOptions, state.group)) + field('사용 여부', select('active', [['', '전체'], ['Y', '사용'], ['N', '중지']], state.active)) + field('검색', input('query', state.query, 'type="search" placeholder="코드·코드명"'))) +
        '<div class="list-head"><span class="list-head__count">' + (group ? esc(group.name) + ' <span class="mm-list-summary__secondary">' + esc(group.id) + ' · ' + status(group.active) + '</span>' : '등록된 코드 그룹 없음') + '</span><div class="ops-actions">' + tool('add-group', '그룹 추가') + tool('edit-group', '그룹 수정') + tool('add-code', '코드 추가', true) + '</div></div><div data-grid></div>');
      ctx.el.querySelector('[data-ops-action="edit-group"]').disabled = !group;
      ctx.el.querySelector('[data-ops-action="add-code"]').disabled = !group;
      bindFilters(ctx.el, function (form) { state = { group: value(form, 'group'), active: value(form, 'active'), query: value(form, 'query') }; render(); });
      actionHost(ctx.el.querySelector('.list-head'), function (action) { if (action === 'add-group') editGroup(); if (action === 'edit-group') editGroup(group); if (action === 'add-code') editCode(); });
      grid(ctx.el.querySelector('[data-grid]'), { rows: group ? data.codes.filter(function (r) { return r.group === state.group && (!state.active || r.active === (state.active === 'Y')) && matches(r.code + ' ' + r.name + ' ' + r.en + ' ' + r.ja, state.query); }) : [], emptyText: group ? undefined : '등록된 코드 그룹이 없습니다. 그룹을 추가해 주세요.', defaultSort: { key: 'order', dir: 'asc' }, columns: [
        { key: 'order', label: '순서', className: 'c' }, { key: 'code', label: '코드' }, { key: 'name', label: '한국어명' }, { key: 'en', label: 'English' }, { key: 'ja', label: '日本語' },
        { key: 'active', label: '사용 여부', render: function (r) { return status(r.active); }, exportValue: function (r) { return status(r.active); } }, { key: 'updated', label: '수정일' }, { key: 'actions', label: '관리', render: function (r) { return actions([rowButton('edit', '수정'), rowButton('toggle', r.active ? '중지' : '사용')]); } }
      ], onAction: function (action, row) { if (action === 'edit') editCode(row); if (action === 'toggle') api.confirm({ title: '코드 사용 여부 변경', body: esc(row.name) + ' 코드를 ' + (row.active ? '중지' : '사용') + '하시겠습니까?', onConfirm: function () { row.active = !row.active; row.updated = day(0); save('codes', data, '사용 여부 변경', row.code); render(); api.notify('변경했습니다.'); } }); } });
    }
    render();
  });

  function languageSeed() {
    var labels = [['COMMON.SEARCH','조회','Search','検索'],['COMMON.SAVE','저장','Save','保存'],['COMMON.CANCEL','취소','Cancel','取消'],['COMMON.CLOSE','닫기','Close','閉じる'],['COMMON.RESET','초기화','Reset','初期化'],['COMMON.EXPORT','내보내기','Export','エクスポート'],['COMMON.ALL','전체','All','全体'],['COMMON.EMPTY','조회 결과가 없습니다.','No results found.','検索結果がありません。'],['COMMON.PREV','이전','Previous','前へ'],['COMMON.NEXT','다음','Next','次へ'],['COMMON.ADD','추가','Add','追加'],['COMMON.EDIT','수정','Edit','編集'],['COMMON.DELETE','삭제','Delete','削除'],['COMMON.SELECT','선택','Select','選択'],['VEHICLE.TITLE','차량','Vehicles','車両'],['VEHICLE.SUMMARY','요약정보','Summary','サマリー'],['VEHICLE.SHOCK','충격','Shock','衝撃'],['VEHICLE.LITHIUM','리튬 배터리','Lithium battery','リチウム電池'],['SERVICE.REPAIR','수리이력','Repair history','修理履歴'],['SERVICE.SUPPLY','소모품 관리','Consumables','消耗品管理'],['SERVICE.ERROR','차량 에러','Vehicle errors','車両エラー'],['REPORT.STATUS','현황 리포트','Status report',''],['REPORT.COMPARE','비교 리포트','Comparison report',''],['OPS.HISTORY','접속 이력','Access history','アクセス履歴'],['OPS.LANGUAGE','다국어','Languages','多言語'],['OPS.CODE','공통코드','Common codes','共通コード'],['OPS.NOTICE','공지','Notices','お知らせ'],['OPS.MENU','메뉴 및 접근권한','Menus and access',''],['ACCOUNT.ROLE','역할','Role','権限'],['ACCOUNT.STATUS','사용 상태','Status','利用状態']];
    return { languages: [{ code: 'ko', name: '한국어', active: true }, { code: 'en', name: 'English', active: true }, { code: 'ja', name: '日本語', active: true }, { code: 'zh', name: '中文', active: false }], phrases: labels.map(function (r, i) { return { id: r[0], texts: { ko: r[1], en: r[2], ja: r[3], zh: i < 2 ? ['查询','保存'][i] : '' }, updated: day(-(i % 8)) }; }) };
  }

  function parseCsv(text) {
    text = String(text).replace(/^\uFEFF/, ''); var rows = [], row = [], cell = '', quoted = false, afterQuote = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; afterQuote = true; } } else cell += c; continue; }
      if (afterQuote && c !== ',' && c !== '\r' && c !== '\n') throw new Error('닫는 따옴표 뒤에 잘못된 문자가 있습니다.');
      if (c === '"') { if (cell) throw new Error('따옴표 형식을 확인해 주세요.'); quoted = true; }
      else if (c === ',') { row.push(cell); cell = ''; afterQuote = false; }
      else if (c === '\r' || c === '\n') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); if (row.some(function (v) { return v !== ''; })) rows.push(row); row = []; cell = ''; afterQuote = false; }
      else cell += c;
    }
    if (quoted) throw new Error('닫히지 않은 따옴표가 있습니다.');
    row.push(cell); if (row.some(function (v) { return v !== ''; })) rows.push(row);
    return rows;
  }

  api.register('languages', function (ctx) {
    var data = read('languages', languageSeed()), state = { language: 'en', query: '', translated: '' };
    function editLanguage(existing) {
      var item = existing || { code: '', name: '', active: true };
      api.modal({ title: existing ? '언어 수정' : '언어 추가', body: '<div class="form-grid">' + field('언어 코드', input('code', item.code, 'required maxlength="10" ' + (existing ? 'readonly' : 'placeholder="예: fr"'))) + field('언어명', input('name', item.name, 'required maxlength="40"')) + field('사용 여부', select('active', [['Y','사용'],['N','중지']], item.active ? 'Y' : 'N')) + '</div>', submitLabel: '저장', onSubmit: function (form, close) {
        var code = value(form, 'code'); if (!/^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(code)) return api.notify('언어 코드는 en, ja, zh-CN 형식으로 입력해 주세요.');
        if (!existing && data.languages.some(function (r) { return r.code === code; })) return api.notify('이미 등록된 언어입니다.');
        if (code === 'ko' && value(form, 'active') !== 'Y') return api.notify('기준 언어인 한국어는 사용 상태를 유지해야 합니다.');
        var next = { code: code, name: requiredText(form, 'name', '언어명'), active: value(form, 'active') === 'Y' };
        if (existing) Object.assign(existing, next); else { data.languages.push(next); data.phrases.forEach(function (r) { r.texts[code] = ''; }); }
        state.language = code; save('languages', data, existing ? '수정' : '등록', '언어 ' + next.name); close(); render(); api.notify('저장했습니다.');
      } });
    }
    function editPhrase(existing) {
      var item = existing || { id: '', texts: {} };
      api.modal({ title: existing ? '문구 수정' : '문구 추가', wide: true, body: '<div class="form-grid">' + field('문구 코드', input('id', item.id, 'required maxlength="40" ' + (existing ? 'readonly' : 'placeholder="예: COMMON.CONFIRM"')), true) + data.languages.map(function (lang) { return field(lang.name + ' (' + lang.code + ')', '<textarea class="inp" name="text_' + esc(lang.code) + '" rows="2" maxlength="1000"' + (lang.code === 'ko' ? ' required' : '') + '>' + esc(item.texts[lang.code] || '') + '</textarea>'); }).join('') + '</div>', submitLabel: '저장', onSubmit: function (form, close) {
        var id = value(form, 'id'); if (!codeValid(id)) return api.notify('문구 코드는 영문 대문자로 시작하며 영문·숫자·점·밑줄·하이픈을 사용할 수 있습니다.');
        if (!existing && data.phrases.some(function (r) { return r.id === id; })) return api.notify('이미 등록된 문구 코드입니다.');
        var texts = {}; data.languages.forEach(function (lang) { texts[lang.code] = lang.code === 'ko' ? requiredText(form, 'text_ko', '한국어 문구') : value(form, 'text_' + lang.code); });
        var next = { id: id, texts: texts, updated: day(0) }; if (existing) Object.assign(existing, next); else data.phrases.push(next);
        save('languages', data, existing ? '수정' : '등록', '문구 ' + id); close(); render(); api.notify('저장했습니다.');
      } });
    }
    function upload(file) {
      if (!file) return;
      if (!/\.csv$/i.test(file.name)) return api.notify('CSV 파일을 선택해 주세요.');
      if (file.size > 2 * 1024 * 1024) return api.notify('파일은 2MB 이하로 선택해 주세요.');
      file.text().then(function (text) {
        var rows = parseCsv(text), header = ['코드'].concat(data.languages.map(function (r) { return r.code; }));
        if (!rows.length || rows[0].length !== header.length || rows[0].some(function (v, i) { return v.trim() !== header[i]; })) throw new Error('현재 언어 목록의 파일 양식과 헤더가 다릅니다. 파일 양식을 다시 내려받아 주세요.');
        if (rows.length < 2 || rows.length > 5001) throw new Error('1~5000개의 문구를 입력해 주세요.');
        var seen = new Set(), staged = rows.slice(1).map(function (r, index) {
          if (r.length !== header.length) throw new Error((index + 2) + '행의 열 수가 다릅니다.');
          var id = r[0].trim(); if (!codeValid(id) || seen.has(id)) throw new Error((index + 2) + '행의 문구 코드가 잘못되었거나 중복됩니다.'); seen.add(id);
          if (!r[1].trim()) throw new Error((index + 2) + '행의 한국어 문구를 입력해 주세요.');
          var texts = {}; data.languages.forEach(function (lang, i) { if (r[i + 1].length > 1000) throw new Error((index + 2) + '행의 문구는 1000자 이하로 입력해 주세요.'); texts[lang.code] = r[i + 1]; });
          return { id: id, texts: texts, updated: day(0) };
        });
        var added = staged.filter(function (r) { return !data.phrases.some(function (old) { return old.id === r.id; }); }).length;
        api.modal({ title: '문구 파일 적용 확인', body: '<p>추가 ' + added + '개 · 수정 ' + (staged.length - added) + '개 · 총 ' + staged.length + '개 문구를 저장합니다.</p><div class="tbl-wrap"><table class="tbl"><thead><tr><th>코드</th><th>한국어</th></tr></thead><tbody>' + staged.slice(0, 5).map(function (r) { return '<tr><td>' + esc(r.id) + '</td><td>' + esc(r.texts.ko) + '</td></tr>'; }).join('') + '</tbody></table></div>', submitLabel: '적용', onSubmit: function (form, close) {
          staged.forEach(function (r) { var old = data.phrases.find(function (p) { return p.id === r.id; }); if (old) Object.assign(old, r); else data.phrases.push(r); });
          save('languages', data, '파일 적용', '다국어 ' + staged.length + '개 문구'); close(); render(); api.notify('문구 파일을 적용했습니다.');
        } });
      }).catch(function (error) { api.notify(error.message || 'CSV 파일을 읽지 못했습니다.'); });
    }
    function render() {
      var lang = data.languages.find(function (r) { return r.code === state.language; }) || data.languages[0]; state.language = lang.code;
      MIQCommon.view.set(ctx.el,"innerHTML",filters(field('언어', select('language', data.languages.map(function (r) { return [r.code, r.name + (r.active ? '' : ' · 중지')]; }), state.language)) + field('번역 상태', select('translated', [['','전체'],['Y','번역 완료'],['N','미번역']], state.translated)) + field('검색', input('query', state.query, 'type="search" placeholder="문구 코드·내용"'))) + '<div class="list-head"><span class="list-head__count">' + esc(lang.name) + ' <span class="mm-list-summary__secondary">' + status(lang.active) + '</span></span><div class="ops-actions">' + tool('add-language','언어 추가') + tool('edit-language','언어 수정') + tool('template','파일 양식') + tool('upload','파일 업로드') + tool('add-phrase','문구 추가',true) + '</div></div><input type="file" accept=".csv,text/csv" data-csv-upload hidden><div data-grid></div>');
      bindFilters(ctx.el, function (form) { state = { language: value(form, 'language'), translated: value(form, 'translated'), query: value(form, 'query') }; render(); });
      ctx.el.querySelector('[data-csv-upload]').addEventListener('change', function (e) { upload(e.target.files[0]); e.target.value = ''; });
      actionHost(ctx.el.querySelector('.list-head'), function (action) {
        if (action === 'add-language') editLanguage(); if (action === 'edit-language') editLanguage(lang); if (action === 'add-phrase') editPhrase();
        if (action === 'upload') ctx.el.querySelector('[data-csv-upload]').click();
        if (action === 'template') api.exportCsv('다국어_양식', ['코드'].concat(data.languages.map(function (r) { return r.code; })), data.phrases.map(function (r) { return [r.id].concat(data.languages.map(function (l) { return r.texts[l.code] || ''; })); }));
      });
      grid(ctx.el.querySelector('[data-grid]'), { rows: data.phrases.filter(function (r) { var filled = !!String(r.texts[lang.code] || '').trim(); return (!state.translated || filled === (state.translated === 'Y')) && matches(r.id + ' ' + r.texts.ko + ' ' + (r.texts[lang.code] || ''), state.query); }).map(function (r) { return Object.assign({}, r, { korean: r.texts.ko, translation: r.texts[lang.code] || '' }); }), defaultSort: { key: 'id', dir: 'asc' }, columns: [
        { key: 'id', label: '문구 코드' }, { key: 'korean', label: '한국어', render: function(r){return '<span translate="no">'+esc(r.korean)+'</span>';} }, { key: 'translation', label: lang.name, render: function (r) { return r.translation ? '<span translate="no">'+esc(r.translation)+'</span>' : '<span class="mute">미번역</span>'; } }, { key: 'updated', label: '수정일' }, { key: 'actions', label: '관리', render: function () { return rowButton('edit','수정'); } }
      ], onAction: function (action, row) { if (action === 'edit') editPhrase(data.phrases.find(function (r) { return r.id === row.id; })); } });
    }
    render();
  });

  function noticeSeed() {
    var titles = ['시스템 정기 점검 안내','차량 데이터 조회 기능 안내','서비스 운영시간 안내','배터리 관리 안내','운행 리포트 확인 안내','계정 보안 점검 안내','그룹별 차량 조회 안내','장비 연결 상태 확인 안내'];
    return Array.from({ length: 23 }, function (_, i) { return { id: 'NOTICE-' + String(i + 1).padStart(3, '0'), title: titles[i % titles.length] + (i > 7 ? ' (' + (Math.floor(i / 8) + 1) + ')' : ''), target: ['ALL','INTERNAL','DEALER','CUSTOMER'][i % 4], state: i % 7 === 0 ? 'DRAFT' : i % 6 === 0 ? 'STOPPED' : 'PUBLISHED', from: day(i === 2 ? 2 : -i - 1), to: day(i === 3 ? -1 : 30 - i), pinned: i < 2, body: titles[i % titles.length] + '\n\n안내 내용을 확인해 주세요.\n상세 문의는 담당 서비스 창구로 연락해 주시기 바랍니다.', author: '운영 담당자', updated: day(-i) }; });
  }
  var noticeTargets = [['ALL','전체'],['INTERNAL','내부 사용자'],['DEALER','딜러'],['CUSTOMER','고객']];
  function noticeStatus(row) { if (row.state === 'DRAFT') return '작성 중'; if (row.state === 'STOPPED') return '게시 중지'; if (row.from > day(0)) return '게시 예정'; if (row.to && row.to < day(0)) return '게시 종료'; return '게시 중'; }
  api.register('notices', function (ctx) {
    var data = read('notices', noticeSeed()), state = { query: '', target: '', status: '' };
    function edit(existing) {
      var item = existing || { title: '', target: 'ALL', from: day(0), to: day(30), pinned: false, body: '', state: 'DRAFT' };
      api.modal({ title: existing ? '공지 수정' : '공지 등록', wide: true, body: '<div class="form-grid">' + field('제목', input('title', item.title, 'required maxlength="150"'), true) + field('게시 대상', select('target', noticeTargets, item.target)) + field('상단 고정', select('pinned', [['N','일반'],['Y','고정']], item.pinned ? 'Y' : 'N')) + field('게시 시작일', input('from', item.from, 'type="date" required')) + field('게시 종료일', input('to', item.to, 'type="date" required')) + field('게시 상태', select('state', [['DRAFT','작성 중'],['PUBLISHED','게시'],['STOPPED','게시 중지']], item.state)) + field('내용', '<textarea class="inp" name="body" rows="8" maxlength="10000" required>' + esc(item.body) + '</textarea>', true) + '</div>', submitLabel: '저장', onSubmit: function (form, close) {
        var from = value(form, 'from'), to = value(form, 'to'); if (!validRange(from, to)) return api.notify('게시 종료일은 시작일 이후로 선택해 주세요.');
        var next = { id: existing ? existing.id : uid('NOTICE'), title: requiredText(form, 'title', '제목'), target: value(form, 'target'), from: from, to: to, pinned: value(form, 'pinned') === 'Y', state: value(form, 'state'), body: requiredText(form, 'body', '내용'), author: '운영 담당자', updated: day(0) };
        if (existing) Object.assign(existing, next); else data.unshift(next);
        save('notices', data, existing ? '수정' : '등록', '공지 ' + next.title); close(); render(); api.notify('저장했습니다.');
      } });
    }
    function detail(row) {
      api.modal({ title: '공지 상세', body: '<article class="ops-notice-detail"><h3 class="box__name">' + esc(row.title) + '</h3><div class="mm-request-detail"><dl>' +
        '<div><dt>게시 대상</dt><dd>' + esc(noticeTargets.find(function (t) { return t[0] === row.target; })[1]) + '</dd></div>' +
        '<div><dt>상태</dt><dd>' + esc(noticeStatus(row)) + '</dd></div>' +
        '<div class="col-2"><dt>게시 기간</dt><dd>' + esc(row.from + ' ~ ' + row.to) + '</dd></div>' +
        '</dl></div><section class="ops-notice-content" aria-label="공지 내용"><div class="ops-pre">' + esc(row.body) + '</div></section></article>', submitLabel: '닫기', onSubmit: function (form, close) { close(); } });
    }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",filters(field('게시 대상', select('target', [['','전체 대상']].concat(noticeTargets), state.target)) + field('게시 상태', select('status', [['','전체 상태'],['작성 중','작성 중'],['게시 중','게시 중'],['게시 예정','게시 예정'],['게시 종료','게시 종료'],['게시 중지','게시 중지']], state.status)) + field('검색', input('query', state.query, 'type="search" placeholder="제목·내용"'))) + '<div class="list-head"><span class="list-head__count">공지 목록</span><div class="ops-actions">' + tool('add','공지 등록',true) + '</div></div><div data-grid></div>');
      bindFilters(ctx.el, function (form) { state = { target: value(form, 'target'), status: value(form, 'status'), query: value(form, 'query') }; render(); });
      actionHost(ctx.el.querySelector('.list-head'), function () { edit(); });
      grid(ctx.el.querySelector('[data-grid]'), { rows: data.filter(function (r) { return (!state.target || r.target === state.target) && (!state.status || noticeStatus(r) === state.status) && matches(r.title + ' ' + r.body, state.query); }), defaultSort: { key: 'updated', dir: 'desc' }, columns: [
        { key: 'pinned', label: '구분', render: function (r) { return r.pinned ? '고정' : '일반'; }, exportValue: function (r) { return r.pinned ? '고정' : '일반'; } }, { key: 'title', label: '제목', render: function (r) { return '<button type="button" class="ops-text-button" data-action="detail">' + esc(r.title) + '</button>'; } },
        { key: 'target', label: '게시 대상', render: function (r) { return esc(noticeTargets.find(function (t) { return t[0] === r.target; })[1]); }, exportValue: function (r) { return noticeTargets.find(function (t) { return t[0] === r.target; })[1]; } }, { key: 'state', label: '상태', render: noticeStatus, sortValue: noticeStatus, exportValue: noticeStatus }, { key: 'from', label: '게시 시작' }, { key: 'to', label: '게시 종료' }, { key: 'updated', label: '수정일' },
        { key: 'actions', label: '관리', render: function (r) { return actions([rowButton('edit','수정'), rowButton('toggle', r.state === 'PUBLISHED' ? '중지' : '게시'), rowButton('delete','삭제')]); } }
      ], onAction: function (action, row) {
        if (action === 'detail') detail(row); if (action === 'edit') edit(row);
        if (action === 'toggle') api.confirm({ title: row.state === 'PUBLISHED' ? '공지 게시 중지' : '공지 게시', body: esc(row.title) + ' 공지를 ' + (row.state === 'PUBLISHED' ? '중지' : '게시') + '하시겠습니까?', onConfirm: function () { row.state = row.state === 'PUBLISHED' ? 'STOPPED' : 'PUBLISHED'; row.updated = day(0); save('notices', data, row.state === 'PUBLISHED' ? '게시' : '게시 중지', row.title); render(); api.notify('변경했습니다.'); } });
        if (action === 'delete') api.confirm({ title: '공지 삭제', body: esc(row.title) + ' 공지를 삭제하시겠습니까?', onConfirm: function () { data = data.filter(function (r) { return r.id !== row.id; }); save('notices', data, '삭제', row.title); render(); api.notify('삭제했습니다.'); } });
      } });
    }
    render();
  });

  function menuSeed() {
    var definitions = {
      ADMIN: [['DASH','대시보드','/dashboard',''],['MGMT','운영관리','/operations',''],['DATA','차량 데이터','/operations/data','MGMT'],['EQUIPMENT','장비코드','/operations/equipment','MGMT'],['CODES','공통코드','/operations/codes','MGMT'],['LANG','다국어','/operations/languages','MGMT'],['NOTICE','공지','/operations/notices','MGMT'],['USERS','내부계정','/operations/accounts','MGMT'],['MENUS','메뉴·접근권한','/operations/menus','MGMT'],['HISTORY','접속 이력','/operations/history','MGMT']],
      FLEET: [['DASH','대시보드','/fleet/dashboard',''],['ANALYSIS','운행이력','/fleet/analysis',''],['SUMMARY','요약정보','/fleet/analysis/summary','ANALYSIS'],['SHOCK','충격','/fleet/analysis/shock','ANALYSIS'],['BATTERY','리튬 배터리','/fleet/analysis/lithium','ANALYSIS'],['MAP','지도','/fleet/map',''],['SERVICE','서비스','/fleet/service',''],['REPORT','리포트','/fleet/report',''],['MGMT','관리','/fleet/management',''],['GROUP','그룹','/fleet/management/group','MGMT'],['USER','사용자','/fleet/management/user','MGMT']],
      RENTAL: [['DASH','대시보드','/rental/dashboard',''],['OPERATING','운영현황','/rental/operating',''],['EQUIPMENT','차량관리','/rental/equipment',''],['CONTRACT','계약관리','/rental/contract',''],['REPORT','수익 리포트','/rental/report',''],['GROUP','그룹관리','/rental/group','']],
      APP: [['HOME','홈','/app/home',''],['VEHICLE','차량','/app/vehicle',''],['SCAN','차량 조회','/app/scan',''],['SERVICE','서비스','/app/service',''],['NOTICE','공지','/app/notice',''],['ACCOUNT','내 정보','/app/account','']]
    };
    var items = [];
    Object.keys(definitions).forEach(function (site) { definitions[site].forEach(function (r, i) {
      var access = {}; roles.forEach(function (role) { access[role[0]] = role[0] === 'ADMIN' || (site === 'FLEET' && ['SERVICE','SALES','MANAGER','FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'].indexOf(role[0]) >= 0) || (site === 'RENTAL' && ['MANAGER','RENTAL','RENTAL_GROUP'].indexOf(role[0]) >= 0) || (site === 'APP' && ['FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'].indexOf(role[0]) >= 0); });
      if (r[0] === 'GROUP' || r[0] === 'USER') { access.FLEET_GROUP = false; access.DEALER_GROUP = false; }
      items.push({ id: site + '_' + r[0], site: site, name: r[1], path: r[2], parent: r[3] ? site + '_' + r[3] : '', order: i + 1, active: r[0] !== 'CONTRACT', access: access, updated: day(-3) });
    }); }); return items;
  }
  api.register('menus', function (ctx) {
    var data = read('menus', menuSeed()), state = { tab: 'structure', site: 'ADMIN', query: '', active: '' };
    function edit(existing) {
      var item = existing || { id: '', site: state.site, name: '', path: '', parent: '', order: data.filter(function (r) { return r.site === state.site; }).length + 1, active: true };
      var parents = [['','최상위']].concat(data.filter(function (r) { return r.site === item.site && !r.parent && r.id !== item.id; }).map(function (r) { return [r.id, r.name]; }));
      api.modal({ title: existing ? '메뉴 수정' : '메뉴 추가', wide: true, body: '<div class="form-grid">' + field('사이트', input('site', item.site, 'readonly')) + field('메뉴 ID', input('id', item.id, 'required maxlength="40" ' + (existing ? 'readonly' : 'placeholder="예: ADMIN_EXPORT"'))) + field('메뉴명', input('name', item.name, 'required maxlength="80"')) + field('상위 메뉴', select('parent', parents, item.parent)) + field('메뉴 경로', input('path', item.path, 'required maxlength="180" placeholder="/로 시작하는 경로"'), true) + field('표시 순서', input('order', item.order, 'type="number" min="1" max="9999" required')) + field('사용 여부', select('active', [['Y','사용'],['N','중지']], item.active ? 'Y' : 'N')) + '</div>', submitLabel: '저장', onSubmit: function (form, close) {
        var id = value(form, 'id'), order = positiveOrder(form), parent = value(form, 'parent'), route = value(form, 'path'); if (order === null) return;
        if (!codeValid(id)) return api.notify('메뉴 ID는 영문 대문자로 시작하는 코드로 입력해 주세요.');
        if (!existing && data.some(function (r) { return r.id === id; })) return api.notify('이미 등록된 메뉴 ID입니다.');
        if (!/^\/(?!\/)[A-Za-z0-9/_?.=&%#-]*$/.test(route)) return api.notify('메뉴 경로는 /로 시작하는 내부 경로로 입력해 주세요.');
        if (parent && existing && data.some(function (r) { return r.parent === existing.id; })) return api.notify('하위 메뉴가 있는 메뉴는 최상위로 유지해 주세요.');
        var access = existing ? existing.access : {}; if (!existing) roles.forEach(function (r) { access[r[0]] = r[0] === 'ADMIN'; });
        var next = { id: id, site: item.site, name: requiredText(form, 'name', '메뉴명'), path: route, parent: parent, order: order, active: value(form, 'active') === 'Y', access: access, updated: day(0) };
        if (existing) Object.assign(existing, next); else data.push(next);
        save('menus', data, existing ? '수정' : '등록', '메뉴 ' + next.name); close(); render(); api.notify('저장했습니다.');
      } });
    }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",'<div class="tabs" role="tablist" aria-label="메뉴 관리 구분"><button type="button" role="tab" data-tab="structure" class="' + (state.tab === 'structure' ? 'active' : '') + '" aria-selected="' + (state.tab === 'structure') + '">메뉴 구성</button><button type="button" role="tab" data-tab="access" class="' + (state.tab === 'access' ? 'active' : '') + '" aria-selected="' + (state.tab === 'access') + '">역할별 접근</button></div>' + filters(field('사이트', select('site', sites, state.site)) + field('사용 여부', select('active', [['','전체'],['Y','사용'],['N','중지']], state.active)) + field('검색', input('query', state.query, 'type="search" placeholder="메뉴 ID·메뉴명"'))) + '<div class="list-head"><span class="list-head__count">' + esc(sites.find(function (s) { return s[0] === state.site; })[1]) + (state.tab === 'access' ? ' 역할별 접근' : ' 메뉴 원장') + '</span><div class="ops-actions">' + (state.tab === 'structure' ? tool('add','메뉴 추가',true) : '') + '</div></div><div data-grid class="' + (state.tab === 'access' ? 'ops-matrix' : '') + '"></div>');
      ctx.el.querySelectorAll('[data-tab]').forEach(function (tab) { tab.addEventListener('click', function () { state.tab = tab.dataset.tab; render(); }); });
      bindFilters(ctx.el, function (form) { state.site = value(form, 'site'); state.query = value(form, 'query'); state.active = value(form, 'active'); render(); });
      actionHost(ctx.el.querySelector('.list-head'), function () { edit(); });
      var rows = data.filter(function (r) { return r.site === state.site && (!state.active || r.active === (state.active === 'Y')) && matches(r.id + ' ' + r.name, state.query); });
      var visibleRoles = roles.filter(function (r) { return state.site === 'ADMIN' ? ['ADMIN','SERVICE','SALES','MANAGER'].indexOf(r[0]) >= 0 : state.site === 'RENTAL' ? ['ADMIN','MANAGER','RENTAL','RENTAL_GROUP'].indexOf(r[0]) >= 0 : state.site === 'APP' ? ['ADMIN','FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'].indexOf(r[0]) >= 0 : ['ADMIN','SERVICE','SALES','MANAGER','FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'].indexOf(r[0]) >= 0; });
      var columns = state.tab === 'structure' ? [
        { key: 'order', label: '순서', className: 'c' }, { key: 'id', label: '메뉴 ID' }, { key: 'name', label: '메뉴명' }, { key: 'parent', label: '상위 메뉴', render: function (r) { var p = data.find(function (m) { return m.id === r.parent; }); return p ? esc(p.name) : '-'; }, exportValue: function (r) { var p = data.find(function (m) { return m.id === r.parent; }); return p ? p.name : '-'; } }, { key: 'path', label: '경로' }, { key: 'active', label: '사용 여부', render: function (r) { return status(r.active); }, exportValue: function (r) { return status(r.active); } }, { key: 'actions', label: '관리', render: function (r) { return actions([rowButton('edit','수정'), rowButton('toggle', r.active ? '중지' : '사용')]); } }
      ] : [{ key: 'name', label: '메뉴명' }].concat(visibleRoles.map(function (role) { return { key: 'access_' + role[0], label: role[1], className: 'c', sortValue: function (r) { return r.access[role[0]] ? 1 : 0; }, exportValue: function (r) { return r.access[role[0]] ? '허용' : '제한'; }, render: function (r) { return '<button type="button" class="btn btn--sm' + (r.access[role[0]] ? ' btn--ghost' : '') + '" role="switch" aria-checked="' + !!r.access[role[0]] + '" aria-label="' + esc(r.name + ' · ' + role[1] + ' 접근') + '" data-action="access-' + role[0] + '">' + (r.access[role[0]] ? '허용' : '제한') + '</button>'; } }; }));
      grid(ctx.el.querySelector('[data-grid]'), { rows: rows, columns: columns, defaultSort: { key: 'order', dir: 'asc' }, onAction: function (action, row) {
        if (action === 'edit') edit(row);
        if (action === 'toggle') api.confirm({ title: '메뉴 사용 여부 변경', body: esc(row.name) + ' 메뉴를 ' + (row.active ? '중지' : '사용') + '하시겠습니까?', onConfirm: function () { row.active = !row.active; row.updated = day(0); save('menus', data, '사용 여부 변경', row.name); render(); api.notify('변경했습니다.'); } });
        if (action.indexOf('access-') === 0) {
          var role = action.slice(7); if (!roles.some(function (r) { return r[0] === role; })) return;
          row.access[role] = !row.access[role]; row.updated = day(0); save('menus', data, '접근 ' + (row.access[role] ? '허용' : '제한'), row.name + ' / ' + role); render(); api.notify('접근 설정을 저장했습니다.');
        }
      } });
    }
    render();
  });

  function historySeed() {
    var contexts = [
      { site: 'ADMIN', roles: ['ADMIN'], menus: ['차량 데이터','장비코드','공통코드','다국어','공지','내부계정','메뉴·접근권한','접속 이력'] },
      { site: 'FLEET', roles: ['FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'], menus: ['대시보드','요약정보','충격','리튬 배터리','지도','수리이력','소모품 관리','차량 에러','현황 리포트'] },
      { site: 'RENTAL', roles: ['RENTAL','RENTAL_GROUP'], menus: ['대시보드','운영현황','차량관리','수익 리포트'] },
      { site: 'APP', roles: ['FLEET','FLEET_GROUP','DEALER','DEALER_GROUP'], menus: ['홈','차량','차량 조회','서비스','공지','내 정보'] }
    ];
    return Array.from({ length: 78 }, function (_, i) {
      var context = contexts[i % contexts.length], offset = Math.floor(i / contexts.length), role = context.roles[offset % context.roles.length], menu = context.menus[offset % context.menus.length];
      var denied = i % 13 === 0, action = context.site === 'ADMIN' ? ['조회','등록','수정','내보내기'][offset % 4] : ['조회','접속','조회','내보내기'][offset % 4];
      return { id: 'ACCESS-' + String(i + 1).padStart(4,'0'), date: day(-Math.floor(i / 10)) + ' ' + String(18 - i % 9).padStart(2,'0') + ':' + String(i * 7 % 60).padStart(2,'0'), user: '담당자 ' + (i % 8 + 1), role: role, site: context.site, menu: menu, action: action, result: denied ? '접근 제한' : '성공', ip: '10.20.' + (i % 4 + 1) + '.' + (i % 80 + 10), detail: menu + (denied ? ' 접근 권한 확인 후 제한 처리' : ' 화면 작업 완료') };
    });
  }
  api.register('history', function (ctx) {
    var data = read('history', historySeed()), state = { from: day(-7), to: day(0), query: '', site: '', role: '', result: '' };
    function detail(row) {
      api.modal({ title: '접속 이력 상세', wide: true, body: '<div class="form-grid">' + field('이력 번호', esc(row.id)) + field('일시', esc(row.date)) + field('사용자', esc(row.user)) + field('역할', esc((roles.find(function (r) { return r[0] === row.role; }) || ['',row.role])[1])) + field('사이트', esc((sites.find(function (r) { return r[0] === row.site; }) || ['',row.site])[1])) + field('메뉴', esc(row.menu)) + field('작업', esc(row.action)) + field('결과', esc(row.result)) + field('접속 IP', esc(row.ip), true) + field('처리 내용', '<div class="ops-pre">' + esc(row.detail) + '</div>', true) + '</div>', submitLabel: '닫기', onSubmit: function (form, close) { close(); } });
    }
    function render() {
      MIQCommon.view.set(ctx.el,"innerHTML",filters(field('시작일', input('from', state.from, 'type="date"')) + field('종료일', input('to', state.to, 'type="date"')) + field('사이트', select('site', [['','전체 사이트']].concat(sites), state.site)) + field('역할', select('role', [['','전체 역할']].concat(roles), state.role)) + field('결과', select('result', [['','전체 결과'],['성공','성공'],['접근 제한','접근 제한']], state.result)) + field('검색', input('query', state.query, 'type="search" placeholder="사용자·메뉴·작업"'))) + '<div data-grid></div>');
      bindFilters(ctx.el, function (form) { var from = value(form,'from'), to = value(form,'to'); if (!validRange(from,to)) return api.notify('종료일은 시작일 이후로 선택해 주세요.'); state = { from: from, to: to, site: value(form,'site'), role: value(form,'role'), result: value(form,'result'), query: value(form,'query') }; data = read('history', historySeed()); render(); });
      grid(ctx.el.querySelector('[data-grid]'), { rows: data.filter(function (r) { var d = r.date.slice(0,10); return (!state.from || d >= state.from) && (!state.to || d <= state.to) && (!state.site || r.site === state.site) && (!state.role || r.role === state.role) && (!state.result || r.result === state.result) && matches(r.user + ' ' + r.menu + ' ' + r.action, state.query); }), defaultSort: { key: 'date', dir: 'desc' }, columns: [
        { key: 'date', label: '일시' }, { key: 'user', label: '사용자' }, { key: 'role', label: '역할', render: function (r) { return esc((roles.find(function (x) { return x[0] === r.role; }) || ['',r.role])[1]); }, exportValue: function (r) { return (roles.find(function (x) { return x[0] === r.role; }) || ['',r.role])[1]; } }, { key: 'site', label: '사이트', render: function (r) { return esc((sites.find(function (s) { return s[0] === r.site; }) || ['',r.site])[1]); }, exportValue: function (r) { return (sites.find(function (s) { return s[0] === r.site; }) || ['',r.site])[1]; } }, { key: 'menu', label: '메뉴' }, { key: 'action', label: '작업' }, { key: 'result', label: '결과' }, { key: 'ip', label: '접속 IP' }, { key: 'actions', label: '상세', render: function () { return rowButton('detail','보기'); } }
      ], onAction: function (action,row) { if (action === 'detail') detail(row); } });
    }
    render();
  });
})();
