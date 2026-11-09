/* Adopted customer home. Preserve shared routes, role scope, model and navigation. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CustomerHomeView=api;
})(typeof window==='undefined'?null:window,()=>{
  'use strict';
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const share=(part,total)=>total>0?part/total*100:null;
  const finite=value=>Number.isFinite(value)?Math.max(0,value):0;
  const groupSortKey=sort=>sort==='work'?'work':'running';
  function current(M,vehicles,through=M.SNAPSHOT){
    const window=M.web.meeting.hourlyWindow(new Date(through.replace(' ','T')+':00+09:00'));
    const entries=vehicles.filter(v=>v.conn===true).map(v=>{
      const live=M.currentVehicle(v,window);
      return {v,live,time:{working:live.workingMinutes,idle:live.idleMinutes,running:live.runH==null?null:live.runH*60}};
    });
    const collected=entries.filter(e=>Number.isFinite(e.time.working)&&Number.isFinite(e.time.idle));
    const work=collected.length?collected.reduce((n,e)=>n+e.time.working,0):null;
    const idle=collected.length?collected.reduce((n,e)=>n+e.time.idle,0):null;
    const running=entries.filter(e=>e.live.running===true).length;
    const idleCount=entries.filter(e=>e.live.idle===true).length;
    const offline=vehicles.filter(v=>v.conn===false).length;
    const connectionUnknown=vehicles.length-entries.length-offline,operationUnknown=entries.length-running-idleCount;
    const supplies=M.supplySummary(vehicles);
    const errorKnown=vehicles.every(v=>Number.isInteger(v.activeErrorCount)&&v.activeErrorCount>=0);
    return {total:vehicles.length,known:entries.length,offline,running,idleCount,connectionUnknown,operationUnknown,
      work,idle,runTotal:collected.length?work+idle:null,runPer:collected.length?(work+idle)/collected.length:null,metricKnown:collected.length,workPer:collected.length?work/collected.length:null,idlePer:collected.length?idle/collected.length:null,
      workShare:share(work,work+idle),idleShare:share(idle,work+idle),runningRate:operationUnknown?null:share(running,entries.length),
      error:errorKnown?vehicles.reduce((n,v)=>n+v.activeErrorCount,0):null,
      due:supplies.due,soon:supplies.soon,supplyUnknown:supplies.hasUnknown};
  }
  function build(M,rows,role='customer_owner'){
    const vehicles=M.scope(rows,{role,group:'',type:''});
    const today=M.SNAPSHOT.slice(0,10),all=current(M,vehicles);
    const groups=[...new Set(vehicles.map(v=>v.group))].map(group=>({group,...current(M,vehicles.filter(v=>v.group===group))}));
    // Complete calendar days only. Do not compare today's partial interval to a full day.
    // Use each day report's actual adapter, so clicking a column reproduces its hours.
    const trend=Array.from({length:7},(_,i)=>{
      const date=M.calendarDate(today);date.setUTCDate(date.getUTCDate()-7+i);
      const day=date.toISOString().slice(0,10),available=day>=M.DATA_START;
      const p=available&&vehicles.length?M.efficiencyPerformance(vehicles,day,day,{period:'d'}):null;
      return {day,known:p?.known||0,work:p?.known?p.work:null,idle:p?.known?p.idle:null};
    });
    return {all,groups,trend,today,through:M.SNAPSHOT,role,assignedGroup:role==='customer_staff'?M.assignedGroup(role):''};
  }
  function sortGroups(groups,sort,direction='desc'){
    const key=groupSortKey(sort)==='running'?'runTotal':'workPer';
    return [...groups].sort((a,b)=>{
      const ak=Number.isFinite(a[key]),bk=Number.isFinite(b[key]);
      if(ak!==bk)return ak?-1:1;
      return (ak?(a[key]-b[key])*(direction==='asc'?1:-1):0)||a.group.localeCompare(b.group,'ko');
    });
  }
  function render(M,data,sort='running',mode='preview',direction='desc'){
    sort=groupSortKey(sort);
    const {all:c,groups,trend}=data,n=M.DISPLAY.number,h=v=>M.DISPLAY.duration(v,true),pct=v=>M.DISPLAY.efficiency(v);
    const staff=data.role==='customer_staff';
    // Comparison needs at least two named groups. 기본그룹 counts like any other
    // named group; absent/unassigned vehicles remain in the whole-fleet KPIs.
    const comparisonGroups=groups.filter(g=>typeof g.group==='string'&&g.group.trim()!==''&&g.group.trim()!=='미배정');
    const showGroups=data.role==='customer_owner'&&comparisonGroups.length>1;
    const icon=name=>`<i data-lucide="${name}" aria-hidden="true"></i>`;
    const chevron=icon('chevron-right');
    const legend='<span class="od-legend"><span><i class="od-dot od-work"></i>작업</span><span><i class="od-dot od-idle"></i>대기</span></span>';
    const help=(id,title)=>`<button type="button" class="criteria-tip" id="${id}-trigger" data-criteria-tip="${id}" aria-label="${title} 기준 안내" aria-expanded="false" aria-controls="${id}">${icon('circle-help')}</button>`;
    const note=(id,text)=>`<div id="${id}" class="criteria-tip-panel" hidden>${(Array.isArray(text)?text:[text]).map(item=>`<p class="source-note">${esc(item)}</p>`).join('')}<button type="button" class="criteria-tip-close" data-close-criteria="${id}">닫기${icon('x')}</button></div>`;
    const heading=(title,id,action='')=>`<div class="dashboard-panel__head"><div class="panel-heading-with-tip"><h2>${title}</h2>${id?help(id,title):''}</div>${action}</div>`;
    const action=(label,attrs)=>`<button class="od-text-link" type="button" ${attrs}>${label}${chevron}</button>`;
    const meter=(work,idle,max,aria)=>`<span class="od-meter" role="img" aria-label="${esc(aria)}"><i class="od-work" style="width:${finite(share(work,max))}%"></i><i class="od-idle" style="width:${finite(share(idle,max))}%"></i></span>`;
    const supplyNote=unknown=>unknown?'<p class="od-footnote od-missing-data" role="status">소모품 정보 미수신 · 상태 확인 불가</p>':'';
    const errorNote=value=>value===null?'<p class="od-footnote od-missing-data" role="status">에러 정보 미수신 · 미처리 건수 확인 불가</p>':'';
    const issue=(key,label,ico)=>`<button type="button" class="od-issue${key==='soon'?' od-soon':''}${c[key]===0?' od-zero':''}" data-service-focus="${key}" aria-label="${c[key]===null?label+' 건수 확인 불가':label+' '+n(c[key])+(key==='error'?'건':'개')+' 보기'}"><span class="od-issue-label">${icon(ico)}${label}</span><span class="od-number">${n(c[key])}<small>${key==='error'?'건':'개'}</small></span></button>`;
    const live=(key,label,value,color)=>'<button type="button" class="od-state" data-live="'+key+'" aria-label="'+label+' 차량 '+value+'대 보기"><span><i class="od-dot '+color+'"></i>'+label+'</span><span><b>'+n(value)+'</b><small>대</small>'+chevron+'</span></button>';
    const ring=(kind,label,total,value,unknown,states)=>{
      const percent=total&&!unknown?share(value,total):null;
      return '<div class="od-ratio od-ratio-'+kind+'"><h3>'+label+'</h3><div class="od-ring" role="img" aria-label="'+label+' '+(percent===null?'비율 확인 불가':pct(percent))+'" style="--od-ratio:'+(percent??0)+'%"><div class="od-ring-center"><strong>'+pct(percent)+'</strong></div></div><div class="od-states">'+states+'</div></div>';
    };
    const connectionRing=ring('connection','통신 연결',c.total,c.known,c.connectionUnknown,live('connected','연결',c.known,'od-online')+live('offline','미연결',c.offline,'od-offline')+(c.connectionUnknown?live('connection_unknown','확인 불가',c.connectionUnknown,'od-offline'):''));
    const operationRing=ring('operation','차량 가동',c.known,c.running,c.operationUnknown,live('running','가동',c.running,'od-work')+live('idle','유휴',c.idleCount,'od-idle')+(c.operationUnknown?live('operation_unknown','확인 불가',c.operationUnknown,'od-offline'):''));
    const maxGroup=Math.max(60,...comparisonGroups.map(g=>finite(g.workPer)+finite(g.idlePer)));
    const groupRows=showGroups?sortGroups(comparisonGroups,sort,direction).map(g=>{
      const report=`data-report-group="${esc(g.group)}" data-today="true"`;
      const service=(key,label)=>`<button type="button" data-service-focus="${key}" data-scope-group="${esc(g.group)}" aria-label="${esc(g.group)} ${g[key]===null?label+' 건수 확인 불가':label+' '+n(g[key])+(key==='error'?'건':'개')+' 보기'}" class="od-group-issue${g[key]?' has-value':''}${key==='soon'?' od-soon':''}"><span>${label}</span><span><b>${n(g[key])}</b><small>${key==='error'?'건':'개'}</small></span></button>`;
      const primaryLabel=sort==='running'?'총 가동':'대당 작업',secondaryLabel=sort==='running'?'대당 가동시간':'총 작업시간',secondaryValue=sort==='running'?g.runPer:g.work;
      return `<article class="od-group-row" aria-label="${esc(g.group)} 운영 비교"><button type="button" class="od-group-chart" ${report} aria-label="${esc(g.group)} 금일 업무 리포트 보기"><span class="od-group-title"><strong>${esc(g.group)}</strong><span><small>${primaryLabel}</small><b>${h(sort==='running'?g.runTotal:g.workPer)}</b>${chevron}</span></span>${meter(g.workPer,g.idlePer,maxGroup,`대당 작업 ${h(g.workPer)}, 대기 ${h(g.idlePer)}`)}<span class="od-group-meta"><span>집계 ${g.known}/${g.total}대</span><span>${secondaryLabel} <b>${h(secondaryValue)}</b></span></span></button><div class="od-group-issues">${service('error','에러 미처리')}${service('due','교체 필요')}${service('soon','교체 임박')}</div>${errorNote(g.error)}${supplyNote(g.supplyUnknown)}</article>`;
    }).join(''):'';
    const maxTrend=Math.max(60,...trend.map(d=>finite(d.work)));
    const available=trend.filter(d=>d.known),avg=available.length?available.reduce((n,d)=>n+d.work,0)/available.length:null;
    const bars=trend.map(d=>{
      const title=`${d.day} 작업 ${h(d.work)}`;
      return `<span class="od-day" role="img" aria-label="${esc(title)}"><span class="od-day-value">${n(d.work==null?null:d.work/60)}</span><span class="od-day-track"><span class="od-day-bar od-work" style="height:${finite(share(finite(d.work),maxTrend))}%"></span></span><span class="od-day-label">${d.day.slice(8)}</span></span>`;
    }).join('');
    const scope=staff?`내 그룹 차량 <b>${n(c.total)}대</b> · ${esc(data.assignedGroup||'미배정')}`:`전체 차량 <b>${n(c.total)}대</b> · ${comparisonGroups.length}개 그룹`;
    const groupSort=!showGroups?'':`<div class="od-sort" role="group" aria-label="그룹 비교 정렬">${[['running','가동시간'],['work','작업시간']].map(([key,label])=>{const active=sort===key,asc=direction==='asc';return `<button type="button" data-owner-sort="${key}" aria-pressed="${active}" aria-label="${key==='running'?'총 가동시간':'대당 작업시간'}${active?(asc?' 오름차순':' 내림차순'):''}, ${active&&!asc?'오름차순':'내림차순'}으로 정렬">${label}${icon(active?(asc?'arrow-up':'arrow-down'):'arrow-down-up')}</button>`;}).join('')}</div>`;
    const groupHelp=['막대: 차량 수가 다른 그룹을 비교하도록 대당 작업·대기시간을 같은 길이 척도로 표시합니다. 그룹 미배정 차량은 비교에서 제외하며 전체 차량 현황에는 포함합니다.','가동시간 탭: 그룹의 총 가동시간(작업+대기)순으로 정렬하고, 총 가동시간과 대당 가동시간을 표시합니다.','작업시간 탭: 대당 작업시간순으로 정렬하고, 대당 작업시간과 총 작업시간을 표시합니다. 대당 시간은 연결되어 실적을 확인한 차량의 평균입니다.','정렬: 같은 버튼을 다시 누르면 오름차순·내림차순을 전환합니다. 산출할 수 없는 그룹은 양방향 모두 마지막에 놓습니다. 배치·근무·기종 차이가 있으므로 성과 순위로 단정하지 않습니다.','이동: 그룹명을 누르면 금일 리포트, 에러·소모품을 누르면 해당 그룹의 서비스 목록으로 이동합니다. 에러는 발생일과 무관한 현재 미처리 건수입니다.'];
    return `<div class="od-content">
      <div class="od-scope"><span>${scope}</span>${mode==='main'?'':`<a href="./dashboard-backup-20260919.html#home?role=${staff?'customer_staff':'customer_owner'}">기존안 보기${chevron}</a>`}</div>
      <section class="dashboard-panel od-priority" aria-label="현재 미처리 에러 건수와 현재 소모품 항목 수"><div class="od-issues">${issue('error','에러 미처리','triangle-alert')}${issue('due','교체 필요','refresh-cw')}${issue('soon','교체 임박','clock')}</div>${errorNote(c.error)}${supplyNote(c.supplyUnknown)}</section>
      <section class="dashboard-panel od-fleet">${heading('차량 연결·가동','od-fleet-help',action('차량 보기','data-route="summary"'))}<div class="od-fleet-body">${connectionRing}${operationRing}</div>${note('od-fleet-help',['통신 연결: 전체 차량의 확인된 연결 상태를 표시합니다. 통신 상태는 제공된 상태값이며 접속 이력을 추정하지 않습니다.','차량 가동: 연결 차량의 마지막 완료 1시간에 작업+대기 실적이 있으면 가동, 확인된 실적이 0이면 유휴로 표시합니다.','확인 불가: 상태 자료가 없으면 별도로 구분합니다. 확인 불가 차량이 있으면 해당 비율은 -로 표시합니다.','금일 작업 실적: 오늘 00시~상단 집계 시각의 누적 값으로, 마지막 완료 1시간의 가동 상태 판정과 다릅니다.'])}</section>
      <section class="dashboard-panel od-today">${heading('오늘의 작업 효율','od-work-help',action('리포트','data-today-report'))}<div class="od-work-kpis od-work-kpis--running"><button type="button" data-today-report><span>총 가동시간</span><strong>${h(c.runTotal)}</strong><small>대당 ${h(c.runPer)}</small></button><button type="button" data-today-report><span>총 작업시간</span><strong>${h(c.work)}</strong><small>대당 ${h(c.workPer)}</small></button><button type="button" class="od-efficiency-kpi" data-today-report><span>작업비율</span><strong>${pct(c.workShare)}</strong><small>가동 중 작업 비중</small></button></div>${meter(c.work,c.idle,finite(c.work)+finite(c.idle),`작업 ${h(c.work)}, 대기 ${h(c.idle)}`)}<div class="od-work-breakdown"><span><i class="od-dot od-work"></i>작업 <b>${h(c.work)}</b></span><span><i class="od-dot od-idle"></i>대기 <b>${h(c.idle)}</b></span></div><p class="od-footnote">금일 실적 ${c.metricKnown}/${c.known}대 집계 · 미연결 ${c.offline}대 제외</p>${note('od-work-help',['작업비율: 작업시간 ÷ (작업시간 + 대기시간) × 100입니다.','가동시간: 작업시간 + 대기시간입니다. 대당 시간은 연결되어 실적을 확인한 차량의 평균입니다.','집계 범위: 금일 00시~상단 집계 시각 기준이며 미연결 차량은 실적 집계에서 제외합니다.','확인 불가: 수신 대상이 없거나 가동시간이 0이면 비율은 -로 표시합니다. 목표치·절감 비용·저성과 판정은 임의로 만들지 않습니다.'])}</section>
      ${showGroups?`<section class="dashboard-panel od-groups">${heading('그룹별 운영 비교','od-groups-help')}${groupSort}<div class="od-chart-caption"><span>${sort==='running'?(direction==='asc'?'총 가동시간 적은 순':'총 가동시간 많은 순'):(direction==='asc'?'대당 작업시간 적은 순':'대당 작업시간 많은 순')}</span>${legend}</div><div data-owner-groups>${groupRows}</div>${note('od-groups-help',groupHelp)}</section>`:''}
      <section class="dashboard-panel od-trend"><button type="button" class="od-trend-link" data-home-efficiency aria-label="이번 달 운영효율 보기"></button>${heading('최근 7일 작업 추이','od-trend-help')}<div class="od-trend-summary"><div><span>일평균 작업시간</span><strong>${h(avg)}</strong></div><span>${trend[0].day.slice(5).replace('-','.')}~${trend[6].day.slice(5).replace('-','.')}<br>오늘 제외</span></div><div class="od-chart-caption"><span>작업시간 · h</span><span class="od-legend"><span><i class="od-dot od-work"></i>작업</span></span></div><div class="od-trend-bars" aria-label="최근 7일 일별 작업시간 차트">${bars}</div><p class="od-footnote">영역을 누르면 이번 달 운영효율이 열립니다.</p>${note('od-trend-help',['조회 기간: 어제까지 완료된 7개 날짜의 기간별 리포트 작업시간입니다. 오늘은 집계 중이므로 제외합니다.','차트: 막대와 숫자는 모두 일별 작업시간만 표시합니다. 숫자는 시간 단위 정수로 반올림하며 대기시간은 포함하지 않습니다.','일평균: 작업 실적을 확인한 날짜의 작업시간 합계를 해당 날짜 수로 나눈 값입니다.','집계 대상: 현재 미연결 차량도 과거 해당 날짜의 수집 실적이 있으면 포함합니다. 연결 차량만 집계한 오늘 카드와 조회 대상이 다릅니다. 미수신 날짜는 0이 아닌 -로 표시합니다.'])}</section>
    </div>`;
  }
  return {build,current,sortGroups,render};
});
