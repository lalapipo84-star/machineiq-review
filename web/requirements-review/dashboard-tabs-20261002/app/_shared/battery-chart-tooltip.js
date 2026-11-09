(function(){
  'use strict';
  document.querySelectorAll('[data-chart="soc"] [data-svg], [data-chart="temp"] [data-svg]').forEach(function(chart){MIQCharts.bind(chart);});
  function gauges(){
    var soc=document.querySelector('.soc-big__cell'),soh=document.querySelector('.soh-cell'),schedule=document.querySelector('.smart-schedule__track');
    [[soc,'현재 배터리 충전량 (SOC) ',document.getElementById('socVal')],[soh,'배터리 성능 최대치 (SOH) ',document.getElementById('sohPct')],[schedule,'',document.querySelector('.smart-schedule__label strong')]].forEach(function(item){
      if(!item[0]||!item[2])return;
      var detail=item[1]+MIQCommon.view.get(item[2],"textContent");
      MIQCommon.view.call(item[0],"setAttribute",['data-chart-tip',detail]);MIQCommon.view.call(item[0],"setAttribute",['aria-label',detail]);MIQCommon.view.call(item[0],"setAttribute",['tabindex','0']);
      MIQCharts.bind(item[0]);
    });
  }
  gauges();
  ['.li-head','#smartSchedule'].forEach(function(selector){var host=document.querySelector(selector);if(host)new MutationObserver(gauges).observe(host,{childList:true,subtree:true,characterData:true});});
})();
