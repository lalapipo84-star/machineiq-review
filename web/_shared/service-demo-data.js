/* Arbitrary demonstration records for the prototype only.
   These are not actual repairs, ECU/BMS codes, or collected vehicle telemetry.
   The caller supplies an ISO date/window; no clock, random values, or catalog mutations are used. */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MIQServiceDemo=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  function text(value){return typeof value==='string'?value.trim():typeof value==='number'&&Number.isFinite(value)?String(value):'';}
  function validDay(value){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
    var date=new Date(value+'T00:00:00Z');
    return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
  }
  function hash(value){var result=0;for(var index=0;index<value.length;index++)result=(result*31+value.charCodeAt(index))>>>0;return result;}
  function stamp(day,hour,minute){return day+' '+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0');}
  var examples={
    '엔진':{category:'차량',prefix:'ENG',items:[
      ['엔진 냉각 계통','냉각수 온도 신호 점검','엔진 냉각수 온도 센서 및 커넥터 확인'],
      ['엔진 윤활 계통','오일 압력 신호 점검','엔진 오일 압력 센서 및 연결부 확인'],
      ['엔진 흡기 계통','흡기 필터 점검 알림','흡기 필터 상태 확인 및 점검 기록']
    ]},
    '리튬':{category:'배터리',prefix:'LI',items:[
      ['리튬 배터리 팩','셀 온도 신호 점검','리튬 배터리 온도 센서 및 커넥터 확인'],
      ['리튬 배터리 충전 계통','충전 연결 상태 점검','리튬 배터리 충전 커넥터 상태 확인'],
      ['리튬 배터리 통신 계통','BMS 통신 점검 알림','리튬 배터리 BMS 연결 상태 확인']
    ]},
    '납산':{category:'배터리',prefix:'PB',items:[
      ['납산 배터리 단자','단자 연결 상태 점검','납산 배터리 단자 및 연결 케이블 상태 확인'],
      ['납산 배터리 충전 계통','충전 연결 상태 점검','납산 배터리 충전 커넥터 상태 확인'],
      ['납산 배터리 전압 계통','전압 신호 점검','납산 배터리 전압 측정 연결부 확인']
    ]},
    vehicle:{category:'차량',prefix:'VEH',items:[
      ['차량 제어 계통','제어 신호 점검','차량 제어기 연결 상태 확인'],
      ['차량 조작 계통','조작 신호 점검','차량 조작 레버 및 신호 연결부 확인'],
      ['차량 통신 계통','단말 통신 점검','차량 단말 및 통신 연결 상태 확인']
    ]}
  };
  function create(fleet,referenceDay){
    var result={maintenance:[],error:[]};
    if(!Array.isArray(fleet)||!validDay(referenceDay))return result;
    var seen=new Set();
    fleet.forEach(function(vehicle){
      if(!vehicle||typeof vehicle!=='object'||typeof vehicle.vin!=='string')return;
      var vin=vehicle.vin.trim();
      if(!/^[a-z0-9][a-z0-9_-]*$/i.test(vin))return;
      var key=vin.replace(/[-_]/g,'').toUpperCase();
      if(seen.has(key))return;
      seen.add(key);
      var seed=hash(key),type=text(vehicle.type),template=Object.prototype.hasOwnProperty.call(examples,type)?examples[type]:examples.vehicle;
      var variant=seed%template.items.length,item=template.items[variant];
      var metadata={companyId:text(vehicle.companyId),company:text(vehicle.companyName),group:text(vehicle.group),model:text(vehicle.model),vin:vin,type:type,date:referenceDay,demo:true};
      var minute=Math.floor(seed/7)%6*10,errorHour=7+seed%8;
      result.maintenance.push(Object.assign({},metadata,{kind:'maintenance',dateTime:stamp(referenceDay,9+seed%7,minute),
        part:item[0],symptom:item[1],detail:item[2],completed:seed%2===0}));
      var error=Object.assign({},metadata,{kind:'error',dateTime:stamp(referenceDay,errorHour,minute),errorState:seed%2===0?'current':'past',
        category:template.category,code:'DEMO-'+template.prefix+'-'+String(variant+1).padStart(2,'0'),level:['a','b','c'][seed%3],spn:'—',fmi:'—',
        description:item[2]});
      if(error.errorState==='past')error.completedAt=stamp(referenceDay,errorHour+2,minute);
      result.error.push(error);
    });
    return result;
  }
  // Explicit current-day review samples. Existing create() callers retain
  // their historical data. Dashboard links pass this same frozen cutoff.
  function createCurrent(fleet,window){
    if(!window||!validDay(window.date)||!/^([01]\d|2[0-3]):00$/.test(window.to||''))return [];
    var end=window.date+' '+window.to,rows=[];
    create(fleet,window.date).error.forEach(function(item){
      var seed=hash(item.vin.replace(/[-_]/g,'').toUpperCase());
      if(seed%4===0)return;
      [0].concat(seed%3===0?[30]:[]).forEach(function(offset,index){
        var parts=item.dateTime.slice(11).split(':'),minute=Number(parts[0])*60+Number(parts[1])+offset;
        var dateTime=stamp(window.date,Math.floor(minute/60),minute%60);
        if(dateTime>=end)return;
        var row=Object.assign({},item,{dateTime:dateTime,currentSample:true,sampleId:window.date+':'+item.vin+':'+index});
        if(row.completedAt&&row.completedAt>=end){row.errorState='current';delete row.completedAt;}
        rows.push(row);
      });
    });
    return rows;
  }
  return {create:create,createCurrent:createCurrent};
});
