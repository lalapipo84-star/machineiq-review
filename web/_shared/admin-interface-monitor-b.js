/* API/EAI 현황 Type B — UI adapted from the user-supplied if_list_v3 reference.
   Domain data, guards and the manual-call ledger stay owned by admin-monitoring-model.js. */
(function () {
'use strict';
const M = window.MIQAdminMonitoring;
if (!M || !window.MIQAdminContext?.active() || !document.querySelector('body[data-monitoring-page="interfaces-b"]')) return;

const IFACES = M.interfaces, IF = Object.fromEntries(IFACES.map(i => [i.key, i]));
const LABELS = M.labels, VALUE_TEXT = M.valueText;
const logsOf = M.logsOf, lastOk = M.lastOk, nodeState = M.nodeState, vehicleInfo = M.vehicleInfo, manualAvailability = M.manualAvailability;
const MAX_RETRY = 30;
const TAB_ORDER = ['testtms', 'mes', 'nonagree', 'register', 'agree'];
// 화면 표기: testtms는 TMS로 부른다 (정책정리 v3)
const ifName = key => key === 'testtms' ? 'TMS API' : IF[key].name;
const tmsText = s => String(s || '').replace(/testtms/g, 'TMS');

// 상태 4가지만 쓴다: 성공 / 이상 / 실패(재시도·중단 포함) / 대기
const DOT = { done: 'ok', warn: 'warn', fail: 'fail', retry: 'fail', stop: 'fail', idle: 'idle', plan: 'idle' };
const DOT_LABEL = { ok: '성공', warn: '이상', fail: '실패', idle: '대기' };
const TONE_ICON = { ok: '✓', warn: '!', fail: '✕', idle: '…' };

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function addSec(at, s) { const d = new Date(at.replace(' ', 'T') + 'Z'); d.setUTCSeconds(d.getUTCSeconds() + s); return d.toISOString().slice(0, 19).replace('T', ' '); }
function dayPlus(date, n) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
const msOf = at => Date.parse(at.replace(' ', 'T') + 'Z');
function elapsed(from) {
  const h = Math.floor((msOf(M.timestamp()) - msOf(from)) / 3600000);
  return h < 24 ? `${Math.max(h, 1)}시간째` : `${Math.floor(h / 24)}일째`;
}
const maskEqunr = s => String(s).replace(/^(.{6}).*(.{2})$/, '$1****$2');
const nameOf = code => String(code || '').replace(/^\d+\s*\((.*)\)$/, '$1');
const short = msg => esc(String(msg).split(' (')[0]);
const openAlerts = v => M.alerts().filter(a => a.tid === v.tid && !a.closedAt).length;
const alertUrl = v => M.portalUrl('alerts.html', { tid: v.tid });

let cur = null;           // 조회 중인 차량
let filterIface = '';     // 선택한 인터페이스 카드 (항상 하나)
let failOnly = false;
let manualOnly = false;
let openLogId = null;
let summaryOpen = false;
let detailTab = 'fields';

// 첫 진입: 왼쪽부터 이상·실패가 있는 첫 인터페이스, 없으면 첫 인터페이스
function defaultIface(v) {
  return TAB_ORDER.find(k => ['warn', 'fail', 'retry', 'stop'].includes(nodeState(v, k).s)) || TAB_ORDER[0];
}

function search(type, q) {
  q = String(q || '').trim().toUpperCase();
  if (!q) { $('searchInput').focus(); toast('단말기 일련번호 또는 차대번호를 입력하세요.'); return; }
  closeManual(false);
  const v = M.findVehicle(type, q);
  failOnly = false; manualOnly = false; summaryOpen = false; openLogId = null;
  cur = v || null;
  if (!v) {
    $('result').innerHTML = `<div class="card empty">‘${esc(q)}’에 해당하는 ${type === 'equnr' ? '차대번호' : '단말기'}가 없습니다.<br><small>차대번호는 고객 동의(동의 EAI 성공) 이후에만 조회됩니다.</small></div>`;
    return;
  }
  filterIface = defaultIface(v);
  render();
}

// ---------- 화면 ----------
function render() {
  const v = cur, info = vehicleInfo(v), first = logsOf(v, 'testtms')[0];
  const hasInfo = !!info.EQUNR, alerts = openAlerts(v);
  const alertChip = alerts ? `<a class="chip-alert" href="${esc(alertUrl(v))}">● 미처리 Alert ${alerts}건 →</a>` : '';
  const val = k => {
    const raw = info[k];
    if (!raw) return '<span class="vnone">-</span>';
    const m = String(raw).match(/^(\d+)\s*\((.*)\)$/);
    return m ? `${esc(m[2])}<small>${esc(m[1])}</small>` : `<span class="${k === 'EQUNR' || k === 'PKMT' ? 'mono' : ''}">${esc(raw)}</span>`;
  };
  const cell = k => k ? `<div class="vcell"><dt>${esc(LABELS[k])}</dt><dd>${val(k)}</dd></div>` : '<div class="vcell"></div>';
  const row = (label, keys) => `<div class="vrow"><div class="vgroup">${label}</div>${keys.map(cell).join('')}</div>`;
  // 접으면 첫 행(차량)만, 펼치면 차량·계약·지역
  const vinfo = !hasInfo ? '' : row('차량', ['EQUNR', 'TYPBZ', 'MATNR', 'PKMT', 'BATT_TYPE'])
    + (summaryOpen ? row('계약', ['KUNNR_SP', 'KUNNR_Z2', 'KUNNR_Z1', 'ARBPL', 'GWLDT']) + row('지역', ['LAND1', 'TZONE', '', '', '']) : '');

  $('result').innerHTML = `
    <section class="card vcard" aria-labelledby="ambVehicleTitle">
      <h2 class="vtitle" id="ambVehicleTitle">차량 정보<span class="tipwrap"><button type="button" class="info-tip" id="vTip" aria-label="차량 정보 안내" aria-expanded="false" aria-controls="vTipPop">i</button><span class="tip-pop" id="vTipPop" role="tooltip" hidden>동의 EAI가 성공하면 차량 정보가 표시됩니다.</span></span></h2>
      <div class="vhead">
        <span class="vtid">${esc(v.tid)}</span>
        <span class="vchip ${hasInfo ? 'on' : ''}">${hasInfo ? '동의 완료' : '동의 전'}</span>
        <span class="vmeta">최초 통신 <b>${first ? esc(first.at) : '-'}</b></span>
        <div class="right">${alertChip}
          ${hasInfo ? `<button type="button" class="more" id="toggleSummary" aria-expanded="${summaryOpen}">${summaryOpen ? '접기 ▴' : '펼치기 ▾'}</button>` : ''}</div>
      </div>
      ${vinfo ? `<dl class="vbody">${vinfo}</dl>` : ''}
    </section>

    <section class="card hist-card" aria-labelledby="ambStatusTitle">
      <h2 id="ambStatusTitle">인터페이스 상태
        <span class="dot-legend" aria-label="상태 범례">${Object.entries(DOT_LABEL).map(([k, t]) => `<span><i class="tile tile-${k} tile-sm" aria-hidden="true">${TONE_ICON[k]}</i>${t}</span>`).join('')}</span></h2>
      <div class="flow-scroll"><div class="iflow" role="group" aria-label="인터페이스 호출 흐름">
        <div class="ff-tms">${tcard('testtms')}</div>
        <div class="ff-fork" aria-hidden="true"><i class="h0"></i><i class="v"></i><i class="h1"></i><i class="h2"></i></div>
        <div class="ff-mes">${tcard('mes')}</div>
        <div class="ff-non">${tcard('nonagree')}</div>
        <div class="ff-sep" aria-hidden="true"></div>
        <div class="ff-reg">${tcard('register')}</div>
        <div class="ff-down" aria-hidden="true">↓</div>
        <div class="ff-agr">${tcard('agree')}</div>
      </div></div>
      ${statusLine(v)}
    </section>

    <div class="md"><div class="mdleft"><div class="list-slot" id="listSlot"></div></div><div class="detail-slot" id="detailSlot"></div></div>`;
  renderHistory();
}

// 카드: [상태 타일] [이름 / 호출 이력 n건] [수동 호출]. 선택 버튼과 수동 호출 버튼은 형제로 둔다(중첩 컨트롤 없음)
function tcard(key) {
  const i = IF[key], n = nodeState(cur, key), cnt = logsOf(cur, key).length, on = filterIface === key;
  const tone = DOT[n.s], m = manualAvailability(cur, key);
  const manualBtn = i.manual
    ? `<button type="button" class="btn sm tmanual" data-manual="${key}" ${m.ok ? '' : `disabled title="${esc(tmsText(m.why))}"`} aria-label="${esc(ifName(key))} 수동 호출">수동 호출</button>` : '';
  return `<div class="tcard tone-${tone} ${on ? 'on' : ''}" data-itab="${key}">
      <button type="button" class="tsel" aria-pressed="${on}" title="${esc(ifName(key))} · ${esc(tmsText(n.label))}">
        <span class="tile tile-${tone}" role="img" aria-label="${DOT_LABEL[tone]}">${TONE_ICON[tone]}</span>
        <span class="tbody">
          <span class="tname">${esc(ifName(key))}</span>
          <span class="tcnt">${i.planned ? '<span class="new">신규</span>' : ''}호출 이력 ${cnt}건</span>
        </span>
      </button>
      ${manualBtn}
    </div>`;
}

function statusLine(v) {
  const n = nodeState(v, filterIface), s = ifaceSummary(v, filterIface), tone = DOT[n.s];
  const plain = val => esc(String(val || '').replace(/<[^>]+>/g, ''));
  const cell = (k, val, cls) => `<div class="scell"><dt>${k}</dt><dd class="${cls || ''}" title="${plain(val)}">${val || '-'}</dd></div>`;
  return `<div class="status-line" aria-live="polite">
      <div class="shead">
        <span class="title">${esc(ifName(filterIface))}</span>
        <span class="state"><i class="tile tile-${tone} tile-sm" aria-hidden="true">${TONE_ICON[tone]}</i>${esc(tmsText(n.label).replace(/\s*\d+\/\d+$/, ''))}</span>
      </div>
      <dl class="sgrid">${cell('결과', s.result, s.tone)}${cell('최근 호출', esc(s.recent))}${cell('호출 횟수', s.count)}${cell('확인 사항', s.note, s.noteRisk ? 'risk' : '')}</dl>
    </div>`;
}

// 모든 인터페이스가 같은 칸을 채운다: 결과 │ 최근 호출 │ 호출 횟수 │ 확인 사항
const checks = items => items.map(([label, ok]) =>
  `<span class="chk ${ok === true ? 'ok' : ok === false ? 'bad' : 'na'}">${label} ${ok === true ? '✓' : ok === false ? '✕' : '–'}</span>`).join('');
function callCount(logs, max) {
  if (!logs.length) return '';
  const manual = logs.filter(l => l.trigger === '수동').length, auto = logs.length - manual;
  return `${max ? `${auto}/${max}` : auto}회${manual ? ` · 수동 ${manual}회` : ''}`;
}
function ifaceSummary(v, key) {
  const logs = logsOf(v, key), last = logs[logs.length - 1], ok = lastOk(v, key);
  const consented = !!lastOk(v, 'agree');
  const base = { recent: last ? last.at : '', count: callCount(logs, key === 'nonagree' ? MAX_RETRY : 0) };
  const idle = text => ({ ...base, result: text, tone: 'muted' });
  const fail = (msg, note, noteRisk) => ({ ...base, result: short(msg), tone: 'bad', note, noteRisk });
  if (key === 'testtms') {
    if (!last) return idle('Agent 첫 전원 공급 시 수신');
    const r = last.req;
    return { ...base, result: checks([['CAN', r.can === 'Y'], ['TMS', r.checkTms === 'Y'], ['GPS', r.checkGps === 'Y'], ['배터리', r.checkBattery === 'Y']]) };
  }
  if (key === 'mes') {
    if (!last) return idle('TMS 수신 후 전송');
    if (!last.ok) return fail(last.res.MESSAGE, `미전송 ${elapsed(last.at)}`, true);
    const ox = t => t.TEST_RESULT === 'O' ? true : t.TEST_RESULT === 'X' ? false : null;
    return { ...base, result: checks(last.req.TESTS.map(t => [t.TEST_TYPE === 'BATT' ? '배터리' : esc(t.TEST_TYPE), ox(t)])) };
  }
  if (key === 'nonagree') {
    if (ok) return { ...base, result: `${esc(ok.res.TYPBZ || '-')} · ${esc(ok.res.PKMT || '-')}` };
    if (!last) return idle('TMS 수신 직후 호출');
    if (v.alert) return fail(last.summary, `<a class="link" href="${esc(alertUrl(v))}">Alert 등록 ${esc(v.alert.at)} →</a>`, false);
    const auto = logs.filter(l => l.trigger !== '수동');
    if (!auto.length) return fail(last.summary, '', false);
    return fail(last.summary, `<span class="risk-in">${dayPlus(auto[0].at.slice(0, 10), MAX_RETRY - 1)} 자동 중단</span> · 다음 배치 ${dayPlus(last.at.slice(0, 10), 1)} 02:00:00`, false);
  }
  if (key === 'register') {
    if (!last) return idle('고객대표 차량매핑 요청 시 호출');
    const eq = consented ? esc(last.req.EQUNR) : esc(maskEqunr(last.req.EQUNR));
    if (last.ok) return { ...base, result: `차대번호 ${eq} · 딜러 ${esc(nameOf(last.res.KUNNR_Z2))}` };
    return fail(last.res.MESSAGE, logs.length > 1 ? `고객 ${logs.length}회 시도` : '', logs.length > 1);
  }
  if (key === 'agree') {
    if (ok) return { ...base, result: `차대번호 ${esc(ok.res.EQUNR)} · 고객사 ${esc(nameOf(ok.res.KUNNR_SP))}` };
    if (last) return fail(last.res.MESSAGE, `고객 조회 불가 노출 ${elapsed(last.at)}`, true);
    return idle(`차량등록 EAI ${DOT_LABEL[DOT[nodeState(v, 'register').s]]}`);
  }
  return { ...base };
}

function resultPill(l) {
  if (!l.ok) return '<span class="pill p-fail">실패</span>';
  if (l.warn) return '<span class="pill p-warn">이상</span>';
  return '<span class="pill p-ok">성공</span>';
}

// ---------- 호출 이력 + 상세 패널 ----------
function renderHistory() {
  const rows = cur.logs
    .filter(l => l.iface === filterIface && (!failOnly || !l.ok) && (!manualOnly || l.trigger === '수동'))
    .slice().reverse();
  if (!rows.some(l => l.id === openLogId)) openLogId = rows.length ? rows[0].id : null;
  const body = rows.length ? rows.map(l => `<tr data-log="${l.id}" tabindex="0" class="${openLogId === l.id ? 'active' : ''}" aria-selected="${openLogId === l.id}" aria-label="${esc(`${l.at} ${ifName(l.iface)} ${l.ok ? (l.warn ? '이상' : '성공') : '실패'}`)}">
      <td class="mono">${esc(l.at)}</td>
      <td><span class="pill if-${l.iface}">${esc(ifName(l.iface))}</span></td>
      <td><span class="trig ${l.trigger === '수동' ? 'manual' : ''}">${esc(l.trigger)}</span></td>
      <td>${l.attempt != null ? `${l.attempt}/${MAX_RETRY}` : '-'}</td>
      <td>${resultPill(l)}</td>
      <td class="sum" title="${esc(tmsText(l.summary))}">${esc(tmsText(l.summary))}</td>
    </tr>`).join('') : '<tr><td colspan="6" class="empty" style="padding:30px">조건에 맞는 이력이 없습니다.</td></tr>';
  $('listSlot').innerHTML = `<section class="card listcard" aria-labelledby="ambListTitle">
      <div class="listbar"><h3 id="ambListTitle">호출 이력</h3>
        <div class="right">
          <label><input type="checkbox" id="fFail" ${failOnly ? 'checked' : ''}> 실패만</label>
          <label><input type="checkbox" id="fManual" ${manualOnly ? 'checked' : ''}> 수동 호출만</label>
          <span>${rows.length}건</span>
        </div>
      </div>
      <div class="table-wrap"><table aria-label="${esc(ifName(filterIface))} 호출 이력">
        <thead><tr><th style="width:170px">일시</th><th style="width:108px">인터페이스</th><th style="width:56px">구분</th><th style="width:60px">차수</th><th style="width:56px">결과</th><th>요약</th></tr></thead>
        <tbody>${body}</tbody></table></div>
    </section>`;
  $('detailSlot').innerHTML = detailHtml();
}

const findLog = id => cur && cur.logs.find(l => l.id === id);
const YN_KEYS = ['can', 'mountTms', 'checkTms', 'checkGps', 'checkBattery'];
function detailVal(k, v) {
  if (Array.isArray(v)) return v.map(t => { const ok = t.TEST_RESULT === 'O' ? true : t.TEST_RESULT === 'X' ? false : null;
    return `<span class="chk ${ok === true ? 'ok' : ok === false ? 'bad' : 'na'}">${t.TEST_TYPE === 'BATT' ? '배터리' : esc(t.TEST_TYPE)} ${ok === true ? '✓' : ok === false ? '✕' : '–'}</span>`; }).join('');
  if (YN_KEYS.includes(k)) return v === 'Y' ? '<span class="chk ok">✓ 정상</span>' : `<span class="chk bad">✕ 이상 (${esc(v)})</span>`;
  if (k === 'RESULT') return v === 'S' ? '<span class="pill p-ok">S · 성공</span>' : `<span class="pill p-fail">${esc(v)} · 오류</span>`;
  if (k === 'code') return `<span class="pill ${String(v).startsWith('2') ? 'p-ok' : 'p-fail'}">${esc(v)}</span>`;
  if (v == null || v === '') return '-';
  const m = String(v).match(/^(\d+)\s*\((.*)\)$/);
  if (m) return `${esc(m[2])}<small class="dcode">${esc(m[1])}</small>`;
  return esc((VALUE_TEXT[k] && VALUE_TEXT[k][v]) || v);
}
const detailLabel = k => esc((LABELS[k] || k).replace(/\s*\(.*\)$/, ''));
const detailRows = obj => Object.entries(obj || {}).map(([k, v]) =>
  `<div class="frow"><dt>${detailLabel(k)}<small>${esc(k)}</small></dt><dd>${detailVal(k, v)}</dd></div>`).join('');

function detailHtml() {
  const l = findLog(openLogId);
  if (!l) return '<section class="card detail" aria-label="호출 상세"><div class="empty">목록에서 호출을 선택하세요.</div></section>';
  const i = IF[l.iface], m = manualAvailability(cur, l.iface);
  const resAt = addSec(l.at, Math.max(1, Math.round(l.ms / 1000)));
  let notice = '';
  if (!l.ok) notice = `<div class="notice fail">${esc(l.res.MESSAGE || l.summary)}</div>`;
  else if (l.warn) notice = `<div class="notice warn">통신은 정상이지만 점검 결과에 이상 항목이 있습니다: ${esc(l.summary.split(' · ').pop())}</div>`;
  if (l.iface === 'nonagree' && !l.ok && l.attempt === MAX_RETRY && cur.alert)
    notice += `<div class="notice info">${MAX_RETRY}회째 실패로 Alert에 등록되었고 자동 호출이 중단되었습니다 (${esc(cur.alert.at)}). <a href="${esc(alertUrl(cur))}">ALERT 현황</a></div>`;
  if (l.iface === 'agree' && !l.ok)
    notice += '<div class="notice info">동의 EAI는 자동으로 다시 호출하지 않습니다. 담당자가 원인을 확인한 뒤 딜러를 통해 고객에게 재동의를 안내합니다.</div>';
  const dur = l.ms >= 1000 ? (l.ms / 1000).toFixed(1) + 's' : l.ms + 'ms';
  const sentLabel = l.iface === 'mes' ? '전송' : l.iface === 'testtms' ? '수신' : '요청';
  const meta = [
    [sentLabel, esc(l.at)],
    ['응답', `${esc(resAt)} <span class="dur">${dur}</span>`],
    ['호출 구분', `${esc(l.trigger)} · ${esc(l.user)}`],
    ...(l.reason ? [['호출 사유', esc(l.reason)]] : []),
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const secHead = title => { const m2 = String(title).match(/^(.*?)\s*\((.*)\)$/); return m2 ? `${esc(tmsText(m2[1]))}<span class="ddir">${esc(m2[2])}</span>` : esc(title); };
  const section = (title, obj) => `<div class="dsec"><div class="dsec-h">${secHead(title)}</div>${
    detailTab === 'fields' ? `<dl class="dfields">${detailRows(obj)}</dl>` : `<pre>${esc(JSON.stringify(obj, null, 2))}</pre>`}</div>`;
  const tab = (key, label) => `<button type="button" role="tab" id="ambTab-${key}" data-dtab="${key}" aria-selected="${detailTab === key}" aria-controls="ambDetailBody" tabindex="${detailTab === key ? 0 : -1}">${label}</button>`;
  return `<section class="card detail" aria-label="호출 상세">
      <div class="dhead">
        <div class="dtitle2"><span class="dname">${esc(ifName(l.iface))}</span>${l.attempt != null ? `<span class="dattempt">${l.attempt}차</span>` : ''}${resultPill(l)}</div>
        <div class="dtarget">${esc(i.rfc || i.dir)}</div>
        <dl class="dmeta">${meta}</dl>
      </div>
      <div class="dbody">
        ${notice}
        <div class="seg" role="tablist" aria-label="상세 보기 방식">${tab('fields', '항목 보기')}${tab('raw', '원문 보기')}</div>
        <div id="ambDetailBody" role="tabpanel" aria-labelledby="ambTab-${detailTab}">${section(i.reqTitle, l.req)}${section(i.resTitle, l.res)}</div>
        <div class="source">로그 출처: ${esc(tmsText(l.source))} · 로그 ID ${l.id}</div>
      </div>
      <div class="dfoot">
        <button type="button" class="btn" data-copy>원문 복사</button>
        ${i.manual ? `<button type="button" class="btn primary" data-manual="${l.iface}" ${m.ok ? '' : `disabled title="${esc(tmsText(m.why))}"`}>${esc(ifName(l.iface))} 수동 호출</button>` : ''}
      </div>
    </section>`;
}

function selectLog(id) {
  openLogId = id; renderHistory();
  $('listSlot').querySelector(`tr[data-log="${id}"]`)?.focus({ preventScroll: true });
}

// ---------- 수동 호출 (모델의 가드·이력 저장을 그대로 사용) ----------
let manualTimer = null, manualVersion = 0, manualSnapshot = null, manualReturnFocus = null;
function fieldTable(obj) {
  return Object.entries(obj || {}).map(([k, v]) => `<tr><td>${esc(LABELS[k] || k)}<span class="key">${esc(k)}</span></td><td>${
    Array.isArray(v) ? v.map(t => `${esc(t.TEST_TYPE)}: <b>${esc(t.TEST_RESULT)}</b>`).join(' · ') : esc((VALUE_TEXT[k] && VALUE_TEXT[k][v]) || (v == null ? '-' : v))}</td></tr>`).join('');
}
function openManual(key) {
  const m = manualAvailability(cur, key);
  if (!m.ok) { toast(tmsText(m.why)); return; }
  manualVersion++; manualReturnFocus = document.activeElement;
  manualSnapshot = { tid: cur.tid, key, params: JSON.stringify(M.manualParams(cur, key)) };
  const i = IF[key];
  $('mTitle').textContent = `${ifName(key)} 수동 호출`;
  $('mSub').innerHTML = `${esc(i.rfc || '')} · 단말기 <span class="mono">${esc(cur.tid)}</span>`;
  const notes = {
    mes: '가장 최근 TMS 수신 결과를 MES로 다시 전송합니다. MES에 저장된 기존 점검 결과를 덮어씁니다.',
    nonagree: cur.alert
      ? `자동 재시도는 ${MAX_RETRY}회 초과로 중단된 상태입니다. 수동 호출은 재시도 횟수에 포함되지 않습니다.`
      : '자동 배치와 별개로 지금 즉시 ERP를 조회합니다. 수동 호출은 재시도 횟수에 포함되지 않습니다.',
    agree: '고객 동의 정보로 ERP를 다시 조회합니다. 응답에 차대번호·고객사 등 개인정보가 포함됩니다.',
  };
  $('mNotice').innerHTML = `<div class="notice ${key === 'agree' || cur.alert ? 'warn' : 'info'}">${notes[key]}</div><div class="notice info">이 화면의 수동 호출은 로컬 시연이며 실제 인터페이스로 전송하지 않습니다.</div>`;
  $('mParams').innerHTML = fieldTable(M.manualParams(cur, key));
  $('mReason').value = '';
  $('mRun').disabled = false; $('mRun').textContent = '호출';
  $('modalBg').classList.add('open');
  $('mReason').focus();
}
function closeManual(restore = true) {
  manualVersion++; clearTimeout(manualTimer); manualTimer = null; manualSnapshot = null;
  $('modalBg').classList.remove('open');
  if (restore && manualReturnFocus && manualReturnFocus.isConnected) manualReturnFocus.focus();
}
function runManual() {
  const reason = $('mReason').value.trim();
  if (!reason) { $('mReason').focus(); toast('호출 사유를 입력하세요.'); return; }
  if (!manualSnapshot || manualTimer) return;
  const snapshot = manualSnapshot, version = manualVersion;
  const vehicle = M.findVehicle('tid', snapshot.tid), allowed = vehicle && manualAvailability(vehicle, snapshot.key);
  if (!allowed?.ok) { toast(tmsText(allowed?.why) || '조회 대상을 다시 확인하세요.'); closeManual(); return; }
  if (JSON.stringify(M.manualParams(vehicle, snapshot.key)) !== snapshot.params) { toast('호출 파라미터가 변경되었습니다. 내용을 다시 확인하세요.'); closeManual(); return; }
  $('mRun').disabled = true; $('mRun').innerHTML = '<span class="spinner"></span>호출 중';
  manualTimer = setTimeout(() => {
    manualTimer = null;
    if (version !== manualVersion || !$('modalBg').classList.contains('open')) return;
    const latest = M.findVehicle('tid', snapshot.tid), guard = latest && manualAvailability(latest, snapshot.key);
    if (!guard?.ok || JSON.stringify(M.manualParams(latest, snapshot.key)) !== snapshot.params) {
      closeManual(); toast(tmsText(guard?.why) || '호출 조건이 변경되었습니다. 내용을 다시 확인하세요.'); return;
    }
    try {
      const log = M.runManual(snapshot.tid, snapshot.key, reason);
      if (!log || !log.id) throw new Error('호출 이력을 저장하지 못했습니다.');
      closeManual(false); cur = M.findVehicle('tid', snapshot.tid);
      // 수동 호출한 인터페이스를 그대로 보여주고, 방금 호출을 상세 패널에 띄운다
      filterIface = snapshot.key; failOnly = false; manualOnly = false; openLogId = log.id;
      render();
      toast(`${ifName(snapshot.key)} 수동 호출 ${log.ok ? '성공' : '실패'} · ${tmsText(log.summary)}`);
      $('listSlot').querySelector(`tr[data-log="${log.id}"]`)?.focus({ preventScroll: true });
    } catch (error) { closeManual(); toast(error.message || '수동 호출을 완료하지 못했습니다.'); }
  }, 900);
}

// ---------- 기타 ----------
let toastTimer;
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
  const ta = document.createElement('textarea');
  ta.value = text; document.body.appendChild(ta); ta.select();
  document.execCommand('copy'); ta.remove();
  return Promise.resolve();
}
function setTip(open) {
  const b = $('vTip'), p = $('vTipPop'); if (!b || !p) return;
  b.setAttribute('aria-expanded', String(open)); p.hidden = !open;
}

// ---------- 이벤트 ----------
$('searchForm').addEventListener('submit', e => { e.preventDefault(); search($('searchType').value, $('searchInput').value); });
$('searchType').addEventListener('change', () => { $('searchInput').placeholder = $('searchType').value === 'equnr' ? '예) FBB08-000038' : '예) TMS24K0018876'; });

document.addEventListener('click', e => {
  if (e.target.closest('#vTip')) { setTip($('vTipPop').hidden); return; }
  if (!e.target.closest('#vTipPop')) setTip(false);
});

$('result').addEventListener('click', e => {
  const manual = e.target.closest('[data-manual]');
  if (manual) { openManual(manual.dataset.manual); return; }
  if (e.target.closest('#toggleSummary')) { summaryOpen = !summaryOpen; render(); $('toggleSummary')?.focus(); return; }
  const card = e.target.closest('[data-itab]');
  if (card) {
    if (filterIface !== card.dataset.itab) { filterIface = card.dataset.itab; openLogId = null; render(); }
    $('result').querySelector(`[data-itab="${filterIface}"] .tsel`)?.focus();
    return;
  }
  const dtab = e.target.closest('[data-dtab]');
  if (dtab) { detailTab = dtab.dataset.dtab; $('detailSlot').innerHTML = detailHtml(); $('detailSlot').querySelector(`[data-dtab="${detailTab}"]`)?.focus(); return; }
  if (e.target.closest('[data-copy]')) {
    const l = findLog(openLogId); if (!l) return;
    copyText(JSON.stringify({ interface: ifName(l.iface), at: l.at, request: l.req, response: l.res }, null, 2))
      .then(() => toast('원문을 복사했습니다.')).catch(() => toast('복사하지 못했습니다. 원문 보기에서 복사해 주세요.'));
    return;
  }
  const row = e.target.closest('tr[data-log]');
  if (row) selectLog(Number(row.dataset.log));
});
$('result').addEventListener('keydown', e => {
  const t = e.target;
  if (t.matches('[data-dtab]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    e.preventDefault();
    detailTab = e.key === 'Home' ? 'fields' : e.key === 'End' ? 'raw' : detailTab === 'fields' ? 'raw' : 'fields';
    $('detailSlot').innerHTML = detailHtml(); $('detailSlot').querySelector(`[data-dtab="${detailTab}"]`)?.focus();
    return;
  }
  if ((e.key === 'Enter' || e.key === ' ') && t.matches('tr[data-log]')) { e.preventDefault(); selectLog(Number(t.dataset.log)); }
});
$('result').addEventListener('change', e => {
  if (e.target.id === 'fFail') { failOnly = e.target.checked; renderHistory(); $('fFail').focus(); }
  if (e.target.id === 'fManual') { manualOnly = e.target.checked; renderHistory(); $('fManual').focus(); }
});

$('mCancel').addEventListener('click', () => closeManual());
$('modalBg').addEventListener('click', e => { if (e.target === $('modalBg')) closeManual(); });
$('mRun').addEventListener('click', runManual);
document.addEventListener('keydown', e => {
  const modalOpen = $('modalBg').classList.contains('open');
  if (e.key === 'Escape' && !modalOpen) { setTip(false); return; }
  if (!modalOpen) return;
  const scope = $('modalBg').querySelector('.modal');
  if (e.key === 'Escape') { e.preventDefault(); closeManual(); return; }
  if (e.key !== 'Tab') return;
  const focusable = Array.from(scope.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')).filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
  if (!focusable.length) { e.preventDefault(); scope.focus(); return; }
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (e.shiftKey && (document.activeElement === first || !scope.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && (document.activeElement === last || !scope.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
});

// 다른 탭(Type A·ALERT 현황)에서 수동 호출·처리한 결과를 반영
M.subscribe(() => {
  if (!cur) return;
  const vehicle = M.findVehicle('tid', cur.tid);
  if (!vehicle) return;
  cur = vehicle; render();
});

const params = new URLSearchParams(location.search);
const initialType = params.get('equnr') ? 'equnr' : 'tid';
const initial = params.get('equnr') || params.get('tid') || 'TMS24K0018876';
$('searchType').value = initialType; $('searchInput').value = initial;
search(initialType, initial);
}());
