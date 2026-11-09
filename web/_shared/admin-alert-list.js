/* Reference-based WEB Alert preview. All transitions stay in the shared local
   preview model; this controller never calls an interface or server API. */
(function (root) {
  'use strict';
  var M = root.MIQAdminMonitoring;
  if (!M || !root.MIQAdminContext || !root.MIQAdminContext.active() || document.body.dataset.monitoringPage !== 'alerts') return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); };
  var TYPES = M.alertTypes;
  var FIELDS = M.fieldLabels;
  var selected = new Set();
  var state = {tab:'',query:'',status:'open',from:'2026-09-01',to:'2026-11-03',page:1,sort:'at',direction:-1};
  var openId = null, closingIds = [], drawerReturn = null, modalReturn = null, toastTimer;
  var pageSize = 15;
  var NEED_RECALL = '원인을 조치한 뒤 API/EAI 현황에서 같은 단말기의 해당 인터페이스를 재호출해 성공해야 처리 완료할 수 있습니다.';
  function all() { return M.alerts(); }
  function find(id) { return all().find(function(a) { return a.id === id; }); }
  function isOpen(a) { return !a.closedAt; }
  function alertNo(a) { return 'ALT-' + a.at.slice(0,10).replace(/-/g,'') + '-' + String(a.id).padStart(4,'0'); }
  function filtered() {
    return all().filter(function(a) {
      return (!state.tab || a.type === state.tab) && (!state.status || (state.status === 'open') === isOpen(a)) &&
        (!state.from || a.at.slice(0,10) >= state.from) && (!state.to || a.at.slice(0,10) <= state.to) &&
        (!state.query || a.tid.toUpperCase().includes(state.query) || (a.code || '').toUpperCase().includes(state.query));
    }).sort(function(a,b) { var x = state.sort === 'type' ? TYPES[a.type].name : a[state.sort]; var y = state.sort === 'type' ? TYPES[b.type].name : b[state.sort]; return String(x || '').localeCompare(String(y || '')) * state.direction || b.id-a.id; });
  }
  function recallText(r) { return '재호출 성공 · ' + esc(r.at.slice(5,16)) + ' · ' + esc(r.by); }
  function content(a) {
    if(a.type === 'nonagree') return '추적성부품테이블 조회 30회 실패<span class="sub">최초 호출 ' + esc(a.firstAt.slice(0,16)) + '</span>';
    return '<span class="mono">' + esc(a.code) + '</span><span class="sub">' + esc(a.iface + ' · ' + a.field) + '</span>';
  }
  function render() {
    var open = all().filter(isOpen), rows = filtered();
    $('tabs').innerHTML = [['','전체']].concat(Object.entries(TYPES).map(function(x){return [x[0],x[1].name];})).map(function(x,i) {
      return '<button type="button" data-screen-id="MHMIQ-ADM-013-T0'+(i+1)+'" data-tab="'+esc(x[0])+'" class="'+(state.tab===x[0]?'on':'')+'" aria-pressed="'+(state.tab===x[0])+'">'+esc(x[1])+'<span class="n">'+open.filter(function(a){return !x[0]||a.type===x[0];}).length+'</span></button>';
    }).join('');
    Array.from(selected).forEach(function(id){if(!rows.some(function(a){return a.id===id&&M.canClose(a);})) selected.delete(id);});
    state.page=Math.min(state.page,Math.max(1,Math.ceil(rows.length/pageSize)));
    var start=(state.page-1)*pageSize, visible=rows.slice(start,start+pageSize);
    $('count').innerHTML='총 <b>'+rows.length+'</b>건';
    $('rows').innerHTML=visible.length?visible.map(function(a){return '<tr data-id="'+a.id+'" class="'+(!isOpen(a)?'closed ':'')+(openId===a.id?'active':'')+'">'+
      '<td class="chk">'+(M.canClose(a)?'<input type="checkbox" data-chk="'+a.id+'" '+(selected.has(a.id)?'checked ':'')+'aria-label="'+esc(alertNo(a))+' 선택">':'')+'</td>'+
      '<td class="alert-date"><span>'+esc(a.at.slice(0,10))+'</span><span class="sub">'+esc(a.at.slice(11))+'</span></td><td><span class="pill t-'+a.type+'">'+esc(TYPES[a.type].name)+'</span></td>'+
      '<td class="mono nowrap"><button type="button" class="row-open" data-detail="'+a.id+'">'+esc(a.tid)+'</button></td><td>'+content(a)+'</td>'+
      '<td class="if-name nowrap">'+esc(a.iface)+(a.type==='nonagree'?' 1~30회':' 응답')+'</td>'+
      '<td><span class="pill '+(isOpen(a)?'s-open':'s-closed')+'">'+(isOpen(a)?'미처리':'처리 완료')+'</span></td>'+
      '<td class="nowrap">'+(!isOpen(a)?'<span class="sub">'+esc(a.closedBy)+'<br>'+esc(a.closedAt.slice(0,16))+'</span>':'<div class="proc"><button type="button" class="btn sm" data-close="'+a.id+'" '+(M.canClose(a)?'':'disabled title="'+NEED_RECALL+'"')+'>처리 완료</button><span class="sub '+(M.canClose(a)?'ok':'')+'">'+(M.canClose(a)?recallText(a.recall):'재호출 필요')+'</span></div>')+'</td></tr>';}).join(''):'<tr><td colspan="8" class="empty">조건에 맞는 Alert이 없습니다.</td></tr>';
    var eligible=rows.filter(M.canClose), n=eligible.filter(function(a){return selected.has(a.id);}).length;
    $('chkAll').checked=eligible.length>0&&n===eligible.length;
    $('chkAll').indeterminate=n>0&&n<eligible.length;
    $('chkAll').disabled=!eligible.length;
    $('bulkClose').disabled=!selected.size;
    $('bulkClose').textContent=selected.size?'선택 처리 완료 ('+selected.size+')':'선택 처리 완료';
    var pages=Math.max(1,Math.ceil(rows.length/pageSize));
    $('alertPagination').innerHTML='<span>'+(rows.length?start+1:0)+'–'+Math.min(start+pageSize,rows.length)+' / '+rows.length+'건</span><nav aria-label="Alert 페이지"><button type="button" class="btn sm" data-page="'+(state.page-1)+'" '+(state.page===1?'disabled':'')+'>이전</button><span>'+state.page+' / '+pages+'</span><button type="button" class="btn sm" data-page="'+(state.page+1)+'" '+(state.page===pages?'disabled':'')+'>다음</button></nav>';
    document.querySelectorAll('[data-sort]').forEach(function(b){var on=b.dataset.sort===state.sort;b.parentElement.setAttribute('aria-sort',on?(state.direction===1?'ascending':'descending'):'none');b.querySelector('span').textContent=on?(state.direction===1?'▲':'▼'):'↕';});
  }
  function jsonHighlight(obj,field) { return esc(JSON.stringify(obj,null,2)).split('\n').map(function(line){return line.includes('&quot;'+field+'&quot;')?'<span class="hl">'+line+'</span>':line;}).join('\n'); }
  function populateDrawer(a) {
    $('dTitle').innerHTML='<span class="pill t-'+a.type+'">'+esc(TYPES[a.type].name)+'</span> '+alertNo(a)+' <span class="pill '+(isOpen(a)?'s-open':'s-closed')+'">'+(isOpen(a)?'미처리':'처리 완료')+'</span>';
    var url=M.portalUrl('interfaces.html',{tid:a.tid});
    var rows=[['유형',esc(TYPES[a.type].name)],['발생일시',esc(a.at)],['단말기 일련번호','<a class="link mono" href="'+esc(url)+'">'+esc(a.tid)+'</a>']];
    if(a.type==='nonagree') rows.push(['수신 인터페이스','미동의 EAI (DIPP_SEND_EQUIP_DIV_TMS, AGREE=X)'],['최초 호출',esc(a.firstAt)],['30회째 호출',esc(a.lastAt)],['마지막 응답',esc(a.lastMsg)]);
    else rows.push(['수신 인터페이스',esc(a.iface+' 응답 · 로그 ID '+a.logId)],['미등록 코드','<b class="mono">'+esc(a.code)+'</b>'],['수신 항목',esc((FIELDS[a.field]||a.field)+' ('+a.field+')')],['확인한 마스터',esc(TYPES[a.type].master)]);
    var recall='<h4>재호출</h4>'+(a.recall?'<dl class="dl"><dt>재호출 결과</dt><dd><b class="recall-ok">성공</b></dd><dt>재호출 일시</dt><dd>'+esc(a.recall.at)+'</dd><dt>실행자</dt><dd>'+esc(a.recall.by)+'</dd><dt>인터페이스</dt><dd>'+esc(a.iface+' · 로그 ID '+a.recall.logId)+'</dd></dl>':'<div class="notice warn">아직 재호출 성공 이력이 없습니다. '+NEED_RECALL+'</div>');
    var guide=a.type==='nonagree'?'추적성부품테이블 조회에 30회 실패했습니다. 생산라인에서 GPS terminal no. 입력이 누락된 차량입니다. 30회째 실패 후 자동 호출이 중단되었습니다. 생산팀이 ERP 추적성부품 테이블에 등록한 뒤 미동의 EAI를 재호출하세요.':TYPES[a.type].master+'에 없는 코드라 수신한 값이 매칭되지 않았습니다. 마스터에 코드를 등록한 뒤 '+a.iface+'를 재호출하세요. 처리하지 않으면 같은 코드를 수신할 때마다 Alert이 추가됩니다.';
    $('dBody').innerHTML='<div class="notice info">'+esc(guide)+'</div><h4>Alert 정보</h4><dl class="dl">'+rows.map(function(x){return '<dt>'+x[0]+'</dt><dd>'+x[1]+'</dd>';}).join('')+'</dl>'+(a.res?'<h4>수신 응답 (미등록 항목 강조)</h4><pre>'+jsonHighlight(a.res,a.field)+'</pre>':'')+recall+(isOpen(a)&&!M.canClose(a)?'<p><a class="link" href="'+esc(url)+'">API/EAI 현황에서 재호출 →</a></p>':'')+(!isOpen(a)?'<h4>처리 정보</h4><dl class="dl"><dt>처리자</dt><dd>'+esc(a.closedBy)+'</dd><dt>처리일시</dt><dd>'+esc(a.closedAt)+'</dd></dl>':'');
    $('dClose2').hidden=!isOpen(a);$('dClose2').disabled=!M.canClose(a);$('dClose2').title=M.canClose(a)?'':NEED_RECALL;
  }
  function setBackgroundInert(on){ document.querySelectorAll('body > :not(.ami-overlay):not(script):not(style):not(link)').forEach(function(el){if(on){if(el.dataset.amiWasInert==null)el.dataset.amiWasInert=String(el.inert);el.inert=true;}else if(el.dataset.amiWasInert!=null){el.inert=el.dataset.amiWasInert==='true';delete el.dataset.amiWasInert;}}); }
  function syncInert(){var modal=$('modalBg').classList.contains('open');$('drawer').inert=modal||openId===null;setBackgroundInert(modal||openId!==null);}
  function restoreFocus(el,fallback){if(el&&!el.isConnected){var key=['detail','close','chk'].find(function(k){return el.dataset&&el.dataset[k];});if(key)el=document.querySelector('[data-'+key+'="'+el.dataset[key]+'"]');}if(el&&el.isConnected&&!el.disabled)el.focus();else if(fallback)fallback.focus();}
  function openDrawer(id,trigger){var a=find(id);if(!a)return;drawerReturn=trigger||document.activeElement;openId=id;populateDrawer(a);$('drawer').classList.add('open');$('drawerBg').classList.add('open');$('drawer').setAttribute('aria-hidden','false');render();syncInert();$('dClose').focus();}
  function closeDrawer(){openId=null;$('drawer').classList.remove('open');$('drawerBg').classList.remove('open');$('drawer').setAttribute('aria-hidden','true');render();syncInert();restoreFocus(drawerReturn,$('q'));}
  function askClose(ids,trigger){M.refresh();var list=ids.map(find);if(!list.length||list.some(function(a){return !a||!M.canClose(a);})){toast(NEED_RECALL);render();return;}closingIds=ids.slice();modalReturn=trigger||document.activeElement;$('mSub').textContent=ids.length===1?alertNo(list[0])+' · '+TYPES[list[0].type].name+' · '+list[0].tid:'선택한 Alert '+ids.length+'건을 처리 완료로 닫습니다.';$('mInfo').textContent=ids.length===1?list[0].iface+' 재호출 성공 이력('+list[0].recall.at+', '+list[0].recall.by+')을 근거로 처리 완료합니다.':'선택한 Alert은 모두 재호출 성공 이력이 있습니다. 재호출 이력을 근거로 처리 완료합니다.';$('modalBg').classList.add('open');syncInert();$('mCancel').focus();}
  function closeModal(){closingIds=[];$('modalBg').classList.remove('open');syncInert();restoreFocus(modalReturn,openId!==null?$('dClose'):$('q'));}
  function runClose(){var n=closingIds.length,result=M.closeAlerts(closingIds);if(result&&result.ok===false){toast(result.message||NEED_RECALL);closeModal();render();return;}closingIds.forEach(function(id){selected.delete(id);});closeModal();render();if(openId!==null){var a=find(openId);if(a)populateDrawer(a);}toast('Alert '+n+'건을 처리 완료했습니다.');}
  function toast(message){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(function(){$('toast').classList.remove('show');},2600);}
  function exportCsv(){var headers=['발생일시','유형','단말기 일련번호','내용','수신 인터페이스','상태','처리자','처리일시'];var data=filtered().map(function(a){return [a.at,TYPES[a.type].name,a.tid,a.type==='nonagree'?'추적성부품테이블 조회 30회 실패':a.code,a.iface,isOpen(a)?'미처리':'처리 완료',a.closedBy||'',a.closedAt||''];});var csv=[headers].concat(data).map(function(row){return row.map(function(v){v=String(v==null?'':v);if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}).join(',');}).join('\r\n');var url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));var link=document.createElement('a');link.href=url;link.download='machine-iq-alerts-'+M.timestamp().slice(0,10)+'.csv';link.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);toast('조회한 전체 '+data.length+'건을 내보냈습니다.');}
  $('tabs').addEventListener('click',function(ev){var b=ev.target.closest('[data-tab]');if(b){state.tab=b.dataset.tab;state.page=1;render();$('tabs').querySelector('[data-tab="'+state.tab+'"]').focus();}});
  $('fState').addEventListener('change',function(){state.status=this.value;state.page=1;render();});
  $('searchForm').addEventListener('submit',function(ev){ev.preventDefault();var from=$('fFrom').value,to=$('fTo').value;if((from&&to&&from>to)||(from&&!/^\d{4}-\d{2}-\d{2}$/.test(from))||(to&&!/^\d{4}-\d{2}-\d{2}$/.test(to))){toast('조회 시작일과 종료일을 확인해 주세요.');return;}state.query=$('q').value.trim().toUpperCase();state.from=from;state.to=to;state.page=1;render();});
  $('rows').addEventListener('click',function(ev){var chk=ev.target.closest('[data-chk]');if(chk){var id=Number(chk.dataset.chk);chk.checked?selected.add(id):selected.delete(id);render();restoreFocus(chk,$('chkAll'));return;}if(ev.target.closest('.chk'))return;var close=ev.target.closest('[data-close]');if(close){if(!close.disabled)askClose([Number(close.dataset.close)],close);return;}var row=ev.target.closest('[data-id]');if(row)openDrawer(Number(row.dataset.id),ev.target.closest('button')||row.querySelector('[data-detail]'));});
  $('chkAll').addEventListener('change',function(){var checked=this.checked;filtered().filter(M.canClose).forEach(function(a){checked?selected.add(a.id):selected.delete(a.id);});render();});
  $('bulkClose').addEventListener('click',function(){askClose(Array.from(selected),this);});
  $('exportAlerts').addEventListener('click',exportCsv);
  $('alertPagination').addEventListener('click',function(ev){var b=ev.target.closest('[data-page]');if(b&&!b.disabled){state.page=Number(b.dataset.page);render();$('alertTable').scrollIntoView({block:'nearest'});}});
  $('alertTable').querySelector('thead').addEventListener('click',function(ev){var b=ev.target.closest('[data-sort]');if(!b)return;state.direction=state.sort===b.dataset.sort?-state.direction:1;state.sort=b.dataset.sort;state.page=1;render();});
  $('dClose').addEventListener('click',closeDrawer);$('drawerBg').addEventListener('click',closeDrawer);$('dClose2').addEventListener('click',function(){askClose([openId],this);});$('mCancel').addEventListener('click',closeModal);$('mRun').addEventListener('click',runClose);
  document.addEventListener('keydown',function(ev){var active=$('modalBg').classList.contains('open')?$('modalBg'):(openId!==null?$('drawer'):null);if(!active)return;if(ev.key==='Escape'){ev.preventDefault();active.id==='modalBg'?closeModal():closeDrawer();return;}if(ev.key!=='Tab')return;var nodes=Array.from(active.querySelectorAll('button:not(:disabled):not([hidden]),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')).filter(function(el){return el.getClientRects().length>0;});if(!nodes.length){ev.preventDefault();return;}var first=nodes[0],last=nodes[nodes.length-1];if(ev.shiftKey&&(document.activeElement===first||!active.contains(document.activeElement))){ev.preventDefault();last.focus();}else if(!ev.shiftKey&&(document.activeElement===last||!active.contains(document.activeElement))){ev.preventDefault();first.focus();}});
  var unsubscribe=M.subscribe(function(){render();if(openId!==null){var a=find(openId);if(a)populateDrawer(a);}});
  root.addEventListener('pagehide',function(){unsubscribe();clearTimeout(toastTimer);});
  root.addEventListener('pageshow',function(ev){if(!ev.persisted)return;M.refresh();unsubscribe=M.subscribe(function(){render();if(openId!==null){var a=find(openId);if(a)populateDrawer(a);}});render();});
  render();
}(window));
