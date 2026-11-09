(function(){
  'use strict';

  var option=MIQCommon.view.call(document.body,"getAttribute",['data-summary-option'])||'expand';
  var favoriteSummary=document.body.dataset.favoriteSummary==='true';
  var favoriteRole=document.body.dataset.managementRole;
  var favoriteReadError=false;
  if(favoriteSummary&&!window.MIQCommon.roles.canUseFavorites(favoriteRole)){
    MIQCommon.view.set(document.querySelector('.summary-content'),"textContent",'이 메뉴를 사용할 권한이 없습니다.');
    return;
  }
  var PERIOD={
    d:{label:'일'},
    w:{label:'주'},
    m:{label:'월'},
    c:{label:'기간',range:['2026-05-01','2026-07-31']}
  };
  var dateRules=window.MIQCommon.dates;
  ['d','w','m'].forEach(function(mode){
    var range=dateRules.operatingRange(mode,dateRules.yesterday());
    PERIOD[mode].range=[range.from,range.to]
  });
  var VEHICLES=Array.isArray(MIQ.FLEET_CATALOG)&&MIQ.FLEET_CATALOG.length?MIQ.FLEET_CATALOG:MIQ.FLEET;
  var summaryPolicy=MIQCommon.roles.targetPolicy(document.body.dataset.managementRole);
  if(['dealer_staff','customer_staff'].indexOf(document.body.dataset.managementRole)>-1){
    VEHICLES=MIQCommon.roles.filterVehicles(document.body.dataset.managementRole,VEHICLES);
  }
  if(window.MIQServiceRecords&&window.MIQServiceDemo){
    var serviceDay=dateRules.format(dateRules.yesterday());
    var serviceDemo=MIQServiceDemo.create(VEHICLES,serviceDay);
    MIQServiceRecords.records.push.apply(MIQServiceRecords.records,serviceDemo.maintenance.concat(serviceDemo.error));
  }
  if(favoriteSummary){
    try{
      var favoriteIds=window.MIQFavorites.read(favoriteRole,VEHICLES,new URLSearchParams(location.search).get('favoriteCategory'));
      VEHICLES=VEHICLES.filter(function(vehicle){return favoriteIds.indexOf(vehicle.vin)>-1});
    }catch(error){VEHICLES=[];favoriteReadError=true}
  }
  var TYPES=MIQ.TYPES;
  var DETAIL='../Vehicle%20Detail/vehicle-detail-tobe.html';
  var QUERY=new URLSearchParams(location.search);
  var currentCompanyId=(summaryPolicy.group&&summaryPolicy.companyId)||QUERY.get('companyId')||'all';
  var scopeContext=window.MIQ_TARGET_CONTEXT||null;
  var currentMetric=QUERY.get('metric')||'';
  var currentSource=QUERY.get('source')||'';
  var PERIOD_ALIASES={day:'d',daily:'d',week:'w',weekly:'w',month:'m',monthly:'m',custom:'c'};
  var METRIC_SORT={distance:'km',time:'min',fuel:'fuel',battery:'battery',efficiency:'electricEff',shock:'shock'};
  var SORT_KEYS=['vin','group','type','cumKm','cumH','km','min','workMin','performance','electricEff','shock','conn','soc','fuel','battery'];
  var requestedPeriod=PERIOD_ALIASES[QUERY.get('period')]||QUERY.get('period');
  var requestedSort=QUERY.get('sort')||METRIC_SORT[currentMetric];
  var requestedVehicle=VEHICLES.filter(function(vehicle){
    return String(vehicle.vin).replace(/[-_]/g,'').toLowerCase()===String(QUERY.get('veh')||'').replace(/[-_]/g,'').toLowerCase()
  })[0]||null;
  var state={
    period:PERIOD[requestedPeriod]?requestedPeriod:'m',
    sortKey:SORT_KEYS.indexOf(requestedSort)>=0?requestedSort:(option==='sort'?'shock':null),
    sortDir:QUERY.get('dir')==='desc'?-1:(QUERY.get('dir')==='asc'?1:(option==='sort'?-1:1)),
    sel:null,
    expanded:{}
  };
  var initialFrom=QUERY.get('from');
  var initialTo=QUERY.get('to');
  var initialFromDate=new Date((initialFrom||'')+'T00:00:00');
  var initialToDate=new Date((initialTo||'')+'T00:00:00');
  var initialDays=Math.floor((initialToDate-initialFromDate)/86400000)+1;
  if(/^\d{4}-\d{2}-\d{2}$/.test(initialFrom||'')&&/^\d{4}-\d{2}-\d{2}$/.test(initialTo||'')&&initialDays>0&&initialDays<=366){
    PERIOD[state.period].range=[initialFrom,initialTo];
  }
  var summaryKpi=document.getElementById('summaryKpi');
  var optionToolbar=document.getElementById('optionToolbar');
  var vehicleList=document.getElementById('vehicleList');
  var live=document.getElementById('optionLive');

  var pager=MIQ.createListPager(vehicleList,{pageSize:20,onChange:render});
  var tree=MIQ.lnbTree(document.getElementById('lnb'),{
    vehicles:VEHICLES,
    group:QUERY.get('group')||null,
    type:QUERY.get('type')||null,
    vin:requestedVehicle?requestedVehicle.vin:null,
    onChange:function(sel){state.sel=sel;render()}
  });
  state.sel=tree.get();

  function num(value,decimal){
    if(value===null||value===undefined)return '—';
    var n=Number(value)||0;
    return window.MIQCommon.numbers.integer(n).replace(/\B(?=(\d{3})+(?!\d))/g,',')
  }
  function hasNumber(value){return value!==null&&value!==undefined&&value!==''&&!isNaN(Number(value))}
  function hm(minutes){
    if(minutes===null||minutes===undefined)return '—';
    var total=Math.max(0,Math.round(Number(minutes)||0));
    var hours=Math.floor(total/60);
    var mins=total%60;
    return num(hours)+'H '+(mins<10?'0'+mins:mins)+'M'
  }
  function isBatt(vehicle){return vehicle.type==='리튬'||vehicle.type==='납산'}
  function socColor(value){return value>=60?'#0aa656':value>=30?'#ff9f0a':'#992100'}
  function periodValue(vehicle){
    var range=PERIOD[state.period].range;
    var raw=MIQObservations.aggregate(vehicle,range[0],state.period==='d'?range[0]:range[1]);
    return {km:raw.distanceKm,min:raw.runningMinutes,workMin:raw.workMinutes,idleMin:raw.idleMinutes,
      eff:raw.efficiency,operatingEff:raw.efficiency,shock:raw.shockCount,fc:raw.fuelRate,bc:raw.batteryRate};
  }
  function periodTimes(value){return {running:value.min,working:value.workMin,idle:value.idleMin};}
  function filtered(){
    var rows=state.sel&&state.sel.vehicles?state.sel.vehicles:VEHICLES;
    if(!currentCompanyId||currentCompanyId==='all')return rows;
    return rows.filter(function(vehicle){return String(vehicle.companyId||'1933')===String(currentCompanyId)})
  }
  function selectedVehicle(){return state.sel&&state.sel.vehicle?state.sel.vehicle:null}
  function safeId(value){return String(value).replace(/[^a-zA-Z0-9_-]/g,'-')}
  function escapeAttr(value){
    return String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  }
  function activeMetric(){
    return currentMetric&&METRIC_SORT[currentMetric]===state.sortKey?currentMetric:''
  }
  function listQueryParams(){
    var params=new URLSearchParams(location.search);
    var scopeVehicle=selectedVehicle();
    /* 차량이 선택된 경우 상위 범위는 차량 메타데이터가 단일 진실 원천이다. */
    var scopeGroup=summaryPolicy.group||scopeVehicle&&scopeVehicle.group||state.sel&&state.sel.group||null;
    var scopeType=scopeVehicle&&scopeVehicle.type||state.sel&&state.sel.type||null;
    params.set('companyId',currentCompanyId);
    params.set('period',state.period);
    if(state.sortKey)params.set('sort',state.sortKey);else params.delete('sort');
    params.set('dir',state.sortDir===-1?'desc':'asc');
    if(activeMetric())params.set('metric',activeMetric());else params.delete('metric');
    if(currentSource)params.set('source',currentSource);else params.delete('source');
    params.set('from',PERIOD[state.period].range[0]);
    params.set('to',PERIOD[state.period].range[1]);
    if(scopeGroup)params.set('group',scopeGroup);else params.delete('group');
    if(scopeType)params.set('type',scopeType);else params.delete('type');
    if(state.sel&&state.sel.vin)params.set('veh',state.sel.vin);else params.delete('veh');
    params.delete('returnTo');
    return params;
  }
  function syncUrl(){
    if(!history.replaceState)return;
    var params=listQueryParams();
    history.replaceState(null,'',location.pathname+'?'+params.toString());
    document.dispatchEvent(new CustomEvent('miq:query-change',{detail:{query:params.toString()}}))
  }
  function detailHref(vehicle){
    var params=new URLSearchParams();
    params.set('role',document.body.dataset.managementRole);
    var listQuery=listQueryParams();
    params.set('returnTo',location.pathname+'?'+listQuery.toString());
    params.set('veh',vehicle.vin);
    params.set('companyId',vehicle.companyId||currentCompanyId);
    params.set('period',state.period);
    if(state.sortKey)params.set('sort',state.sortKey);
    params.set('dir',state.sortDir===-1?'desc':'asc');
    if(activeMetric())params.set('metric',activeMetric());
    if(currentSource)params.set('source',currentSource);
    params.set('from',PERIOD[state.period].range[0]);
    params.set('to',PERIOD[state.period].range[1]);
    params.set('group',vehicle.group);
    params.set('type',vehicle.type);
    return DETAIL+'?'+params.toString()
  }
  function applyCustomRange(){
    if(state.period!=='c')return true;
    var inputs=document.querySelectorAll('#dateRange input');
    var from=inputs[0]&&inputs[0].value;
    var to=inputs[1]&&inputs[1].value;
    var fromDate=new Date((from||'')+'T00:00:00');
    var toDate=new Date((to||'')+'T00:00:00');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||Number.isNaN(fromDate.getTime())||Number.isNaN(toDate.getTime())||fromDate>toDate){
      MIQCommon.view.set(live,"textContent",'조회 시작일과 종료일을 올바르게 입력해 주세요.');
      if(inputs[0])inputs[0].focus();
      return false
    }
    var days=Math.floor((toDate-fromDate)/86400000)+1;
    if(days>366){
      MIQCommon.view.set(live,"textContent",'사용자설정 기간은 최대 366일까지 조회할 수 있습니다.');
      if(inputs[1])inputs[1].focus();
      return false
    }
    PERIOD.c.range=[from,to];
    return true
  }

  function summaryData(rows){
    var range=PERIOD[state.period].range,raw=MIQObservations.aggregate(rows,range[0],state.period==='d'?range[0]:range[1]);
    var counts={};TYPES.forEach(function(type){counts[type]=rows.filter(function(v){return v.type===type;}).length;});
    return {count:rows.length,counts:counts,km:raw.distanceKm,min:raw.runningMinutes,shock:raw.shockCount,
      efficiencyAvg:raw.efficiency,fuelAvg:raw.fuelRate,batteryAvg:raw.batteryRate};
  }
  function typesText(data){
    return '엔진 '+data.counts['엔진']+' · 납산 '+data.counts['납산']+' · 리튬 '+data.counts['리튬']
  }
  function compactTypesText(data){
    return '엔 '+data.counts['엔진']+' · 납 '+data.counts['납산']+' · 리 '+data.counts['리튬']
  }
  function valueOrDash(value,suffix,decimal){
    return value===null||value===undefined
      ? '<span class="na">-</span>'
      : num(value,decimal)+suffix
  }

  function renderKpi(rows){
    var data=summaryData(rows);
    summaryKpi.classList.add('is-updating');
    if(option==='expand'){
      var items=[
        {label:'차량 구성',value:'<strong>'+data.count+'대</strong><small title="'+typesText(data)+'">'+compactTypesText(data)+'</small>'},
        {label:'운영효율',value:valueOrDash(data.efficiencyAvg,'%',1)},
        {label:'충격 횟수',value:num(data.shock)+'회',alert:data.shock>0},
        {label:'기간 이동거리',value:num(data.km)+' Km'},
        {label:'기간 가동시간',value:num(data.min===null?null:data.min/60)+' H'},
      ];
      MIQCommon.view.set(summaryKpi,"innerHTML",'<div class="kpi-strip-a">'+items.map(function(item){
        return '<div class="kpi-strip-a__item'+(item.alert?' alert':'')+'">'
          +'<span class="kpi-label">'+item.label+'</span>'
          +'<div class="kpi-value">'+item.value+'</div>'
          +'</div>'
      }).join('')+'</div>')
    }else{
      MIQCommon.view.set(summaryKpi,"innerHTML",'<div class="kpi-rail-b">'
        +'<div class="kpi-rail-b__group"><span class="kpi-label">조회 범위</span><div class="kpi-rail-b__values"><strong>'+data.count+'대</strong><span title="'+typesText(data)+'">'+compactTypesText(data)+'</span></div></div>'
        +'<div class="kpi-rail-b__group alert"><span class="kpi-label">확인 우선</span><div class="kpi-rail-b__values"><span>충격 <strong>'+num(data.shock)+'회</strong></span></div></div>'
        +'<div class="kpi-rail-b__group"><span class="kpi-label">운영</span><div class="kpi-rail-b__values"><span>효율 <strong>'+valueOrDash(data.efficiencyAvg,'%',1)+'</strong></span></div></div>'
        +'<div class="kpi-rail-b__group"><span class="kpi-label">기간 활동</span><div class="kpi-rail-b__values"><span><strong>'+num(data.km)+'Km</strong></span><span><strong>'+num(data.min/60)+'H</strong></span></div></div>'
        +'</div>')
    }
    requestAnimationFrame(function(){summaryKpi.classList.remove('is-updating')})
  }

  function sortValue(vehicle,key){
    var value=periodValue(vehicle);
    switch(key){
      case'vin':return vehicle.vin;
      case'group':return vehicle.group;
      case'type':return vehicle.type;
      case'cumKm':return vehicle.cumKm;
      case'cumH':return vehicle.cumH;
      case'km':return value.km;
      case'min':return value.min;
      case'workMin':return periodTimes(value).working;
      case'performance':return value.operatingEff;
      case'electricEff':return value.operatingEff;
      case'shock':return value.shock;
      case'conn':return vehicle.conn?1:0;
      case'soc':return vehicle.soc===null?null:vehicle.soc;
      case'fuel':return value.fc;
      case'battery':return value.bc
    }
    return null
  }
  function sortedRows(rows){
    if(!state.sortKey)return rows.slice();
    return rows.slice().sort(function(a,b){
      var left=sortValue(a,state.sortKey);
      var right=sortValue(b,state.sortKey);
      var leftMissing=left===null||left===undefined||Number.isNaN(left);
      var rightMissing=right===null||right===undefined||Number.isNaN(right);
      if(leftMissing&&rightMissing)return a.vin.localeCompare(b.vin,'ko');
      if(leftMissing)return 1;
      if(rightMissing)return-1;
      var result=typeof left==='string'
        ? left.localeCompare(right,'ko')
        : left-right;
      return result===0?a.vin.localeCompare(b.vin,'ko'):result*state.sortDir
    })
  }
  function sortIndicator(key){
    if(state.sortKey!==key)return'↕';
    return state.sortDir===1?'▲':'▼'
  }
  function sortButton(label,key){
    return '<button type="button" class="table-sort'+(state.sortKey===key?' is-sorted':'')+'" data-sort-key="'+key+'" aria-pressed="'+(state.sortKey===key?'true':'false')+'">'
      +label+'<span class="sort-ind">'+sortIndicator(key)+'</span></button>'
  }
  function sortLabel(key){
    var labels={
      vin:'차량번호',group:'그룹',type:'분류',cumKm:'누적 이동거리',cumH:'누적 가동시간',
      km:'기간 이동거리',min:'기간 가동시간',workMin:'기간 작업시간',performance:'운영효율',electricEff:'운영효율',
      shock:'충격 횟수',conn:'통신연결',soc:'배터리 SOC',fuel:'엔진 연료소비',battery:'전동 배터리소비'
    };
    return labels[key]||'기본 순서'
  }

  function connectionHtml(vehicle){
    var status=MIQSummaryRow.connection(vehicle.conn);
    return '<span class="connection-badge '+status+'">'+(status==='on'?'연결':'미연결')+'</span>'
  }
  function socHtml(vehicle){
    if(!hasNumber(vehicle.soc)||Number(vehicle.soc)<0||Number(vehicle.soc)>100)return'<span class="na" title="배터리 잔량 미수집">-</span>';
    return '<span class="soc" role="img" aria-label="배터리 잔량 '+vehicle.soc+'%"><span class="soc__track"><i class="soc__fill" style="width:'+vehicle.soc+'%;--soc-color:'+socColor(vehicle.soc)+'"></i></span><strong>'+vehicle.soc+'%</strong></span>'
  }
  function connectionDot(vehicle){
    var status=MIQSummaryRow.connection(vehicle.conn);
    var label=status==='on'?'통신연결: 연결':'통신연결: 미연결';
    return '<i class="connection-dot '+status+'" role="img" aria-label="'+label+'" title="'+label+'"></i>'
  }
  function energyText(vehicle){
    return vehicle.soc===null?'정보 미제공':vehicle.soc+'%'
  }
  function performanceText(vehicle,value){
    return {label:'운영효율',value:value.operatingEff==null?'-':window.MIQCommon.numbers.integer(value.operatingEff)+'%'};
  }
  function consumptionText(vehicle,value){
    if(vehicle.type==='엔진')return value.fc===null?'-':window.MIQCommon.numbers.integer(value.fc)+' ℓ/H';
    return value.bc===null?'-':window.MIQCommon.numbers.integer(value.bc)+' kWh/H'
  }
  function health(vehicle,value){
    if(MIQSummaryRow.connection(vehicle.conn)==='off')return{cls:'danger',text:'통신 확인'};
    if(vehicle.soc!==null&&vehicle.soc<30)return{cls:'warning',text:'SOC 확인'};
    if(value.shock>=5)return{cls:'warning',text:'충격 확인'};
    return{cls:'normal',text:'정상'}
  }
  function detailValues(vehicle,value){
    var sample=vehicle.summaryDetail||{};
    function valid(number){return typeof number==='number'&&isFinite(number)&&number>=0}
    function count(number){return valid(number)&&Math.floor(number)===number?num(number)+'건':'—'}
    var times=periodTimes(value);
    var supplies=vehicle.vin&&window.MIQServiceRecords?MIQServiceRecords.supplyItems(vehicle.vin):[];
    var due=supplies.length?supplies.filter(function(item){return item.state==='need';}).length:sample.supplyDueCount===0?0:null;
    var history=MIQSummaryRow.historyCounts(window.MIQServiceRecords,vehicle,PERIOD[state.period].range);
    return [
      ['대기시간',times.idle===null?'—':hm(times.idle)],
      ['충격횟수',valid(value.shock)?num(value.shock)+'회':'—'],
      ['소모품교체',due===null?'—':num(due)+'개'],
      ['차량 에러',count(sample.activeErrorCount)],
      ['수리이력',count(history.repair)],
      ['고장이력',count(history.fault)]
    ]
  }
  function detailPanel(vehicle,value){
    var items=detailValues(vehicle,value);
    return '<div class="vehicle-detail-panel">'
      +items.map(function(item){
        return '<div class="vehicle-detail-panel__item"><span>'+item[0]+'</span><strong>'+item[1]+'</strong></div>'
      }).join('')
      +'</div>'
  }

  function renderExpandableTable(rows){
    if(!rows.length){
      var emptyMessage='조회 조건에 해당하는 차량이 없습니다.';
      if(favoriteSummary&&!VEHICLES.length){
        emptyMessage=favoriteReadError?'관심차량을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.':(QUERY.get('favoriteCategory')?'선택한 구분에 등록된 관심차량이 없습니다.':'등록된 관심차량이 없습니다.')+' 관심차량 관리에서 차량을 담고 저장해 주세요.';
      }
      MIQCommon.view.set(vehicleList,"innerHTML",'<div class="option-empty">'+emptyMessage+'</div>');
      return
    }
    var body=rows.map(function(vehicle,index){
      var value=periodValue(vehicle);
      var expanded=Boolean(state.expanded[vehicle.vin]);
      var detailId='vehicle-detail-'+safeId(vehicle.vin);
      var performance=performanceText(vehicle,value);
      var times=periodTimes(value);
      return '<tr class="vehicle-row" data-vin="'+escapeAttr(vehicle.vin)+'" style="--row-delay:'+(index*16)+'ms">'
        +'<td><div class="vehicle-identity"><button type="button" class="row-expand" data-expand-vin="'+escapeAttr(vehicle.vin)+'" aria-expanded="'+(expanded?'true':'false')+'" aria-controls="'+detailId+'" aria-label="'+escapeAttr(vehicle.vin)+' 상세 '+(expanded?'접기':'펼치기')+'">'+(expanded?'−':'+')+'</button><span class="vehicle-identity__text"><a href="'+detailHref(vehicle)+'">'+connectionDot(vehicle)+'<span class="vehicle-vin">'+vehicle.vin+'</span></a><span class="vehicle-model">'+vehicle.model+'</span></span></div></td>'
        +'<td><span class="affiliation"><strong>'+vehicle.group+'</strong><span class="vehicle-type">'+vehicle.type+(vehicle.type==='리튬'?socHtml(vehicle):'')+'</span></span></td>'
        +'<td><span class="metric-pair"><span>거리 <strong>'+valueOrDash(vehicle.cumKm,' Km')+'</strong></span><span>시간 <strong>'+valueOrDash(vehicle.cumH,' H')+'</strong></span></span></td>'
        +'<td><span class="metric-pair"><span>거리 <strong>'+num(value.km,value.km<10?1:0)+' Km</strong></span><span>시간 <strong>'+hm(value.min)+'</strong></span></span></td>'
        +'<td><span class="performance-cell"><strong>'+performance.value+'</strong></span></td>'
        +'<td class="c"><strong class="row-time">'+(times.running===null?'—':hm(times.running))+'</strong></td>'
        +'<td class="c"><strong class="row-time">'+(times.working===null?'—':hm(times.working))+'</strong></td>'
        +'</tr>'
        +(expanded?'<tr class="detail-row" data-detail-vin="'+escapeAttr(vehicle.vin)+'" id="'+detailId+'"><td colspan="7">'+detailPanel(vehicle,value)+'</td></tr>':'')
    }).join('');
    MIQCommon.view.set(vehicleList,"innerHTML",'<div class="expand-table-wrap"><table class="expand-table" aria-label="차량 운행 요약 상세 펼침형">'
      +'<colgroup><col><col><col><col><col><col><col></colgroup>'
      +'<thead><tr>'
      +'<th scope="col">'+sortButton('차량','vin')+'</th>'
      +'<th scope="col">'+sortButton('소속·분류','group')+'</th>'
      +'<th scope="col">'+sortButton('누적','cumKm')+'</th>'
      +'<th scope="col">'+sortButton('선택 기간 '+PERIOD[state.period].label,'km')+'</th>'
      +'<th scope="col">'+sortButton('운영효율(%)','performance')+'</th>'
      +'<th scope="col" class="c">'+sortButton('가동시간','min')+'</th>'
      +'<th scope="col" class="c">'+sortButton('작업시간','workMin')+'</th>'
      +'</tr></thead><tbody>'+body+'</tbody></table></div>')
  }

  function fieldClass(keys){
    return keys.indexOf(state.sortKey)>=0?' priority-field is-sort-key':' priority-field'
  }
  function renderPriorityCards(rows){
    if(!rows.length){
      MIQCommon.view.set(vehicleList,"innerHTML",'<div class="option-empty">조회 조건에 해당하는 차량이 없습니다.</div>');
      return
    }
    MIQCommon.view.set(vehicleList,"innerHTML",'<div class="priority-card-list">'+rows.map(function(vehicle,index){
      var value=periodValue(vehicle);
      var performance=performanceText(vehicle,value);
      var status=health(vehicle,value);
      return '<article class="priority-card" data-vin="'+escapeAttr(vehicle.vin)+'" style="--row-delay:'+(index*16)+'ms">'
        +'<div class="priority-card__head">'
        +'<div class="priority-card__identity"><a href="'+detailHref(vehicle)+'">'+vehicle.vin+'</a><span class="model">'+vehicle.model+'</span><span class="type-badge">'+vehicle.type+'</span></div>'
        +'<div class="priority-card__states"><span class="health-badge '+status.cls+'">'+status.text+'</span>'+connectionHtml(vehicle)+'<span class="priority-card__energy">잔여 에너지 <strong>'+energyText(vehicle)+'</strong></span></div>'
        +'</div>'
        +'<div class="priority-card__info">'
        +'<div class="priority-field"><span>소속 업체</span><strong title="'+escapeAttr(vehicle.companyName||MIQ.COMPANY)+'">'+(vehicle.companyName||MIQ.COMPANY)+'</strong></div>'
        +'<div class="'+fieldClass(['group'])+'"><span>소속 그룹</span><strong>'+vehicle.group+'</strong></div>'
        +'<div class="'+fieldClass(['type'])+'"><span>동력 유형</span><strong>'+vehicle.type+'</strong></div>'
        +'<div class="'+fieldClass(['cumKm'])+'"><span>누적 이동거리</span><strong>'+valueOrDash(vehicle.cumKm,' Km')+'</strong></div>'
        +'<div class="'+fieldClass(['cumH'])+'"><span>누적 가동시간</span><strong>'+valueOrDash(vehicle.cumH,' H')+'</strong></div>'
        +'<div class="priority-field"><span>TMS Serial</span><strong class="na">정보 미제공</strong></div>'
        +'</div>'
        +'<div class="priority-card__metrics">'
        +'<div class="priority-field"><span>운영률</span><strong'+(hasNumber(vehicle.operatingRate)?'':' class="na"')+'>'+(hasNumber(vehicle.operatingRate)?num(vehicle.operatingRate,1)+'%':'정보 미제공')+'</strong></div>'
        +'<div class="'+fieldClass(['performance','electricEff'])+'"><span>'+performance.label+'</span><strong>'+performance.value+'</strong></div>'
        +'<div class="'+fieldClass(['shock'])+'"><span>충격 횟수</span><strong>'+num(value.shock)+'회</strong></div>'
        +'<div class="'+fieldClass(['km'])+'"><span>기간 이동거리</span><strong>'+num(value.km,value.km<10?1:0)+' Km</strong></div>'
        +'<div class="'+fieldClass(['min'])+'"><span>기간 가동시간</span><strong>'+hm(value.min)+'</strong></div>'
        +'<div class="'+fieldClass(['fuel','battery'])+'"><span>평균 소비량</span><strong>'+consumptionText(vehicle,value)+'</strong></div>'
        +'</div>'
        +'</article>'
    }).join('')+'</div>')
  }

  function scopeForRows(rows){
    var vehicle=selectedVehicle();
    if(scopeContext)return scopeContext;
    var companyVehicle=vehicle||VEHICLES.filter(function(item){return currentCompanyId==='all'||String(item.companyId||'1933')===String(currentCompanyId)})[0]||null;
    var segments=[
      {key:'company',label:currentCompanyId==='all'?'전체 업체':companyVehicle&&companyVehicle.companyName||'선택 업체'},
      {key:'group',label:state.sel&&state.sel.group||'전체 그룹'},
      {key:'type',label:state.sel&&state.sel.type||'전체 분류'},
      {key:'vehicle',label:vehicle?vehicle.vin+' · '+vehicle.model:'전체 차량'}
    ];
    return{
      companyId:currentCompanyId,
      group:state.sel&&state.sel.group||null,
      type:state.sel&&state.sel.type||null,
      equipmentId:vehicle?vehicle.vin:null,
      scopeSegments:segments,
      scopePath:segments.map(function(segment){return segment.label}).join(' › '),
      selectedCount:rows.length
    }
  }
  function renderToolbarScope(rows){
    var host=optionToolbar.querySelector('.option-toolbar__count');
    if(window.MIQ&&typeof MIQ.renderScopeSummary==='function'){
      var target=scopeForRows(rows);
      MIQ.renderScopeSummary(host,target,{countLabel:'차량',count:rows.length,countUnit:'대'});
      host.classList.add('miq-summary-scope-chip')
    }
  }
  function renderToolbar(rows,visible){
    visible=visible||rows;
    if(option==='expand'){
      var allExpanded=visible.length>0&&visible.every(function(vehicle){return Boolean(state.expanded[vehicle.vin])});
      MIQCommon.view.set(optionToolbar,"innerHTML",'<span class="option-toolbar__count"></span>'
        +'<span class="connection-legend" aria-label="통신연결 범례"><span class="connection-legend__title">통신연결</span><span><i class="connection-dot on" aria-hidden="true"></i>연결</span><span><i class="connection-dot off" aria-hidden="true"></i>미연결</span></span>'
        +'<div class="option-toolbar__tools"><span class="option-toolbar__hint">+ 버튼으로 차량별 추가 정보를 확인합니다.</span><button type="button" class="option-toolbar__button" id="toggleAllDetails">'+(allExpanded?'모두 접기':'모두 펼치기')+'</button></div>');
      renderToolbarScope(rows);
      document.getElementById('toggleAllDetails').addEventListener('click',function(){
        visible.forEach(function(vehicle){state.expanded[vehicle.vin]=!allExpanded});
        render()
      })
    }else{
      var options=[
        ['vin','차량번호'],['group','그룹'],['type','분류'],['cumKm','누적 이동거리'],['cumH','누적 가동시간'],
        ['km','기간 이동거리'],['min','기간 가동시간'],['electricEff','운영효율'],['shock','충격 횟수'],
        ['conn','통신연결'],['soc','배터리 SOC'],['fuel','엔진 연료소비'],['battery','전동 배터리소비']
      ];
      MIQCommon.view.set(optionToolbar,"innerHTML",'<span class="option-toolbar__count"></span>'
        +'<span class="sort-current">현재 '+sortLabel(state.sortKey)+' · '+(state.sortDir===1?'오름차순':'내림차순')+'</span>'
        +'<div class="option-toolbar__tools">'
        +'<label class="sort-control">정렬 기준 <select class="sort-select" data-role="sort-key" aria-label="정렬 기준">'+options.map(function(item){return'<option value="'+item[0]+'"'+(state.sortKey===item[0]?' selected':'')+'>'+item[1]+'</option>'}).join('')+'</select></label>'
        +'<label class="sort-control">방향 <select class="sort-select" data-role="sort-dir" aria-label="정렬 방향"><option value="1"'+(state.sortDir===1?' selected':'')+'>오름차순</option><option value="-1"'+(state.sortDir===-1?' selected':'')+'>내림차순</option></select></label>'
        +'<button type="button" class="option-toolbar__button" id="sortReset">초기화</button>'
        +'</div>');
      renderToolbarScope(rows);
      optionToolbar.querySelector('[data-role="sort-key"]').addEventListener('change',function(){
        state.sortKey=this.value;
        state.sortDir=this.value==='shock'?-1:1;
        render()
      });
      optionToolbar.querySelector('[data-role="sort-dir"]').addEventListener('change',function(){
        state.sortDir=Number(this.value);
        render()
      });
      document.getElementById('sortReset').addEventListener('click',function(){
        state.sortKey='shock';
        state.sortDir=-1;
        render()
      })
    }
  }

  function sharedPeriodReady(){
    var bar=document.getElementById('periodTabs').closest('.filter-bar');
    return bar&&bar.dataset.periodReady==='true'
  }
  function renderChrome(){
    // The shared controller owns draft dates; table renders must not overwrite them.
    if(sharedPeriodReady())return;
    Array.prototype.forEach.call(document.querySelectorAll('#periodTabs button[data-period]'),function(button){
      button.classList.toggle('active',MIQCommon.view.call(button,"getAttribute",['data-period'])===state.period)
    });
    var range=PERIOD[state.period].range;
    var inputs=document.querySelectorAll('#dateRange input');
    if(inputs.length===2){
      inputs[0].value=range[0];
      inputs[1].value=range[1];
      inputs[0].disabled=state.period!=='c';
      inputs[1].disabled=state.period!=='c'
    }
  }
  function render(){
    var sourceRows=filtered();
    var ordered=sortedRows(sourceRows);
    renderChrome();
    renderKpi(sourceRows);
    var visible=pager.slice(ordered,state.period+'|'+PERIOD[state.period].range.join('|'));
    renderToolbar(ordered,visible);
    if(option==='expand')renderExpandableTable(visible);
    else renderPriorityCards(visible);
    syncUrl()
  }

  document.getElementById('periodTabs').addEventListener('click',function(event){
    if(sharedPeriodReady())return;
    var button=event.target.closest('button[data-period]');
    if(!button)return;
    Array.prototype.forEach.call(this.querySelectorAll('button'),function(item){item.classList.remove('active')});
    button.classList.add('active');
    state.period=MIQCommon.view.call(button,"getAttribute",['data-period']);
    render();
    if(state.period==='c'){
      var firstDate=document.querySelector('#dateRange input');
      MIQCommon.view.set(live,"textContent",'사용자설정 기간을 입력한 뒤 조회해 주세요. 최대 366일까지 조회할 수 있습니다.');
      if(firstDate)firstDate.focus()
    }
  });
  document.getElementById('runSearch').addEventListener('click',function(event){
    if(sharedPeriodReady())return;
    if(!applyCustomRange()){
      event.stopImmediatePropagation();
      return
    }
    if(sharedPeriodReady())return;
    render();
    MIQCommon.view.set(live,"textContent",PERIOD[state.period].label+' 기준으로 조회했습니다.')
  });
  document.addEventListener('miq:period-change',function(event){
    var detail=event.detail||{};
    var mode=detail.period;
    if(!PERIOD[mode])return;
    var from=dateRules.parse(detail.startDate);
    var to=dateRules.parse(detail.endDate);
    if(!from||!to||from>to)return;
    state.period=mode;
    PERIOD[mode].range=[detail.startDate,detail.endDate];
    if(mode==='c')PERIOD.c.f=dateRules.dayCount(from,to)/30;
    render();
    MIQCommon.view.set(live,"textContent",PERIOD[state.period].label+' 기준으로 조회했습니다.')
  });
  vehicleList.addEventListener('click',function(event){
    var sort=event.target.closest('[data-sort-key]');
    if(sort){
      var key=MIQCommon.view.call(sort,"getAttribute",['data-sort-key']);
      if(state.sortKey===key)state.sortDir=-state.sortDir;
      else{state.sortKey=key;state.sortDir=1}
      render();
      return
    }
    var expand=event.target.closest('[data-expand-vin]');
    if(expand){
      var expandVin=MIQCommon.view.call(expand,"getAttribute",['data-expand-vin']);
      state.expanded[expandVin]=!state.expanded[expandVin];
      render();
      return
    }
  });
  var initialTargetSync=true;
  document.addEventListener('miq:target-change',function(event){
    scopeContext=event.detail||scopeContext;
    currentCompanyId=event.detail&&event.detail.companyId||currentCompanyId;
    var vin=event.detail&&event.detail.equipmentId;
    var targetGroup=event.detail&&event.detail.group||null;
    var targetType=event.detail&&event.detail.type||null;
    var exists=vin&&VEHICLES.some(function(vehicle){return vehicle.vin===vin});
    if(exists){
      if(initialTargetSync&&state.sel&&state.sel.vin===vin)tree.set({vin:vin});
      else tree.set({group:null,type:null,vin:vin})
    }else if(!vin)tree.set({group:targetGroup,type:targetType,vin:null});
    else syncUrl();
    initialTargetSync=false
  });

  render()
})();
