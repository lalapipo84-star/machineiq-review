/* Current-day card adapter. Reuses the hourly/summary fixtures; no period or clock globals. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.MIQDashboardCurrent=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  function valid(n){return typeof n==='number'&&Number.isFinite(n)&&n>=0;}
  function efficiency(fleet,window,meeting,summary){
    var work=0,idle=0,known=0;
    (fleet||[]).forEach(function(vehicle){
      var sample=meeting.hourlyVehicle(vehicle,window);
      if(!sample.known||!valid(sample.runH))return;
      var time={working:sample.workingMinutes,idle:sample.idleMinutes};
      if(!valid(time.working)||!valid(time.idle))return;
      known++;work+=time.working;idle+=time.idle;
    });
    return {known:known,work:known?work/60:null,idle:known?idle/60:null,
      total:known?(work+idle)/60:null,efficiency:work+idle>0?work/(work+idle)*100:null};
  }
  function faults(records,window,matches,complete){
    var start=window.date+' 00:00:00',end=window.date+' '+window.to+':00';
    var count=(records||[]).filter(function(record){
      if(record.kind!=='error'||matches&&!matches(record))return false;
      var stamp=String(record.dateTime||'').replace('T',' ').slice(0,19);
      if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(stamp))stamp+=':00';
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(stamp)&&stamp>=start&&stamp<end;
    }).length;
    // An empty event list cannot establish zero unless the caller explicitly
    // supplies a complete set (such as the authored current-day samples).
    return count>0||complete===true?count:null;
  }
  return {efficiency:efficiency,faults:faults};
});
