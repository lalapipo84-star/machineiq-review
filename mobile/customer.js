(() => {
  'use strict';
  const M = window.CustomerPrototype;
  const sourceFleet=window.MIQ_MOCK_DATA?.fleet;
  const loadState=M.fleetState(sourceFleet);
  let rows=[];
  if(loadState.available){
    try{rows=M.buildVehicles(sourceFleet);}catch{loadState.available=false;}
  }
  const approvalStore=M.createApprovalStore(rows);
  let approvalStatus='pending',approvalQuery='',approvalPending=null,approvalMessage='';
  const approvalLabels={pending:'승인 대기',approved:'승인 완료',rejected:'반려'};
  const rejectionReasons=['업체 또는 소속 정보를 확인해 주세요.','신청자 정보를 확인해 주세요.','이미 접수된 신청입니다.'];
  const $ = s => document.querySelector(s);
  const displayCopy = x => String(x ?? '').replace(/시연 예시:\s*|시연용 점검 기록:\s*/g,'').replace(/\s*\(시연 위치\s*\d*\)/g,'');
  const esc = x => displayCopy(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fieldText=value=>value==null||String(value).trim()===''?'-':value;
  const escField=value=>esc(fieldText(value));
  const validPosition=p=>!!p&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&Math.abs(p.lat)<=90&&Math.abs(p.lng)<=180;
  const retryData=()=>'<button type="button" class="detail-secondary-button" data-retry-data>다시 불러오기</button>';
  const dataUnavailable=()=>'<section class="detail-card" data-load-state="error" role="alert"><div class="dashboard-panel__head"><h2>데이터를 불러오지 못했습니다.</h2></div><p class="source-note">연결 상태를 확인한 뒤 다시 시도해 주세요.</p>'+retryData()+'</section>';
  function missingPage() {
    const error=M.web.errors.describe('missing');
    return '<section class="detail-card" data-screen-id="LQ-COM-006" role="alert"><div class="dashboard-panel__head"><h2>'+esc(error.title)+'</h2></div><p class="source-note">'+esc(error.detail)+'</p><a class="detail-secondary-button" href="./login.html">로그인 화면으로</a></section>';
  }
  function supplyNotice(summary) {
    return summary.hasUnknown?'<div role="status"><p class="source-note">'+(summary.knownItems?'일부 소모품 정보 미수신 · 확인된 항목만 표시':'소모품 정보 미수신 · 상태 확인 불가')+'</p>'+retryData()+'</div>':'';
  }
  const icon = name => `<i data-lucide="${name}" aria-hidden="true"></i>`;
  let serviceCenterTrigger=null;
  function serviceCenterButton(v) {
    return `<button type="button" class="service-center-button" data-service-center="${esc(v.equipmentId)}" aria-label="${esc(v.equipmentNumber)} 담당 서비스센터" aria-haspopup="dialog" aria-controls="service-center-dialog">서비스센터${icon('chevron-right')}</button>`;
  }
  function openServiceCenter(id,trigger) {
    // Only currently visible vehicles in the current permission/query scope.
    const vehicle=state.view==='supplies'?selected():state.view==='services'&&['supplies','error'].includes(state.service)?serviceData().vehicles.find(v=>v.equipmentId===id):null;
    if(!vehicle||vehicle.equipmentId!==id)return;
    const center=M.serviceCenter(vehicle),phone=String(center?.phone||'').trim();
    const dial=/^\+?[\d ()-]+$/.test(phone)?phone.replace(/[ ()-]/g,''):'';
    $('#service-center-vehicle').textContent=fieldText(vehicle.equipmentNumber);
    $('#service-center-info').innerHTML=center?`<h3>${escField(center.name)}</h3><p>${escField(center.address)}</p>${/^\+?\d{7,15}$/.test(dial)?`<a href="tel:${esc(dial)}" aria-label="서비스센터 전화 ${esc(phone)}">${esc(phone)}</a>`:`<p>${escField(phone)}</p>`}`:'<p class="source-note">담당 서비스센터 정보가 없습니다.</p>';
    serviceCenterTrigger=trigger;
    $('#service-center-dialog').showModal();
    $('[data-close-service-center]')?.focus({preventScroll:true});
  }
  const fmt = M.DISPLAY.number;
  const hours = min => M.DISPLAY.duration(min);
  const shortHours = min => M.DISPLAY.duration(min,true);
  const rate = M.DISPLAY.efficiency;
  const metricCriteria = '작업비율 = 작업시간 ÷ (작업시간 + 대기시간) × 100. 가동시간이 0이면 산출하지 않습니다. ';
  const reportConnectionCriteria = '미연결은 조회 대상 중 현재 단말 통신을 확인할 수 없는 차량입니다. 대시보드와 같은 통신 상태로 집계하며 조회 기간의 작업 실적 유무와는 구분합니다. 미연결 차량도 선택 기간에 수집된 실적은 표시합니다.';
  const missingCriteria = '숫자 -는 수신/집계 정보가 없거나 산출할 수 없다는 뜻입니다. 해당하지 않는 동력 항목도 -로 표시하며 실제 0은 0으로 표시합니다.';
  function periodCutoff() { const s=periodState(),current=state.view==='services'&&(state.service==='supplies'||state.service==='error'&&state.serviceFocus==='error');const label=state.view==='services'&&state.service==='error'&&state.serviceOrigin==='dashboard'?M.dashboardWindow({from:s.from,to:s.to,through:state.serviceThrough||M.SNAPSHOT}).label:current?M.SNAPSHOT.slice(5).replace('-','.')+' 기준 · 현재 상태':(state.view==='services'?M.periodWindow(s.from,s.to):M.efficiencyWindow(s.from,s.to)).label;return `<span class="period-cutoff">${esc(label)}</span>`; }
  const labels = {home:'홈',summary:'요약정보',detail:'차량 상세',services:'서비스',reports:'리포트',efficiency:'운영효율',account:'설정',settings:'설정',vehicleRegistration:'차량 등록',vehicleRequired:'차량 등록 안내',approvals:'사용자 승인',shock:'충격',engine:'엔진',battery:'배터리',operation:'운행정보',supplies:'소모품',maintenance:'수리이력',error:'에러',notifications:'알림 내역',notFound:'페이지 없음'};
  const periodViews=new Set(['summary','detail','operation','shock','reports','efficiency']);
  function linkedPeriodSelection(period,from,to) {
    // Period tabs provide presets; an explicitly queried range is never realigned.
    if(M.calendarDate(from)&&M.calendarDate(to)&&from<=to)return {period:period==='d'&&from!==to?'c':['d','w','m','c'].includes(period)?period:'m',from,to};
    return M.efficiencyRange(period==='c'?'d':period,from||to||M.SNAPSHOT.slice(0,10),from?'start':'end');
  }
  const liveLabels = {connected:'통신 연결',offline:'통신 미연결',running:'가동 중',idle:'유휴',connection_unknown:'연결 상태 확인 불가',operation_unknown:'가동 상태 확인 불가',error:M.STATUS.error.label,due:M.STATUS.due.label,soon:M.STATUS.soon.label};
  let state, navigated = false, rangeOpen = false;
  const summarySortFields=[['min','가동시간'],['work','작업시간'],['efficiency','작업비율'],['km','운행거리']];
  let vehicleLookupOpen=false,vehicleLookupIndex=-1;
  const vehicleSearchKeys=window.CustomerQueryControls.searchKeys;
  const supplySelection=new Set();
  let supplyContext='',supplyPending=[],supplyUndo=[],supplyMessage='';
  const chargeMemory=new Map();
  let chargeContext='',chargeDraft=null,chargeMessage='';
  // Per-role, in-memory UI preferences only. No OS permission, FCM or server write.
  const pushFields=[['shockWarningYn','실시간 충격'],['vehicleWarningYn','실시간 차량 에러'],['batteryWarningYn','실시간 배터리 경고'],['suppliesWarningYn','소모품 교체 안내'],['marketingYn','공지사항/마케팅 알림']];
  const pushPreferences=Object.fromEntries(Object.keys(M.ROLE_LABELS).map(role=>[role,{pushAlarmYn:false,...Object.fromEntries(pushFields.map(([key])=>[key,false]))}]));
  const notificationCategories=[['all','전체'],['shock','충격'],['error','차량 에러'],['battery','배터리'],['supplies','소모품'],['other','기타']];
  function notificationCategory(item) { const view=M.pushPresentation(item).view;return ['shock','error','battery','supplies'].includes(view)?view:'other'; }
  const {scopeControls,periodState,periodPatch,periodControls,vehicleQueryControl,filterVehicleQuery,vehicleControl,vehicleSearchStatus}=window.CustomerQueryControls.create({model:M,rows,getState:()=>state,getRangeOpen:()=>rangeOpen,esc,fieldText,icon,summaryVehicles});
  function readState() {
    const [requestedView, qs] = location.hash.slice(1).split('?');
    const view = Object.hasOwn(labels,requestedView) ? requestedView : requestedView?'notFound':'home';
    const p = new URLSearchParams(location.search);
    new URLSearchParams(qs).forEach((v,k)=>p.set(k,v));
    const efficiencyLayout=p.get('efficiencyLayout')==='inline'?'inline':'menu';
    const efficiencyMode=p.get('efficiencyMode')==='vehicle'?'vehicle':'daily';
    const reportMetricMode=p.get('reportMetricMode')==='average'?'average':'total';
    // A fresh page starts on the first sort tab, even with an old bookmarked
    // default in the URL. In-page navigation retains deliberate selections.
    const efficiencySortMetric=state&&['running','work'].includes(p.get('efficiencySortMetric'))?p.get('efficiencySortMetric'):'running';
    const summarySelected=!!state&&summarySortFields.some(([key])=>key===p.get('summarySort'));
    const selection=periodViews.has(view)?linkedPeriodSelection(p.get('period')||'m',p.get('from'),p.get('to')):null;
    const serviceSelection=view==='services'?linkedPeriodSelection(p.get('servicePeriod')||'m',p.get('serviceFrom'),p.get('serviceTo')):null;
    const period = selection?.period||(['d','w','m','c'].includes(p.get('period')) ? p.get('period') : 'm');
    const [from,to] = M.dates(period);
    return {efficiencyLayout,efficiencyMode,reportMetricMode,efficiencySortMetric,reportSortDirection:p.get('reportSortDirection')==='asc'?'asc':'desc',efficiencyDirection:state&&['asc','desc'].includes(p.get('efficiencyDirection'))?p.get('efficiencyDirection'):efficiencyMode==='vehicle'?'desc':'',view:Object.hasOwn(labels,view) ? view : 'home',role:Object.hasOwn(M.ROLE_LABELS,p.get('role')) ? p.get('role') : p.has('role')?'customer_staff':'customer_owner',serviceOrigin:p.get('serviceOrigin')==='dashboard'?'dashboard':'',serviceThrough:p.get('serviceThrough')||'',notificationCategory:notificationCategories.some(([key])=>key===p.get('notificationCategory'))?p.get('notificationCategory'):'all',serviceEquipmentId:view==='home'?'':p.get('serviceEquipmentId')||'',
      group:view==='home'?'':p.get('group')||'',type:'',q:['home','summary'].includes(view)?'':p.get('q')||'',listVehicle:view==='home'?'':p.get('listVehicle')||'',status:'all',live:view==='home'?'':p.get('live')||'',
      summarySearch:view==='home'?'':p.get('summarySearch')||'',reportSearch:view==='home'?'':p.get('reportSearch')||'',serviceSearch:view==='home'?'':p.get('serviceSearch')||'',
      summarySort:summarySelected?p.get('summarySort'):summarySortFields[0][0],summaryDirection:summarySelected&&p.get('summaryDirection')==='asc'?'asc':'desc',
      service:['maintenance','supplies','error'].includes(p.get('service'))?p.get('service'):'maintenance',serviceEntry:p.get('serviceEntry')||'',servicePeriod:serviceSelection?.period||p.get('servicePeriod')||'m',serviceFrom:serviceSelection?.from||p.get('serviceFrom')||M.dates('m')[0],serviceTo:serviceSelection?.to||p.get('serviceTo')||M.dates('m')[1],serviceFocus:['error','due','soon'].includes(p.get('serviceFocus'))?p.get('serviceFocus'):'',reportFocus:['all','waiting','unknown'].includes(p.get('reportFocus'))?p.get('reportFocus'):'all',equipmentId:p.get('equipmentId')||'',returnView:['summary','services','detail','notifications'].includes(p.get('returnView'))?p.get('returnView'):'detail',reportVehicle:view==='home'?'':p.get('reportVehicle')||'',period,from:selection?.from||p.get('from')||from,to:selection?.to||p.get('to')||to};
  }
  function go(view,patch={},replace=false) {
    const next = {...state,...patch,view};
    if('efficiencyMode' in patch&&patch.efficiencyMode!==state.efficiencyMode&&!('efficiencyDirection' in patch))next.efficiencyDirection=patch.efficiencyMode==='vehicle'?'desc':'';
    for(const [control,query] of Object.entries(vehicleSearchKeys))if(control in patch&&!(query in patch))next[query]='';
    if(view!=='services'||patch.serviceFocus!==undefined&&patch.serviceOrigin===undefined||patch.service&&patch.service!=='error')Object.assign(next,{serviceOrigin:'',serviceThrough:''});
    if(periodViews.has(view))Object.assign(next,linkedPeriodSelection(next.period,next.from,next.to));
    if(view==='services'){
      const range=linkedPeriodSelection(next.servicePeriod,next.serviceFrom,next.serviceTo);
      Object.assign(next,{servicePeriod:range.period,serviceFrom:range.from,serviceTo:range.to});
    }
    if(view==='notifications')Object.assign(next,{group:'',q:'',live:''});
    if(!['error','maintenance','supplies'].includes(view))next.serviceEntry='';
    next.type = '';
    if (!['all','waiting','unknown'].includes(next.reportFocus)) next.reportFocus = 'all';
    if (view === 'home') Object.assign(next,{group:'',q:'',live:'',status:'all',equipmentId:'',listVehicle:'',reportVehicle:'',serviceEquipmentId:'',summarySearch:'',reportSearch:'',serviceSearch:''});
    if (view === 'summary') next.q='';
    if (!replace) rangeOpen = false;
    if (next.role !== 'customer_owner') next.group = '';
    if (('role' in patch || 'group' in patch) && !M.scope(rows,next).some(v=>v.equipmentId===next.listVehicle)) next.listVehicle='';
    if (('role' in patch || 'group' in patch) && !M.scope(rows,next).some(v=>v.equipmentId===next.reportVehicle)) next.reportVehicle='';
    if (('role' in patch || 'group' in patch) && !M.scope(rows,next).some(v=>v.equipmentId===next.serviceEquipmentId)) next.serviceEquipmentId='';
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k,v])=>{if(k!=='view' && v) p.set(k,v);});
    history[replace?'replaceState':'pushState']({},'',`${location.pathname}#${view}?${p}`);
    navigated = true; render();
    if (!replace) { window.scrollTo(0,0); $('#main').focus({preventScroll:true}); }
  }
  function serviceScopeControls() {
    return `<section class="compact-filter-top service-scope-controls${state.role==='customer_owner'?'':' no-group'}" aria-label="서비스 조회 대상">${scopeControls()}${vehicleControl('serviceEquipmentId')}</section>`;
  }
  const socLevel = v => ['리튬','납산'].includes(v.type)&&Number.isFinite(v.soc)&&v.soc>=0&&v.soc<=100 ? (v.soc>=60?'high':v.soc>=30?'medium':'low') : '';
  const batteryIcon = v => socLevel(v) ? `<svg class="battery-soc-icon" data-soc-level="${socLevel(v)}" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect class="battery-soc-fill" x="4" y="9" width="12" height="6" rx="1" stroke="none"/><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/></svg>` : icon('battery');
  const definition = (entries,className='') => `<dl class="detail-definition${className?' '+className:''}">${entries.map(([k,value,battery])=>`<div><dt>${esc(k)}</dt><dd>${battery&&socLevel(battery)?`<span class="battery-soc-reading">${batteryIcon(battery)}<span>${escField(value)}</span></span>`:escField(value)}</dd></div>`).join('')}</dl>`;
  function isToday() { return state.period==='d'&&state.from===M.TODAY&&state.to===state.from; }
  function periodMetrics(v) { return M.metrics(v,state.from,state.to,state.period); }
  function dataNote(text) { return `<details class="source-disclosure"><summary>집계 기준</summary><p class="source-note">${text}</p></details>`; }
  function shortcutRow(buttons,label,kind='status') {
    return `<div class="vehicle-card-shortcuts" style="--vehicle-shortcut-columns:${buttons.length}" role="group" aria-label="${label}" data-shortcut-kind="${kind}">${buttons.join('')}</div>`;
  }
  function alignNavigationIcons() {
    document.querySelectorAll('[data-shortcut-kind="navigation"] .vehicle-compact-shortcut').forEach(button=>{
      const label=button.querySelector('.vehicle-navigation-label');
      if(!label||!button.querySelector('.vehicle-navigation-icon > svg'))return;
      const leftGap=label.getBoundingClientRect().left-button.getBoundingClientRect().left;
      if(!Number.isFinite(leftGap)||leftGap<=0)return;
      // Absolute offsets start inside the border; keep the label's existing layout.
      button.style.setProperty('--vehicle-navigation-icon-center',Math.max(0,leftGap/2-button.clientLeft)+'px');
    });
  }
  function reportActions(v,kinds=['efficiency','shock']) {
    const content=(name,label)=>`<span class="vehicle-navigation-content"><span class="vehicle-navigation-icon" aria-hidden="true">${icon(name)}</span><span class="vehicle-navigation-label">${label}</span></span>`;
    const links={
      efficiency:`<button type="button" class="vehicle-compact-shortcut" data-vehicle-report="efficiency" data-equipment="${esc(v.equipmentId)}">${content('chart-no-axes-gantt','운영효율')}${icon('chevron-right')}</button>`,
      shock:`<button type="button" class="vehicle-compact-shortcut" data-route="shock">${content('vibrate','충격 상세')}${icon('chevron-right')}</button>`
    };
    return shortcutRow(kinds.map(kind=>links[kind]),'차량 실적 바로가기','navigation');
  }
  function vehicleActions(v,{energy=true,shock=true,maintenance=false}={}) {
    const m=periodMetrics(v);
    const supplies=Array.isArray(v.supplies)?M.supplyItems(v):null;
    const supplyCount=supplies?.some(item=>item.count===0)?null:supplies?.length??null;
    const dueCount=supplies?.filter(item=>item.key==='due').length||0;
    const soonCount=supplies?.filter(item=>item.key==='soon').length||0;
    const supplyState=dueCount?'due':soonCount?'soon':supplies==null||supplies.some(item=>item.key==='unknown')?'unknown':supplies.length?'normal':'empty';
    const errorCount=Number.isFinite(v.activeErrorCount)&&v.activeErrorCount>=0?v.activeErrorCount:null;
    const links=[['supplies','소모품',supplyCount,'refresh-cw'],['error','에러',errorCount,'triangle-alert']].map(([kind,label,count,iconName])=>{
      const needsAction=kind==='supplies'?dueCount>0:count>0;
      const description=label+' '+(count==null?'미수신':count+'건')+(kind==='supplies'?(dueCount?' · 교체 필요 '+dueCount+'건':'')+(soonCount?' · 교체 임박 '+soonCount+'건':''):'')+(kind==='supplies'&&supplies?.some(item=>item.key==='unknown')?' · 일부 정보 미수신':'')+(count>0?' · 해당 차량 서비스 보기':'');
      return `<button type="button" class="vehicle-compact-shortcut is-${kind}${needsAction?' needs-action':''}${kind==='supplies'&&supplyState==='soon'?' is-soon':''}" data-slot="${kind}" ${kind==='supplies'?`data-supply-state="${supplyState}"`:''} data-service-menu="${esc(v.equipmentId)}" data-service-kind="${kind}" ${count>0?'':'disabled'} aria-label="${description}" title="${description}"><span class="vehicle-shortcut-icon">${icon(iconName)}${count>0?'<span class="vehicle-shortcut-alert" aria-hidden="true">!</span>':''}</span><span>${label}</span><strong>${count==null?'-':count}</strong></button>`;
    });
    if(maintenance)links.unshift(`<button type="button" class="vehicle-compact-shortcut" data-slot="maintenance" data-route="maintenance">${icon('clipboard-check')}<span>수리이력</span></button>`);
    if(energy){
      if(v.type==='엔진'&&state.view==='summary'){
        const value=fmt(m?.fc),label='시간당 연료소비량 '+value+' L/H';
        links.push(`<button type="button" class="vehicle-compact-shortcut" data-slot="engine" data-service-vehicle="${esc(v.equipmentId)}" data-kind="engine" aria-label="${label}" title="${label}"><strong>${value}<small class="vehicle-energy-unit"> L/H</small></strong></button>`);
      }else{
        const applicable=v.type!=='엔진',known=applicable&&Number.isFinite(v.soc)&&v.soc>=0&&v.soc<=100;
        const value=known?rate(v.soc):'-',label=!applicable?'배터리 잔량 · 해당 없음':(v.conn?'배터리':'마지막 잔량')+' '+(known?value:'미수신');
        links.push(`<button type="button" class="vehicle-compact-shortcut" data-slot="battery" ${applicable?`data-service-vehicle="${esc(v.equipmentId)}" data-kind="battery"`:'disabled'} aria-label="${label}" title="${label}">${batteryIcon(v)}<strong>${value}</strong></button>`);
      }
    }
    if(shock)links.push(`<button type="button" class="vehicle-compact-shortcut" data-slot="shock" data-service-vehicle="${esc(v.equipmentId)}" data-kind="shock" aria-label="충격 ${m?fmt(m.shock,'건'):'미수신'}" title="충격">${icon('vibrate')}<strong>${m?fmt(m.shock,'건'):'-'}</strong></button>`);
    return shortcutRow(links,'차량 점검 및 정보');
  }
  function criteriaHeading(title,id,heading='h2') {
    return `<div class="panel-heading-with-tip"><${heading}>${title}</${heading}><button id="${id}-trigger" type="button" class="criteria-tip" data-criteria-tip="${id}" aria-label="${title}${title.endsWith('기준')?' 안내':' 기준 안내'}" aria-expanded="false" aria-controls="${id}">${icon('circle-help')}</button></div>`;
  }
  function criteriaPanel(id,content) {
    return `<div id="${id}" class="criteria-tip-panel" hidden>${content}<button type="button" class="criteria-tip-close" data-close-criteria="${id}">닫기${icon('x')}</button></div>`;
  }
  function rosterCriteria(p,{today=false,preview=false}={}) {
    return `<p class="source-note roster-criteria">${today?M.SNAPSHOT.slice(5).replace('-','.'):'조회 기간'} 기준 · 작업시간 ${state.reportSortDirection==='asc'?'적은':'많은'} 순${preview?' '+Math.min(3,p.known)+'대':''}<br>가동시간 = 작업 + 대기 · 실적 없는 차량은 목록 뒤에 표시합니다.</p><p class="source-note">${reportConnectionCriteria}</p>`;
  }
  function reportRoster(scoped,p,{today=false,focus='all',limit=Infinity}={}) {
    const rowsToShow=scoped.map(v=>p.entries.find(e=>e.v.equipmentId===v.equipmentId)||{v,m:null,rate:null,idleRate:null})
      .filter(e=>focus==='unknown'?!e.v.conn:focus==='waiting'?p.waiting.some(x=>x.v.equipmentId===e.v.equipmentId):true)
      .sort((a,b)=>(a.m?0:1)-(b.m?0:1)||((a.m?.work??0)-(b.m?.work??0))*(state.reportSortDirection==='asc'?1:-1)||String(a.v.equipmentNumber??'').localeCompare(String(b.v.equipmentNumber??'')));
    return rowsToShow.slice(0,limit).map(({v,m})=>{
      return `<button type="button" class="performance-vehicle is-work-time" data-report-vehicle="${esc(v.equipmentId)}" ${today?'data-today="true"':''}><div><strong>${escField(v.equipmentNumber)}</strong><small>${escField(v.model)} · ${esc(v.group)}</small></div><b>${m?'<small>작업시간</small>'+shortHours(m.work):'-'}</b><p>${!v.conn?'통신 미연결 · ':''}${m?'대기 '+shortHours(m.idle)+' · 작업비율 '+rate(m.efficiency):'선택 기간 실적 없음'}</p>${icon('chevron-right')}</button>`;
    }).join('')||'<p class="empty-state">표시 기준에 해당하는 차량이 없습니다.</p>';
  }
  function status(v) {
    const label=v.conn===false?'미연결':v.conn!==true?'연결 확인 불가':v.operating===true?'가동 중':v.operating===false?'유휴':'가동 확인 불가';
    return '<span class="status-pill '+(v.conn===false?'is-offline':v.operating===false?'is-idle-status':'')+'">'+label+'</span>';
  }
  function communicationStatus(v) {
    const label=v.conn===true?'연결':v.conn===false?'미연결':'확인 불가';
    return `<span class="status-pill ${v.conn?'':'is-offline'}" title="통신연결" aria-label="통신연결 ${label}">${label}</span>`;
  }
  function vehicleCard(v) {
    const metric=periodMetrics(v);
    const positioned=validPosition(v.position),mapLabel=fieldText(v.equipmentNumber)+(positioned?' 지도 보기':' 위치 정보 없음');
return `<article class="vehicle-mobile-row ${M.attention(v)?'is-attention':''}"><div class="vehicle-mobile-row__head"><button type="button" class="vehicle-card-main summary-heading-link" data-vehicle="${esc(v.equipmentId)}"><strong>${escField(v.equipmentNumber)}</strong><small>${escField(v.model)} · ${esc(v.type)} · ${esc(v.group)}</small></button><div class="summary-status-actions"><button type="button" class="summary-map-button" data-map="${esc(v.equipmentId)}" aria-label="${esc(mapLabel)}" title="${positioned?'지도 보기':'위치 정보 없음'}">${icon('map-pin')}</button>${communicationStatus(v)}</div></div><button type="button" class="vehicle-card-main" data-vehicle="${esc(v.equipmentId)}"><div class="vehicle-mobile-row__meta"><span>가동시간<b>${metric?hours(metric.min):'-'}</b></span><span>작업시간<b>${metric?hours(metric.work):'-'}</b></span><span>작업비율<b>${rate(metric?.efficiency)}</b></span><span>운행거리<b>${metric?fmt(metric.km,' km'):'-'}</b></span></div><div class="row-status"><span>${!v.conn?'마지막 수신 '+(v.receivedAt?.slice(5)||'정보 미제공'):'기간 실적 · 현재 상태는 별도'}</span><span>차량 상세 ›</span></div></button>${vehicleActions(v)}</article>`;
  }
  let homeSort='running',homeSortDirection='desc';
  function home() {
    const dashboard=window.CustomerHomeView;
    if(!dashboard)return dataUnavailable();
    const mode=document.body?.dataset.dashboardMode==='preview'?'preview':'main';
    return `<div data-screen-id="LQ-DASH-001" data-home-layout="current"><div class="snapshot"><div class="panel-heading-with-tip home-title"><h1>금일 현황</h1><button type="button" class="criteria-tip" data-refresh-home aria-label="금일 현황 새로고침" title="새로고침">${icon('refresh-cw')}</button></div><span title="1시간 단위 수집 · 마지막 수집 완료 구간 기준 · 한국시간">${M.hourlyWindow().label}</span></div>${dashboard.render(M,dashboard.build(M,rows,state.role),homeSort,mode,homeSortDirection)}</div>`;
  }
  function performanceBar(p,divisor=1) {
    const running=Number.isFinite(p.work)&&Number.isFinite(p.idle)?p.work+p.idle:null;
    return `<div class="work-track" role="img" aria-label="가동시간 ${hours(running==null?null:running/divisor)} 기준 100%. 작업 ${hours(Number.isFinite(p.work)?p.work/divisor:null)}, 대기 ${hours(Number.isFinite(p.idle)?p.idle/divisor:null)}"><span class="is-work" style="width:${running?p.work/running*100:0}%"></span><span class="is-idle" style="width:${running?p.idle/running*100:0}%"></span></div><div class="work-legend"><span><i class="is-work"></i>작업</span><span><i class="is-idle"></i>대기</span></div>`;
  }
  // Local demo presentation only: production binds server totals/averages.
  function performanceAverage(p,key) {
    return p.known&&p.entries.every(e=>Number.isFinite(e.m[key]))?p.entries.reduce((sum,e)=>sum+e.m[key],0)/p.known:null;
  }
  function groupPerformance(scoped,from,to,today=false) {
    return [...new Set(scoped.map(v=>v.group))].map(group=>{
      const vehicles=scoped.filter(v=>v.group===group),p=M.efficiencyPerformance(vehicles,from,to,{today,period:state.view==='home'?'d':state.period,source:state.view==='home'?'dashboard':'efficiency'});
      return `<button class="group-row performance-group" type="button" data-report-group="${esc(group)}" ${today?'data-today="true"':''} aria-label="${esc(group)} 차량별 작업 현황 보기"><strong>${esc(group)}${icon('chevron-right')}</strong><b>작업비율 ${rate(p.workShare)}</b><div class="group-performance-metrics"><span>대당 가동<b>${shortHours(performanceAverage(p,'min'))}</b></span><span>대당 작업<b>${shortHours(p.known?Math.round(p.work/p.known):null)}</b></span><span>대당 대기<b>${shortHours(p.known?Math.round(p.idle/p.known):null)}</b></span><span>대당 이동거리<b>${fmt(performanceAverage(p,'km'),' km')}</b></span></div><small>집계 ${p.known} / ${p.total}대${p.unknown?' · 미집계 '+p.unknown+'대':''}</small></button>`;
    }).join('');
  }
  const runningTimeCriteria='가동시간 = 작업시간 + 대기시간.';
  function referenceRateCriteria(today) {
    return `<p class="source-note">${runningTimeCriteria}<br>작업·대기 비중은 가동시간 대비 비율입니다. 가동시간이 0이면 비중은 -로 표시합니다.<br>선택 기간의 실적 확인 차량을 집계하며, 대당 평균은 해당 차량 수로 나눕니다. 미래·자료 없는 구간은 제외합니다.</p>`;
  }
  function summaryVehicles() {
    return sortedSummaryVehicles(filterVehicleQuery(M.listed(rows,state),'listVehicle'));
  }
  function summaryCards() {
    return summaryVehicles().map(vehicleCard).join('')||'<p class="empty-state">조건에 맞는 차량이 없습니다.</p>';
  }
  function lookupChoices() {
    return [{equipmentId:'',equipmentNumber:'전체 차량'},...M.scope(rows,state)];
  }
  function updateVehicleLookup() {
    const control=vehicleQueryControl(),query=vehicleSearchKeys[control],input=$('#vehicle-lookup-input'),popup=$('#vehicle-lookup-popup');
    if(!control||!input||!popup)return;
    input.setAttribute('aria-expanded',String(vehicleLookupOpen));
    input.removeAttribute('aria-activedescendant');
    popup.hidden=!vehicleLookupOpen;
    $('[data-clear-vehicle-lookup]').hidden=!state[control]&&!state[query];
    $('[data-toggle-vehicle-lookup]').setAttribute('aria-label',vehicleLookupOpen?'차량 목록 닫기':'차량 목록 열기');
    if(!vehicleLookupOpen)return;
    $('#vehicle-lookup-options').innerHTML=lookupChoices().map((v,index)=>`<button type="button" role="option" tabindex="-1" id="vehicle-lookup-option-${index}" data-select-vehicle-lookup="${esc(v.equipmentId)}" aria-selected="${!state[query]&&v.equipmentId===state[control]}" class="vehicle-combobox-option${index===vehicleLookupIndex?' is-keyboard-active':''}"><strong>${escField(v.equipmentNumber)}</strong>${v.equipmentId?`<span>${escField(v.model)} · ${escField(v.group)}</span>`:''}</button>`).join('');
    if(vehicleLookupIndex>=0){input.setAttribute('aria-activedescendant','vehicle-lookup-option-'+vehicleLookupIndex);$('#vehicle-lookup-option-'+vehicleLookupIndex)?.scrollIntoView?.({block:'nearest'});}
  }
  function openVehicleLookup() {
    if(!vehicleQueryControl())return;
    vehicleLookupOpen=true;vehicleLookupIndex=-1;
    updateVehicleLookup();$('#vehicle-lookup-input').focus();$('#vehicle-lookup-input').select?.();
  }
  function closeVehicleLookup() {
    if(!vehicleLookupOpen)return;
    vehicleLookupOpen=false;vehicleLookupIndex=-1;updateVehicleLookup();
  }
  function chooseLookupVehicle(id) {
    const control=vehicleQueryControl(),query=vehicleSearchKeys[control];
    if(!control||id&&!M.scope(rows,state).some(v=>v.equipmentId===id))return;
    go(state.view,{[control]:id,[query]:'',status:'all',live:'',equipmentId:''},true);
    $('#vehicle-lookup-input').focus({preventScroll:true});
  }
  function applyVehicleSearch(input) {
    const control=vehicleQueryControl(),searchKey=vehicleSearchKeys[control];
    if(!control)return;
    state[searchKey]=input.value;state[control]='';state.equipmentId='';
    vehicleLookupOpen=false;vehicleLookupIndex=-1;updateVehicleLookup();
    const query=new URLSearchParams(location.hash.split('?')[1]||'');
    for(const key of [searchKey,control,'equipmentId']){if(state[key])query.set(key,state[key]);else query.delete(key);}
    history.replaceState({},'',location.pathname+location.search+'#'+state.view+'?'+query);
    // Only replace query results: retain the input, caret, IME and unsubmitted date form.
    if(state.view==='summary')$('.vehicle-mobile-list').innerHTML=summaryCards();
    else if(state.view==='services'){
      syncSupplyContext();
      const data=serviceData();
      $('#vehicle-service-tabs').innerHTML=serviceTabs(data);
      $('#vehicle-query-results').innerHTML=serviceResults(data);
      syncSupplySelection();
    }else $('#vehicle-query-results').innerHTML=state.view==='reports'?reports(true):efficiency(true);
    $('#vehicle-lookup-status').textContent=vehicleSearchStatus();
    window.lucide?.createIcons({attrs:{'stroke-width':2}});
  }
  function sortedSummaryVehicles(vehicles,key=state.summarySort,direction=state.summaryDirection) {
    if(!summarySortFields.some(([field])=>field===key))return vehicles;
    return vehicles.map((vehicle,index)=>({vehicle,index,value:periodMetrics(vehicle)?.[key]})).sort((a,b)=>{
      const aKnown=Number.isFinite(a.value),bKnown=Number.isFinite(b.value);
      if(aKnown!==bKnown)return aKnown?-1:1;
      return (aKnown?(a.value-b.value)*(direction==='asc'?1:-1):0)||a.index-b.index;
    }).map(entry=>entry.vehicle);
  }
  function summarySortControls() {
    return `<div class="summary-sort" role="group" aria-label="차량 정렬">${summarySortFields.map(([key,label])=>{const active=state.summarySort===key,asc=state.summaryDirection==='asc';return `<button type="button" data-summary-sort="${key}" aria-pressed="${active}" aria-label="${label}${active?(asc?' 오름차순':' 내림차순'):''}, ${active&&!asc?'오름차순':'내림차순'}으로 정렬">${label}${icon(active?(asc?'arrow-up':'arrow-down'):'arrow-down-up')}</button>`;}).join('')}</div>`;
  }
  function reportScope() {
    return filterVehicleQuery(M.scope(rows,state),'reportVehicle');
  }
  function reportScopeError() {
    return '<p class="error-note">차량을 찾을 수 없거나 조회 범위 밖의 차량입니다.</p><button type="button" class="detail-secondary-button" data-clear-report-vehicle>전체 차량으로</button>';
  }
  function individualReport(v,p,today,webReport) {
    const entry=p.entries[0],m=entry?.m,battery=['리튬','납산'].includes(v.type);
    const chargeHelp=battery?'<p class="source-note">배터리 충전량은 기존 WEB 리포트의 조회 기간 평균(%) 기준입니다. 현재 값은 WEB의 고정 시연 자료를 재사용하며 실제 수집 이력이 아닙니다. 현재 잔량·전력소비율(kWh/h)과 구분합니다.</p>':'';
    return `<section class="dashboard-panel"><div class="dashboard-panel__head">${criteriaHeading('차량 운행정보','vehicle-operation-help')}<span>선택 차량 기준</span></div>${definition([['가동시간',m?hours(m.min):'-'],['운행거리',m?fmt(m.km,' km'):'-'],['충격',m?fmt(m.shock,'건'):'-'],['가동 중 대기 비중',rate(entry?.idleRate)],...(v.type==='엔진'?[['평균 연료소비율 ('+M.ENERGY_MONTH+' 월간)',fmt(v.fc,' L/h')]]:[]),...(battery?[['배터리 충전량 (기간 평균)',rate(webReport?.batt)]]:[])])}${v.type==='엔진'?`<p class="source-note">연료소비율은 ${M.ENERGY_MONTH} 월간 평균이며 위 조회 기간과 별도입니다.</p>`:''}${criteriaPanel('vehicle-operation-help','<p class="source-note">대기 비중 = 대기 ÷ (작업 + 대기) × 100 · 저활용 판정 없음</p>'+chargeHelp)}${!entry?`<p class="source-note">${today&&!v.conn?'현재 통신 미연결이며 선택 기간의 수집된 실적이 없습니다. 과거 기간을 선택하면 이전 실적을 확인할 수 있습니다.':'선택 기간의 수신 정보가 없습니다.'}</p>`:''}</section>`;
  }
  function summary() {
return `<div data-screen-id="LQ-OPS-001"><div class="snapshot"><div class="summary-title-with-map"><h1>요약정보</h1><button type="button" class="summary-fleet-map-button" data-fleet-map aria-label="전체 차량 지도 보기" title="전체 차량 지도 보기">${icon('map-pin')}지도보기</button></div>${periodCutoff()}</div>${periodControls({group:true,vehicle:'listVehicle'})}${summarySortControls()}${state.live?`<button class="clear-filter" type="button" data-clear-live>${esc(liveLabels[state.live]||state.live)} 차량${icon('x')}</button>`:''}<div class="vehicle-mobile-list">${summaryCards()}</div>${dataNote('작업·대기·거리·작업비율·충격은 조회 기간 실적입니다. 가동시간 = 작업시간 + 대기시간이며, 작업비율 = 작업시간 ÷ 가동시간 × 100입니다. 가동시간이 0이면 비율은 -로 표시합니다. 통신·가동 상태·잔량·에러·교체 알림은 마지막 수신 기준이며, 미연결 차량의 현재 가동 여부는 확인할 수 없습니다. 미연결이어도 선택 기간에 수집된 실적은 표시합니다. 소모품 숫자는 전체 조회 품목 수입니다. ! 표시는 사용률 90% 이상 교체 필요 품목이 있다는 뜻이며, 80% 이상~90% 미만 교체 임박은 주의 색상으로 구분합니다. 품목별 상태는 소모품에서, 합계와 비교는 업무 현황에서 확인할 수 있습니다.')}</div>`;
  }
  function selected() { return M.scope(rows,{...state,group:'',type:''}).find(v=>v.equipmentId===state.equipmentId); }
  function vehicleHeader(v,withServiceCenter=false) { return `<section class="detail-hero"><div class="detail-icon">${icon('truck')}</div><div><small>${esc(v.group)} · ${esc(v.type)}</small><h1>${escField(v.equipmentNumber)}</h1><p>${escField(v.model)} · ${escField(v.companyName)}</p></div>${withServiceCenter?serviceCenterButton(v):status(v)}</section>`; }
  function shockBreakdown(m,inlineHelp=false) {
    return `<div class="shock-breakdown" aria-label="충격 강도별 건수">${M.SHOCK_LEVELS.map(level=>`<div class="shock-band is-${level.key}"><span>${level.label}</span><strong>${fmt(m?.shockBands?.[level.key],'건')}</strong><small>${level.level} · ${level.min}g 이상</small></div>`).join('')}</div>${inlineHelp?'':criteriaHeading('충격 분류 기준','shock-level-help','h3')}${criteriaPanel('shock-level-help',M.SHOCK_LEVELS.map(level=>`<p class="source-note"><strong>${level.label}</strong> ${level.min}g 이상${level.max?' ~ '+level.max+'g 미만':''} · ${level.description}</p>`).join('')+'<p class="source-note">충격은 가장 높은 해당 단계에 한 번만 집계합니다.</p>')}`;
  }
  function lithiumStates(v) {
    if(v.type!=='리튬')return '';
    const known=!v.catalogOnly&&Number.isFinite(v.soc)&&v.soc>=0&&v.soc<=100;
    const info=known?M.web?.lithium?.snapshot(v):null;
    const fields=[['temperature','온도','thermometer'],['charge','충전','zap'],['battery','배터리','battery']];
    return `<div class="lithium-state-grid" aria-label="리튬 배터리 상태">${fields.map(([key,label,ico])=>{const value=info?.[key]||'수집 전',tone=['경고','이상'].includes(value)?'danger':value==='주의'?'warning':value==='정상'?'normal':'unknown';return `<div class="lithium-state-item is-${tone}">${icon(ico)}<span>${label}</span><strong>${esc(value)}</strong></div>`;}).join('')}</div>`;
  }
  function chargeAvailable(v) {return v?.type==='리튬'&&!v.catalogOnly&&Number.isFinite(v.soc)&&v.soc>=0&&v.soc<=100;}
  function chargeVehicle() {const v=selected();return ['detail','battery'].includes(state.view)&&chargeAvailable(v)?v:null;}
  function prepareCharge(v) {
    const key='linq.smartCharge.v1:'+state.role+':'+v.equipmentNumber;
    if(chargeContext!==key){
      let saved=chargeMemory.get(key);
      if(!saved)try{const value=JSON.parse(localStorage.getItem(key));if(value&&typeof value.on==='boolean'&&M.chargeWindow(value.from,value.to))saved=value;}catch(e){}
      chargeDraft={...(saved||{on:true,from:22,to:6})};chargeContext=key;chargeMessage='';
    }
    return chargeDraft;
  }
  function smartCharge(v) {
    if(v.type!=='리튬')return '';
    const draft=prepareCharge(v),available=chargeAvailable(v),on=available&&draft.on,w=M.chargeWindow(draft.from,draft.to);
    const field=(name,label,value)=>`<label><span>${label}</span><select data-charge-hour="${name}" aria-label="${label}" ${on?'':'disabled'}>${Array.from({length:24},(_,h)=>`<option value="${h}" ${h===Number(value)?'selected':''}>${String(h).padStart(2,'0')}시</option>`).join('')}</select></label>`;
    return `<section class="mobile-smart-charge" aria-label="스마트 충전"><label class="setting-row"><span><strong>스마트 충전</strong></span><input type="checkbox" data-charge-enabled aria-label="스마트 충전 사용" ${on?'checked':''} ${available?'':'disabled'}><i aria-hidden="true"></i></label><div class="charge-time-fields">${field('from','충전 시작 시간',draft.from)}${field('to','충전 종료 시간',draft.to)}</div><div class="charge-schedule"><span>${!available?'설정 수집 전':on?w.startLabel+' → '+w.endLabel+' · '+w.duration+'시간':'스마트 충전 꺼짐'}</span><small>차량 시간 · Asia/Seoul</small></div><div class="charge-save-row"><p class="source-note charge-feedback" role="status" aria-live="polite">${esc(chargeMessage||'변경 후 저장해 주세요.')}</p><button type="button" class="detail-secondary-button" data-save-charge ${available?'':'disabled'}>저장</button></div></section>`;
  }
  function saveCharge() {
    const v=chargeVehicle();if(!v)return;
    const draft=prepareCharge(v);if(!M.chargeWindow(draft.from,draft.to))return;
    try{
      if(typeof localStorage!=='undefined')localStorage.setItem(chargeContext,JSON.stringify(draft));
      chargeMemory.set(chargeContext,{...draft});chargeMessage=typeof localStorage==='undefined'?'이 화면에서만 저장했습니다.':'저장했습니다.';
    }catch(e){chargeMessage='저장하지 못했습니다. 다시 시도해 주세요.';}
    render();$('[data-save-charge]')?.focus();
  }
  function periodMaintenance(v) {
    try{
      const records=M.serviceRecords([v],{kind:'maintenance',from:state.from,to:state.to});
      return Array.isArray(records)?records:null;
    }catch{return null;}
  }
  function details() {
    const v=selected();
    if(!v) return '<p class="error-note">차량을 찾을 수 없거나 조회 범위 밖의 차량입니다.</p><button class="detail-secondary-button" data-route="summary">차량 목록으로</button>';
    const m=periodMetrics(v),energy=v.type==='엔진'?'엔진':'배터리';
    const maintenance=periodMaintenance(v);
    return `<div data-screen-id="LQ-OPS-002">${vehicleHeader(v)}<section class="detail-card"><div class="dashboard-panel__head"><h2>현재 점검 상태</h2><span>${v.conn?'수신 '+(v.receivedAt?.slice(5)||'정보 미제공'):'마지막 수신 '+(v.receivedAt?.slice(5)||'정보 미제공')}</span></div>${vehicleActions(v,{shock:false,energy:false})}</section>
      ${periodControls()}<section class="detail-card"><div class="dashboard-panel__head"><h2>조회 기간 운행</h2>${periodCutoff()}</div>${definition([['가동시간',m?hours(m.min):'-'],['작업시간',m?hours(m.work):'-'],['대기시간',m?hours(m.idle):'-']],'detail-period-primary')}${definition([['작업비율',rate(m?.efficiency)],['운행거리',m?fmt(m.km,' km'):'-']])}${reportActions(v,['efficiency'])}<div class="dashboard-panel__head detail-shock-heading">${criteriaHeading('충격','shock-level-help')}</div>${shockBreakdown(m,true)}${reportActions(v,['shock'])}</section>
      <section class="detail-card"><div class="dashboard-panel__head"><h2>${energy} 정보</h2><span>${v.conn?'현재 수신':'마지막 수신'}</span></div>${lithiumStates(v)}${v.type==='엔진'?definition([['평균 연료소비량',fmt(v.fc,' L/h')],['기준',M.ENERGY_MONTH+' 월간']]):definition([['종류',v.type],['잔량',rate(v.soc),v],['평균 전력소비량',fmt(v.bc,' kWh/h (월간)')],['배터리 전압',fmt(v.batteryVoltage,' V')],['배터리 용량',fmt(v.batteryCapacity,' Ah')],['수신시각',v.receivedAt]])}<p class="source-note">${energy==='엔진'?'회전수·냉각수 온도 이력 미수신':v.type==='리튬'?'마지막 수신 기준입니다.':'시계열·충전 이력 미수신'}</p>${smartCharge(v)}</section>
      <section class="detail-card" data-maintenance-period><div class="dashboard-panel__head"><h2>조회 기간 수리이력</h2><button type="button" data-route="maintenance">수리이력${icon('chevron-right')}</button></div>${maintenance?`<p class="source-note">${esc(state.from)} ~ ${esc(state.to)} · ${maintenance.length}건</p>${maintenance.map(maintenanceRow).join('')||'<p class="empty-state">조회 기간의 수리이력이 없습니다.</p>'}`:'<p class="source-note" role="alert">수리이력을 불러오지 못했습니다.</p>'+retryData()}</section>
      <section class="detail-card"><div class="dashboard-panel__head"><h2>최종 위치</h2>${validPosition(v.position)?`<button type="button" data-map>지도 보기${icon('chevron-right')}</button>`:''}</div><p class="source-note">${validPosition(v.position)?esc(typeof v.position.address==='string'&&v.position.address.trim()?v.position.address:'주소 정보 없음')+'<br>('+v.position.lat+', '+v.position.lng+')':'위치 정보 없음'}</p></section>
      <details class="detail-card vehicle-basics"><summary>차량 기본정보 · 누적 실적${icon('chevron-down')}</summary>${definition([['기종',v.codeName],['동력',v.type],['연식',v.modelYear],['누적 운행시간',fmt(v.cumH)+' h'],['누적 운행거리',fmt(v.cumKm)+' km'],['업체',v.companyName]])}</details>
      ${dataNote(metricCriteria+' '+missingCriteria)}</div>`;
  }
  function child() {
    const v=selected(); if(!v) return details();
    const m=periodMetrics(v), kind=state.view;
    const ids={shock:'LQ-OPS-005',engine:'LQ-OPS-006',battery:'LQ-OPS-007',operation:'LQ-OPS-002-T01',supplies:'LQ-SVC-003',maintenance:'LQ-SVC-002'};
    let content='';
    if(kind==='operation') content=definition([['가동시간',m?hours(m.min):'-'],['운행거리',m?fmt(m.km,' km'):'-'],['작업시간',m?hours(m.work):'-'],['대기시간',m?hours(m.idle):'-']]);
    if(kind==='shock') content=definition([['기간 내 충격',m?fmt(m.shock,'건'):'-']])+shockBreakdown(m);
    if(kind==='engine') content=v.type==='엔진'?definition([['평균 연료소비량 ('+M.ENERGY_MONTH+')',fmt(v.fc,' L/h')]])+'<p class="source-note">냉각수 온도·엔진 회전수 이력 미수신</p>':'<p class="empty-state">엔진 차량이 아닙니다.</p>';
    if(kind==='battery') content=v.type!=='엔진'?lithiumStates(v)+definition([['배터리 종류',v.type],['잔량'+(!v.conn?' (마지막 수신)':''),rate(v.soc),v],['수신시각',v.receivedAt],['평균 전력소비량 ('+M.ENERGY_MONTH+')',fmt(v.bc,' kWh/h')],['배터리 전압',fmt(v.batteryVoltage,' V')],['배터리 용량',fmt(v.batteryCapacity,' Ah')],...(v.type==='리튬'?[]:[['충전 예약','이용 불가']])])+smartCharge(v):'<p class="empty-state">배터리 차량이 아닙니다.</p>';
    if(kind==='supplies') {
      const summary=M.supplySummary([v]);
      content=supplyToolbar()+supplyNotice(summary)+(M.supplyItems(v).filter(r=>!state.serviceEntry||r.id===state.serviceEntry).map(supplyDetail).join('')||'<p class="empty-state">'+(summary.hasUnknown?'표시할 소모품 정보가 없습니다.':state.serviceEntry?'선택한 소모품을 찾을 수 없습니다.':'등록된 소모품이 없습니다.')+'</p>');
    }
    if(kind==='maintenance') content=M.serviceRecords([v],{kind,from:state.from,to:state.to}).map(maintenanceRow).join('')||'<p class="empty-state">해당 내역이 없습니다.</p>';
    if(state.serviceEntry&&kind==='maintenance') {
      const records=M.serviceHistory([v]);
      const entry=records.find(r=>r.id===state.serviceEntry&&r.kind===kind);
      if(!entry) content='<p class="empty-state">조회할 수 없는 내역입니다.</p>';
      else content=definition([['그룹',v.group],['기종',v.model],['호기',v.equipmentNumber],...maintenanceFields(entry)]);
    }
    return `<div data-screen-id="${ids[kind]}">${vehicleHeader(v,kind==='supplies')}<div class="section-heading"><h2>${labels[kind]}</h2>${['operation','shock'].includes(kind)?periodCutoff():`<small>${kind==='battery'&&!v.conn?'마지막 수신 정보':kind==='error'&&state.serviceEntry?'발생 이력':['battery','supplies','error'].includes(kind)?'현재 수신 상태':kind==='engine'?M.ENERGY_MONTH+' 월간':'기간별 정보'}</small>`}</div>${['operation','shock'].includes(kind)?periodControls():''}<section class="detail-card">${content}</section>${dataNote('운행·충격은 선택 기간 기준, 연료·전력소비량은 '+M.ENERGY_MONTH+' 현재 집계 기준입니다. 잔량·점검 알림은 마지막 수신 기준이며 수신되지 않은 숫자는 -로 표시합니다.')}<button class="detail-secondary-button" type="button" data-return>${state.returnView==='notifications'?'알림 목록으로 돌아가기':state.returnView==='summary'?'요약정보로 돌아가기':state.returnView==='services'?'서비스 목록으로 돌아가기':'차량 상세로 돌아가기'}</button></div>`;
  }
  function supplyUsage(r) {
    const valid=r.percent!=null;
    const context=!valid?'사용시간/교체주기 미수신':r.usedHours>r.cycleHours?'초과 '+fmt(r.usedHours-r.cycleHours)+' h':'교체까지 '+fmt(r.cycleHours-r.usedHours)+' h';
    return `<span class="supply-usage is-${r.key}"><span class="supply-usage-head"><span>${valid?'사용 '+fmt(r.usedHours)+' h / 주기 '+fmt(r.cycleHours)+' h':'미수신'}</span><strong>${valid?rate(r.percent):'-'}</strong></span><span class="supply-usage-track" aria-hidden="true"><span style="width:${valid?Math.min(100,Math.max(0,r.percent)):0}%"></span></span><span class="supply-usage-tail"><span>${r.label}</span><span>${context}</span></span></span>`;
  }
  function supplyDetail(r) {
    return `<article class="supply-detail">${state.role==='customer_owner'?supplyCheckbox(r):`<h3>${esc(r.name)}</h3>`}${supplyUsage(r)}${definition([['교체주기',r.cycleHours>0?fmt(r.cycleHours)+' h':'-'],['사용시간',r.usedHours!=null?fmt(r.usedHours)+' h':'-'],['최근 교체일',r.lastChangedAt||'미수신'],['수집 기준',r.occurredAt]])}</article>`;
  }
  function visibleSupplies() {
    if(state.role!=='customer_owner')return [];
    if(state.view==='services'&&state.service==='supplies'){
      const scoped=filterVehicleQuery(M.scope(rows,state),'serviceEquipmentId');
      return M.serviceRecords(scoped,{kind:'supplies',focus:state.serviceFocus});
    }
    if(state.view==='supplies'){const v=selected();return v?M.supplyItems(v).filter(r=>!state.serviceEntry||r.id===state.serviceEntry):[];}
    return [];
  }
  const resettable=r=>r.percent!=null&&r.usedHours>0;
  function supplyCheckbox(r) {
    const vehicle=rows.find(v=>v.equipmentId===r.equipmentId);
    return `<label class="supply-item-select"><input type="checkbox" data-supply-select="${esc(r.id)}" aria-label="${esc(r.name+' · '+fieldText(vehicle?.equipmentNumber)+' 선택')}" ${supplySelection.has(r.id)?'checked':''} ${resettable(r)?'':'disabled'}><strong>${esc(r.name)}</strong></label>`;
  }
  function supplyToolbar() {
    if(state.role!=='customer_owner')return '';
    const items=visibleSupplies().filter(resettable),count=supplySelection.size;
    return `<div class="supply-selection-toolbar"><label class="supply-all-select"><input type="checkbox" data-supply-select-all aria-label="소모품 전체 선택" ${items.length&&count===items.length?'checked':''} ${items.length?'':'disabled'}><span>전체 선택</span></label><span id="supply-selection-count" aria-live="polite">${count}개 선택</span><button type="button" class="report-primary-action" data-open-supply-reset ${count?'':'disabled'}>교체 완료 · Reset</button></div><div class="supply-reset-result" ${supplyMessage?'':'hidden'}><p role="status">${esc(supplyMessage)}</p>${supplyUndo.length?'<button type="button" class="detail-secondary-button" data-undo-supply-reset>실행 취소</button>':''}</div>`;
  }
  function syncSupplySelection() {
    const items=visibleSupplies().filter(resettable),ids=new Set(items.map(r=>r.id));
    for(const id of supplySelection)if(!ids.has(id))supplySelection.delete(id);
    const all=$('[data-supply-select-all]'),count=$('#supply-selection-count'),button=$('[data-open-supply-reset]');
    if(all){all.checked=items.length>0&&supplySelection.size===items.length;all.indeterminate=supplySelection.size>0&&supplySelection.size<items.length;all.disabled=!items.length;}
    if(count)count.textContent=supplySelection.size+'개 선택';
    if(button)button.disabled=!supplySelection.size;
    document.querySelectorAll('[data-supply-select]').forEach(input=>{input.checked=supplySelection.has(input.dataset.supplySelect);});
  }
  function openSupplyReset() {
    syncSupplySelection();
    supplyPending=visibleSupplies().filter(r=>resettable(r)&&supplySelection.has(r.id)).map(r=>r.id);
    if(state.role!=='customer_owner'||!supplyPending.length)return;
    $('#supply-reset-count').textContent='처리 대상 '+supplyPending.length+'개';
    $('#supply-reset-items').innerHTML=visibleSupplies().filter(r=>supplyPending.includes(r.id)).map(r=>`<li>${esc(r.name)} · ${esc(rows.find(v=>v.equipmentId===r.equipmentId).equipmentNumber)}</li>`).join('');
    $('#supply-reset-confirm').textContent=supplyPending.length+'개 항목 처리';
    $('#supply-reset-dialog').showModal();$('[data-close-supply-reset]').focus();
  }
  function confirmSupplyReset() {
    const dialog=$('#supply-reset-dialog'),visible=new Set(visibleSupplies().filter(resettable).map(r=>r.id));
    if(!dialog.open||state.role!=='customer_owner'||!supplyPending.length||supplyPending.some(id=>!visible.has(id))){if(dialog.open)dialog.close();return;}
    const snapshot=M.resetSupplies(rows,state,supplyPending);
    if(!snapshot.length)return;
    supplyUndo=snapshot;supplyMessage=snapshot.length+'개 항목을 교체 완료로 처리했습니다.';
    supplySelection.clear();dialog.close();render();$('[data-open-supply-reset]')?.focus();
  }
  function errorDocument(record) {
    const catalog=window.CustomerErrorDocuments;
    const key=record.pdfKey||String(record.code||'').toLowerCase();
    if(!catalog||!Object.hasOwn(catalog,key))return null;
    const pdf=catalog[key];
    return pdf.code===record.code&&pdf.mime==='application/pdf'&&/^JVBERi0[A-Za-z0-9+/=]+$/.test(pdf.base64||'')&&/^[\w.-]+\.pdf$/.test(pdf.filename||'')?pdf:null;
  }
  function errorRow(r) {
    const pdf=errorDocument(r),action=pdf?`<a class="error-pdf-download" href="data:application/pdf;base64,${pdf.base64}" download="${esc(pdf.filename)}" aria-label="에러코드 ${esc(r.code)} PDF 다운로드" title="PDF 다운로드">${icon('file-down')}</a>`:'<span class="error-pdf-missing" aria-label="등록된 PDF 없음" title="등록된 PDF 없음">-</span>';
    return `<div class="service-item-line error-service-item is-state-${r.resolved?'neutral':'danger'}" data-error-record="${esc(r.id)}"><div class="error-service-copy"><span class="error-service-heading">${icon('triangle-alert')}<strong>${esc(r.code||'코드 미제공')}${r.level?' · '+esc(r.level.toUpperCase()):''}</strong><b>${r.resolved?'해제':'미해제'}</b></span>${r.description?`<span class="error-service-description">${esc(r.description)}</span>`:'<span class="error-service-description">설명 미제공</span>'}<small>SPN ${esc(r.spn||'-')} / FMI ${esc(r.fmi||'-')}</small><small>발생 ${esc(r.occurredAt.slice(5).replace('-','.'))}${r.resolvedAt?' · 해제 '+esc(r.resolvedAt.slice(5).replace('-','.')):''}</small></div>${action}</div>`;
  }
  // Keep compact list rows; customer WEB fields belong only in the selected record detail.
  function maintenanceFields(r) {
    return [['수리일시',r.occurredAt||'-'],['고장부위',r.part||'-'],['현상',r.symptom||'-'],['완료여부',r.resolved?'완료':'진행중']];
  }
  function maintenanceRow(r) {
    return `<button type="button" class="service-item-line is-state-${r.resolved?'neutral':'danger'}" data-service-vehicle="${esc(r.equipmentId)}" data-kind="${r.kind}" data-entry="${esc(r.id)}"><span>${icon('clipboard-check')}${esc(r.label)}<small>${esc(r.occurredAt.slice(5).replace('-','.'))}</small></span><b>${r.resolved?'처리완료':'진행중'}</b>${icon('chevron-right')}</button>`;
  }
  function serviceData() {
    const scoped=filterVehicleQuery(M.scope(rows,state),'serviceEquipmentId'),s=periodState(),current=state.service==='supplies',activeErrors=state.service==='error'&&state.serviceFocus==='error';
    const filtered=M.serviceRecords(scoped,{kind:state.service,from:s.from,to:s.to,focus:state.serviceFocus,origin:state.serviceOrigin,through:state.serviceThrough||M.SNAPSHOT});
    const vehicles=scoped.filter(v=>filtered.some(r=>r.equipmentId===v.equipmentId));
    const supplyStatus=M.supplySummary(scoped);
    const tabCount=key=>key==='supplies'&&supplyStatus.hasUnknown?'-':M.serviceRecords(scoped,{kind:key,from:s.from,to:s.to,focus:key===state.service?state.serviceFocus:'',origin:state.serviceOrigin,through:state.serviceThrough||M.SNAPSHOT}).reduce((n,r)=>n+r.count,0);
    const open=filtered.filter(r=>!r.resolved).reduce((n,r)=>n+r.count,0);
    const itemRow=r=>r.kind==='error'?errorRow(r):current?`<div class="service-item-line supply-service-item"><span class="supply-service-name">${state.role==='customer_owner'?supplyCheckbox(r):`<strong>${esc(r.name)}</strong>`}</span>${supplyUsage(r)}</div>`:maintenanceRow(r);
    return {current,activeErrors,vehicles,filtered,supplyStatus,tabCount,open,itemRow};
  }
  function serviceTabs(data) {
    const tabs=[['maintenance','수리이력','clipboard-check'],['supplies','소모품','refresh-cw'],['error','에러','triangle-alert']];
    const {tabCount}=data;
    return `${tabs.map(([key,title,ico])=>`<button type="button" data-service="${key}" aria-pressed="${state.service===key}" class="${state.service===key?'is-active':''}">${icon(ico)}<span>${title}</span><strong>${tabCount(key)}</strong></button>`).join('')}`;
  }
  function serviceResults(data=serviceData()) {
    const {current,activeErrors,vehicles,filtered,supplyStatus,open,itemRow}=data;
    const note=current?'소모품은 마지막 수신 기준의 현재 상태이며 조회 기간을 적용하지 않습니다.':activeErrors?'발생일·조회 기간과 무관하게 현재 미해제 에러를 표시합니다.':state.service==='error'&&state.serviceOrigin==='dashboard'?'지정 집계 구간의 에러 발생 건수이며 해제된 건도 포함합니다. EE·FL 코드는 제외합니다.':'선택 기간에 발생한 이력과 현재 처리 상태를 표시합니다.';
    return `${current?supplyToolbar():''}
      ${['due','soon'].includes(state.serviceFocus)?`<button type="button" class="clear-filter" data-clear-service-focus aria-label="서비스 조회 조건 해제">${esc(liveLabels[state.serviceFocus])}${icon('x')}</button>`:''}
      ${current&&supplyStatus.hasUnknown?supplyNotice(supplyStatus):`<p class="source-note service-scope-note">${current?'현재':activeErrors?'현재 미해제':'기간 내'} ${vehicles.length}대 · ${filtered.reduce((n,r)=>n+r.count,0)}${current?'개':'건'}${state.service==='error'?' · 미해제 '+open+'건':current?' · 교체 필요 '+filtered.filter(r=>r.key==='due').reduce((n,r)=>n+r.count,0)+'개 · 임박 '+filtered.filter(r=>r.key==='soon').reduce((n,r)=>n+r.count,0)+'개':''}</p>`}
      <div class="vehicle-mobile-list">${vehicles.map(v=>`<article class="service-mobile-row" data-service-card="${esc(v.equipmentId)}"><div class="service-mobile-row__head"><button type="button" class="vehicle-card-main" data-vehicle="${esc(v.equipmentId)}"><strong>${escField(v.equipmentNumber)}</strong><small>${escField(v.model)} · ${esc(v.group)}</small></button>${['supplies','error'].includes(state.service)?serviceCenterButton(v):''}</div>${filtered.filter(r=>r.equipmentId===v.equipmentId).map(itemRow).join('')}</article>`).join('')||'<p class="empty-state">'+(current&&supplyStatus.hasUnknown?'확인 가능한 소모품 항목이 없습니다.':'해당 내역이 없습니다.')+'</p>'}</div>
      ${dataNote(note)}`;
  }
  function services() {
    const data=serviceData(),{current,activeErrors}=data;
    const help=current?'소모품은 기간과 무관한 마지막 수신 상태이며 교체 필요·임박 품목만 표시합니다. 사용률 90% 이상은 교체 필요, 80% 이상 90% 미만은 교체 임박입니다.':activeErrors?'발생일·조회 기간과 무관하게 현재 미해제 에러를 표시합니다. 에러 탭을 다시 선택하면 기간별 발생 이력으로 전환합니다.':state.service==='error'&&state.serviceOrigin==='dashboard'?'지정 집계 구간의 에러 발생 건수이며, 해제된 건도 포함하고 EE·FL 코드는 제외합니다.':'수리이력·에러는 선택 기간의 발생 건수이며 현재 처리 상태를 함께 표시합니다. 홈의 에러 미처리와 차량의 에러 숫자는 기간과 무관한 현재 미해제 건입니다.';
    return `<div data-screen-id="LQ-SVC-001"><div class="snapshot">${criteriaHeading('서비스','service-help','h1')}${periodCutoff()}</div>${criteriaPanel('service-help','<p class="source-note">'+help+'</p>')}${serviceScopeControls()}<div id="vehicle-service-tabs" class="mobile-status-tabs service-category-tabs" role="group" aria-label="서비스 종류">${serviceTabs(data)}</div>
      ${current||activeErrors?'':periodControls()}<div id="vehicle-query-results">${serviceResults(data)}</div></div>`;
  }
  function notificationItems() { return M.recentNotifications(M.pushHistory(M.scope(rows,{...state,group:''}))); }
  function notifications() {
    const items=notificationItems(),window=M.notificationWindow();
    const counts=Object.fromEntries(notificationCategories.map(([key])=>[key,key==='all'?items.length:items.filter(item=>notificationCategory(item)===key).length]));
    const categories=notificationCategories.filter(([key])=>key!=='other'||counts.other||state.notificationCategory==='other');
    const selected=state.notificationCategory,filtered=selected==='all'?items:items.filter(item=>notificationCategory(item)===selected);
    const tabs=`<div class="mobile-status-tabs push-category-tabs" role="group" aria-label="알림 유형">${categories.map(([key,label])=>`<button type="button" data-notification-category="${key}" class="${selected===key?'is-active':''}" aria-pressed="${selected===key}" aria-controls="push-history-list" aria-label="${label} 알림 ${counts[key]}건"><span>${label}</span><strong>${counts[key]}</strong></button>`).join('')}</div>`;
    return `<div data-screen-id="LQ-COM-004"><div class="snapshot">${criteriaHeading('알림 내역','notification-period-help','h1')}<span>최근 30일</span></div>${criteriaPanel('notification-period-help','<p class="source-note">발생일시 기준 최근 30일의 알림을 최신순으로 표시합니다. 30일이 지난 알림은 목록과 건수에서 제외합니다. 시간은 한국시간 기준입니다.</p><p class="source-note">알림은 발생 당시의 기록으로, 목록에 남아 있다고 현재도 경고가 지속되는 것은 아닙니다. 현재 상태는 차량 상세에서 확인해 주세요.</p>')}<p class="source-note">조회 ${esc(window.from)} ~ ${esc(window.to)}</p>${tabs}<div id="push-history-list" class="notification-history-list push-history" aria-live="polite">${filtered.map(item=>{
      const type=M.pushPresentation(item),tag=type.view?'button':'article';
      return `<${tag} ${type.view?`type="button" data-notification-entry="${esc(item.id)}"`:''} class="notification-history-item push-history-item" data-push-category="${notificationCategory(item)}">${icon(type.icon)}<span class="notification-history-copy"><span class="push-history-heading"><strong>${esc(type.label)}</strong>${type.view?icon('chevron-right'):''}</span><span class="push-history-message">${esc(item.message)}</span><time class="push-history-date" datetime="${esc(String(item.pushDatetime).replace(' ','T'))}">${esc(item.pushDatetime)}</time></span></${tag}>`;
    }).join('')||(items.length?'<p class="empty-state">해당 유형의 알림이 없습니다.</p>':'<div class="push-history-empty"><p class="empty-state">PUSH 내역이 없습니다.</p><button class="detail-secondary-button" type="button" data-route="settings">PUSH 서비스 설정</button></div>')}</div></div>`;
  }
  function reportTabs() {
    const inline=state.efficiencyLayout==='inline',vehicle=state.view==='efficiency'&&state.efficiencyMode==='vehicle',daily=state.view==='efficiency'&&(!vehicle||inline);
    return `<div class="mobile-status-tabs report-tabs${inline?'':' has-vehicle-efficiency'}" role="group" aria-label="리포트 메뉴"><button type="button" data-route="reports" class="${state.view==='reports'?'is-active':''}" aria-pressed="${state.view==='reports'}">${icon('chart-no-axes-combined')}<span>업무 현황</span></button><button type="button" data-efficiency-mode="daily" class="${daily?'is-active':''}" aria-pressed="${daily}">${icon('chart-no-axes-gantt')}<span>운영효율</span></button>${inline?'':`<button type="button" data-efficiency-mode="vehicle" class="${vehicle?'is-active':''}" aria-pressed="${vehicle}">${icon('truck')}<span>차량별효율</span></button>`}</div>`;
  }
  function efficiencyTitle() {return state.efficiencyLayout!=='inline'&&state.efficiencyMode==='vehicle'?'차량별효율':'운영효율';}
  function sortedEfficiencyEntries(entries,value,direction=state.efficiencyDirection) {
    if(!['asc','desc'].includes(direction))return entries;
    return entries.map((entry,index)=>({entry,index,value:value(entry)})).sort((a,b)=>{
      const aKnown=Number.isFinite(a.value),bKnown=Number.isFinite(b.value);
      if(aKnown!==bKnown)return aKnown?-1:1;
      return (aKnown?(a.value-b.value)*(direction==='asc'?1:-1):0)||a.index-b.index;
    }).map(item=>item.entry);
  }
  function efficiencySortControl(count) {
    const direction=state.efficiencyDirection,current=direction==='desc'?'많은 순':direction==='asc'?'적은 순':'기본순',next=direction==='desc'?'적은 순':direction==='asc'?'기본순':'많은 순';
    return `<button type="button" class="efficiency-sort" data-efficiency-sort data-direction="${direction}" aria-label="작업시간 정렬: ${current}. ${next}으로 변경" title="작업시간 많은 순 → 적은 순 → 기본순" ${count<2?'disabled':''}>작업시간${icon(direction==='desc'?'arrow-down':direction==='asc'?'arrow-up':'arrow-up-down')}</button>`;
  }
  function vehicleEfficiencySortTabs(count) {
    return `<div class="mobile-status-tabs efficiency-view-tabs" role="group" aria-label="차량별 효율 정렬">${[['running','가동시간'],['work','작업시간']].map(([key,label])=>{const active=state.efficiencySortMetric===key,asc=state.efficiencyDirection==='asc';return `<button type="button" data-efficiency-sort data-efficiency-sort-metric="${key}" data-direction="${active?state.efficiencyDirection:''}" aria-pressed="${active}" class="${active?'is-active':''}" aria-label="${label}${active?(asc?' 오름차순':' 내림차순'):''}, ${active&&!asc?'오름차순':'내림차순'}으로 정렬" ${count<2?'disabled':''}>${label}${icon(active?(asc?'arrow-up':'arrow-down'):'arrow-up-down')}</button>`;}).join('')}</div>`;
  }
  function efficiencyTimeDescription(p,divisor=1,byVehicle=false) {
    const running=(p.work+p.idle)/divisor,work=p.work/divisor;
    return byVehicle&&state.efficiencySortMetric==='running'?'가동 '+hours(running)+', 작업 '+hours(work):'작업 '+hours(work)+', '+(byVehicle?'가동 '+hours(running):'대기 '+hours(p.idle/divisor));
  }
  function efficiencyChart(p,divisor=1,byVehicle=false) {
    const running=p.work+p.idle,segments=[['is-work',p.work],['is-idle',p.idle]];
    const bar='<div class="work-track" aria-hidden="true">'+segments.map(([kind,value])=>'<span class="'+kind+'" style="width:'+(running?value/running*100:0)+'%"></span>').join('')+'</div>';
    const runningFirst=byVehicle&&state.efficiencySortMetric==='running';
    const primary=runningFirst?'가동 '+shortHours(running/divisor):'작업 '+shortHours(p.work/divisor);
    const secondary=runningFirst?'작업 '+shortHours(p.work/divisor):byVehicle?'가동 '+shortHours(running/divisor):'대기 '+shortHours(p.idle/divisor);
    return bar+'<strong><span>'+primary+'<small>'+secondary+'</small></span>'+icon('chevron-down')+'</strong>';
  }
  function runningShare(p,key) {
    const running=Number.isFinite(p.work)&&Number.isFinite(p.idle)?p.work+p.idle:0;
    return running>0&&Number.isFinite(p[key])?p[key]/running*100:null;
  }
  function efficiencyDetails(p,divisor=1) {
    const known=p.known>0&&Number.isFinite(p.work)&&Number.isFinite(p.idle);
    return definition([['작업시간 ('+rate(runningShare(p,'work'))+')',known?hours(p.work/divisor):'-'],['대기시간 ('+rate(runningShare(p,'idle'))+')',known?hours(p.idle/divisor):'-'],['가동시간',known?hours((p.work+p.idle)/divisor):'-'],['실적 확인',p.known+' / '+p.total+'대']]);
  }
  function vehicleEfficiencyRows(scoped) {
    const entries=scoped.map(v=>({v,p:M.efficiencyPerformance([v],state.from,state.to,{period:state.period})}));
    return sortedEfficiencyEntries(entries,({p})=>p.known&&p.capacity>0?(state.efficiencySortMetric==='running'?p.work+p.idle:p.work):null).map(({v,p})=>{
      const capacity=p.capacity;
      const label=`<span class="efficiency-vehicle-label"><span class="efficiency-vehicle-id">${escField(v.equipmentNumber)}</span><small>${escField(v.model)}</small></span>`;
      if(!p.known||!capacity)return `<div class="efficiency-day efficiency-vehicle" data-efficiency-vehicle="${esc(v.equipmentId)}"><div class="efficiency-day-uncollected">${label}<span>미집계</span><strong>-</strong></div></div>`;
      return `<details class="efficiency-day efficiency-vehicle" data-efficiency-vehicle="${esc(v.equipmentId)}"><summary aria-label="${escField(v.equipmentNumber)} ${efficiencyTimeDescription(p,1,true)}, 상세 펼치기">${label}${efficiencyChart(p,1,true)}</summary><div class="efficiency-day__detail">${efficiencyDetails(p)}</div></details>`;
    }).join('');
  }
  function reportNote(today) {return '표시 시간은 분 단위로 반올림합니다.';}
  function reportWorkMetrics(p,webReport,vehicle) {
    const average=!vehicle&&state.reportMetricMode==='average',prefix=vehicle?'':average?'대당 ':'총 ';
    const work=average?performanceAverage(p,'work'):p.work,idle=average?performanceAverage(p,'idle'):p.idle;
    const running=Number.isFinite(work)&&Number.isFinite(idle)?work+idle:null;
    const distance=average?performanceAverage(p,'km'):webReport.dist;
    const tabs=vehicle?'':`<div class="mobile-status-tabs report-tabs" role="group" aria-label="작업 현황 집계 기준">${[['total','전체 합계'],['average','대당 평균']].map(([key,label])=>`<button type="button" data-report-metric-mode="${key}" class="${state.reportMetricMode===key?'is-active':''}" aria-pressed="${state.reportMetricMode===key}">${label}</button>`).join('')}</div>`;
    return tabs+`<div class="summary-totals report-key-metrics"><span><span class="report-metric-heading">${prefix}가동시간</span><strong>${hours(running)}</strong></span><span><span class="report-metric-heading">${prefix}작업시간 <small class="report-time-share">(${rate(runningShare(p,'work'))})</small></span><strong>${hours(work)}</strong></span><span><span class="report-metric-heading">${prefix}대기시간 <small class="report-time-share">(${rate(runningShare(p,'idle'))})</small></span><strong>${hours(idle)}</strong></span></div><p class="source-note report-distance">${vehicle?'운행거리':average?'대당 이동거리':'총 운행거리'} <strong>${fmt(distance,' km')}</strong></p>${performanceBar(p,average&&p.known?p.known:1)}`;
  }
  function reportView(screenId,title,content,resultsOnly) {
    return resultsOnly?content:`<div data-screen-id="${screenId}"><div class="snapshot"><h1>${title}</h1>${periodCutoff()}</div>${reportTabs()}${periodControls({group:true,vehicle:true})}<div id="vehicle-query-results">${content}</div></div>`;
  }
  function reports(resultsOnly=false) {
    const scoped=reportScope(),vehicle=state.reportVehicle&&!state.reportSearch?scoped[0]:null,today=isToday(),p=M.efficiencyPerformance(scoped,state.from,state.to,{today,period:state.period});
    if(state.reportVehicle&&!state.reportSearch&&!vehicle)return reportView('LQ-RPT-001','업무 리포트',reportScopeError(),resultsOnly);
    const webReport=M.reportValues(scoped,state.from,state.to,state.period);
    // Preserve existing reportFocus=unknown links; the filter now means current disconnection.
    const focusTabs=[['all','전체',p.total],['waiting','긴 대기',p.waiting.length],['unknown','미연결',M.counts(scoped).offline]];
    const content=`
      <section class="dashboard-panel"><div class="dashboard-panel__head">${criteriaHeading(vehicle?'차량 작업 현황':state.role==='customer_staff'?'내 그룹 전체 작업 현황':state.group||state.reportSearch?'조회 범위 전체 작업 현황':'전체 차량 작업 현황','report-work-help')}<span>집계 ${p.known} / ${p.total}대</span></div>${criteriaPanel('report-work-help',referenceRateCriteria(today))}${p.known?reportWorkMetrics(p,webReport,vehicle): '<p class="empty-state">선택 범위의 집계 정보가 없습니다.</p>'}${today&&p.unknown?'<p class="source-note">선택 기간의 실적이 없는 차량은 '+p.unknown+'대입니다.</p>':''}</section>
      ${!vehicle&&state.role==='customer_owner'&&new Set(scoped.map(v=>v.group)).size>1?`<section class="dashboard-panel"><div class="dashboard-panel__head">${criteriaHeading('그룹별 작업 현황','report-group-help')}<span>대당 실적</span></div>${criteriaPanel('report-group-help','<p class="source-note">'+metricCriteria+' 대당 시간·이동거리는 실적 확인 차량의 평균입니다.</p>')}${groupPerformance(scoped,state.from,state.to,today)}</section>`:''}
      ${vehicle?individualReport(vehicle,p,today,webReport):`<section class="dashboard-panel"><div class="dashboard-panel__head">${criteriaHeading('차량별 작업 현황','roster-help')}<button type="button" class="efficiency-sort report-roster-sort" data-report-sort data-direction="${state.reportSortDirection}" aria-label="작업시간 ${state.reportSortDirection==='asc'?'적은':'많은'} 순. ${state.reportSortDirection==='asc'?'많은':'적은'} 순으로 변경">작업시간${icon(state.reportSortDirection==='asc'?'arrow-up':'arrow-down')}</button></div><div class="mobile-status-tabs report-focus-tabs" role="group" aria-label="차량 확인 기준">${focusTabs.map(([key,label,n])=>`<button type="button" data-report-focus="${key}" aria-pressed="${state.reportFocus===key}" class="${state.reportFocus===key?'is-active':''}"><span>${label}</span><strong>${n}</strong></button>`).join('')}</div>${criteriaPanel('roster-help',rosterCriteria(p,{today})+'<p class="source-note">긴 대기: 대기 비중 30% 이상이면서 대기 30분 이상 (임시 조회 조건)</p>')}${reportRoster(scoped,p,{today,focus:state.reportFocus})}</section>`}
      <button type="button" class="report-primary-action" data-efficiency>${icon('chart-no-axes-gantt')}월간 운영효율 보기${icon('chevron-right')}</button>
      ${dataNote(reportNote(today)+' 가동시간은 작업시간과 대기시간의 합계입니다. 작업·대기 비중은 가동시간 대비 비율이며, 가동시간이 0이면 -로 표시합니다. 차량별 목록은 기본 작업시간 많은 순이며 정렬 방향을 변경할 수 있습니다. 실적 없는 차량은 뒤에 표시합니다. 미연결은 현재 통신 상태이며 기간 실적과 구분합니다. 긴 대기는 표시된 임시 조회 조건이며 성과 판정이 아닙니다.')}`;
    return reportView('LQ-RPT-001','업무 리포트',content,resultsOnly);
  }
  function efficiency(resultsOnly=false) {
    const byVehicle=state.efficiencyMode==='vehicle',inline=state.efficiencyLayout==='inline',screenId=byVehicle?'LQ-REF-003-T02':inline?'LQ-REF-003-T01':'LQ-REF-003';
    const scoped=reportScope(),vehicle=state.reportVehicle&&!state.reportSearch?scoped[0]:null,today=isToday(),hourly=state.period==='d',days=M.efficiencyCalendar(scoped,state.period,state.from,state.to,{today,period:state.period}),p=M.efficiencyPerformance(scoped,state.from,state.to,{today,period:state.period});
    if(state.reportVehicle&&!state.reportSearch&&!vehicle)return reportView(screenId,efficiencyTitle(),reportScopeError(),resultsOnly);
    const efficiencyScopeCriteria='선택한 전체·그룹·차량과 조회 기간의 실적입니다. 전체 합계와 대당 평균을 선택할 수 있으며, 대당 평균은 실적 확인 차량 수로 나눕니다. 작업·대기 비중은 가동시간 대비 비율입니다. 가동시간이 0이면 비중은 -로 표시합니다. 미래·자료 없는 구간은 미집계로 표시합니다.';
    const weekday=date=>['일','월','화','수','목','금','토'][new Date(date+'T12:00:00+09:00').getUTCDay()];
    const daily=sortedEfficiencyEntries(days,d=>d.known>0&&Number.isFinite(d.work)?d.work/d.known:null).map(d=>{
      const date=`<span class="efficiency-date">${d.hour||d.date.slice(-2)}${d.hour?'':`<small>${weekday(d.date)}</small>`}</span>`;
      if(!d.known)return `<div class="efficiency-day" data-date="${d.date}"${d.hour?` data-hour="${d.hour}"`:''}><div class="efficiency-day-uncollected" aria-label="${d.date} 미집계">${date}<span>미집계</span><strong>-</strong></div></div>`;
      return `<details class="efficiency-day" data-date="${d.date}"${d.hour?` data-hour="${d.hour}"`:''}><summary aria-label="${d.date}${d.hour?' '+d.hour:''} ${efficiencyTimeDescription(d,d.known)}, 상세 펼치기">${date}${efficiencyChart(d,d.known)}</summary><div class="efficiency-day__detail">${efficiencyDetails(d,d.known)}</div></details>`;
    }).join('');
    const graphTitle=byVehicle?'차량별 운영 현황':hourly?'시간대별 운영 현황':'일별 운영 현황';
    const graphHelp=byVehicle?'선택한 조회 기간의 차량별 작업·대기시간입니다. 현재 통신 상태와 기간 실적은 구분합니다. 행을 누르면 작업·대기 비중과 가동시간을 확인할 수 있습니다.':efficiencyScopeCriteria;
    const graphTabs=inline?`<div class="mobile-status-tabs efficiency-view-tabs" role="group" aria-label="운영 현황 표시 기준"><button type="button" data-efficiency-mode="daily" data-inline-efficiency aria-pressed="${!byVehicle}" class="${!byVehicle?'is-active':''}">${hourly?'시간대별':'일별'} 운영 현황</button><button type="button" data-efficiency-mode="vehicle" data-inline-efficiency aria-pressed="${byVehicle}" class="${byVehicle?'is-active':''}">차량별 운영 현황</button></div>`:'';
    const content=`<section class="dashboard-panel"><div class="dashboard-panel__head">${criteriaHeading('기간 작업비율','efficiency-help')}<span>집계 ${p.known} / ${p.total}대</span></div>${criteriaPanel('efficiency-help','<p class="source-note">'+efficiencyScopeCriteria+'</p>')}${!p.known?'<p class="empty-state">집계 정보가 없습니다.</p>':''}${reportWorkMetrics(p,M.reportValues(scoped,state.from,state.to,state.period),vehicle)}</section>
      <section class="dashboard-panel efficiency-panel${byVehicle?' is-by-vehicle':''}" aria-label="${graphTitle}">${inline?`<div class="dashboard-panel__head">${graphTabs}</div>`:''}${criteriaPanel('daily-efficiency-help','<p class="source-note">'+graphHelp+' '+runningTimeCriteria+' 막대는 각 행의 가동시간을 100%로 한 작업·대기 비중입니다. 시간 자체의 크기는 오른쪽 숫자로 확인합니다. h는 시간, m은 분입니다.</p>')}<div class="work-legend efficiency-legend"><span class="efficiency-graph-count">${byVehicle?scoped.length+'대':days.length+(hourly?'시간':'일')}<button id="daily-efficiency-help-trigger" type="button" class="criteria-tip" data-criteria-tip="daily-efficiency-help" aria-label="${graphTitle} 기준 안내" aria-expanded="false" aria-controls="daily-efficiency-help">${icon('circle-help')}</button></span><span><i class="is-work"></i>작업</span><span><i class="is-idle"></i>대기</span></div>${byVehicle?vehicleEfficiencySortTabs(scoped.length):''}<p class="source-note efficiency-scale-label">가동시간 내 비중 (가동 = 작업 + 대기)</p><div class="efficiency-axis"><span class="efficiency-axis-scale" aria-hidden="true">0<span>50</span>100%</span>${byVehicle?'':efficiencySortControl(days.length)}</div><div class="efficiency-daily-list">${(byVehicle?vehicleEfficiencyRows(scoped):daily)||'<p class="empty-state">조회 조건에 해당하는 실적이 없습니다.</p>'}</div></section>${dataNote(reportNote(today)+' '+missingCriteria)}`;
    return reportView(screenId,efficiencyTitle(),content,resultsOnly);
  }
  function approvalCards() {
    const all=approvalStore.list(state.role),query=approvalQuery.trim().toLowerCase();
    const filtered=all.filter(r=>(approvalStatus==='all'||r.status===approvalStatus)&&(!query||[r.name,r.email,r.companyName,r.group].join(' ').toLowerCase().includes(query)));
    return filtered.map(r=>`<article class="detail-card customer-approval-card" data-approval-card="${esc(r.id)}"><header><div><h2>${esc(r.name)}</h2><small>고객 직원</small></div><span class="status-pill ${r.status==='pending'?'is-warning':r.status==='rejected'?'is-danger':''}">${approvalLabels[r.status]}</span></header><p class="approval-email">${esc(r.email)}</p><p class="source-note">신청 ${esc(r.createdAt)}</p>${r.status==='pending'?`<div class="customer-approval-actions"><button type="button" class="detail-secondary-button" data-review-request="${esc(r.id)}" data-review-action="reject">반려</button><button type="button" class="report-primary-action" data-review-request="${esc(r.id)}" data-review-action="approve">${icon('check')}승인</button></div>`:definition([...(r.status==='approved'?[['배정 그룹',r.group]]:[['반려 사유',r.reason]]),['처리자',r.processedBy],['처리일시',r.processedAt]])}</article>`).join('')||'<p class="empty-state">'+(all.length?'조건에 맞는 신청이 없습니다.':'접수된 직원 신청이 없습니다.')+'</p>';
  }
  function approvals() {
    if(state.role!=='customer_owner')return '<p class="error-note">고객 대표만 사용자 신청을 처리할 수 있습니다.</p><button type="button" class="detail-secondary-button" data-route="settings">설정으로 돌아가기</button>';
    const all=approvalStore.list(state.role);
    return `<div data-screen-id="LQ-MGT-001-T01"><div class="snapshot">${criteriaHeading('사용자 승인','approval-list-help','h1')}<span>전체 기간 · 신청일 최신순</span></div>${criteriaPanel('approval-list-help','<p class="source-note"><strong>조회 대상</strong> 소속 업체의 고객 직원 가입 신청입니다. 고객 대표만 조회·처리할 수 있습니다.</p><p class="source-note"><strong>기간·정렬</strong> 기간 제한 없이 전체 신청 이력을 신청일 최신순으로 표시합니다. 승인·반려 탭도 처리일이 아닌 신청일 순서입니다.</p><p class="source-note"><strong>상태 구분</strong> 대기는 미처리 신청, 승인은 승인 완료, 반려는 반려 완료이며 전체는 세 상태의 합계입니다.</p><p class="source-note"><strong>검색·건수</strong> 검색은 선택한 상태의 목록에 적용됩니다. 탭 숫자는 검색 전 상태별 전체 건수입니다.</p>')}<p class="source-note">(주)세종물류중부지점 · 고객 대표만 승인·반려할 수 있습니다.</p><label class="approval-search">${icon('search')}<input type="search" data-approval-search aria-label="신청자 이름·이메일 검색" placeholder="이름 · 이메일 검색" value="${esc(approvalQuery)}"></label><div class="mobile-status-tabs approval-status-tabs" role="group" aria-label="신청 처리 상태">${[['pending','대기'],['approved','승인'],['rejected','반려'],['all','전체']].map(([key,label])=>`<button type="button" data-approval-status="${key}" class="${approvalStatus===key?'is-active':''}" aria-pressed="${approvalStatus===key}"><span>${label}</span><strong>${key==='all'?all.length:all.filter(r=>r.status===key).length}</strong></button>`).join('')}</div><p class="approval-message" role="status" tabindex="-1" ${approvalMessage?'':'hidden'}>${esc(approvalMessage)}</p><div id="customer-approval-list">${approvalCards()}</div></div>`;
  }
  function openCustomerApproval(id,action) {
    const request=approvalStore.find(id,state.role);
    if(state.view!=='approvals'||!request||request.status!=='pending'||!['approve','reject'].includes(action))return;
    approvalPending={id,action,role:state.role};
    const approving=action==='approve';
    $('#customer-approval-title').textContent=approving?'사용자 승인 확인':'사용자 반려 확인';
    $('#customer-approval-target').innerHTML=definition([['신청자',request.name],['구분','고객 직원'],['이메일',request.email],['소속 업체',request.companyName]]);
    $('#customer-approval-group').innerHTML='<option value="">그룹을 선택해 주세요</option>'+approvalStore.groups().map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join('');
    $('#customer-approval-group-field').hidden=!approving;
    $('#customer-approval-reason-field').hidden=approving;
    $('#customer-approval-reason-type').innerHTML='<option value="">사유를 선택해 주세요</option>'+rejectionReasons.map((r,i)=>`<option value="${i}">${esc(r)}</option>`).join('')+'<option value="custom">직접 입력</option>';
    $('#customer-approval-reason').value='';$('#customer-approval-reason').hidden=true;
    $('#customer-approval-error').textContent='';$('#customer-approval-error').hidden=true;
    $('#customer-approval-confirm').textContent=approving?'승인 처리':'반려 처리';
    $('#customer-approval-dialog').showModal();
    $(approving?'#customer-approval-group':'#customer-approval-reason-type').focus();
  }
  function confirmCustomerApproval() {
    if(!approvalPending)return;
    if(state.view!=='approvals'||state.role!==approvalPending.role||state.role!=='customer_owner'){closeCustomerApproval();return;}
    const reasonType=$('#customer-approval-reason-type').value;
    const reason=reasonType==='custom'?$('#customer-approval-reason').value:/^[0-2]$/.test(reasonType)?rejectionReasons[Number(reasonType)]:'';
    const result=approvalStore.process(approvalPending.id,state.role,approvalPending.action,{group:$('#customer-approval-group').value,reason});
    if(!result.ok){$('#customer-approval-error').textContent=result.message;$('#customer-approval-error').hidden=false;$('#customer-approval-error').focus();return;}
    approvalMessage=result.message;approvalPending=null;$('#customer-approval-dialog').close();render();$('.approval-message')?.focus();
  }
  function closeCustomerApproval() {
    const pending=approvalPending;approvalPending=null;$('#customer-approval-dialog')?.close();
    if(pending)$('[data-review-request="'+pending.id+'"][data-review-action="'+pending.action+'"]')?.focus();
  }
  function account() {const profile=window.CustomerOnboarding?.current();return `<section class="detail-card" data-screen-id="LQ-ACC-001"><h2>내 정보</h2>${definition([['이름',profile?.name||(state.role==='customer_owner'?'윤태호':'정보 미제공')],['구분',M.ROLE_LABELS[state.role]],['소속 업체',profile?.company||'(주)세종물류중부지점'],['조회 범위',profile?'승인된 조회 차량 없음':state.role==='customer_owner'?'소속 업체 전체 차량':M.assignedGroup(state.role)+' 배정 차량'],['이메일',profile?.email||M.web.principals[state.role]]])}</section>`;}
  function vehicleRequired(){const owner=state.role==='customer_owner';return `<div class="vehicle-registration" data-screen-id="LQ-AUTH-006"><div class="snapshot"><h1>차량 등록 안내</h1></div><section class="detail-card"><h2>서비스를 이용하려면 차량 등록이 필요합니다.</h2><p class="source-note">${owner?'차량을 등록하고 담당 딜러의 승인을 받으면 서비스를 이용할 수 있습니다.':'소속 업체 대표가 차량을 등록하고 조회 그룹에 배정하면 서비스를 이용할 수 있습니다.'}</p>${owner?'<button type="button" class="report-primary-action" data-route="vehicleRegistration">차량 등록</button>':''}</section></div>`;}
  function settings() {
    const nativeTools=window.CustomerNativeTools?.settingsSection?.()||'';
    if(window.CustomerOnboarding?.current())return `<h1>설정</h1>${account()}${state.role==='customer_owner'?`<section class="settings-group customer-registration-entry"><button type="button" class="settings-link-row registration-entry-button" data-route="vehicleRegistration"><span><strong>차량 등록</strong><small>차량 시리얼번호로 조회·신청</small></span>${icon('chevron-right')}</button></section>`:''}<section class="settings-group"><button type="button" class="settings-link-row settings-logout" data-logout><span><strong>로그아웃</strong></span>${icon('log-out')}</button></section>`+nativeTools;
    const preferences=pushPreferences[state.role];
    const toggle=(key,label,disabled=false)=>`<label class="setting-row"><span><strong>${label}</strong></span><input type="checkbox" data-push-setting="${key}" ${preferences[key]?'checked':''} ${disabled?'disabled':''}><i aria-hidden="true"></i></label>`;
    return `<h1>설정</h1>${account()}${state.role==='customer_owner'?`<section class="settings-group customer-registration-entry"><button type="button" class="settings-link-row registration-entry-button" data-route="vehicleRegistration"><span><strong>차량 등록</strong><small>차량 시리얼번호로 조회·신청</small></span>${icon('chevron-right')}</button></section>`:''}<section class="settings-group"><h2>권한 화면 확인</h2><label class="select-row"><span><strong>조회 역할</strong><small>화면 확인용</small></span><select data-control="role" aria-label="조회 역할">${Object.entries(M.ROLE_LABELS).map(([key,label])=>`<option value="${key}" ${state.role===key?'selected':''}>${label}</option>`).join('')}</select></label></section>
      <section class="settings-group"><div class="dashboard-panel__head settings-panel-head">${criteriaHeading('PUSH 알림','push-settings-help')}</div>${criteriaPanel('push-settings-help','<p class="source-note">PUSH 전체를 끄면 하위 항목도 모두 꺼집니다. 다시 켠 뒤 받을 항목을 선택해 주세요. 공지사항/마케팅 알림은 별도 선택 항목입니다. 알림 내역은 발생 이력이며 PUSH 수신 설정과 구분됩니다.</p>')}${toggle('pushAlarmYn','PUSH 알림 받기')}${pushFields.map(([key,label])=>toggle(key,label,!preferences.pushAlarmYn)).join('')}</section>
      <section class="settings-group"><h2>계정 메뉴</h2>${state.role==='customer_owner'?`<button type="button" class="settings-link-row customer-approval-entry" data-route="approvals"><span><strong>사용자 승인</strong><small>소속 업체 직원 가입 신청</small></span><b>${approvalStore.list(state.role).filter(r=>r.status==='pending').length}건 대기</b>${icon('chevron-right')}</button>`:''}<button type="button" class="settings-link-row settings-logout" data-logout><span><strong>로그아웃</strong></span>${icon('log-out')}</button></section>`+nativeTools;
  }
  function syncSupplyContext() {
    const nextSupplyContext=JSON.stringify([state.view,state.service,state.role,state.group,state.serviceEquipmentId,state.equipmentId,state.serviceEntry,state.serviceFocus,state.serviceSearch]);
    if(supplyContext!==nextSupplyContext){supplySelection.clear();supplyPending=[];supplyUndo=[];supplyMessage='';supplyContext=nextSupplyContext;if($('#supply-reset-dialog')?.open)$('#supply-reset-dialog').close();}
  }
  function render() {
    if($('#service-center-dialog')?.open)$('#service-center-dialog').close();
    window.CustomerVehicleRegistration?.leave();
    state=readState();
    const onboarding=window.CustomerOnboarding,profile=onboarding?.current();
    if(profile){state.role=profile.role;if(onboarding.requiresVehicle()&&(!['settings','account','vehicleRegistration','vehicleRequired'].includes(state.view)||state.view==='vehicleRegistration'&&profile.role==='customer_staff'))return go('vehicleRequired',{role:profile.role},true);}
    if(state.view==='vehicleRegistration'&&state.role!=='customer_owner')return go('vehicleRequired',{},true);
    vehicleLookupOpen=false;vehicleLookupIndex=-1;
    if(approvalPending&&(state.view!=='approvals'||state.role!==approvalPending.role))closeCustomerApproval();
    if(!['detail','battery'].includes(state.view)){chargeContext='';chargeDraft=null;chargeMessage='';}
    // Keep old error links usable without retaining a separate detail screen.
    if(state.view==='error')return go('services',{service:'error',serviceEquipmentId:state.equipmentId||state.serviceEquipmentId,serviceEntry:'',serviceFocus:'',q:'',live:''},true);
    syncSupplyContext();
    if(periodViews.has(state.view)||state.view==='services'){
      const query=new URLSearchParams(location.hash.split('?')[1]||'');
      const keys=state.view==='services'?['servicePeriod','serviceFrom','serviceTo']:['period','from','to'];
      if(state.view==='summary')keys.push('summarySort','summaryDirection');
      if(state.view==='efficiency'&&state.efficiencyMode==='vehicle')keys.push('efficiencySortMetric','efficiencyDirection');
      if(keys.some(key=>query.get(key)!==state[key])){
        keys.forEach(key=>query.set(key,state[key]));
        history.replaceState({},'',location.pathname+location.search+'#'+state.view+'?'+query);
      }
    }
    const fn={notFound:missingPage,home,summary,detail:details,services,notifications,reports,efficiency,vehicleRequired,account:settings,settings,approvals,vehicleRegistration:()=>window.CustomerVehicleRegistration?.render({role:state.role,navigate:go})||dataUnavailable()}[state.view]||child;
    $('#main').innerHTML=loadState.available?fn():dataUnavailable();
    if(loadState.available)syncSupplySelection();
    const homeView=state.view==='home'; $('#brand').hidden=!homeView; $('#header-title').hidden=homeView;
    $('#header-title').textContent=state.view==='efficiency'?efficiencyTitle():labels[state.view]; $('[data-back]').hidden=homeView;
    const totalNotifications=loadState.available&&!profile?notificationItems().length:0,hasNotifications=totalNotifications>0;
    $('#notification-count').textContent=hasNotifications?totalNotifications:'';
    $('.header-button').setAttribute('aria-label',hasNotifications?`전체 PUSH 알림 ${totalNotifications}건 열기`:'알림 내역 열기');
    $('#notification-count').hidden=!hasNotifications;
    const activeRoute=state.view==='notFound'?'':state.view==='notifications'||state.returnView==='notifications'&&['error','supplies','shock','battery','maintenance','engine','operation'].includes(state.view)?'':['reports','efficiency'].includes(state.view)?'reports':['settings','account','approvals','vehicleRegistration','vehicleRequired'].includes(state.view)?'settings':['home','summary','services'].includes(state.view)?state.view:state.view!=='detail'&&state.returnView==='services'?'services':'summary';
    document.querySelectorAll('.bottom-nav [data-route]').forEach(b=>{const active=b.dataset.route===activeRoute;b.classList.toggle('is-active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    document.title=`${state.view==='efficiency'?efficiencyTitle():labels[state.view]} · MACHINE IQ`;
    window.lucide?.createIcons({attrs:{'stroke-width':2}});
    alignNavigationIcons();
  }
  function setLocationMapExpanded(expanded) {
    $('#location-dialog').classList.toggle('is-map-expanded',expanded);
    const button=$('#location-map-expand'),label=expanded?'지도 원래 크기로':'지도 전체보기';
    button.setAttribute('aria-expanded',String(expanded));button.setAttribute('aria-label',label);button.title=label;
    $('#location-map-expand-label').textContent=expanded?'접기':'전체보기';
    window.CustomerLocationMap.resize();
  }
  let locationMapTrigger=null,locationFleetVehicles=[];
  const fleetMapVehicles=()=>M.scope(rows,{role:state.role});
  const locationInfoCell=(label,value,wide=false)=>'<div'+(wide?' class="is-wide"':'')+'><dt>'+label+'</dt><dd>'+esc(value??'정보 없음')+'</dd></div>';
  function locationVehicleInfo(v,fleet=false) {
    const p=v.position,positioned=validPosition(p);
    const cell=locationInfoCell;
    const m=periodMetrics(v),mapState=M.currentVehicle(v).status;
    const mapLabel=({ok:'정상',bad:'Fault',off:'미연결',unknown:'통신 미수집'})[mapState]||'통신 미수집';
    const mapClass=mapState==='bad'?'is-danger':mapState==='off'?'is-offline':mapState==='ok'?'':'is-unknown';
    $('#location-info-title').textContent=fleet?fieldText(v.equipmentNumber):'차량 정보';
    $('#location-dialog-info').innerHTML=cell('기종',v.model)
      +'<div><dt>상태</dt><dd><span class="status-pill '+mapClass+'" data-map-vehicle-status="'+esc(mapState)+'">'+mapLabel+'</span></dd></div>'
      +cell('소속 그룹',v.group)+cell('통신 상태',v.conn===true?'연결':v.conn===false?'미연결':'수집 전')
      +cell('총 가동시간',Number.isFinite(v.cumH)?fmt(v.cumH)+'H':'정보 없음')
      +cell('자료일 가동시간',m?hours(m.min)+' ('+state.from+' ~ '+state.to+')':'정보 없음')
      +cell('위치 기준 시간',positioned?p.lastDatetime:null,true)
      +(fleet?cell('최종 위치',positioned?(displayCopy(p.address)||'주소 정보 없음'):'위치 정보 없음',true):'');
    $('#location-dialog-coordinate').textContent=positioned?'('+p.lat.toFixed(6)+', '+p.lng.toFixed(6)+')':'';
  }
  function showFleetLocationOverview() {
    const positioned=locationFleetVehicles.filter(v=>validPosition(v.position));
    $('#location-dialog-info-section').hidden=false;$('#location-info-title').textContent='전체';
    $('#location-dialog-info').innerHTML=locationInfoCell('전체 차량',locationFleetVehicles.length+'대')
      +locationInfoCell('위치 확인',positioned.length+'대')
      +locationInfoCell('위치 정보 없음',(locationFleetVehicles.length-positioned.length)+'대',true);
    $('#location-dialog-coordinate').textContent='';
  }
  function selectFleetLocation(equipmentId) {
    if(state.view!=='summary'||!$('#location-dialog').open)return;
    const v=locationFleetVehicles.find(v=>v.equipmentId===equipmentId);
    if(!v||!fleetMapVehicles().some(row=>row.equipmentId===equipmentId))return;
    locationVehicleInfo(v,true);$('#location-dialog-info-section').hidden=false;
    window.CustomerLocationMap.resize({fitFleet:true});
  }
  function openFleetLocationDialog(trigger) {
    if(state.view!=='summary')return;
    locationFleetVehicles=fleetMapVehicles();locationMapTrigger=trigger;
    const positioned=locationFleetVehicles.filter(v=>validPosition(v.position));
    $('#location-dialog').classList.toggle('is-location-missing',!positioned.length);setLocationMapExpanded(false);
    $('#location-dialog-title').textContent='전체 차량 지도';
    $('#location-dialog-address').textContent='지도에서 차량을 누르면 해당 차량 정보를 확인할 수 있습니다.';
    showFleetLocationOverview();
    $('#location-map').hidden=!positioned.length;$('#location-map-expand').hidden=!positioned.length;
    $('#location-map').setAttribute('aria-label','Google 지도 · 전체 차량 최종 수신 위치');
    $('#location-dialog').showModal();$('#location-dialog-body').scrollTop=0;
    if(positioned.length)window.CustomerLocationMap.openFleet(positioned.map(v=>({...v.position,equipmentId:v.equipmentId,equipmentNumber:v.equipmentNumber,mapState:M.currentVehicle(v).status})),{onSelect:id=>selectFleetLocation(id)});
    else {
      window.CustomerLocationMap.close();$('#location-map-status').hidden=false;$('#location-map-external').hidden=true;
      $('#location-map-status-text').textContent=locationFleetVehicles.length?'차량의 위치 좌표가 없어 지도에 표시할 수 없습니다.':'등록된 차량이 없습니다.';
      $('#location-map').setAttribute('aria-busy','false');
    }
    window.lucide?.createIcons({attrs:{'stroke-width':2}});
  }
  function openLocationDialog(equipmentId='',trigger=null) {
    const v=equipmentId?(state.view==='summary'?summaryVehicles().find(row=>row.equipmentId===equipmentId):null):selected(),p=v?.position;
    if(!v)return;
    const positioned=validPosition(p);
    locationFleetVehicles=[];
    $('#location-dialog-info-section').hidden=false;
    $('#location-dialog').classList.toggle('is-location-missing',!positioned);
    locationMapTrigger=trigger;
    setLocationMapExpanded(false);
    $('#location-dialog-title').textContent=fieldText(v.equipmentNumber);
    $('#location-dialog-address').textContent=positioned?(displayCopy(p.address)||'주소 정보 없음'):'위치 정보 없음';
    locationVehicleInfo(v);
    $('#location-map').setAttribute('aria-label','Google 지도 · 차량 최종 수신 위치');
    $('#location-map').hidden=!positioned;
    $('#location-map-expand').hidden=!positioned;
    $('#location-dialog').showModal();
    $('#location-dialog-body').scrollTop=0;
    if(positioned)window.CustomerLocationMap.open({lat:p.lat,lng:p.lng,equipmentNumber:v.equipmentNumber});
    else {
      window.CustomerLocationMap.close();
      $('#location-map-status-text').textContent='이 차량의 위치 좌표가 수신되지 않아 지도에 표시할 수 없습니다.';
      $('#location-map-status').hidden=false;
      $('#location-map-external').hidden=true;
      $('#location-map').setAttribute('aria-busy','false');
    }
  }
  document.addEventListener('click',e=>{
    if(vehicleLookupOpen&&!e.target.closest('.vehicle-combobox'))closeVehicleLookup();
    if(e.target.id==='vehicle-lookup-input')return;
    if(e.target===$('#service-center-dialog')){$('#service-center-dialog').close();return;}
    if(e.target===$('#customer-approval-dialog')){closeCustomerApproval();return;}
    if(e.target===$('#supply-reset-dialog')){$('#supply-reset-dialog').close();return;}
    if(e.target===$('#location-dialog')){ $('#location-dialog').close();return; }
    const b=e.target.closest('button'); if(!b)return;
    if(b.hasAttribute('data-service-center')){openServiceCenter(b.dataset.serviceCenter,b);return;}
    if(b.hasAttribute('data-close-service-center')){$('#service-center-dialog').close();return;}
    if(b.hasAttribute('data-toggle-vehicle-lookup')){if(vehicleLookupOpen){closeVehicleLookup();$('#vehicle-lookup-input').focus();}else openVehicleLookup();return;}
    if(b.hasAttribute('data-clear-vehicle-lookup')){chooseLookupVehicle('');return;}
    if(b.hasAttribute('data-select-vehicle-lookup')){chooseLookupVehicle(b.dataset.selectVehicleLookup);return;}
    if(b.dataset.summarySort&&state.view==='summary'&&summarySortFields.some(([key])=>key===b.dataset.summarySort)){
      go('summary',{summarySort:b.dataset.summarySort,summaryDirection:state.summarySort===b.dataset.summarySort&&state.summaryDirection==='desc'?'asc':'desc'},true);
      $('[data-summary-sort="'+state.summarySort+'"]').focus({preventScroll:true});return;
    }
    if(b.dataset.ownerSort&&state.view==='home'&&state.role==='customer_owner'&&['work','running'].includes(b.dataset.ownerSort)){homeSortDirection=homeSort===b.dataset.ownerSort&&homeSortDirection==='desc'?'asc':'desc';homeSort=b.dataset.ownerSort;render();$('[data-owner-sort="'+homeSort+'"]')?.focus({preventScroll:true});return;}
    if(b.hasAttribute('data-retry-data')){window.location.reload();return;}
    if(b.hasAttribute('data-refresh-home')){if(state.view!=='home'||b.disabled)return;b.disabled=true;b.setAttribute('aria-busy','true');window.location.reload();return;}
    if(b.dataset.efficiencyMode){if(!['daily','vehicle'].includes(b.dataset.efficiencyMode))return;const inline=b.hasAttribute('data-inline-efficiency');go('efficiency',{efficiencyMode:b.dataset.efficiencyMode},inline);if(inline)$('[data-inline-efficiency][data-efficiency-mode="'+state.efficiencyMode+'"]').focus({preventScroll:true});return;}
    if(b.hasAttribute('data-close-customer-approval'))return closeCustomerApproval();
    if(b.hasAttribute('data-confirm-customer-approval'))return confirmCustomerApproval();
    if(b.dataset.reviewRequest)return openCustomerApproval(b.dataset.reviewRequest,b.dataset.reviewAction);
    if(b.dataset.approvalStatus){if(!['pending','approved','rejected','all'].includes(b.dataset.approvalStatus)||state.role!=='customer_owner')return;approvalStatus=b.dataset.approvalStatus;render();$('[data-approval-status="'+approvalStatus+'"]')?.focus();return;}
    if(b.hasAttribute('data-close-supply-reset'))return $('#supply-reset-dialog').close();
    if(b.hasAttribute('data-open-supply-reset'))return openSupplyReset();
    if(b.hasAttribute('data-save-charge'))return saveCharge();
    if(b.hasAttribute('data-confirm-supply-reset'))return confirmSupplyReset();
    if(b.hasAttribute('data-undo-supply-reset')){
      if(M.undoSupplyReset(rows,state,supplyUndo)){supplyUndo=[];supplyMessage='교체 완료 처리를 취소했습니다.';render();$('[data-open-supply-reset]')?.focus();}return;
    }
    if(b.hasAttribute('data-logout')) {
      if(window.CustomerOnboarding?.logout()===false)return alert('로그아웃 상태를 저장하지 못했습니다. 다시 시도해 주세요.');
      sessionStorage.removeItem('linq-customer-prototype-authenticated-role');
      window.location.replace('./login.html?role='+(state.role==='customer_staff'?'customer_staff':'customer_owner'));
      return;
    }
    if(b.dataset.notificationCategory) {
      if(!notificationCategories.some(([key])=>key===b.dataset.notificationCategory))return;
      go('notifications',{notificationCategory:b.dataset.notificationCategory},true);
      $('[data-notification-category="'+state.notificationCategory+'"]').focus();return;
    }
    if(b.hasAttribute('data-criteria-tip')) {
      const panel=$('#'+b.dataset.criteriaTip); if(!panel)return; panel.hidden=!panel.hidden;
      b.setAttribute('aria-expanded',String(!panel.hidden)); return;
    }
    if(b.hasAttribute('data-close-criteria')) {
      const panel=$('#'+b.dataset.closeCriteria),trigger=$('#'+b.dataset.closeCriteria+'-trigger');
      if(panel)panel.hidden=true;
      if(trigger){trigger.setAttribute('aria-expanded','false'); trigger.focus();} return;
    }
    if(b.hasAttribute('data-back')) return ['vehicleRegistration','vehicleRequired'].includes(state.view)?go('settings'):navigated?history.back():go(state.view==='approvals'?'settings':'home');
    if(b.hasAttribute('data-return')) return go(state.returnView);
    if(b.hasAttribute('data-efficiency-sort')) {
      if(state.view!=='efficiency')return;
      if(state.efficiencyMode==='vehicle'){
        const metric=b.dataset.efficiencySortMetric||state.efficiencySortMetric;
        if(!['running','work'].includes(metric))return;
        go('efficiency',{efficiencySortMetric:metric,efficiencyDirection:metric===state.efficiencySortMetric&&state.efficiencyDirection==='desc'?'asc':'desc'},true);
        $('[data-efficiency-sort-metric="'+metric+'"]')?.focus({preventScroll:true});
      }else{
        go('efficiency',{efficiencyDirection:state.efficiencyDirection==='desc'?'asc':state.efficiencyDirection==='asc'?'':'desc'},true);
        $('[data-efficiency-sort]')?.focus({preventScroll:true});
      }return;
    }
    if(b.hasAttribute('data-report-sort')&&state.view==='reports'){
      go('reports',{reportSortDirection:state.reportSortDirection==='desc'?'asc':'desc'},true);
      $('[data-report-sort]')?.focus({preventScroll:true});return;
    }
    if(b.dataset.reportMetricMode&&['reports','efficiency'].includes(state.view)){
      if(!['total','average'].includes(b.dataset.reportMetricMode))return;
      go(state.view,{reportMetricMode:b.dataset.reportMetricMode},true);
      $('[data-report-metric-mode="'+state.reportMetricMode+'"]')?.focus({preventScroll:true});return;
    }
    if(b.hasAttribute('data-toggle-range')) {rangeOpen=!rangeOpen;render();$('[data-toggle-range]').focus();return;}
    if(b.hasAttribute('data-efficiency')) return go('efficiency',{...M.efficiencyRange('m',state.from||M.SNAPSHOT.slice(0,10)),efficiencyMode:'daily'});
    if(b.hasAttribute('data-home-efficiency')) return go('efficiency',{...M.efficiencyRange('m',M.TODAY),efficiencyLayout:'menu',efficiencyMode:'daily',group:'',q:'',live:'',reportFocus:'all',reportVehicle:'',equipmentId:'',listVehicle:''});
    if(b.hasAttribute('data-clear-report-vehicle')) return go(state.view,{reportVehicle:''},true);
    if(b.hasAttribute('data-today-report')) return go('reports',{period:'d',from:M.TODAY,to:M.TODAY,reportFocus:b.dataset.focus||'all',reportVehicle:''});
    if(b.dataset.vehicleReport) return go(b.dataset.vehicleReport,{efficiencyMode:'daily',reportVehicle:b.dataset.equipment,group:state.role==='customer_owner'?(selected()?.group||state.group):'',q:'',live:''});
    if(b.dataset.reportVehicle) return go('reports',{reportVehicle:b.dataset.reportVehicle,...(b.dataset.today?{period:'d',from:M.TODAY,to:M.TODAY}:{})});
    if(b.dataset.serviceFocus) {
      const error=b.dataset.serviceFocus==='error',currentError=error&&state.view==='home';
      return go('services',{...(b.dataset.scopeGroup?{group:b.dataset.scopeGroup}:{}),service:error?'error':'supplies',serviceEquipmentId:'',serviceFocus:error?(currentError?'error':''):b.dataset.serviceFocus,serviceOrigin:error&&!currentError?'dashboard':'',serviceThrough:error&&!currentError?M.SNAPSHOT:'',...(error&&!currentError?{servicePeriod:'d',serviceFrom:M.TODAY,serviceTo:M.TODAY}:{}),q:'',live:''});
    }
    if(b.hasAttribute('data-clear-service-focus')) return go('services',{serviceFocus:'',serviceEquipmentId:''},true);
    if(b.dataset.serviceMenu) {
      const vehicle=M.scope(rows,state).find(v=>v.equipmentId===b.dataset.serviceMenu);
      const kind=b.dataset.serviceKind;
      if(!vehicle||!['supplies','error'].includes(kind)||(kind==='error'?!vehicle.activeErrorCount:!M.supplyItems(vehicle).length))return;
      return go('services',{service:kind,serviceEquipmentId:vehicle.equipmentId,serviceFocus:kind==='error'?'error':'',q:'',live:''});
    }
    if(b.dataset.reportGroup) return go('reports',{group:b.dataset.reportGroup,reportVehicle:'',reportFocus:'all',...(b.dataset.today?{period:'d',from:M.TODAY,to:M.TODAY}:{})});
    if(b.dataset.reportFocus) return go('reports',{reportFocus:b.dataset.reportFocus},true);
    if(b.dataset.performanceVehicle) return go('detail',{equipmentId:b.dataset.performanceVehicle,...(b.dataset.today?{period:'d',from:M.TODAY,to:M.TODAY}:{})});
    if(b.dataset.route) return go(b.dataset.route,b.dataset.route==='services'?{service:'maintenance',serviceFocus:'',serviceEquipmentId:''}:state.view==='detail'?{returnView:'detail'}:{});
    if(b.dataset.vehicle) return go('detail',{equipmentId:b.dataset.vehicle});
    if(b.dataset.serviceVehicle) return go(b.dataset.kind,{equipmentId:b.dataset.serviceVehicle,serviceEntry:b.dataset.entry||'',returnView:state.view==='summary'?'summary':state.view==='services'?'services':'detail'});
    if(b.dataset.live) return go('summary',{...(b.dataset.scopeGroup?{group:b.dataset.scopeGroup,listVehicle:''}:{}),live:b.dataset.live,status:'all',q:''});
    if(b.dataset.group) return go('summary',{group:b.dataset.group,status:'all',q:'',live:''});
    if(b.hasAttribute('data-clear-live')) return go('summary',{live:''});
    if(b.dataset.notificationEntry) {
      const entry=notificationItems().find(r=>r.id===b.dataset.notificationEntry);
      const view=entry&&M.pushPresentation(entry).view;
      if(view==='shock')return go('shock',{equipmentId:entry.equipmentId,period:'d',from:entry.pushDatetime.slice(0,10),to:entry.pushDatetime.slice(0,10),serviceEntry:'',returnView:'notifications',group:''});
      if(view==='error')return go('services',{service:'error',serviceEquipmentId:entry.equipmentId,serviceEntry:'',serviceFocus:'',servicePeriod:'d',serviceFrom:entry.pushDatetime.slice(0,10),serviceTo:entry.pushDatetime.slice(0,10),returnView:'notifications',group:'',q:'',live:''});
      if(view==='supplies')return go('supplies',{equipmentId:entry.equipmentId,serviceEntry:entry.supplyRecordId||'',returnView:'notifications',group:''});
      if(view)return go(view,{equipmentId:entry.equipmentId,serviceEntry:'',returnView:'notifications',group:''});
      return;
    }
    if(b.dataset.service) return go('services',{service:b.dataset.service,serviceFocus:''},true);
    if(b.dataset.period) { rangeOpen=false;const range=M.efficiencyRange(b.dataset.period,M.SNAPSHOT.slice(0,10),'end');return go(state.view,periodPatch(range.period,range.from,range.to),true); }
    if(b.hasAttribute('data-fleet-map'))return openFleetLocationDialog(b);
    if(b.hasAttribute('data-map')) return openLocationDialog(b.dataset.map||'',b);
    if(b.hasAttribute('data-close-map')) return $('#location-dialog').close();
    if(b.hasAttribute('data-expand-map')) return setLocationMapExpanded(!$('#location-dialog').classList.contains('is-map-expanded'));
  });
  document.addEventListener('change',e=>{
    if(e.target.id==='customer-approval-group'){$('#customer-approval-error').hidden=true;return;}
    if(e.target.id==='customer-approval-reason-type'){$('#customer-approval-error').hidden=true;$('#customer-approval-reason').hidden=e.target.value!=='custom';if(e.target.value==='custom')$('#customer-approval-reason').focus();return;}
    if(e.target.hasAttribute?.('data-charge-enabled')||e.target.dataset.chargeHour){
      const v=chargeVehicle();if(!v)return;const draft=prepareCharge(v);
      if(e.target.hasAttribute?.('data-charge-enabled'))draft.on=Boolean(e.target.checked);
      else {const field=e.target.dataset.chargeHour,value=Number(e.target.value);if(!draft.on||!['from','to'].includes(field)||!Number.isInteger(value)||value<0||value>23)return;draft[field]=value;}
      chargeMessage='변경 후 저장해 주세요.';render();const selector=e.target.dataset.chargeHour?'[data-charge-hour="'+e.target.dataset.chargeHour+'"]':'[data-charge-enabled]';$(selector)?.focus();return;
    }
    if(e.target.dataset.supplySelect||e.target.hasAttribute?.('data-supply-select-all')){
      const items=visibleSupplies().filter(resettable);
      if(state.role!=='customer_owner')return;
      if(e.target.hasAttribute?.('data-supply-select-all')){supplySelection.clear();if(e.target.checked)items.forEach(r=>supplySelection.add(r.id));}
      else if(items.some(r=>r.id===e.target.dataset.supplySelect)){if(e.target.checked)supplySelection.add(e.target.dataset.supplySelect);else supplySelection.delete(e.target.dataset.supplySelect);}
      syncSupplySelection();return;
    }
    if(['settings','account'].includes(state.view)&&e.target.dataset.pushSetting){
      const key=e.target.dataset.pushSetting,preferences=pushPreferences[state.role];
      if(!Object.hasOwn(preferences,key)||(key!=='pushAlarmYn'&&!preferences.pushAlarmYn))return;
      preferences[key]=Boolean(e.target.checked);
      if(key==='pushAlarmYn'&&!preferences.pushAlarmYn)pushFields.forEach(([field])=>{preferences[field]=false;});
      render();$('[data-push-setting="'+key+'"]').focus();return;
    }
    if(e.target.dataset.control)go(state.view,{[e.target.dataset.control]:e.target.value,status:'all',live:'',equipmentId:'',...(e.target.dataset.control==='role'?{serviceFocus:''}:{})},true);});
  document.addEventListener('input',e=>{if(e.target.id==='vehicle-lookup-input'){if(!e.isComposing)applyVehicleSearch(e.target);return;}if(e.target.id==='customer-approval-reason'){$('#customer-approval-error').hidden=true;return;}if(e.target.hasAttribute('data-approval-search')){approvalQuery=e.target.value;if(state.view==='approvals'&&state.role==='customer_owner'){$('#customer-approval-list').innerHTML=approvalCards();window.lucide?.createIcons({attrs:{'stroke-width':2}});}return;}if(e.target.closest('#range-form'))e.target.form.querySelectorAll('input').forEach(input=>input.setCustomValidity(''));});
  document.addEventListener('compositionend',e=>{if(e.target.id==='vehicle-lookup-input'){applyVehicleSearch(e.target);return;}});
  document.addEventListener('keydown',e=>{
    if(e.target.id!=='vehicle-lookup-input'||e.isComposing||e.keyCode===229)return;
    if(e.key==='Escape'||e.key==='Tab'){if(e.key==='Escape'&&vehicleLookupOpen)e.preventDefault();closeVehicleLookup();return;}
    if(['ArrowDown','ArrowUp'].includes(e.key)){
      e.preventDefault();if(!vehicleLookupOpen)openVehicleLookup();
      const count=lookupChoices().length;
      vehicleLookupIndex=vehicleLookupIndex<0?(e.key==='ArrowDown'?0:count-1):(vehicleLookupIndex+(e.key==='ArrowDown'?1:-1)+count)%count;
      updateVehicleLookup();return;
    }
    if(e.key==='Enter'&&vehicleLookupOpen){
      e.preventDefault();const choices=lookupChoices();
      if(vehicleLookupIndex>=0)chooseLookupVehicle(choices[vehicleLookupIndex].equipmentId);
    }
  });
  document.addEventListener('submit',e=>{if(e.target.id==='range-form'){
    e.preventDefault();const fd=new FormData(e.target),from=fd.get('from'),to=fd.get('to');
    if(!M.calendarDate(from)||!M.calendarDate(to)){e.target.querySelector('input').setCustomValidity('올바른 조회 날짜를 입력해 주세요.');e.target.reportValidity();return;}
    if(from>to){e.target.querySelector('input').setCustomValidity('시작일은 종료일보다 늦을 수 없습니다.');e.target.reportValidity();return;}
    const range=linkedPeriodSelection(from===to?'d':'c',from,to);rangeOpen=false;
    go(state.view,periodPatch(range.period,range.from,range.to),true);
  }});
  document.addEventListener('cancel',event=>{
    if(event.target===$('#customer-approval-dialog')){event.preventDefault();closeCustomerApproval();return;}
    if(event.target===$('#location-dialog')&&event.target.classList.contains('is-map-expanded')){
      event.preventDefault();setLocationMapExpanded(false);$('#location-map-expand').focus();
    }
  },true);
  document.addEventListener('close',event=>{
    if(event.target===$('#service-center-dialog')){if(serviceCenterTrigger?.isConnected)serviceCenterTrigger.focus({preventScroll:true});serviceCenterTrigger=null;$('#service-center-vehicle').textContent='';$('#service-center-info').innerHTML='';}
    if(event.target===$('#customer-approval-dialog')&&approvalPending)closeCustomerApproval();
    if(event.target===$('#supply-reset-dialog')){supplyPending=[];$('[data-open-supply-reset]')?.focus();}
    if(event.target===$('#location-dialog')){window.CustomerLocationMap.close();setLocationMapExpanded(false);locationFleetVehicles=[];if(locationMapTrigger?.isConnected)locationMapTrigger.focus({preventScroll:true});locationMapTrigger=null;}
  },true);
  window.addEventListener('popstate',()=>{rangeOpen=false;render();});
  window.addEventListener('resize',alignNavigationIcons);
  document.fonts?.ready.then(alignNavigationIcons);
  render();
})();
