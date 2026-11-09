/* Pure prototype contracts. Values passed in by the caller; no server claims. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./vehicle-observations.js'));else root.MIQMeeting=factory(root.MIQObservations);})(typeof window==='undefined'?this:window,function(observations){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function hourlyWindow(now,zone){
    zone=zone||'Asia/Seoul';
    var parts=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(now||new Date());
    var p={};parts.forEach(function(x){p[x.type]=x.value;});
    var hour=Number(p.hour),date=p.year+'-'+p.month+'-'+p.day;
    return {date:date,from:'00:00',to:pad(hour)+':00',hours:hour,timeZone:zone,slots:Array.from({length:hour},function(_,i){return {from:pad(i)+':00',to:pad(i+1)+':00'};})};
  }
  function chargeWindow(start,end){
    if(start===null||end===null||typeof start==='boolean'||typeof end==='boolean'||String(start).trim()===''||String(end).trim()==='')return null;
    start=Number(start);end=Number(end);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||start>23||end<0||end>23)return null;
    var overnight=start>=end, duration=(end-start+24)%24||24;
    // The 24-hour scale begins at the configured start, so every overnight
    // interval is continuous, including 23 -> 22 and a full 24 hours.
    return {start:start,end:end,duration:duration,overnight:overnight,startLabel:(overnight?'전일 ':'금일 ')+pad(start)+':00',endLabel:'금일 '+pad(end)+':00',midnight:overnight?(24-start)/24*100:null,fill:duration/24*100};
  }
  function watchHourly(callback,options){
    options=options||{};
    var now=options.now||function(){return new Date();},last='',stopped=false;
    function refresh(){
      if(stopped)return;
      var w=hourlyWindow(now(),options.timeZone),key=w.date+' '+w.to;
      if(key!==last){last=key;callback(w);}
    }
    var timer=(options.schedule||setInterval)(refresh,30000);
    refresh();
    return {refresh:refresh,stop:function(){stopped=true;(options.cancel||clearInterval)(timer);}};
  }
  function calendarDays(from,to){
    function parse(value){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return null;
      var d=new Date(value+'T00:00:00Z');
      return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===value?d:null;
    }
    var start=parse(from),end=parse(to),rows=[];
    if(!start||!end||start>end)return rows;
    for(var d=start;d<=end;d=new Date(d.getTime()+86400000)){
      var date=d.toISOString().slice(0,10);
      rows.push({date:date,x:(d.getUTCMonth()+1)+'/'+d.getUTCDate()});
    }
    return rows;
  }
  // Independent prototype kWh values, never converted from SOC.
  // Production displays the server's daily chargeKwh/consumeKwh response.
  function dailyEnergy(vin,from,to){
    return calendarDays(from,to).map(function(day){
      var key=vin+':energy-kwh-v2:'+day.date,seed=0;
      for(var j=0;j<key.length;j++)seed=(seed*31+key.charCodeAt(j))>>>0;
      function next(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
      return {date:day.date,x:day.x,chargeKwh:Math.round((18+next()*22)*10)/10,consumeKwh:Math.round((12+next()*24)*10)/10};
    });
  }
  function temperatureHours(vin,date){
    var key=vin+':temperature:'+date,seed=0,rows=[];
    for(var j=0;j<key.length;j++)seed=(seed*31+key.charCodeAt(j))>>>0;
    function next(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;}
    var base=30+Math.round(next()*4);
    for(var h=0;h<24;h++){
      var peak=Math.exp(-Math.pow(h-17,2)/12)*(8+next()*3);
      rows.push({date:date,x:pad(h)+'시',v:Math.round(base+peak+next()*1.2)});
    }
    return rows;
  }
  function dailyTemperature(vin,from,to){
    // Derive prototype extrema from hourly temperature for the validated calendar range.
    return calendarDays(from,to).map(function(day){
      var values=temperatureHours(vin,day.date).map(function(hour){return hour.v;});
      return {date:day.date,x:day.x,minC:Math.min.apply(null,values),maxC:Math.max.apply(null,values)};
    });
  }
  function reportScope(role,companies,groups,assignedGroup){
    var staff=role==='customer_staff',customer=staff||role==='customer_owner';
    var items=customer?(staff?[assignedGroup||'내 그룹']:groups.filter(function(g){return g&&g!=='미배정';})):companies;
    items=items.filter(function(n,i,a){return a.indexOf(n)===i;});
    if(!items.length&&customer)items=['전체'];
    return {label:customer?'그룹':'업체',items:items,readOnly:staff,single:items.length<=1,customer:customer};
  }
  function favoriteIds(value,allowed){
    return Array.isArray(value)?value.filter(function(id,i,a){return typeof id==='string'&&allowed.indexOf(id)>=0&&a.indexOf(id)===i;}):[];
  }
  function hourlyVehicle(v,window){
    var known=v.conn===true||v.conn===false,connected=v.conn===true;
    function random(key){var s=0;for(var i=0;i<key.length;i++)s=(s*31+key.charCodeAt(i))>>>0;return (s%1000)/1000;}
    var raw=observations.aggregate(v,window.date,window.date,window);
    var last=window.hours?observations.sample(v,window.date,window.hours-1,window):null;
    var running=connected&&!!last&&last.workMinutes+last.idleMinutes>0;
    var fault=connected&&random(v.vin+'fault')>.86?1:0;
    // Explicit demonstration vehicles share their current fault count with summary/dashboard.
    var activeError=v.summaryDetail&&v.summaryDetail.activeErrorCount;
    if(v.demo===true&&typeof activeError==='number'&&Number.isFinite(activeError)&&activeError>=0)fault=activeError;
    return {known:known,connected:connected,running:running,idle:connected&&!running,fault:fault,runH:known&&raw.known?raw.runningMinutes/60:null,workingMinutes:known?raw.workMinutes:null,idleMinutes:known?raw.idleMinutes:null,
      km:known?raw.distanceKm:null,fuel:known?raw.fuelLitres:null,battery:known?raw.batteryKwh:null,
      dataTime:connected?window.date+' '+window.to:null,
      status:!known?'unknown':!connected?'off':fault?'bad':'ok'};
  }
  return {hourlyWindow:hourlyWindow,watchHourly:watchHourly,dailyEnergy:dailyEnergy,temperatureHours:temperatureHours,dailyTemperature:dailyTemperature,chargeWindow:chargeWindow,reportScope:reportScope,favoriteIds:favoriteIds,hourlyVehicle:hourlyVehicle};
});
