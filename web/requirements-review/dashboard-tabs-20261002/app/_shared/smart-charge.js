(function(){
  'use strict';
  var from=document.getElementById('smartFrom'),to=document.getElementById('smartTo'),sw=document.getElementById('smartSw'),save=document.getElementById('smartSave');
  if(!from||!to||!sw||!save)return;
  var host=document.getElementById('smartSchedule'),status=document.getElementById('smartFeedback');
  var feedbackTimer;
  function clearSaveFeedback(){
    clearTimeout(feedbackTimer);
    MIQCommon.view.set(status,"textContent",'');
    status.classList.remove('smart-feedback-popup');
  }
  function showSaveFeedback(message,duration){
    clearSaveFeedback();
    status.classList.add('smart-feedback-popup');
    MIQCommon.view.set(status,"textContent",message);
    feedbackTimer=setTimeout(clearSaveFeedback,duration);
  }
  var role=document.body.dataset.managementRole||'internal';
  var vin=new URLSearchParams(location.search).get('veh')||'default';
  var key='linq.smartCharge.v1:'+role+':'+vin;
  [from,to].forEach(function(sel,i){MIQCommon.view.set(sel,"innerHTML",Array.from({length:24},function(_,h){return '<option value="'+h+'">'+String(h).padStart(2,'0')+'시</option>';}).join(''));sel.value=i?'6':'22';});
  try{var stored=JSON.parse(localStorage.getItem(key));if(stored&&MIQMeeting.chargeWindow(stored.from,stored.to)){from.value=stored.from;to.value=stored.to;sw.classList.toggle('on',stored.on===true);}}catch(e){}
  function paint(){
    var available=!sw.disabled,on=available&&sw.classList.contains('on'),w=MIQMeeting.chargeWindow(from.value,to.value);
    from.disabled=to.disabled=!on;save.disabled=!available;MIQCommon.view.call(sw,"setAttribute",['aria-pressed',String(on)]);
    if(!available)MIQCommon.view.set(status,"textContent",'선택 차량의 스마트 충전 설정은 수집 전입니다.');
    var summary=!available?'충전 설정 수집 전':on?w.startLabel+' → '+w.endLabel+' · '+w.duration+'시간':'스마트 충전 꺼짐';
    var hours=Array.from({length:24},function(_,hour){
      var charging=on&&(hour-w.start+24)%24<w.duration;
      var label=String(hour).padStart(2,'0'),end=String(hour+1).padStart(2,'0');
      var detail=label+':00 ~ '+end+':00 · '+(!available?'수집 전':charging?'충전':'비충전');
      return '<div class="smart-schedule__hour'+(charging?' is-charging':'')+'" role="listitem" aria-label="'+detail+'" title="'+detail+'">'
        +'<span class="smart-schedule__cell" aria-hidden="true"></span><span class="smart-schedule__time" aria-hidden="true">'+label+'</span></div>';
    }).join('');
    MIQCommon.view.set(host,"innerHTML",'<div class="smart-schedule__label"><strong>'+summary+'</strong><span>차량 시간 · Asia/Seoul</span></div>'
      +'<div class="smart-schedule__hours" role="list" aria-label="00시부터 23시까지, 한 칸은 1시간. '+summary+'">'+hours+'</div>'
      +'<div class="smart-schedule__key"><span class="smart-schedule__legend"><span><i class="is-charging" aria-hidden="true"></i>충전</span><span><i aria-hidden="true"></i>'+(!available?'수집 전':'비충전')+'</span></span><span>00~23시 · 1칸 = 1시간</span></div>');
  }
  from.addEventListener('change',function(){clearSaveFeedback();MIQCommon.view.set(status,"textContent",'변경 후 저장해 주세요.');paint();});
  to.addEventListener('change',function(){clearSaveFeedback();MIQCommon.view.set(status,"textContent",'변경 후 저장해 주세요.');paint();});
  sw.addEventListener('click',function(){clearSaveFeedback();MIQCommon.view.set(status,"textContent",'변경 후 저장해 주세요.');paint();});
  save.addEventListener('click',function(){if(sw.disabled)return;try{localStorage.setItem(key,JSON.stringify({from:Number(from.value),to:Number(to.value),on:sw.classList.contains('on')}));showSaveFeedback('저장했습니다.',2000);}catch(e){showSaveFeedback('설정을 저장하지 못했습니다. 다시 시도해 주세요.',4000);}});
  document.addEventListener('keydown',function(event){if(event.key==='Escape'&&status.classList.contains('smart-feedback-popup'))clearSaveFeedback();});
  paint();
})();
