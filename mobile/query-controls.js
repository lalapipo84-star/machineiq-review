// Shared vehicle/period controls. One markup implementation; no event listeners or DOM replacement.
(function(root){
  'use strict';
  const searchKeys=Object.freeze({listVehicle:'summarySearch',reportVehicle:'reportSearch',serviceEquipmentId:'serviceSearch'});
  function create({model:M,rows,getState,getRangeOpen,esc,fieldText,icon,summaryVehicles}){
    const vehicleSearchKeys=searchKeys;
  function scopeControls() {
    const state=getState();
    return state.role === 'customer_owner' ? `<label class="compact-group"><select data-control="group" aria-label="그룹"><option value="">전체 그룹</option>${[...new Set(rows.map(v=>v.group))].map(v=>`<option ${state.group===v?'selected':''}>${esc(v)}</option>`).join('')}</select></label>` : '';
  }

  function periodState() {
    const state=getState();
    const prefix=state.view==='services'?'service':'';
    return prefix?{period:state[prefix+'Period'],from:state[prefix+'From'],to:state[prefix+'To']}:state;
  }

  function periodPatch(period,from,to) {
    const state=getState();
    const prefix=state.view==='services'?'service':'';
    return prefix?{[prefix+'Period']:period,[prefix+'From']:from,[prefix+'To']:to}:{period,from,to};
  }

  function periodControls({group=false,vehicle=false}={}) {
    const state=getState();
    const s=periodState(),dayOnly=s.from===s.to;
    const hasGroup=group&&state.role==='customer_owner';
    const shortDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)?value.slice(5).replace('-','.'):value;
    const lookup=vehicle?vehicleControl(vehicle===true?'reportVehicle':vehicle):'';
    return `<section class="compact-filter-panel ${hasGroup?'has-group':'no-group'} no-search${vehicle?' has-report-vehicle':''}" aria-label="조회 조건">
      ${hasGroup?'<div class="compact-filter-top">'+scopeControls()+lookup+'</div>':lookup}
      <button class="compact-range-toggle" type="button" data-toggle-range aria-expanded="${getRangeOpen()}" aria-controls="range-form" aria-label="조회 기간 ${esc(s.from)} ~ ${esc(s.to)}, 날짜 변경">${icon('calendar-days')}<span>${esc(shortDate(s.from))}${dayOnly?'':' ~ '+esc(shortDate(s.to))}</span>${icon('chevron-down')}</button>
      <div class="period-tabs" role="group" aria-label="조회 기간">${[['d','일'],['w','주'],['m','월']].map(([key,text])=>`<button type="button" data-period="${key}" aria-pressed="${s.period===key}" class="${s.period===key?'is-active':''}">${text}</button>`).join('')}</div>
      <form class="date-range" id="range-form" ${getRangeOpen()?'':'hidden'}><input name="from" type="date" value="${esc(s.from)}" aria-label="조회 시작일" required><span>~</span><input name="to" type="date" value="${esc(s.to)}" aria-label="조회 종료일" required><button type="submit">조회</button></form></section>`;
  }

  function vehicleQueryControl() {
    const state=getState();
    return state.view==='summary'?'listVehicle':['reports','efficiency'].includes(state.view)?'reportVehicle':state.view==='services'?'serviceEquipmentId':'';
  }

  function filterVehicleQuery(vehicles,control) {
    const state=getState();
    const value=state[vehicleSearchKeys[control]]||'',term=value.trim().toLocaleLowerCase(),searching=Array.from(term).length>=3;
    return vehicles.filter(v=>value?(!searching||[v.equipmentNumber,v.model].some(value=>String(value??'').toLocaleLowerCase().includes(term))):(!state[control]||v.equipmentId===state[control]));
  }

  function vehicleControlLabel(control) {
    const state=getState();
    const query=vehicleSearchKeys[control];
    if(state[query])return state[query];
    if(!state[control])return '';
    const v=M.scope(rows,state).find(v=>v.equipmentId===state[control]);
    return v?fieldText(v.equipmentNumber)+' · '+fieldText(v.model):'조회할 수 없는 차량';
  }

  function vehicleControl(control='reportVehicle') {
    const state=getState();
    const query=vehicleSearchKeys[control];
    return `<section class="compact-report-vehicle vehicle-combobox" data-vehicle-control="${control}" aria-label="차량 선택 및 검색"><div class="vehicle-combobox-field"><input id="vehicle-lookup-input" type="text" role="combobox" aria-label="조회 차량 검색" aria-autocomplete="none" aria-expanded="false" aria-controls="vehicle-lookup-options" aria-describedby="vehicle-lookup-status" autocomplete="off" spellcheck="false" placeholder="전체 차량" value="${esc(vehicleControlLabel(control))}"><button type="button" class="vehicle-combobox-clear" data-clear-vehicle-lookup aria-label="차량 선택 및 검색 초기화" ${state[control]||state[query]?'':'hidden'}>${icon('x')}</button><button type="button" class="vehicle-combobox-toggle" data-toggle-vehicle-lookup aria-label="차량 목록 열기">${icon('chevron-down')}</button></div><span class="vehicle-combobox-announcement" id="vehicle-lookup-status" role="status" aria-live="polite">${vehicleSearchStatus(control)}</span><div class="vehicle-combobox-popup" id="vehicle-lookup-popup" hidden><p class="vehicle-combobox-status">차량 1대를 선택해 주세요.</p><div id="vehicle-lookup-options" role="listbox" aria-label="조회 차량 목록"></div></div></section>`;
  }

  function vehicleSearchStatus(control=vehicleQueryControl()) {
    const state=getState();
    const term=(state[vehicleSearchKeys[control]]||'').trim();
    const vehicles=control==='listVehicle'?summaryVehicles():filterVehicleQuery(M.scope(rows,state),control);
    return Array.from(term).length>=3?'검색 차량 '+vehicles.length+'대.':'차량번호 또는 기종을 3글자 이상 입력하면 아래 내용이 바로 검색됩니다.';
  }

    return {scopeControls,periodState,periodPatch,periodControls,vehicleQueryControl,filterVehicleQuery,vehicleControl,vehicleSearchStatus};
  }
  const api={searchKeys,create};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CustomerQueryControls=api;
})(typeof window==='undefined'?globalThis:window);
