// Local registration preview. No API request, fleet mutation, or persistent storage.
(function(root){
  'use strict';
  const fields={vehicle:'차량 시리얼번호'};
  const catalog=Object.freeze({
    vehicles:[{serial:'FBA32_LOCAL_001',model:'B30S-7',dealerId:'local-a'},{serial:'FBA32_LOCAL_002',model:'B30S-7',dealerId:'local-b'},{serial:'FBA32_LOCAL_USED',model:'B30S-7',dealerId:'local-a',registered:true}],
    dealers:{'local-a':'로컬 확인 딜러 A','local-b':'로컬 확인 딜러 B'}
  });
  const normalize=value=>String(value??'').trim().toUpperCase();
  const valid=value=>/^[A-Z0-9][A-Z0-9_-]{2,63}$/.test(normalize(value));
  // Vue handoff: preserve strict validation. Replace this fixture catalog with
  // authoritative API data and revalidate at save; never use preview() in production.
  const duplicate=(vehicle,records)=>Array.isArray(records)&&records.some(item=>normalize(item?.vehicle)===normalize(vehicle));
  function lookup(vehicle,records=[]){
    vehicle=normalize(vehicle);
    if(!valid(vehicle))return {error:'차량 시리얼번호를 확인해 주세요. 영문·숫자·밑줄·하이픈 3~64자로 입력합니다.'};
    const v=catalog.vehicles.find(item=>item.serial===vehicle);
    if(!v)return {error:'차량 정보를 찾을 수 없습니다. 시리얼번호를 확인해 주세요.'};
    if(v.registered)return {error:'이미 등록된 차량입니다. 기존 등록 정보를 확인해 주세요.'};
    if(duplicate(vehicle,records))return {error:'이미 신청한 차량입니다. 기존 신청 정보를 확인해 주세요.'};
    return {vehicle,model:v.model,dealer:catalog.dealers[v.dealerId],dealerId:v.dealerId};
  }
  // Explicit local walkthrough, not an authoritative lookup. Unknown nonempty
  // values remain examples; retained requests and registered fixtures still block.
  function preview(vehicle,records=[]){
    vehicle=String(vehicle??'').trim();
    if(!vehicle)return {error:'차량 시리얼번호를 입력해 주세요.',field:'vehicle'};
    if(duplicate(vehicle,records))return {error:'이미 신청한 차량입니다. 기존 신청 정보를 확인해 주세요.',field:'vehicle'};
    const v=catalog.vehicles.find(item=>item.serial===normalize(vehicle));
    if(v?.registered)return {error:'이미 등록된 차량입니다. 기존 등록 정보를 확인해 주세요.',field:'vehicle'};
    return {vehicle,model:(v?.model||'B30S-7')+' (예시)',dealer:(catalog.dealers[v?.dealerId]||'로컬 확인 딜러')+' (예시)',...(v?{dealerId:v.dealerId}:{})};
  }
  const dateText=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
  let requestSequence=0;
  function createRequestRecord(result,role){
    if(role!=='customer_owner'||!result||result.error||typeof result.vehicle!=='string'||!result.vehicle.trim()||!result.model||!result.dealer)return null;
    return {vehicle:result.vehicle.trim(),model:result.model,dealer:result.dealer,...(result.dealerId?{dealerId:result.dealerId}:{}),id:'local-request-'+Date.now()+'-'+(++requestSequence),role,status:'REQ',requestedBy:'고객 대표',registeredAt:dateText(new Date()),processedAt:'',processedBy:'',company:'(주)세종물류중부지점',reasonType:'',reason:''};
  }
  if(typeof module==='object'&&module.exports)module.exports={normalize,valid,lookup,catalog,preview,createRequestRecord};
  if(!root.document)return;
  const doc=root.document,$=s=>doc.querySelector(s),esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let role='',draft={vehicle:''},result=null,contextKey='',resultOwner='';
  const previewRequests=[];
  const identity=()=>{const profile=root.CustomerOnboarding?.current();return profile?'account:'+profile.role+':'+profile.userId:'preview:'+role;};
  const canRequest=()=>{const profile=root.CustomerOnboarding?.current();return role==='customer_owner'&&(!profile||profile.role==='customer_owner');};
  const records=()=>root.CustomerOnboarding?.current()?(root.CustomerOnboarding.requests?.()||[]):previewRequests;
  const active=()=>!!$('#vehicle-registration-form');
  const definition=rows=>'<dl class="detail-definition">'+rows.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value||'—')}</dd></div>`).join('')+'</dl>';
  const details=r=>definition([['차량 시리얼번호',r.vehicle],['기종',r.model],['담당 딜러',r.dealer]]);
  function enter(context){
    role=context.role;
    const key=identity();
    if(contextKey!==key){draft={vehicle:''};result=null;resultOwner='';contextKey=key;}
  }
  function resultMarkup(){
    if(result?.submitted)return `<section class="detail-card registration-result" tabindex="-1"><h2>신청 접수 완료</h2>${details(result)}<p class="source-note" role="status">신청이 접수되었습니다. 담당 딜러 승인 대기 중입니다.</p></section>`;
    if(result?.qrNotice)return `<section class="detail-card registration-result"><p class="source-note" role="status">${esc(result.qrNotice)}</p></section>`;
    if(result?.error)return `<section class="detail-card registration-result"><p class="error-note" role="alert">${esc(result.error)}</p></section>`;
    if(!result)return '';
    return `<section class="detail-card registration-result" tabindex="-1"><h2>조회 결과</h2>${details(result)}<p class="source-note">다음을 누르면 담당 딜러에게 차량 등록을 신청합니다.</p><button type="button" class="report-primary-action" data-registration-next>다음</button></section>`;
  }
  function refresh(){
    if($('#vehicle-registration-result'))$('#vehicle-registration-result').innerHTML=resultMarkup();
  }
  function set(field,value,check=false){
    if(!active()||!canRequest()||!Object.hasOwn(fields,field))return false;
    // QR values remain identifiers; never interpret a URL, JSON, or executable content.
    if(check&&!String(value??'').trim())return false;
    draft[field]=String(value??'');result=null;resultOwner='';
    const input=$('#registration-'+field);if(input&&input.value!==draft[field])input.value=draft[field];
    refresh();return true;
  }
  function render(context){
    enter(context);
    if(!canRequest())return '<div class="vehicle-registration" data-screen-id="LQ-MGT-008"><div class="snapshot"><h1>차량 등록</h1></div><section class="detail-card"><h2>차량 등록 신청은 고객 대표만 가능합니다.</h2><p class="source-note">소속 업체 대표에게 차량 등록을 요청해 주세요.</p></section></div>';
    const input=(key)=>`<label class="registration-field" for="registration-${key}"><strong>${fields[key]} <span aria-hidden="true">*</span></strong><span class="registration-input-row"><input id="registration-${key}" name="${key}" type="text" value="${esc(draft[key])}" placeholder="${fields[key]} 입력" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="${fields[key]}" aria-required="true">${root.CustomerRegistrationScanner?.button(key)||`<button type="button" class="detail-secondary-button registration-scan-button" data-registration-scan="${key}" aria-label="${fields[key]} QR 촬영"><i data-lucide="scan-line" aria-hidden="true"></i>QR 촬영</button>`}</span></label>`;
    return `<div class="vehicle-registration" data-screen-id="LQ-MGT-008"><div class="snapshot"><h1>차량 등록</h1></div><form id="vehicle-registration-form" class="detail-card" novalidate><h2>차량 정보</h2><p class="source-note">차량 시리얼번호를 입력하고 조회해 주세요.</p>${input('vehicle')}<button type="submit" class="report-primary-action" data-registration-lookup>조회</button></form><div id="vehicle-registration-result" aria-live="polite">${resultMarkup()}</div></div>`;
  }
  doc.addEventListener('input',e=>{if(e.isComposing)return;const key=e.target.name;if(e.target.form?.id==='vehicle-registration-form'&&Object.hasOwn(fields,key))set(key,e.target.value);});
  doc.addEventListener('compositionend',e=>{if(e.target.form?.id==='vehicle-registration-form')set(e.target.name,e.target.value);});
  doc.addEventListener('submit',e=>{
    if(e.target.id!=='vehicle-registration-form')return;e.preventDefault();
    if(!canRequest()||!active())return;
    result=preview(draft.vehicle,records());resultOwner=identity();refresh();
    if(result.error){$('#registration-'+result.field)?.focus();return;}
    $('.registration-result')?.focus();
  });
  doc.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.registrationScan&&!root.CustomerRegistrationScanner&&active()&&Object.hasOwn(fields,b.dataset.registrationScan)){
      result={qrNotice:'QR 촬영은 테스트 앱에서 사용할 수 있습니다. HTML 화면에서는 '+fields[b.dataset.registrationScan]+'를 직접 입력해 주세요.'};refresh();$('#registration-'+b.dataset.registrationScan)?.focus();return;
    }
    if(b.hasAttribute('data-registration-next')&&active()){
      if(!canRequest())return;
      if(!result||result.submitted||result.error||resultOwner!==identity()||result.vehicle!==draft.vehicle.trim())return;
      const checked=preview(draft.vehicle,records());
      if(checked.error){result=checked;refresh();return;}
      const record=createRequestRecord(checked,role);if(!record)return;
      if(root.CustomerOnboarding?.current()){
        if(!root.CustomerOnboarding.addRequest?.(record)){result={error:'신청을 저장하지 못했습니다. 저장소 설정을 확인하고 다시 조회해 주세요.'};refresh();return;}
      }else previewRequests.push(record);
      result={...record,submitted:true};draft={vehicle:''};
      $('#registration-vehicle').value='';
      refresh();$('.registration-result')?.focus();return;
    }
  });
  root.CustomerVehicleRegistration={render,set,lookup,leave(){root.CustomerRegistrationScanner?.close();}};
})(typeof window==='undefined'?globalThis:window);
