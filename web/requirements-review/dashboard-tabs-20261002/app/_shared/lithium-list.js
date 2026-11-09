(function(){
  'use strict';
  var query=new URLSearchParams(location.search),role=MIQCommon.roles.resolve(query.get('role'));
  var policy=MIQCommon.roles.targetPolicy(role),model=MIQLithiumListModel;
  var fleet=model.allowed(MIQ.FLEET_CATALOG||MIQ.FLEET,role,policy);
  var state={companyId:policy.companyId||query.get('companyId')||'all',group:role==='customer_staff'?'물류1팀':query.get('group')||'',veh:query.get('veh')||query.get('equipmentId')||'',abnormal:query.get('abnormal')==='1',sort:model.sortKeys.indexOf(query.get('sort'))>=0?query.get('sort'):'',dir:query.get('dir')==='desc'?'desc':'asc'};
  var tbody=document.getElementById('lithiumListBody'),checkbox=document.getElementById('lithiumAbnormal');
  var pager=MIQ.createListPager(tbody.closest('.tbl-wrap')||tbody.closest('table').parentElement,{pageSize:20,onChange:render});
  var scopeContext=window.MIQ_TARGET_CONTEXT||{};
  function esc(value){return MIQCharts.escape(value);}
  function hm(value){return value===null?'수집 전':Math.floor(value/60)+'시간 '+value%60+'분';}
  function syncQuery(){
    var params=new URLSearchParams(location.search);
    params.set('role',role);params.set('type','리튬');
    [['companyId',state.companyId],['group',state.group],['veh',state.veh],['abnormal',state.abnormal?'1':''],['sort',state.sort],['dir',state.sort?state.dir:'']].forEach(function(pair){if(pair[1])params.set(pair[0],pair[1]);else params.delete(pair[0]);});
    ['equipmentId','origin','lithiumListQuery'].forEach(function(key){params.delete(key);});
    history.replaceState(null,'',location.pathname+'?'+params.toString());
    return params;
  }
  function detailHref(vehicle,params){
    var detail=new URLSearchParams(params.toString());
    detail.set('lithiumListQuery',params.toString());detail.set('origin','lithium-list');detail.set('veh',vehicle.vin);detail.set('companyId',vehicle.companyId||'1933');
    if(vehicle.group)detail.set('group',vehicle.group);else detail.delete('group');
    detail.delete('abnormal');
    return 'lithium-tobe.html?'+detail.toString();
  }
  function smart(vehicle,known){
    if(!known)return '수집 전';
    try{var saved=JSON.parse(localStorage.getItem('linq.smartCharge.v1:'+role+':'+vehicle.vin));return saved&&saved.on===false?'꺼짐':'켜짐';}catch(error){return '수집 전';}
  }
  function renderScope(count){
    // The list is always lithium-only; its scope pill describes company/group/vehicle selection.
    var target=Object.assign({},scopeContext,{companyId:state.companyId,group:state.group,equipmentId:state.veh,type:''});
    if(!target.scopeSegments||!target.scopeSegments.length){
      var company=fleet.find(function(vehicle){return String(vehicle.companyId||'1933')===state.companyId;});
      target.scopeSegments=[{key:'company',label:company&&company.companyName||state.companyId},{key:'group',label:state.group},{key:'vehicle',label:state.veh}];
    }
    MIQ.renderScopeSummary(document.getElementById('lithiumListScope'),target,{countLabel:'차량',count:count,countUnit:'대',includeVehicle:true});
  }
  function renderSort(){
    Array.prototype.forEach.call(document.querySelectorAll('.li-list-table .table-sort'),function(button){
      var selected=MIQCommon.view.call(button,"getAttribute",['data-sort-key'])===state.sort;
      button.classList.toggle('is-sorted',selected);
      MIQCommon.view.call(button,"setAttribute",['aria-pressed',String(selected)]);
      MIQCommon.view.call(button.closest('th'),"setAttribute",['aria-sort',selected?(state.dir==='asc'?'ascending':'descending'):'none']);
      MIQCommon.view.set(button.querySelector('.sort-ind'),"textContent",selected?(state.dir==='asc'?'▲':'▼'):'↕');
    });
  }
  function render(){
    var params=syncQuery(),rows=model.sort(model.filter(fleet,state),state.sort,state.dir,smart);
    checkbox.checked=state.abnormal;
    renderScope(rows.length);
    renderSort();
    rows=pager.slice(rows);
    MIQCommon.view.set(tbody,"innerHTML",rows.length?rows.map(function(vehicle){
      var info=model.snapshot(vehicle),color=info.soc>=60?'#37b24d':info.soc>=30?'#f59f00':'#e03131';
      var soc=info.soc===null?'<span class="li-list-unknown">수집 전</span>':'<div class="battery-graph mode-list" '+MIQCharts.tipAttrs(vehicle.vin+'\n배터리 잔량 (SOC) '+info.soc+'%')+'><div class="battery-graph__image"><div class="battery-graph__progress"><span class="battery-graph__bar" style="width:'+Math.max(0,Math.min(100,info.soc))+'%;background:'+color+'"></span></div></div><span class="battery-graph__text">'+info.soc+'%</span></div>';
      var status=[['온도',info.temperature],['충전',info.charge],['배터리',info.battery]].map(function(item){return '<div class="battery-status__item"><span class="battery-status__text">'+item[0]+'</span><strong class="battery-status__value '+(item[1]==='수집 전'?'is-unknown':item[1]!=='정상'?'is-warning':'')+'">'+item[1]+'</strong></div>';}).join('');
      return '<tr data-vin="'+esc(vehicle.vin)+'"><td><a class="equipment-link" href="'+esc(detailHref(vehicle,params))+'">'+esc(vehicle.vin)+'</a><span class="li-list-model">'+esc(vehicle.model)+'</span></td><td class="c">'+soc+'</td><td class="c">'+(info.soh===null?'수집 전':info.soh+'%')+'</td><td class="c">'+hm(info.workMinutes)+'</td><td class="c">'+hm(info.chargeMinutes)+'</td><td class="c">'+smart(vehicle,info.known)+'</td><td><div class="battery-status mode-list"><div class="battery-status__group">'+status+'</div></div></td></tr>';
    }).join(''):'<tr><td colspan="7" class="li-list-empty">조회 조건에 해당하는 리튬 차량이 없습니다.</td></tr>');
  }
  MIQCharts.bind(tbody);
  checkbox.addEventListener('change',function(){state.abnormal=checkbox.checked;render();});
  Array.prototype.forEach.call(document.querySelectorAll('.li-list-table .table-sort'),function(button){button.addEventListener('click',function(){var key=MIQCommon.view.call(button,"getAttribute",['data-sort-key']);state.dir=state.sort===key&&state.dir==='asc'?'desc':'asc';state.sort=key;render();});});
  document.addEventListener('miq:target-change',function(event){var target=event.detail||{};scopeContext=target;state.companyId=policy.companyId||target.companyId||'all';state.group=role==='customer_staff'?'물류1팀':target.group||'';state.veh=target.equipmentId||'';render();});
  window.addEventListener('pageshow',function(event){if(event.persisted)render();});
  render();
})();
