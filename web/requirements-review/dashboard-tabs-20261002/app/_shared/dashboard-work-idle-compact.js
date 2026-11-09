(function () {
  'use strict';
  var q=function(s,r){return (r||document).querySelector(s);};
  var all=function(s,r){return Array.from((r||document).querySelectorAll(s));};
  var txt=function(n){return n?MIQCommon.view.get(n,"textContent").replace(/\s+/g,' ').trim():'';};
  var esc=MIQCharts.escape;
  var number=function(v){return Number(String(v).replace(/[^\d.\-]/g,''))||0;};
  var fmt=function(v){return v===null||v===undefined?'—':Math.round(v).toLocaleString('ko-KR');};
  var root=q('#dashboardContent'),period=q('.dashboard-period');
  if(!root||!period)return;
  var role=MIQCommon.roles.resolve(document.body.dataset.managementRole);
  var companyMode=MIQCommon.roles.dashboardDimension(role)==='company';
  var staff=MIQCommon.roles.hideDashboardComparison(role),dimension=companyMode?'업체':'그룹';
  var fleet=MIQCommon.roles.filterVehicles(role,MIQ_MOCK_DATA.fleet.vehicles);
  if(window.MIQCustomerAccess && MIQCustomerAccess.guardDashboard(role,fleet))return;
  var view=window.MIQDashboardCompanyView;
  var entities=companyMode?view.companies.map(function(c){return {id:String(c.companyId),companyId:String(c.companyId),name:c.companyName,count:c.vehicleCount,raw:c,vehicles:fleet.filter(function(v){return String(v.companyId)===String(c.companyId);})};}):[];
  if(staff)entities=view.companies.map(function(c){return {id:String(c.companyId),companyId:String(c.companyId),name:c.companyName,count:c.vehicleCount,raw:c,vehicles:fleet.filter(function(v){return String(v.companyId)===String(c.companyId);})};});
  if(!companyMode&&!staff){
    var groups=new Map();
    fleet.forEach(function(vehicle){
      var name=vehicle.group||'미지정';
      if(!groups.has(name))groups.set(name,{id:'group-'+groups.size,name:name,count:0,vehicles:[]});
      var entity=groups.get(name);entity.vehicles.push(vehicle);entity.count++;
    });
    entities=Array.from(groups.values());
  }
  var now=MIQMeeting.hourlyWindow(new Date(),'Asia/Seoul');
  var cutoff=new Date(new Date(now.date+'T00:00:00Z').getTime()-86400000).toISOString().slice(0,10);
  // Selected second preview: company status links and period usage cards without variant switching.
  var state={scope:'',year:+now.date.slice(0,4),livePage:1,periodPage:1,liveQuery:'',periodQuery:'',sort:'name',liveExpanded:false,periodExpanded:false,periodSort:'name'};
  var entitySearches=[];
  var query=new URLSearchParams(location.search),initialEntity=entities.find(function(e){return companyMode?e.id===query.get('companyId'):e.name===query.get('group');});
  if(initialEntity)state.scope=initialEntity.id;
  var servicePolicy=MIQCommon.roles.targetPolicy(role);
  var errorRecords=MIQServiceDemo.create(fleet,cutoff).error;
  var series=MIQReportSeries;
  var pending=false;
  function range(){return MIQ.getAppliedPeriod(q('.filter-bar',period))||Object.assign({period:'m'},MIQCommon.dates.operatingRange('m'));}
  function shortRange(){var r=range();return r.from.slice(5).replace('-','.')+'–'+r.to.slice(5).replace('-','.');}
  function scoped(){return entities.filter(function(e){return !state.scope||e.id===state.scope;});}
  function pageLink(path,params){
    var u=new URL(path,location.href);u.searchParams.set('role',role);u.searchParams.set('source','dashboard');
    if(state.scope){var e=scoped()[0];if(e)u.searchParams.set(companyMode?'companyId':'group',companyMode?e.id:e.name);}
    Object.keys(params||{}).forEach(function(k){if(params[k]!=null)u.searchParams.set(k,params[k]);});
    return u.pathname+u.search;
  }
  function reportLink(entity,periodRange){var r=periodRange||range();return pageLink('../Report%20Status/report-status-tobe.html',{companyId:companyMode?entity.id:null,company:companyMode?entity.name:null,group:companyMode?null:entity.name,period:r.period,from:r.from,to:r.to});}
  function serviceLink(entity,kind){
    var params={companyId:companyMode?entity.id:null,company:companyMode?entity.name:null,group:companyMode?null:entity.name};
    if(kind==='error')Object.assign(params,recentFaultRange());else params.state=kind;
    return pageLink('../Service/service-'+(kind==='error'?'error':'supply')+'-tobe.html',params);
  }
  function pill(label,kind){return '<span class="dc-basis '+(kind||'')+'">'+esc(label)+'</span>';}
  function livePill(){return pill('현재 · '+MIQMeeting.hourlyWindow(new Date(),'Asia/Seoul').to,'is-current');}
  function periodPill(){return pill('기간 · '+shortRange(),'is-period');}
  function trendPill(){return pill(state.year+'년 월별','is-year');}
  function card(id,title,width,kind){
    var el=document.createElement('article');el.className='dc-card dc-span-'+width+' '+(kind||'');el.id=id;
    MIQCommon.view.set(el,"innerHTML",'<header class="dc-head"><h2>'+title+'</h2><span class="dc-card-meta"></span></header><div class="dc-body"></div><footer class="dc-foot"></footer>');return el;
  }
  function setHTML(node,html){if(MIQCommon.view.get(node,"innerHTML")!==html)MIQCommon.view.set(node,"innerHTML",html);}
  function write(el,html,meta,foot){setHTML(q('.dc-body',el),html);setHTML(q('.dc-card-meta',el),meta||'');setHTML(q('.dc-foot',el),foot||'');}
  function overviewLink(el,href,label){
    var link=q('.dc-head-link',el);
    if(!link){link=document.createElement('a');link.className='dc-head-link';q('.dc-head',el).appendChild(link);}
    MIQCommon.view.call(link,"setAttribute",['href',href]);MIQCommon.view.call(link,"setAttribute",['aria-label',label]);MIQCommon.view.call(link,"setAttribute",['title',label]);
    setHTML(link,'<span>'+esc(label)+'</span> ↗');
  }
  function value(v,unit){return '<strong>'+fmt(v)+'</strong><small>'+esc(unit)+'</small>';}
  function icon(key){
    var paths={time:'<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',distance:'<path d="M4 17V7h11l5 5v5M7 17h9M15 7v5h5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',fuel:'<path d="M5 20V4h9v16M3 20h13M7 7h5M14 9h3l3 3v6a1 1 0 0 1-2 0v-4h-4"/>',battery:'<rect x="3" y="7" width="17" height="11" rx="2"/><path d="M20 11h2v3M11 9l-3 5h5l-3 4"/>',fault:'<path d="M12 3L2 21h20L12 3zM12 9v5M12 17v1"/>',need:'<path d="M14 3a6 6 0 0 0-7 8L2 16a3 3 0 0 0 4 4l5-5a6 6 0 0 0 8-7l-4 4-3-3 4-4z"/>'};
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[key]||paths.time)+'</svg>';
  }
  function partialMonth(index){
    var day=+cutoff.slice(8),month=+cutoff.slice(5,7),year=+cutoff.slice(0,4);
    return state.year===year&&index===month-1&&day<new Date(Date.UTC(year,month,0)).getUTCDate();
  }
  function svgChart(values,type,color,label,unit,options){
    options=options||{};
    var valid=values.filter(function(v){return v!==null&&Number.isFinite(v);});
    if(!valid.length)return '<div class="dc-empty">표시할 월별 기록이 없습니다.</div>';
    var base=0,peak=options.percent?100:Math.max.apply(null,valid)*1.12||1;
    if(!options.percent){var magnitude=Math.pow(10,Math.floor(Math.log10(peak)));peak=Math.ceil(peak/magnitude)*magnitude;}
    var W=Math.max(240,options.width||280),H=144,L=Math.max(32,Math.min(76,fmt(peak).length*7+13)),R=W-9,T=27,B=H-25;
    var x=function(i){return L+(R-L)/12*(i+.5);},y=function(v){return B-(v-base)/(peak-base)*(B-T);};
    var s='<svg class="dc-chart dc-chart-'+type+'" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(state.year+'년 '+label+' 월별 추이. 단위 '+unit)+'"><title>'+esc(label+' · '+unit)+'</title>';
    var currentIndex=values.findIndex(function(v,i){return v!==null&&partialMonth(i);});
    if(currentIndex>=0){var band=(R-L)/12;s+='<rect class="dc-partial-band" x="'+(x(currentIndex)-band/2)+'" y="'+T+'" width="'+band+'" height="'+(B-T)+'" rx="3"/><text class="dc-partial-label" x="'+Math.min(R-35,Math.max(L+35,x(currentIndex)))+'" y="14" text-anchor="middle">'+(currentIndex+1)+'월 · '+(+cutoff.slice(8))+'일까지</text>';}
    [0,.5,1].forEach(function(f){var tick=base+(peak-base)*f;s+='<line class="dc-gridline" x1="'+L+'" x2="'+R+'" y1="'+y(tick)+'" y2="'+y(tick)+'"/><text x="'+(L-8)+'" y="'+(y(tick)+4)+'" text-anchor="end">'+fmt(tick)+'</text>';});
    if(type==='line'||type==='area'){
      var pts=[];values.forEach(function(v,i){if(v!==null)pts.push([x(i),y(v),partialMonth(i)]);});
      if(pts.length){
        var complete=pts.filter(function(p){return !p[2];}),path=complete.map(function(p,i){return(i?'L':'M')+p[0]+' '+p[1];}).join('');
        if(type==='area'&&complete.length){var gradient='dc-fill-'+label.replace(/\s/g,'');s+='<defs><linearGradient id="'+esc(gradient)+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="'+color+'" stop-opacity=".15"/><stop offset="100%" stop-color="'+color+'" stop-opacity=".015"/></linearGradient></defs><path d="'+path+'L'+complete[complete.length-1][0]+' '+B+'L'+complete[0][0]+' '+B+'Z" fill="url(#'+esc(gradient)+')"/>';}
        s+='<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        if(!options.total&&pts.length>1&&pts[pts.length-1][2]){var last=pts[pts.length-1],prev=pts[pts.length-2];s+='<path d="M'+prev[0]+' '+prev[1]+'L'+last[0]+' '+last[1]+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-dasharray="3 4" opacity=".55"/>';}
      }
    }
    values.forEach(function(v,i){
      var month=state.year+'-'+String(i+1).padStart(2,'0'),partial=partialMonth(i),tip=state.year+'년 '+(i+1)+'월 · '+label+'\n'+(v===null?'집계 전':fmt(v)+' '+unit+(partial?' · '+cutoff.slice(8)+'일까지':''));
      var barWidth=Math.max(9,Math.min(23,(R-L)/12*.54));
      s+='<g '+MIQCharts.tipAttrs(tip)+'>';
      if(v!==null){
        if(partial)s+='<line class="dc-partial-guide" x1="'+x(i)+'" x2="'+x(i)+'" y1="'+T+'" y2="'+y(v)+'"/>';
        if(type==='bar')s+='<rect x="'+(x(i)-barWidth/2)+'" y="'+y(v)+'" width="'+barWidth+'" height="'+(B-y(v))+'" rx="3" fill="'+color+'" opacity="'+(partial?'.32':'.8')+'"/>';
        else s+='<circle cx="'+x(i)+'" cy="'+y(v)+'" r="'+(partial?'3.4':'2.5')+'" fill="'+(partial?'#fff':color)+'" stroke="'+color+'" stroke-width="1.5"/>';
      }else s+='<text x="'+x(i)+'" y="'+(B-9)+'" text-anchor="middle" class="dc-pending-dot">—</text>';
      s+='<rect x="'+(x(i)-(R-L)/24)+'" y="'+T+'" width="'+((R-L)/12)+'" height="'+(B-T)+'" fill="transparent"/><text x="'+x(i)+'" y="'+(B+20)+'" text-anchor="middle"'+(partial?' class="dc-current-month"':'')+'>'+(i+1)+'</text></g>';
    });
    return s+'</svg>';
  }
  function annual(key){return series.annual(scoped(),key,state.year,cutoff);}
  function lastValue(values){var out=null;values.forEach(function(v){if(v!==null)out=v;});return out;}
  function trendNote(){return state.year===+cutoff.slice(0,4)?(+cutoff.slice(5,7))+'월 '+(+cutoff.slice(8))+'일까지 집계 · 이후 기록 없음':'1–12월 집계';}
  function recentFaultRange(){return {period:'d',from:now.date,to:now.date,dashboardSample:'current',sampleDate:now.date,sampleTo:now.to};}
  function currentFaultCount(entity){
    var samples=MIQServiceDemo.createCurrent(fleet,now);
    return MIQDashboardCurrent.faults(samples,now,function(record){
      if(servicePolicy.group&&record.group!==servicePolicy.group)return false;
      return (entity?[entity]:scoped()).some(function(e){
        return companyMode||staff?String(record.companyId)===e.id:record.companyId===servicePolicy.companyId&&record.group===e.name;
      });
    },true);
  }
  function faultCount(entity,periodRange){var r=periodRange||range();return errorRecords.filter(function(item){return item.date>=r.from&&item.date<=r.to&&(!entity||(companyMode?item.companyId===entity.id:item.group===entity.name));}).length;}
  function totalFaults(periodRange){return scoped().reduce(function(n,e){return n+faultCount(e,periodRange);},0);}
  function rowStats(e){
    var c=e.row&&e.row.cells;
    var stats;
    if(e.vehicles){
      var samples=e.vehicles.map(function(v){return MIQMeeting.hourlyVehicle(v,MIQMeeting.hourlyWindow(new Date(),'Asia/Seoul'));});
      var connected=e.vehicles.filter(function(v){return v.conn===true;}).length;
      var running=samples.filter(function(v){return v.running;}).length;
      stats={total:e.count,connected:connected,off:e.count-connected,running:running,idle:Math.max(0,connected-running)};
    }else stats=e.raw?{total:e.count,connected:e.raw.connected,off:e.raw.disconnected,running:e.raw.running,idle:e.raw.idle}:{total:e.count,connected:number(txt(c[2])),off:number(txt(c[3])),running:number(txt(c[4])),idle:number(txt(c[5]))};
    // The linked list and its count use the same current consumable records.
    var filter={companyIds:servicePolicy.companyIds,companyId:companyMode?e.id:servicePolicy.companyId,group:servicePolicy.group||(companyMode?'':e.name),exactGroup:!!servicePolicy.group};
    stats.need=MIQServiceRecords.count('supply',Object.assign({},filter,{supplyState:'need'}));
    stats.soon=MIQServiceRecords.count('supply',Object.assign({},filter,{supplyState:'soon'}));
    return stats;
  }
  function chartStat(label,numberValue,unit,note){return '<div class="dc-chart-stat"><span>'+esc(label)+'</span><div>'+value(numberValue,unit)+'</div>'+(note?'<small>'+esc(note)+'</small>':'')+'</div>';}
  function fleetCard(){
    var stats=scoped().map(rowStats),totals={total:0,connected:0,off:0,running:0,idle:0};stats.forEach(function(s){Object.keys(totals).forEach(function(k){totals[k]+=s[k]||0;});});
    function ratioChart(title,denominatorLabel,denominator,numerator,other,labels,kind){
      var percent=denominator?numerator/denominator*100:0;
      return '<div class="dc-ratio is-'+kind+'"><div class="dc-ratio-heading"><strong>'+title+'</strong><span>'+denominatorLabel+' <b>'+fmt(denominator)+'</b>대</span></div><div class="dc-ratio-body"><div class="dc-donut" style="--share:'+percent+'%" role="img" aria-label="'+title+' '+(denominator?fmt(percent)+'%':'산출 대상 없음')+'"><div><strong>'+ (denominator?fmt(percent)+'<small>%</small>':'—')+'</strong></div></div><div class="dc-ratio-legend"><span><i class="dc-dot is-primary"></i>'+labels[0]+'<b>'+fmt(numerator)+'</b></span><span><i class="dc-dot is-muted"></i>'+labels[1]+'<b>'+fmt(other)+'</b></span></div></div></div>';
    }
    var map=pageLink('../Map/map-tobe.html',{});
    write(cards.fleet,'<a href="'+esc(map)+'" class="dc-dual-ratios">'+ratioChart('통신 연결','전체',totals.total,totals.connected,totals.off,['연결','미연결'],'connection')+ratioChart('차량 가동','연결',totals.connected,totals.running,totals.idle,['가동','유휴'],'operation')+'</a>',livePill());
    overviewLink(cards.fleet,map,'지도 보기');
  }
  function attentionCard(){
    var recent=recentFaultRange(),counts=[currentFaultCount(),scoped().reduce(function(n,e){return n+rowStats(e).need;},0),scoped().reduce(function(n,e){return n+rowStats(e).soon;},0)];
    var date='00:00 ~ '+now.to;
    var action='<span class="dwi-maintenance-action">상세 보기 <span aria-hidden="true">›</span></span>';
    var html='<div class="dc-maintenance"><a class="dc-maintenance-fault'+(counts[0]===0||counts[0]===null?' is-zero':'')+'" href="'+esc(pageLink('../Service/service-error-tobe.html',recent))+'" aria-label="오늘 고장 '+fmt(counts[0])+'건, '+date+'"><span class="dc-alert-icon">'+icon('fault')+'</span><span class="dc-maintenance-label">고장</span><span class="dc-maintenance-value">'+value(counts[0],'건')+'</span>'+action+'</a><div class="dc-maintenance-supplies">';
    html+=[1,2].map(function(i){return '<a class="dc-maintenance-supply is-'+(i===1?'need':'soon')+(counts[i]===0?' is-zero':'')+'" href="'+esc(pageLink('../Service/service-supply-tobe.html',{state:i===1?'need':'soon'}))+'"><span class="dc-alert-icon">'+icon(i===1?'need':'time')+'</span><span class="dc-maintenance-label">'+(i===1?'교체 필요':'교체 임박')+'</span><span class="dc-maintenance-value">'+value(counts[i],'개')+'</span>'+action+'</a>';}).join('')+'</div></div>';
    write(cards.attention,html,livePill());
  }
  function periodCard(){
    var r=range(),list=scoped(),count=list.reduce(function(n,e){return n+e.count;},0);
    var items=['eff','shock','dist','hour','fuel','batt'].map(function(key){return series.metrics.find(function(m){return m.key===key;});});
    var provided=MIQObservations.aggregate(list.reduce(function(rows,e){return rows.concat(MIQObservations.select(e));},[]),r.from,r.to,now).knownVehicleCount;
    count=provided;
    var html='<div class="dc-period-six">'+items.map(function(m){
      var n=series.aggregate(list,m.key,r.from,r.to,now);
      var note=m.agg==='sum'?(m.key==='shock'?'기간 발생 건수':'대당 '+fmt(count&&n!==null?n/count:null)+' '+m.unit):m.key==='batt'?'충전량 비율 · 평균':m.key==='fuel'?'시간당 소비량 · 평균':'선택 기간 평균';
      var body='<span class="dc-metric-label">'+(m.rateLabel||m.label)+'</span><div class="dc-metric-number" data-metric="'+m.key+'">'+value(n,m.unit)+'</div><span class="dc-per-note">'+note+'</span>';
      return '<div class="dc-kpi '+(m.key==='eff'?'is-primary':'')+'">'+body+'</div>';
    }).join('')+'</div>';
    write(cards.summary,html,periodPill()+'<span class="dc-scope-count">'+list.length+'개 '+dimension+'</span><span class="dc-scope-count">'+provided+'대 지표 제공</span>','<a class="dc-period-fault" href="'+esc(pageLink('../Service/service-error-tobe.html',r))+'">'+icon('fault')+'기간 고장 <b>'+fmt(totalFaults())+'</b>건 <span>›</span></a>');
  }
  // Separate comparison page: keep dcToday and the original outer card geometry.
  function todayCard(){
    var w=MIQMeeting.hourlyWindow(new Date(),'Asia/Seoul'),entitiesInScope=scoped();
    var selectedFleet=fleet.filter(function(vehicle){
      return entitiesInScope.some(function(entity){return companyMode||staff?String(vehicle.companyId)===entity.id:vehicle.group===entity.name;});
    });
    var result=MIQDashboardCurrent.efficiency(selectedFleet,w,MIQMeeting,MIQSummaryRow);
    var known=result.known>0,share=result.efficiency;
    function hours(n){return known?n.toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}):'—';}
    var percent=share===null?'—':Math.round(share),paint=share===null?'#eaf0f3':'conic-gradient(from 270deg,#ff3600 0 '+share+'%,#eaf0f3 '+share+'% 100%)';
    var chart='<div class="dwi-ring" style="background:'+paint+'" role="img" aria-label="운영효율 '+percent+'%"><div class="dwi-ring-center"><div><strong>'+percent+'</strong><small>%</small></div><span>가동시간 대비</span></div></div>';
    var details='<div class="dwi-metrics"><div class="dwi-row"><span class="dwi-label"><i class="dwi-dot is-work"></i>작업시간</span><span class="dwi-value"><strong>'+hours(result.work)+'</strong><small>H</small></span></div><div class="dwi-row"><span class="dwi-label"><i class="dwi-dot is-idle"></i>대기시간</span><span class="dwi-value"><strong>'+hours(result.idle)+'</strong><small>H</small></span></div><div class="dwi-row dwi-total"><span class="dwi-label">전체 가동시간</span><span class="dwi-value"><strong>'+hours(result.work+result.idle)+'</strong><small>H</small></span></div></div>';
    var href=pageLink('../Operational%20Efficiency/operational-efficiency-tobe-option-b.html',{period:'d',from:w.date,to:w.date});
    write(cards.today,'<div class="dwi-layout">'+chart+details+'</div>',pill('현재 · '+w.to,'is-current'));
    overviewLink(cards.today,href,'운영효율 보기');
  }
  function paintTrends(){
    var eff=annual('eff'),fuel=annual('fuel'),batt=annual('batt'),dist=annual('dist'),hour=annual('hour'),shock=annual('shock');
    function width(card){return Math.max(240,q('.dc-body',card).clientWidth-32);}
    function monthCaption(values,kind){var index=-1;values.forEach(function(v,i){if(v!==null)index=i;});return (index<0?'최근 월':(index+1)+'월')+' '+kind;}
    write(cards.efficiency,chartStat(monthCaption(eff,'평균'),lastValue(eff),'%')+svgChart(eff,'line','#ff3600','운영효율','%',{percent:true,width:width(cards.efficiency)}),trendPill(),'<span>'+trendNote()+'</span>');
    write(cards.fuel,chartStat(monthCaption(fuel,'평균'),lastValue(fuel),'L/H','엔진 차량 · 시간당 소비량')+svgChart(fuel,'area','#ff3600','시간당 연료소비량','L/H',{width:width(cards.fuel)}),trendPill(),'<span>'+trendNote()+'</span>');
    var batteryValues=batt.filter(function(v){return v!==null;});
    var batteryMin=fmt(Math.min.apply(null,batteryValues)),batteryMax=fmt(Math.max.apply(null,batteryValues));
    var batteryRange=batteryValues.length?(batteryMin===batteryMax?'월평균 '+batteryMin+'% 수준':'월평균 범위 '+batteryMin+'–'+batteryMax+'%'):'';
    write(cards.battery,chartStat(monthCaption(batt,'평균'),lastValue(batt),'%',batteryRange)+svgChart(batt,'line','#0aa656','배터리 충전량','%',{percent:true,width:width(cards.battery)}),trendPill(),'<span>월별 평균 충전량 · '+trendNote()+'</span>');
    write(cards.distance,chartStat(monthCaption(dist,'합계'),lastValue(dist),'Km')+svgChart(dist,'area','#647786','운행거리','Km',{total:true,width:width(cards.distance)}),trendPill(),'<span>'+trendNote()+'</span>');
    write(cards.hours,chartStat(monthCaption(hour,'합계'),lastValue(hour),'H')+svgChart(hour,'bar','#647786','운행시간','H',{width:width(cards.hours)}),trendPill(),'<span>'+trendNote()+'</span>');
    MIQCommon.view.set(q('#dcTrendRange'),"textContent",state.year+'년 · '+trendNote());
    write(cards.shock,chartStat(monthCaption(shock,'발생'),lastValue(shock),'건')+svgChart(shock,'bar','#ff9f0a','충격횟수','건',{width:width(cards.shock)}),trendPill(),'<span>'+trendNote()+'</span>');
  }
  function filterRows(kind){
    var search=state[kind+'Query'];
    if(kind==='period'){
      var selected=state.periodSort,r=range(),cache={};
      function rank(e){if(!(e.id in cache))cache[e.id]=series.aggregate([e],selected,r.from,r.to,now);return cache[e.id];}
      return scoped().filter(function(e){return !search||e.id===search;}).sort(function(a,b){
        var tie=a.name.localeCompare(b.name,'ko');
        if(selected==='vehicles')return b.count-a.count||tie;
        if(selected==='name')return tie;
        var av=rank(a),bv=rank(b);return av===null?(bv===null?tie:1):bv===null?-1:bv-av||tie;
      });
    }
    return scoped().filter(function(e){return !search||e.id===search;}).sort(function(a,b){
      return state.sort==='vehicles'?b.count-a.count||a.name.localeCompare(b.name,'ko'):state.sort==='need'?rowStats(b).need-rowStats(a).need||b.count-a.count:a.name.localeCompare(b.name,'ko');
    });
  }
  function pager(kind,rows){
    var pageSize=kind==='live'?livePageSize():5;
    if(kind==='live'&&state.liveExpanded){
      setHTML(q('.dc-foot',cards.live),'<span role="status">총 '+fmt(rows.length)+'개 '+dimension+' · 전체 표시</span><button type="button" class="dc-live-toggle" data-live-toggle aria-expanded="true" aria-controls="dcLiveContent">접기 <span aria-hidden="true">⌃</span></button>');
      return rows;
    }
    var page=MIQDashboardCompanies.pages(rows,state[kind+'Page'],pageSize);state[kind+'Page']=page.page;
    var start=Math.max(1,Math.min(page.page-2,page.pageCount-4)),buttons='';
    for(var i=start;i<=Math.min(page.pageCount,start+4);i++)buttons+='<button type="button" data-page="'+i+'" '+(i===page.page?'aria-current="page"':'')+' aria-label="'+i+'페이지">'+i+'</button>';
    var count=page.from+'–'+page.to+' / '+fmt(page.total)+'개 '+dimension;
    var single=kind==='live'&&page.pageCount<=1;
    setHTML(q('.dc-foot',cards[kind]),'<span role="status">'+(single?'총 '+fmt(page.total)+'개 '+dimension:count+' · '+pageSize+'개씩')+'</span><nav '+(single?'hidden ':'')+'aria-label="'+dimension+'별 '+(kind==='live'?'차량 현황':'사용량')+' 페이지"><button type="button" data-page="'+(page.page-1)+'" aria-label="이전 페이지" '+(page.page<=1?'disabled':'')+'>‹</button>'+buttons+'<button type="button" data-page="'+(page.page+1)+'" aria-label="다음 페이지" '+(page.page>=page.pageCount?'disabled':'')+'>›</button></nav>');
    return page.rows;
  }
  function livePageSize(){return root.clientWidth<=1040?2:4;}
  function toggleLive(fromFooter){
    state.liveExpanded=!state.liveExpanded;paintLive();
    var button=q('.dc-head [data-live-toggle]',cards.live);
    (button.hidden?q('input',cards.live):button).focus({preventScroll:true});
    if(fromFooter)cards.live.scrollIntoView({block:'start'});
  }
  function entityName(e,periodRange){return '<a class="dc-entity-name" href="'+esc(reportLink(e,periodRange))+'" title="'+esc(e.name)+'">'+esc(e.name)+'</a>';}
  function paintLive(){
    var filtered=filterRows('live'),rows=pager('live',filtered);
    var toggle=q('.dc-head [data-live-toggle]',cards.live);
    toggle.hidden=filtered.length<=livePageSize()&&!state.liveExpanded;
    MIQCommon.view.call(toggle,"setAttribute",['aria-expanded',String(state.liveExpanded)]);
    MIQCommon.view.call(toggle,"setAttribute",['aria-label',dimension+'별 차량 현황 '+(state.liveExpanded?'접기':'펼치기')]);
    toggle.title=state.liveExpanded?'한 줄로 접기':'검색된 '+fmt(filtered.length)+'개 '+dimension+' 전체 표시';
    setHTML(toggle,(state.liveExpanded?'접기':'펼치기')+' <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>');
    function alertItem(e,n,label,unit,kind,key,target){
      return '<a class="dc-company-alert dc-company-alert-link '+(n>0?kind:'is-zero')+'" href="'+esc(serviceLink(e,target))+'" data-service-kind="'+target+'" aria-label="'+esc(e.name+' '+label+' '+fmt(n)+unit+' 보기')+'"><span class="dc-company-alert-label">'+icon(key)+label+'</span><span class="dc-company-alert-value"><b>'+fmt(n)+'</b><small>'+unit+'</small><span class="dc-alert-link-arrow" aria-hidden="true">›</span></span></a>';
    }
    var recent=recentFaultRange();
    var html='<ul class="dc-company-list" aria-label="'+dimension+'별 차량 현황">'+rows.map(function(e){
      var s=rowStats(e),rate=s.connected?s.running/s.connected*100:0;
      function share(n){return s.total?n/s.total*100:0;}
      return '<li class="dc-company-tile'+(s.need>0?' has-replacement':'')+'" data-entity="'+esc(e.id)+'"><div class="dc-company-tile-head"><div class="dc-company-identity">'+entityName(e,recent)+'<span>보유 <b>'+fmt(s.total)+'</b>대 <i>·</i> 연결 <b>'+fmt(s.connected)+'</b>대</span></div><div class="dc-company-rate" aria-label="연결 차량 중 가동률 '+fmt(rate)+'%"><strong>'+fmt(rate)+'<small>%</small></strong><span>연결 중 가동</span></div></div>'+
        '<div class="dc-company-alerts">'+alertItem(e,currentFaultCount(e),'고장','건','is-fault','fault','error')+alertItem(e,s.need,'교체 필요','개','is-need','need','need')+alertItem(e,s.soon,'교체 임박','개','is-warning','time','soon')+'</div>'+
        '<div class="dc-company-state"><div class="dc-state-labels"><span class="is-running"><i></i>가동 <b>'+fmt(s.running)+'</b></span><span class="is-idle"><i></i>유휴 <b>'+fmt(s.idle)+'</b></span><span class="is-offline"><i></i>미연결 <b>'+fmt(s.off)+'</b></span></div><div class="dc-state-track" aria-hidden="true"><i class="is-running" style="width:'+share(s.running)+'%"></i><i class="is-idle" style="width:'+share(s.idle)+'%"></i><i class="is-offline" style="width:'+share(s.off)+'%"></i></div></div></li>';
    }).join('')+'</ul>';
    if(!rows.length)html='<div class="dc-status-empty">검색 조건에 맞는 '+dimension+'가 없습니다.</div>';
    setHTML(q('.dc-status-list-host',cards.live),html);
    cards.live.dataset.visibleRows=String(rows.length);
    setHTML(q('.dc-card-meta',cards.live),livePill());
  }
  function paintPeriod(){
    var filtered=filterRows('period'),rows=usagePager(filtered),r=range();
    var toggle=q('[data-period-toggle]',q('.dc-head',cards.period));
    toggle.hidden=filtered.length<=usagePageSize()&&!state.periodExpanded;
    MIQCommon.view.call(toggle,"setAttribute",['aria-expanded',String(state.periodExpanded)]);
    MIQCommon.view.call(toggle,"setAttribute",['aria-label',dimension+'별 사용량 '+(state.periodExpanded?'접기':'펼치기')]);
    toggle.title=state.periodExpanded?'기본 목록으로 접기':'검색된 '+fmt(filtered.length)+'개 '+dimension+' 전체 표시';
    setHTML(toggle,(state.periodExpanded?'접기':'펼치기')+' <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>');
    cards.period.classList.toggle('is-expanded',state.periodExpanded);
    setHTML(q('.dc-card-meta',cards.period),periodPill()+'<span>조회 기간의 전체 · 대당 값 / 비율은 평균</span>');
    setHTML(q('.dc-table-scroll',cards.period),rows.length?'<ul class="dc-company-list dc-usage-list" aria-label="'+dimension+'별 사용량 카드">'+rows.map(usageTile).join('')+'</ul>':'<div class="dc-status-empty">검색 조건에 맞는 '+dimension+'가 없습니다.</div>');
  }
  function usagePageSize(){return livePageSize();}
  function usagePager(rows){
    if(state.periodExpanded){
      setHTML(q('.dc-foot',cards.period),'<span role="status">총 '+fmt(rows.length)+'개 '+dimension+' · 전체 표시</span><button type="button" class="dc-live-toggle" data-period-toggle aria-expanded="true" aria-controls="dcPeriodContent">접기 <span aria-hidden="true">⌃</span></button>');return rows;
    }
    var size=usagePageSize(),page=MIQDashboardCompanies.pages(rows,state.periodPage,size);state.periodPage=page.page;
    var start=Math.max(1,Math.min(page.page-2,page.pageCount-4)),buttons='';
    for(var i=start;i<=Math.min(page.pageCount,start+4);i++)buttons+='<button type="button" data-page="'+i+'" '+(i===page.page?'aria-current="page"':'')+' aria-label="'+i+'페이지">'+i+'</button>';
    setHTML(q('.dc-foot',cards.period),'<span role="status">'+(page.pageCount<=1?'총 '+fmt(page.total)+'개 '+dimension:page.from+'–'+page.to+' / '+fmt(page.total)+'개 '+dimension+' · '+size+'개씩')+'</span><nav '+(page.pageCount<=1?'hidden ':'')+'aria-label="'+dimension+'별 사용량 페이지"><button type="button" data-page="'+(page.page-1)+'" aria-label="이전 페이지" '+(page.page<=1?'disabled':'')+'>‹</button>'+buttons+'<button type="button" data-page="'+(page.page+1)+'" aria-label="다음 페이지" '+(page.page>=page.pageCount?'disabled':'')+'>›</button></nav>');
    return page.rows;
  }
  function toggleUsage(fromFooter){
    state.periodExpanded=!state.periodExpanded;paintPeriod();
    var button=q('.dc-head [data-period-toggle]',cards.period);(button.hidden?q('input',cards.period):button).focus({preventScroll:true});
    if(fromFooter)cards.period.scrollIntoView({block:'start'});
  }
  function usageTile(e){
    var r=range(),values={};['eff','shock','fuel','batt','dist','hour'].forEach(function(key){values[key]=series.aggregate([e],key,r.from,r.to,now);});
    function per(key){return fmt(values[key]!==null&&e.count?values[key]/e.count:null);}
    function metric(key,label,unit,iconKey,note){var definition=series.metric(key),full=definition.rateLabel||definition.label;
      return '<div class="dc-usage-metric" data-metric="'+key+'" aria-label="'+esc(full+' '+fmt(values[key])+' '+unit)+'"><span class="dc-company-alert-label" title="'+esc(full)+'">'+icon(iconKey)+esc(label)+'</span><span class="dc-company-alert-value"><b>'+fmt(values[key])+'</b><small>'+unit+'</small></span><small class="dc-usage-note">'+note+'</small></div>';
    }
    function total(key,label,unit){return '<div class="dc-usage-total" data-metric="'+key+'"><span>'+label+'</span><div><b>'+fmt(values[key])+'</b><small>'+unit+'</small></div><small>대당 '+per(key)+' '+unit+'</small></div>';}
    return '<li class="dc-company-tile dc-usage-tile" data-entity="'+esc(e.id)+'"><div class="dc-company-tile-head"><div class="dc-company-identity">'+entityName(e)+'<span>보유 <b>'+fmt(e.count)+'</b>대</span></div><div class="dc-company-rate" data-metric="eff" aria-label="평균 운영효율 '+fmt(values.eff)+'%"><span>운영효율 · 평균</span><strong>'+fmt(values.eff)+'<small>%</small></strong></div></div><div class="dc-usage-totals" role="group" aria-label="운행 합계와 대당 값">'+total('dist','운행거리','Km')+total('hour','운행시간','H')+'</div><div class="dc-company-alerts" role="group" aria-label="충격횟수와 에너지 평균">'+metric('shock','충격횟수','건','fault','대당 '+per('shock')+'건')+metric('fuel','연료 / H','L/H','fuel','평균')+metric('batt','충전량','%','battery','평균')+'</div></li>';
  }
  MIQCommon.view.call(q('.dashboard-titlebar'),"insertAdjacentHTML",['beforeend','<p class="dc-scope-caption"></p><div class="dc-global-tools"><label>'+dimension+' <select id="dcScope" aria-label="조회 '+dimension+'"><option value="">전체 '+dimension+'</option>'+entities.map(function(e){return '<option value="'+esc(e.id)+'">'+esc(e.name)+'</option>';}).join('')+'</select></label><form id="dcYearForm"><label>월별 추이 <select id="dcYear" aria-label="추이 연도">'+[state.year,state.year-1,state.year-2].map(function(y){return '<option>'+y+'</option>';}).join('')+'</select></label><button type="submit">연도 조회</button></form></div>']);
  MIQCommon.view.set(q('#periodHeading'),"textContent",'기간 실적 조회');
  MIQCommon.view.call(q('.period-heading > div:first-child'),"insertAdjacentHTML",['beforeend','<span class="dc-query-note">아래 운영 실적 · 고장 · 업체별 사용량에 적용</span>']);
  period.removeAttribute('aria-labelledby');MIQCommon.view.call(period,"setAttribute",['aria-label','대시보드 현황']);
  var grid=document.createElement('div');grid.className='dc-grid';period.appendChild(grid);
  var cards={fleet:card('dcFleet','차량 연결 · 가동',2,'dc-short'),attention:card('dcAttention','정비 확인',2,'dc-short'),live:card('dcLive',dimension+'별 차량 현황',4,'dc-status-card'),today:card('dcToday','운영효율',1,'dc-today-card dwi-card'),summary:card('dcSummary','기간 운영 실적',4,'dc-summary-card'),efficiency:card('dcEfficiency','운영효율',1,'dc-trend-card'),fuel:card('dcFuel','시간당 연료소비량',1,'dc-trend-card'),battery:card('dcBattery','배터리 충전량',1,'dc-trend-card'),distance:card('dcDistance','운행거리',1,'dc-trend-card'),hours:card('dcHours','운행시간',1,'dc-trend-card'),shock:card('dcShock','충격횟수',1,'dc-trend-card'),period:card('dcPeriod',dimension+'별 사용량 · 효율',4,'dc-table-card')};
  var overview=document.createElement('div');overview.className='dc-overview-row';grid.appendChild(overview);
  ['fleet','attention','today'].forEach(function(k){overview.appendChild(cards[k]);});grid.appendChild(cards.live);
  var trends=document.createElement('section');trends.className='dc-trends';MIQCommon.view.call(trends,"setAttribute",['aria-labelledby','dcTrendsTitle']);
  MIQCommon.view.set(trends,"innerHTML",'<header class="dc-trends-head"><div><h2 id="dcTrendsTitle">월별 추이</h2><span id="dcTrendRange"></span></div></header><div class="dc-trends-grid"></div>');
  q('.dc-trends-head',trends).appendChild(q('#dcYearForm'));
  ['efficiency','distance','hours','shock','fuel','battery'].forEach(function(k){q('.dc-trends-grid',trends).appendChild(cards[k]);});
  grid.appendChild(trends);
  var periodResults=document.createElement('section');periodResults.className='dc-period-results';MIQCommon.view.call(periodResults,"setAttribute",['aria-labelledby','periodHeading']);
  cards.period.classList.add('dc-usage-preview','dc-usage-cards');
  periodResults.appendChild(q('.period-heading',period));periodResults.appendChild(cards.summary);periodResults.appendChild(cards.period);grid.appendChild(periodResults);
  function bindEntitySearch(el,kind){
    var input=q('input',el),label=input.parentElement,form=document.createElement('form'),box=document.createElement('div');
    form.className='dc-entity-search';MIQCommon.view.call(form,"setAttribute",['role','search']);MIQCommon.view.call(form,"setAttribute",['aria-label',MIQCommon.view.call(input,"getAttribute",['aria-label'])]);
    label.replaceWith(form);box.className='dc-entity-input';form.appendChild(box);box.appendChild(input);
    input.placeholder=dimension+'명 2글자 이상 입력';input.autocomplete='off';MIQCommon.view.call(input,"setAttribute",['role','combobox']);MIQCommon.view.call(input,"setAttribute",['aria-autocomplete','list']);MIQCommon.view.call(input,"setAttribute",['aria-expanded','false']);
    var list=document.createElement('div');list.className='dc-entity-suggestions';list.id=el.id+'Suggestions';MIQCommon.view.call(list,"setAttribute",['role','listbox']);MIQCommon.view.call(list,"setAttribute",['aria-label',dimension+' 검색 후보']);list.hidden=true;box.appendChild(list);MIQCommon.view.call(input,"setAttribute",['aria-controls',list.id]);
    var submit=document.createElement('button');submit.type='submit';submit.className='dc-entity-submit';MIQCommon.view.set(submit,"textContent",'검색');form.appendChild(submit);
    var selected='',candidates=[],active=-1;
    function close(){list.hidden=true;MIQCommon.view.call(input,"setAttribute",['aria-expanded','false']);input.removeAttribute('aria-activedescendant');active=-1;}
    function sync(){submit.disabled=!!input.value.trim()&&!selected;}
    function choose(candidate){selected=candidate.companyId;input.value=candidate.companyName;close();sync();input.focus();}
    function show(){
      candidates=MIQDashboardCompanies.suggest(scoped().map(function(e){return {companyId:e.id,companyName:e.name};}),input.value);list.replaceChildren();active=-1;input.removeAttribute('aria-activedescendant');
      if(Array.from(input.value.trim().replace(/\s/g,'')).length<2){close();return;}
      candidates.forEach(function(candidate,index){var option=document.createElement('button');option.type='button';option.tabIndex=-1;option.id=list.id+'-'+index;MIQCommon.view.call(option,"setAttribute",['role','option']);MIQCommon.view.call(option,"setAttribute",['aria-selected','false']);MIQCommon.view.call(option,"setAttribute",['translate','no']);MIQCommon.view.set(option,"textContent",candidate.companyName);option.addEventListener('mousedown',function(event){event.preventDefault();});option.addEventListener('click',function(){choose(candidate);});list.appendChild(option);});
      if(!candidates.length){var empty=document.createElement('p');MIQCommon.view.set(empty,"textContent",'일치하는 '+(companyMode?'업체가':'그룹이')+' 없습니다.');list.appendChild(empty);}
      list.hidden=false;MIQCommon.view.call(input,"setAttribute",['aria-expanded','true']);
    }
    input.addEventListener('input',function(){selected='';sync();show();});
    input.addEventListener('focus',function(){if(!selected&&input.value.trim())show();});
    input.addEventListener('keydown',function(event){
      if(event.isComposing||event.keyCode===229)return;
      if(event.key==='Escape'){close();return;}
      if(event.key==='ArrowDown'||event.key==='ArrowUp'){
        event.preventDefault();if(list.hidden)show();if(!candidates.length)return;
        active=event.key==='ArrowDown'?(active+1)%candidates.length:active<0?candidates.length-1:(active-1+candidates.length)%candidates.length;
        all('[role="option"]',list).forEach(function(option,i){MIQCommon.view.call(option,"setAttribute",['aria-selected',String(i===active)]);if(i===active){MIQCommon.view.call(input,"setAttribute",['aria-activedescendant',option.id]);option.scrollIntoView({block:'nearest'});}});
      }else if(event.key==='Enter'&&!list.hidden){event.preventDefault();if(active>=0)choose(candidates[active]);}
    });
    form.addEventListener('submit',function(event){event.preventDefault();if(input.value.trim()&&(!selected||!scoped().some(function(e){return e.id===selected;}))){selected='';sync();show();return;}state[kind+'Query']=input.value.trim()?selected:'';state[kind+'Page']=1;close();kind==='live'?paintLive():paintPeriod();});
    form.addEventListener('focusout',function(event){if(!box.contains(event.relatedTarget))close();});
    document.addEventListener('click',function(event){if(!box.contains(event.target))close();});
    entitySearches.push(function(){selected='';state[kind+'Query']='';input.value='';close();sync();});
    sync();
  }
  ['live','period'].forEach(function(kind){
    var el=cards[kind];
    q('.dc-body',el).id=el.id+'Content';MIQCommon.view.set(q('.dc-body',el),"innerHTML",'<div class="dc-table-tools"><label><input type="search" aria-label="'+dimension+'별 '+(kind==='live'?'차량 현황':'사용량')+' 검색" placeholder="'+dimension+'명 검색"/></label>'+(kind==='live'?'<select aria-label="현황 정렬"><option value="name">이름순</option><option value="vehicles">보유 차량순</option><option value="need">교체 필요순</option></select>':'<select aria-label="사용량 정렬"><option value="name">이름순</option><option value="vehicles">보유 차량순</option><option value="eff">운영효율순</option><option value="dist">운행거리순</option><option value="hour">운행시간순</option></select>')+'</div>'+'<div class="'+(kind==='live'?'dc-status-list-host':'dc-table-scroll')+'"></div>');
    {
      q('.dc-head',el).appendChild(q('.dc-table-tools',el));
      var toggle=document.createElement('button');toggle.type='button';toggle.className='dc-live-toggle';MIQCommon.view.call(toggle,"setAttribute",['data-'+kind+'-toggle','']);MIQCommon.view.call(toggle,"setAttribute",['aria-controls',el.id+'Content']);
      toggle.addEventListener('click',function(){kind==='live'?toggleLive(false):toggleUsage(false);});q('.dc-table-tools',el).appendChild(toggle);
    }
    bindEntitySearch(el,kind);
    var sort=q('select',el);if(sort)sort.addEventListener('change',function(){state[kind==='live'?'sort':'periodSort']=this.value;state[kind+'Page']=1;kind==='live'?paintLive():paintPeriod();});
    q('.dc-foot',el).addEventListener('click',function(event){if(event.target.closest('[data-'+kind+'-toggle]')){kind==='live'?toggleLive(true):toggleUsage(true);return;}var button=event.target.closest('[data-page]');if(!button)return;state[kind+'Page']=+button.dataset.page;kind==='live'?paintLive():paintPeriod();q('[aria-current="page"]',el)?.focus({preventScroll:true});});
  });
  if(staff){cards.live.hidden=true;cards.period.hidden=true;q('#dcScope').disabled=true;state.scope=entities[0]&&entities[0].id||'';}
  function paint(){
    pending=false;now=MIQMeeting.hourlyWindow(new Date(),'Asia/Seoul');
    var hideCompanyCards=staff||(companyMode&&!!state.scope);
    cards.live.hidden=hideCompanyCards;cards.period.hidden=hideCompanyCards;
    periodCard();
    fleetCard();attentionCard();todayCard();paintTrends();if(!staff){paintLive();paintPeriod();}
    MIQCommon.view.set(q('.dc-scope-caption'),"textContent",(state.scope?scoped()[0].name:'전체 '+dimension)+' · '+fmt(scoped().reduce(function(n,e){return n+e.count;},0))+'대');
    document.body.classList.add('dc-ready');
  }
  function schedule(){if(!pending){pending=true;requestAnimationFrame(paint);}}
  function applyScope(){
    state.scope=q('#dcScope').value;state.livePage=state.periodPage=1;state.liveExpanded=state.periodExpanded=false;
    entitySearches.forEach(function(reset){reset();});
    window.dispatchEvent(new CustomEvent('miq:dashboard-company-filter',{detail:{companyIds:companyMode?scoped().map(function(e){return e.id;}):null}}));
    if(!companyMode)document.dispatchEvent(new CustomEvent('miq:target-change',{detail:{group:state.scope?scoped()[0].name:''}}));
    schedule();
  }
  q('#dcScope').value=state.scope;
  q('#dcScope').addEventListener('change',applyScope);
  q('#dcYearForm').addEventListener('submit',function(event){event.preventDefault();state.year=+q('#dcYear').value;paintTrends();});
  window.addEventListener('miq:period-change',function(){state.periodPage=1;schedule();});
  MIQCharts.bind(grid);document.body.classList.add('dc-canvas');if(state.scope)applyScope();paint();
  var currentClock=MIQMeeting.watchHourly(function(w){now=w;todayCard();attentionCard();if(!staff)paintLive();});
  window.addEventListener('pageshow',currentClock.refresh);
  window.addEventListener('focus',currentClock.refresh);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)currentClock.refresh();});
  var lastWidth=0,lastLiveSize=livePageSize();new ResizeObserver(function(entries){var width=Math.round(entries[0].contentRect.width);if(width===lastWidth)return;lastWidth=width;requestAnimationFrame(function(){paintTrends();var size=livePageSize();if(!staff&&size!==lastLiveSize){lastLiveSize=size;paintLive();paintPeriod();}});}).observe(grid);
  // The shared date controller initializes on DOMContentLoaded. Repaint after it
  // has committed the URL period so dates and results stay aligned.
  function ready(){paint();var target=!staff&&(location.hash==='#dcPeriod'?cards.period:location.hash==='#dcLive'?cards.live:null);if(target)requestAnimationFrame(function(){target.scrollIntoView({block:'start'});});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
