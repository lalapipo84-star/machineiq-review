/* ══════════════════════════════════════════════════════════════
   Bobcat MachineIQ '26 — 공용 모달 모듈  (_shared/modals.js)

   목적: 같은 성격의 편집 다이얼로그를 화면마다 복제하지 않고 한 곳에서 정의한다.
         관리기능 > 사용자와 서비스 > 소모품 도래에서 같은 항목·동작을 공유한다.
         차량 수정(그룹 · 닉네임 · 충격 임계값)은 관리기능 > 차량 화면 전용 모달(#vehModal)에서 처리한다.

   제공 모달
     user     · 사용자 정보 수정              ← 관리기능 > 사용자
     supply   · 소모품 교환 정보 수정        ← 서비스 > 소모품 도래

   사용법
     <button data-miq-modal="supply"
             data-name="엔진오일" data-cycle="500" data-used="231"
             data-vin="FBA32_224250271">수정</button>

     또는 스크립트에서 :  MIQ.modal.open('supply', { name:'엔진오일', cycle:500, used:231 })

   스타일은 이 파일이 자체 주입한다 (miq- 접두어). 따라서 mockup.css 를 쓰지 않는
   레거시 페이지(gnb.css 만 로드)에서도 동일하게 보인다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var BASE = (document.body && document.body.dataset.base) || '../';
  var VARIANT = (document.body && document.body.dataset.variant) === 'asis' ? 'asis' : 'tobe';
  function enc(s) { return s.replace(/ /g, '%20'); }
  function link(dir, file) { return BASE + enc(dir) + '/' + file; }

  /* ── 자체 스타일 주입 (페이지 CSS와 충돌하지 않도록 miq- 접두어) ── */
  var CSS = '' +
  '.miq-dim{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:900;display:none;align-items:center;justify-content:center;padding:24px;font-family:\'Noto Sans KR\',sans-serif}' +
  '.miq-dim.open{display:flex}' +
  '.miq-modal{background:#fff;border-radius:8px;width:100%;max-width:600px;max-height:88vh;display:flex;flex-direction:column;box-shadow:0 12px 40px rgba(0,0,0,.22);color:#000000;font-size:14px}' +
  '.miq-modal.lg{max-width:820px}' +
  '.miq-h{display:flex;align-items:center;gap:10px;padding:16px 20px;border-bottom:1px solid #f0f0f0}' +
  '.miq-h h3{font-size:16px;font-weight:700;margin:0}' +
  '.miq-src{font-size:11px;color:#fff;background:#ff3600;border-radius:3px;padding:2px 8px;font-weight:600}' +
  '.miq-x{margin-left:auto;background:none;border:none;font-size:18px;color:#aaa;cursor:pointer;line-height:1}' +
  '.miq-b{padding:20px;overflow:auto;flex:1}' +
  '.miq-f{display:flex;gap:8px;justify-content:flex-end;padding:14px 20px;border-top:1px solid #f0f0f0;background:#fcfcfc;border-radius:0 0 8px 8px;align-items:center}' +
  '.miq-f .miq-left{margin-right:auto;font-size:12px}' +
  '.miq-btn{border:1px solid #dfdfdf;background:#fff;color:#000000;border-radius:4px;padding:7px 14px;font-size:13px;font-weight:500;cursor:pointer;font-family:inherit;text-decoration:none;display:inline-flex;align-items:center}' +
  '.miq-btn.pri{background:#ff3600;border-color:#ff3600;color:#fff;font-weight:600}' +
  '.miq-btn.danger{color:#e03131;border-color:#f5c2c2}' +
  '.miq-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 18px}' +
  '.miq-grid .full{grid-column:span 2}' +
  '.miq-fld{display:flex;flex-direction:column;gap:5px;min-width:0}' +
  '.miq-fld>span{font-size:12px;color:#888;font-weight:600}' +
  '.miq-fld>span i{color:#ff3600;font-style:normal;margin-left:2px}' +
  '.miq-fld input,.miq-fld select{border:1px solid #dfdfdf;border-radius:4px;padding:8px 10px;font-size:13px;background:#fff;color:#000000;outline:none;width:100%;font-family:inherit}' +
  '.miq-fld input:focus,.miq-fld select:focus{border-color:#ff3600}' +
  '.miq-fld input[readonly]{background:#f7f8f9;color:#777}' +
  '.miq-sec{font-size:12px;font-weight:700;color:#555;margin:18px 0 10px;padding-top:14px;border-top:1px solid #f0f0f0}' +
  '.miq-sec:first-child{margin-top:0;padding-top:0;border-top:none}' +
  '.miq-chk{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 14px}' +
  '.miq-chk label{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#000000;cursor:pointer}' +
  '.miq-note{background:#fff9db;border:1px solid #ffe08a;border-radius:6px;padding:10px 13px;font-size:12px;color:#7a5b00;line-height:1.7;margin-top:14px}' +
  '.miq-note b{color:#5c4400}' +
  '.miq-ro{background:#f4f5f7;border:1px dashed #dcdcdc;border-radius:6px;padding:10px 13px;font-size:12px;color:#777;line-height:1.7;margin-top:14px}' +
  '.miq-bar{height:8px;background:#eee;border-radius:4px;overflow:hidden;margin-top:6px}' +
  '.miq-bar i{display:block;height:100%;border-radius:4px}' +
  '.miq-kv{display:flex;justify-content:space-between;font-size:12px;color:#666;margin-top:4px}' +
  '.miq-kv b{color:#000000}';

  var st = document.createElement('style');
  MIQCommon.view.set(st,"textContent",CSS);
  document.head.appendChild(st);

  function esc(v) { return String(v == null ? '' : v).replace(/"/g, '&quot;'); }
  function fld(label, value, opts) {
    opts = opts || {};
    if (opts.options) {
      var o = opts.options.map(function (x) {
        return '<option' + (x === value ? ' selected' : '') + '>' + x + '</option>';
      }).join('');
      return '<div class="miq-fld"><span>' + label + (opts.req ? '<i>*</i>' : '') + '</span><select>' + o + '</select></div>';
    }
    return '<div class="miq-fld"><span>' + label + (opts.req ? '<i>*</i>' : '') + '</span>' +
      '<input value="' + esc(value) + '"' + (opts.ro ? ' readonly' : '') + '/></div>';
  }

  /* ══════════ 모달 정의 ══════════ */
  var DEFS = {
    /* 관리기능 > 사용자 의 사용자 수정 모달과 동일 */
    user: function (c) {
      var role = c.role || '고객 대표';
      if (role.indexOf('ROLE_') === 0) role = '고객 대표';
      return {
        title: '사용자 정보 수정',
        src: '관리기능 &gt; 사용자',
        cls: 'lg',
        goto: link('Mgmt User', VARIANT === 'asis' ? 'mgmt-user-asis.html' : 'mgmt-user-tobe.html'),
        gotoLabel: '사용자 관리 화면으로',
        body:
          '<div class="miq-sec">사용자 정보</div>' +
          '<div class="miq-grid">' +
            fld('사용자 ID (이메일)', c.userId || 'fleet.park@sejonglog.co.kr', { ro: true }) +
            fld('이름', c.userName || '박민아', { ro: true }) +
            fld('권한', role, { options: ['내부 사용자', '딜러 대표', '딜러 직원', '고객 대표', '고객 직원'], req: true }) +
            fld('그룹', c.group || '기본그룹', { options: ['전체', '기본그룹', '테스트그룹', '물류1팀'], req: true }) +
            fld('연락처', c.telno || '010-****-3345') +
            fld('이메일', c.email || c.userId || 'fleet.park@sejonglog.co.kr') +
          '</div>' +
          '<div class="miq-sec">수신 동의</div>' +
          '<div class="miq-chk">' +
            '<label><input type="checkbox" checked/> SMS 수신동의</label>' +
            '<label><input type="checkbox" checked/> PUSH 알림</label>' +
            '<label><input type="checkbox" checked/> 이메일 수신동의</label>' +
            '<label><input type="checkbox"/> 리포트 수신동의</label>' +
          '</div>' +
          '<div class="miq-ro">이 모달은 <b>관리기능 &gt; 사용자</b>의 수정 항목과 동일합니다. 권한·그룹·연락처 및 수신 동의만 변경할 수 있습니다.</div>'
      };
    },

    /* 서비스 > 소모품관리 의 소모품 수정 모달과 동일 */
    supply: function (c) {
      var cycle = parseFloat(c.cycle || 100);
      var used = parseFloat(c.used || 231);
      var rawPct = cycle > 0 ? used / cycle * 100 : 0;
      var roundedPct = Math.round(rawPct * 100) / 100;
      var pct = Math.min(100, roundedPct);
      var col = roundedPct >= 90 ? '#e03131' : (roundedPct >= 80 ? '#f59f00' : '#2f9e44');
      return {
        title: '소모품 교환 정보 수정 — ' + (c.name || '엔진오일'),
        src: '서비스 &gt; 소모품관리',
        goto: link('Service', VARIANT === 'asis' ? 'service-asis.html' : 'service-supply-tobe.html'),
        gotoLabel: '소모품관리 화면으로',
        body:
          '<div class="miq-grid">' +
            fld('소모품', c.name || '엔진오일', { ro: true }) +
            fld('차량 (차대번호)', c.vin || 'FBA32_224250271', { ro: true }) +
            fld('교환주기 (H)', cycle, { req: true }) +
            fld('교체 후 사용시간 (H)', used, { ro: true }) +
            fld('마지막 교체일시', c.lastDate || '2026-03-18 10:20') +
            fld('마지막 교체 누적시간 (H)', c.lastCum || '1,240') +
          '</div>' +
          '<div class="full" style="margin-top:14px">' +
            '<span style="font-size:12px;color:#888;font-weight:600">소모품 사용률</span>' +
            '<div class="miq-bar"><i style="width:' + Math.min(100, pct) + '%;background:' + col + '"></i></div>' +
            '<div class="miq-kv"><span>교환주기 <b>' + cycle + 'H</b></span>' +
            '<span>사용 <b>' + used + 'H</b></span><span style="color:' + col + '"><b>' + pct + '%</b></span></div>' +
          '</div>' +
          '<div class="miq-note">사용률 = <b>(TB_EQUIPMENT.CUMULATIVE_TIME_VAL − EXCHANGE_CUMULATIVE_TIME_VAL) ÷ EXCHANGE_CYCLE × 100</b>. ' +
          '교환주기를 바꾸면 사용률과 <b>교체필요/교체임박</b> 판정(≥90% / 80% 이상·90% 미만)이 즉시 다시 계산됩니다.</div>' +
          '<div class="miq-ro">이 모달은 <b>서비스 &gt; 소모품관리</b>의 수정 모달과 <b>동일한 정의</b>를 공유합니다 (_shared/modals.js).<br/>' +
          '대상 테이블 <b>TB_SERVICE_SCHEDULE</b> (EXCHANGE_CYCLE · EXCHANGE_CUMULATIVE_TIME_VAL).</div>'
      };
    }
  };

  /* ══════════ 렌더 / 열기 ══════════ */
  var host = null;
  function ensureHost() {
    if (host) return host;
    host = document.createElement('div');
    host.className = 'miq-dim';
    MIQCommon.view.set(host,"innerHTML",'<div class="miq-modal"></div>');
    host.addEventListener('mousedown', function (e) { if (e.target === host) close(); });
    document.body.appendChild(host);
    return host;
  }
  function close() { if (host) host.classList.remove('open'); }

  function open(kind, ctx) {
    var def = DEFS[kind];
    if (!def) { console.warn('MIQ.modal: unknown kind', kind); return; }
    var d = def(ctx || {});
    var h = ensureHost();
    var box = h.firstChild;
    box.className = 'miq-modal' + (d.cls ? ' ' + d.cls : '');
    MIQCommon.view.set(box,"innerHTML",'<div class="miq-h"><h3>' + d.title + '</h3><span class="miq-src">' + d.src + ' 공용</span>' +
      '<button class="miq-x" type="button">✕</button></div>' +
      '<div class="miq-b">' + d.body + '</div>' +
      '<div class="miq-f">' +
        '<a class="miq-btn miq-left" href="' + d.goto + '">' + d.gotoLabel + ' ›</a>' +
        '<button class="miq-btn" type="button">취소</button>' +
        '<button class="miq-btn pri" type="button">저장</button>' +
      '</div>');
    box.querySelector('.miq-x').onclick = close;
    box.querySelectorAll('.miq-f .miq-btn').forEach(function (b) {
      if (b.tagName === 'BUTTON') b.onclick = close;
    });
    h.classList.add('open');
  }

  /* 선언형 트리거 : [data-miq-modal="user|supply"] + data-* 컨텍스트 */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-miq-modal]');
    if (!t) return;
    e.preventDefault();
    var ctx = {};
    Object.keys(t.dataset).forEach(function (k) {
      if (k !== 'miqModal') ctx[k] = t.dataset[k];
    });
    open(t.dataset.miqModal, ctx);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  window.MIQ = window.MIQ || {};
  window.MIQ.modal = { open: open, close: close, defs: DEFS };
})();
