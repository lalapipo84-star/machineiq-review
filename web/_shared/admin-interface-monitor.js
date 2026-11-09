/* UI adapted from the supplied interface-monitor reference. Domain data and guards have one shared owner. */
(function () {
'use strict';
const M=window.MIQAdminMonitoring;
if(!M || !window.MIQAdminContext?.active() || !document.querySelector('body[data-monitoring-page="interfaces"]')) return;
const IFACES=M.interfaces,IF=Object.fromEntries(IFACES.map(i=>[i.key,i]));
const LABELS=M.labels,AGREE_FIELDS=M.agreeFields,VALUE_TEXT=M.valueText,NO_MANUAL=M.noManual;
const logsOf=M.logsOf,lastOk=M.lastOk,nodeState=M.nodeState,vehicleInfo=M.vehicleInfo,manualAvailability=M.manualAvailability;
const MAX_RETRY=30;
function addSec(at,s){const d=new Date(at.replace(' ','T')+'Z');d.setUTCSeconds(d.getUTCSeconds()+s);return d.toISOString().slice(0,19).replace('T',' ');}
// ---------- 렌더링 ----------
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON = { done: '✓', warn: '!', fail: '✕', retry: '↻', stop: '■', idle: '…', plan: '+' };

let cur = null;          // 조회 중인 차량
let filterIface = '';    // 진행 단계 클릭 / 셀렉트로 거는 필터
let failOnly = false;
let manualOnly = false;
let openLogId = null;
let historyPage=1;
const HISTORY_SIZE=15;
let drawerReturnFocus=null;

function search(type, q) {
  q = q.trim().toUpperCase();
  if(!q){$('searchInput').focus();toast('단말기 일련번호 또는 차대번호를 입력하세요.');return;}
  closeManual(false);closeDrawer(false);
  const v = M.findVehicle(type,q);
  filterIface = ''; failOnly = false; manualOnly = false;historyPage=1;
  cur = v || null;
  if (!v) {
    $('result').innerHTML = `<div class="card empty">‘${esc(q)}’에 해당하는 ${type === 'equnr' ? '차대번호' : '단말기'}가 없습니다.<br><small>차대번호는 고객 동의(동의 EAI 성공) 이후에만 조회됩니다.</small></div>`;
    return;
  }
  render();
}

function render() {
  const v = cur;
  const info = vehicleInfo(v);
  const first = logsOf(v, 'testtms')[0];
  const field = (k, val, mono) => `<div><div class="k">${k}</div><div class="v ${val ? (mono ? 'mono' : '') : 'muted'}">${val ? esc(val) : '-'}</div></div>`;
  const node = key => {
    const i = IF[key], n = nodeState(v, key);
    const m = manualAvailability(v, key);
    return `<div class="node c-${key} s-${n.s} ${filterIface === key ? 'selected' : ''}" data-node="${key}" role="button" tabindex="0" aria-pressed="${filterIface === key}" aria-label="${esc(i.name)} 이력 필터">
        ${i.planned ? '<span class="tag-new">신규</span>' : ''}
        <div class="name">${i.name}</div>
        <div class="dir">${i.dir}</div>
        <div class="st"><span class="ic">${ICON[n.s]}</span>${n.label}</div>
        ${n.cnt != null ? `<div class="progress"><i style="width:${n.cnt / MAX_RETRY * 100}%"></i></div>` : ''}
        <div class="meta">${esc(n.meta).replace(/&lt;br\s*\/?&gt;/gi,'<br>')}</div>
        <div class="foot">
          <span class="cnt">이력 ${logsOf(v, key).length}건</span>
          ${i.manual ? `<button class="btn sm" data-manual="${key}" ${m.ok ? '' : `disabled title="${esc(m.why)}"`}>수동 호출</button>` : ''}
        </div>
      </div>`;
  };

  $('result').innerHTML = `
    <section class="card">
      <h2>진행 단계 <span class="hint">단계를 누르면 아래 이력을 그 인터페이스만 걸러 봅니다</span></h2>
      <div class="ami-flow-scroll"><div class="flow">
        <div class="indep l-auto">생산 단계 · 자동 호출</div>
        <div class="indep l-customer">고객대표 차량매핑 요청 프로세스 · 시간 흐름과 무관</div>
        ${node('testtms')}
        <div class="c-fork fork"><i class="h0"></i><i class="v"></i><i class="h1"></i><i class="h2"></i></div>
        ${node('mes')}
        ${node('nonagree')}
        <div class="c-sep"></div>
        ${node('register')}
        <div class="c-down">↓</div>
        ${node('agree')}
      </div></div>
    </section>

    <section class="card">
      <h2>차량 요약 <span class="hint">동의 EAI 응답 기준 · 동의 EAI 성공 전에는 - 로 표시</span></h2>
      <div class="summary">
        ${field('단말기 일련번호', v.tid, true)}
        ${field('최초 통신', first && first.at)}
        ${AGREE_FIELDS.map(k => field(LABELS[k], info[k], k === 'EQUNR')).join('')}
      </div>
    </section>

    <section class="card">
      <h2>호출 이력</h2>
      <div class="toolbar">
        <select id="fIface" aria-label="인터페이스 이력 필터">
          <option value="">인터페이스 전체</option>
          ${IFACES.map(i => `<option value="${i.key}" ${filterIface === i.key ? 'selected' : ''}>${i.name}</option>`).join('')}
        </select>
        <label><input type="checkbox" id="fFail" ${failOnly ? 'checked' : ''}> 실패만</label>
        <label><input type="checkbox" id="fManual" ${manualOnly ? 'checked' : ''}> 수동 호출만</label>
        <span class="right" id="histCount"></span>
      </div>
      <div class="table-wrap">
        <table class="ami-history-table" aria-label="인터페이스 호출 이력">
          <thead><tr><th style="width:170px">일시</th><th style="width:110px">인터페이스</th><th style="width:70px">구분</th><th style="width:60px">차수</th><th style="width:70px">결과</th><th>요약</th><th style="width:110px">실행자</th></tr></thead>
          <tbody id="histBody"></tbody>
        </table>
      </div>
      <nav id="historyPagination" class="ami-pagination" aria-label="호출 이력 페이지"></nav>
    </section>`;
  renderHistory();
}

function resultPill(l) {
  if (!l.ok) return '<span class="pill p-fail">실패</span>';
  if (l.warn) return '<span class="pill p-warn">이상</span>';
  return `<span class="pill p-ok">${l.iface === 'testtms' ? '수신' : '성공'}</span>`;
}

function renderHistory() {
  const rows = cur.logs
    .filter(l => (!filterIface || l.iface === filterIface) && (!failOnly || !l.ok) && (!manualOnly || l.trigger === '수동'))
    .slice().reverse();
  const total=rows.length,pages=Math.max(1,Math.ceil(total/HISTORY_SIZE));
  historyPage=Math.min(Math.max(historyPage,1),pages);
  const pageRows=rows.slice((historyPage-1)*HISTORY_SIZE,historyPage*HISTORY_SIZE);
  $('histCount').textContent = `${total}건 / 전체 ${cur.logs.length}건`;
  $('histBody').innerHTML = total ? pageRows.map(l => `
    <tr data-log="${l.id}" class="${openLogId === l.id ? 'active' : ''}" tabindex="0" role="button" aria-label="${esc(l.at+' '+IF[l.iface].name+' '+(l.ok?'성공':'실패')+' 상세')}">
      <td class="mono" style="white-space:nowrap">${l.at}</td>
      <td><span class="pill if-${l.iface}">${IF[l.iface].name}</span></td>
      <td><span class="trig ${l.trigger === '수동' ? 'manual' : ''}">${l.trigger}</span></td>
      <td>${l.attempt != null ? `${l.attempt}/${MAX_RETRY}` : '-'}</td>
      <td>${resultPill(l)}</td>
      <td>${esc(l.summary)}</td>
      <td class="trig">${esc(l.user)}</td>
    </tr>`).join('') : '<tr><td colspan="7" class="empty" style="padding:30px">조건에 맞는 이력이 없습니다.</td></tr>';
  $('historyPagination').innerHTML=`<span class="count">${total?(historyPage-1)*HISTORY_SIZE+1:0}–${Math.min(historyPage*HISTORY_SIZE,total)} / ${total}건</span><button class="btn sm" data-page="${historyPage-1}" aria-label="이전 페이지" ${historyPage===1?'disabled':''}>이전</button>${Array.from({length:pages},(_,index)=>`<button class="btn sm" data-page="${index+1}" ${historyPage===index+1?'aria-current="page"':''}>${index+1}</button>`).join('')}<button class="btn sm" data-page="${historyPage+1}" aria-label="다음 페이지" ${historyPage===pages?'disabled':''}>다음</button>`;
}

// ---------- 상세 드로어 ----------
let drawerTab = 'fields';
const findLog = id => cur && cur.logs.find(l => l.id === id);

function fmtVal(k, v) {
  if (Array.isArray(v)) return v.map(t => `${esc(t.TEST_TYPE)}: <b>${esc(t.TEST_RESULT)}</b>`).join(' · ');
  return esc((VALUE_TEXT[k] && VALUE_TEXT[k][v]) || (v==null?'-':v));
}
function fieldTable(obj) {
  return `<table class="ftable">${Object.entries(obj).map(([k, v]) =>
    `<tr><td>${LABELS[k] || k}<span class="key">${k}</span></td><td>${fmtVal(k, v)}</td></tr>`).join('')}</table>`;
}

function openDrawer(id) {
  const l = findLog(id);
  if (!l) return;
  drawerReturnFocus=document.activeElement?.getClientRects().length?document.activeElement:$('searchInput');
  openLogId = id;
  const i = IF[l.iface];
  $('dTitle').innerHTML = `<span class="pill if-${l.iface}">${i.name}</span> ${l.attempt != null ? `${l.attempt}차` : ''} ${resultPill(l)}`;
  const resAt = addSec(l.at, Math.max(1, Math.round(l.ms / 1000)));
  $('dMeta').innerHTML = [
    [l.iface === 'mes' ? '전송 시간' : l.iface === 'testtms' ? '수신 시간' : '요청 시간', l.at],
    ['응답 시간', `${resAt} (${l.ms >= 1000 ? (l.ms / 1000).toFixed(1) + 's' : l.ms + 'ms'})`],
    ['호출 구분', `${l.trigger} · ${l.user}`],
    ['대상', i.rfc || i.dir],
    ['단말기', cur.tid],
    l.reason ? ['호출 사유', l.reason] : ['방향', i.dir],
  ].map(([k, v]) => `<div><div class="k">${k}</div><div class="${k === '단말기' ? 'mono' : ''}">${esc(v)}</div></div>`).join('');
  renderDrawerBody();
  $('dRecall').disabled = !manualAvailability(cur, l.iface).ok;
  $('dRecall').title = manualAvailability(cur, l.iface).why || '';
  $('drawer').classList.add('open'); $('drawerBg').classList.add('open');
  $('drawer').inert=false;
  $('drawer').setAttribute('aria-hidden', 'false');
  renderHistory();
  $('dClose').focus();
}

function renderDrawerBody() {
  const l = findLog(openLogId);if(!l)return;const i = IF[l.iface];
  document.querySelectorAll('#dTabs button').forEach(b => {const selected=b.dataset.tab===drawerTab;b.classList.toggle('on',selected);b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;});
  $('dBody').setAttribute('aria-labelledby',drawerTab==='fields'?'dFieldsTab':'dRawTab');
  let notice = '';
  if (!l.ok) notice = `<div class="notice fail">${esc(l.res.MESSAGE || l.summary)}</div>`;
  else if (l.warn) notice = `<div class="notice warn">통신은 정상이지만 점검 결과에 이상 항목이 있습니다: ${esc(l.summary.split(' · ').pop())}</div>`;
  if (l.iface === 'nonagree' && !l.ok && l.attempt === MAX_RETRY && cur.alert)
    notice += `<div class="notice info">${MAX_RETRY}회째 실패로 Alert에 등록되었고 자동 호출이 중단되었습니다 (${esc(cur.alert.at)}). <a class="ami-alert-link" href="${esc(M.portalUrl('alerts.html',{tid:cur.tid}))}">ALERT 현황</a></div>`;
  if (l.iface === 'agree' && !l.ok)
    notice += '<div class="notice info">동의 EAI는 자동으로 다시 호출하지 않습니다. 담당자가 원인을 확인한 뒤 딜러를 통해 고객에게 재동의를 안내합니다.</div>';

  $('dBody').innerHTML = notice + (drawerTab === 'fields'
    ? `<div class="cols"><div><h4>${i.reqTitle}</h4>${fieldTable(l.req)}</div><div><h4>${i.resTitle}</h4>${fieldTable(l.res)}</div></div>`
    : `<h4 style="margin:0 0 6px;font-size:13px">${i.reqTitle}</h4><pre>${esc(JSON.stringify(l.req, null, 2))}</pre>
       <h4 style="margin:0 0 6px;font-size:13px">${i.resTitle}</h4><pre>${esc(JSON.stringify(l.res, null, 2))}</pre>`)
    + `<div class="source">로그 출처: ${esc(l.source)} · 로그 ID ${l.id}</div>`;
}

function closeDrawer(restore=true) {
  openLogId = null;
  $('drawer').classList.remove('open'); $('drawerBg').classList.remove('open');
  $('drawer').setAttribute('aria-hidden', 'true');
  $('drawer').inert=true;
  if (cur) renderHistory();
  if(restore){
    const target=drawerReturnFocus?.isConnected?drawerReturnFocus:$('result').querySelector(`[data-log="${drawerReturnFocus?.dataset?.log||''}"]`);
    (target||$('searchInput')).focus();
  }
}

// ---------- 수동 호출 ----------
let manualKey = null;

const manualParams=M.manualParams;

function openManual(key) {
  const m = manualAvailability(cur, key);
  if (!m.ok) { toast(m.why); return; }
  manualKey = key;
  manualVersion++;manualReturnFocus=document.activeElement;
  manualSnapshot={tid:cur.tid,key,params:JSON.stringify(manualParams(cur,key))};
  const i = IF[key];
  $('mTitle').textContent = `${i.name} 수동 호출`;
  $('mSub').innerHTML = `${esc(i.rfc || '')} · 단말기 <span class="mono">${cur.tid}</span>`;
  const notes = {
    mes: '가장 최근 testtms 수신 결과를 MES로 다시 전송합니다. MES에 저장된 기존 점검 결과를 덮어씁니다.',
    nonagree: cur.alert
      ? `자동 재시도는 ${MAX_RETRY}회 초과로 중단된 상태입니다. 수동 호출은 재시도 횟수에 포함되지 않습니다.`
      : '자동 배치와 별개로 지금 즉시 ERP를 조회합니다. 수동 호출은 재시도 횟수에 포함되지 않습니다.',
    agree: '고객 동의 정보로 ERP를 다시 조회합니다. 응답에 차대번호·고객사 등 개인정보가 포함됩니다.',
  };
  $('mNotice').innerHTML = `<div class="notice ${key === 'agree' || cur.alert ? 'warn' : 'info'}">${notes[key]}</div><div class="notice info">이 화면의 수동 호출은 로컬 시연이며 실제 인터페이스로 전송하지 않습니다.</div>`;
  $('mParams').innerHTML = fieldTable(manualParams(cur, key)).replace(/^<table class="ftable">|<\/table>$/g, '');
  $('mReason').value = '';
  $('mRun').disabled = false; $('mRun').textContent = '호출';
  $('modalBg').classList.add('open');
  $('mReason').focus();
}

let manualTimer=null,manualVersion=0,manualSnapshot=null,manualReturnFocus=null;
function closeManual(restore=true){
  manualVersion++;clearTimeout(manualTimer);manualTimer=null;manualSnapshot=null;manualKey=null;
  $('modalBg').classList.remove('open');
  if(restore && manualReturnFocus && manualReturnFocus.isConnected) manualReturnFocus.focus();
}
function runManual() {
  const reason=$('mReason').value.trim();
  if(!reason){$('mReason').focus();toast('호출 사유를 입력하세요.');return;}
  if(!manualSnapshot || manualTimer) return;
  const snapshot=manualSnapshot,version=manualVersion;
  const vehicle=M.findVehicle('tid',snapshot.tid),allowed=vehicle&&manualAvailability(vehicle,snapshot.key);
  if(!allowed?.ok){toast(allowed?.why||'조회 대상을 다시 확인하세요.');closeManual();return;}
  if(JSON.stringify(manualParams(vehicle,snapshot.key))!==snapshot.params){toast('호출 파라미터가 변경되었습니다. 내용을 다시 확인하세요.');closeManual();return;}
  $('mRun').disabled=true;$('mRun').innerHTML='<span class="spinner"></span>호출 중';
  manualTimer=setTimeout(()=>{
    manualTimer=null;
    if(version!==manualVersion || !$('modalBg').classList.contains('open')) return;
    const latest=M.findVehicle('tid',snapshot.tid),guard=latest&&manualAvailability(latest,snapshot.key);
    if(!guard?.ok || JSON.stringify(manualParams(latest,snapshot.key))!==snapshot.params){
      closeManual();toast(guard?.why||'호출 조건이 변경되었습니다. 내용을 다시 확인하세요.');return;
    }
    try{
      const log=M.runManual(snapshot.tid,snapshot.key,reason);
      if(!log || !log.id) throw new Error(log?.why||'호출 이력을 저장하지 못했습니다.');
      closeManual(false);cur=M.findVehicle('tid',snapshot.tid);
      filterIface='';failOnly=false;manualOnly=false;historyPage=1;render();
      toast(`${IF[snapshot.key].name} 수동 호출 ${log.ok?'성공':'실패'} · ${log.summary}`);
      openDrawer(log.id);
    }catch(error){closeManual();toast(error.message||'수동 호출을 완료하지 못했습니다.');}
  },900);
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

// ---------- 이벤트 ----------
$('searchForm').addEventListener('submit', e => { e.preventDefault(); search($('searchType').value, $('searchInput').value); });
$('searchType').addEventListener('change',()=>{$('searchInput').placeholder=$('searchType').value==='equnr'?'예) FBB08-000038':'예) TMS24K0018876';});

$('result').addEventListener('click', e => {
  const page=e.target.closest('[data-page]');
  if(page){historyPage=Number(page.dataset.page);renderHistory();$('historyPagination').querySelector('[aria-current="page"]')?.focus();return;}
  const manual = e.target.closest('[data-manual]');
  if (manual) { openManual(manual.dataset.manual); return; }
  const node = e.target.closest('[data-node]');
  if (node) { filterIface = filterIface === node.dataset.node ? '' : node.dataset.node;historyPage=1; render();$('result').querySelector(`[data-node="${node.dataset.node}"]`)?.focus(); return; }
  const row = e.target.closest('[data-log]');
  if (row) openDrawer(Number(row.dataset.log));
});
$('result').addEventListener('keydown',e=>{
  if(!['Enter',' '].includes(e.key)||e.target.closest('button'))return;
  const action=e.target.closest('[data-node],[data-log]');
  if(action){e.preventDefault();action.click();}
});
$('result').addEventListener('change', e => {
  historyPage=1;
  if (e.target.id === 'fIface') { filterIface = e.target.value; render();$('fIface').focus(); }
  if (e.target.id === 'fFail') { failOnly = e.target.checked; renderHistory(); }
  if (e.target.id === 'fManual') { manualOnly = e.target.checked; renderHistory(); }
});

$('dClose').addEventListener('click', closeDrawer);
$('drawerBg').addEventListener('click', closeDrawer);
$('dTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) { drawerTab = b.dataset.tab; renderDrawerBody(); } });
$('dTabs').addEventListener('keydown',e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();drawerTab=e.key==='Home'?'fields':e.key==='End'?'raw':drawerTab==='fields'?'raw':'fields';
  renderDrawerBody();$('dTabs').querySelector('[aria-selected="true"]').focus();
});
$('dCopy').addEventListener('click', () => {
  const l = findLog(openLogId);
  if(!l)return;
  copyText(JSON.stringify({ interface: IF[l.iface].name, at: l.at, request: l.req, response: l.res }, null, 2)).then(() => toast('원문을 복사했습니다.')).catch(()=>toast('복사하지 못했습니다. 원문 보기에서 복사해 주세요.'));
});
$('dRecall').addEventListener('click', () => { const l = findLog(openLogId);if(!l)return; closeDrawer(); openManual(l.iface); });

$('mCancel').addEventListener('click', () => closeManual());
$('modalBg').addEventListener('click', e=>{if(e.target===$('modalBg'))closeManual();});
$('mRun').addEventListener('click', runManual);
document.addEventListener('keydown', e => {
  const modalOpen=$('modalBg').classList.contains('open');
  const scope=modalOpen?$('modalBg').querySelector('.modal'):openLogId?$('drawer'):null;
  if(!scope)return;
  if(e.key==='Escape'){e.preventDefault();modalOpen?closeManual():closeDrawer();return;}
  if(e.key!=='Tab')return;
  const focusable=Array.from(scope.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')).filter(el=>!el.disabled&&el.tabIndex>=0&&el.getClientRects().length);
  if(!focusable.length){e.preventDefault();scope.focus();return;}
  const first=focusable[0],last=focusable[focusable.length-1];
  if(e.shiftKey&&(document.activeElement===first||!scope.contains(document.activeElement))){e.preventDefault();last.focus();}
  else if(!e.shiftKey&&(document.activeElement===last||!scope.contains(document.activeElement))){e.preventDefault();first.focus();}
});

M.subscribe(()=>{
  if(!cur)return;
  const vehicle=M.findVehicle('tid',cur.tid);
  if(!vehicle)return;
  cur=vehicle;render();
  if(openLogId){renderDrawerBody();const l=findLog(openLogId);if(l){const allowed=manualAvailability(cur,l.iface);$('dRecall').disabled=!allowed.ok;$('dRecall').title=allowed.why||'';}}
});
const params=new URLSearchParams(location.search);
$('drawer').inert=true;
const initialType=params.get('equnr')?'equnr':'tid';
const initial=params.get('equnr')||params.get('tid')||'TMS24K0018876';
$('searchType').value=initialType;$('searchInput').value=initial;
search(initialType,initial);
}());
