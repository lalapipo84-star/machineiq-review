/* Pure IMQ GPS route contract. Source: EquipmentRoute.vue / FindGpsTrackReq/Res / GpsTrackItem.
 * UI dates are YYYY-MM-DD; request dates are YYYYMMDD (DateInput.vue:285, GpsMapper.xml:35).
 * GET /common/gps/find-gps-track -> {code:'00', result:[{equipmentNumber,gpsTrackItems}]}.
 * GpsMapper converts GPS timestamps into the signed-in user's timezone before responding.
 * Unzoned timestamps therefore remain wall-clock values; never parse them in browser local time.
 * Explicit-offset timestamps are compared in options.timeZone (prototype default Asia/Seoul).
 * This module never generates points, performs requests, or writes storage.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.MIQMapRouteModel=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var DEFAULT_TIME_ZONE='Asia/Seoul';
  function dateParts(value,label){
    if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new RangeError((label||'날짜')+'는 YYYY-MM-DD 형식이어야 합니다.');
    var p=value.split('-').map(Number),y=p[0],m=p[1],d=p[2];
    var leap=y%4===0&&(y%100!==0||y%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(y<1||m<1||m>12||d<1||d>days[m-1])throw new RangeError((label||'날짜')+'가 유효하지 않습니다.');
    return p;
  }
  function buildQuery(input){
    if(!input||typeof input!=='object')throw new TypeError('차량과 조회 기간이 필요합니다.');
    if(typeof input.vin!=='string'||!input.vin.trim())throw new TypeError('정확한 차량 번호가 필요합니다.');
    dateParts(input.from,'시작일');dateParts(input.to,'종료일');
    if(input.from>input.to)throw new RangeError('시작일은 종료일보다 늦을 수 없습니다.');
    return {searchKeyword:input.vin.trim(),startDate:input.from.replace(/-/g,''),endDate:input.to.replace(/-/g,''),minInterval:input.from===input.to?60:1440};
  }
  function payload(response){
    var current=response;
    for(var depth=0;depth<8;depth++){
      if(current==null)return [];
      if(Array.isArray(current))return current;
      if(typeof current!=='object')throw new TypeError('경로 응답은 배열 또는 원본 응답 객체여야 합니다.');
      if(Object.prototype.hasOwnProperty.call(current,'code')&&String(current.code)!=='00')throw new Error('경로 조회 실패 응답: '+String(current.code));
      if(Object.prototype.hasOwnProperty.call(current,'result')){current=current.result;continue;}
      if(Object.prototype.hasOwnProperty.call(current,'data')){current=current.data;continue;}
      if(Object.prototype.hasOwnProperty.call(current,'body')){current=current.body;continue;}
      return [];
    }
    throw new TypeError('경로 응답의 감싸기 구조가 너무 깊거나 순환합니다.');
  }
  function numeric(value){
    if(typeof value==='number')return Number.isFinite(value)?value:null;
    if(typeof value==='string'&&value.trim()&&/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())){
      var n=Number(value);return Number.isFinite(n)?n:null;
    }
    return null;
  }
  function utcMillis(y,m,d,h,min,sec,ms){
    var result=new Date(0);result.setUTCFullYear(y,m-1,d);result.setUTCHours(h,min,sec,ms);return result.getTime();
  }
  function stamp(value,formatter){
    if(typeof value!=='string')return null;
    var raw=value.trim(),match=/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})?$/.exec(raw);
    if(!match)return null;
    var date;try{date=dateParts(match[1]);}catch(error){return null;}
    var h=Number(match[2]),min=Number(match[3]),sec=Number(match[4]),ms=Number((match[5]||'').padEnd(3,'0').slice(0,3));
    if(h>23||min>59||sec>59)return null;
    var local=utcMillis(date[0],date[1],date[2],h,min,sec,ms),day=match[1];
    if(match[6]){
      var zone=match[6],offset=0;
      if(zone!=='Z'){
        var oh=Number(zone.slice(1,3)),om=Number(zone.slice(4,6));
        if(oh>14||om>59||(oh===14&&om!==0))return null;
        offset=(zone[0]==='-'?-1:1)*(oh*60+om)*60000;
      }
      var epoch=local-offset,parts={};
      formatter.formatToParts(new Date(epoch)).forEach(function(part){if(part.type!=='literal')parts[part.type]=part.value;});
      day=parts.year+'-'+parts.month+'-'+parts.day;
      local=utcMillis(Number(parts.year),Number(parts.month),Number(parts.day),Number(parts.hour),Number(parts.minute),Number(parts.second),ms);
    }
    return {raw:raw,date:day,order:local};
  }
  function normalizeResponse(response,vin,from,to,options){
    var query=buildQuery({vin:vin,from:from,to:to});
    var timeZone=options&&options.timeZone||DEFAULT_TIME_ZONE;
    // An invalid timezone is a caller configuration error, not an empty route.
    var formatter=new Intl.DateTimeFormat('en-CA',{timeZone:timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
    var points=[],sequence=0;
    payload(response).forEach(function(vehicle){
      if(!vehicle||typeof vehicle.equipmentNumber!=='string'||vehicle.equipmentNumber.trim()!==query.searchKeyword||!Array.isArray(vehicle.gpsTrackItems))return;
      vehicle.gpsTrackItems.forEach(function(item){
        if(!item||typeof item!=='object')return;
        var lat=numeric(item.latitude),lng=numeric(item.longitude);
        if(lat===null||lng===null||lat===0||lng===0||lat<-90||lat>90||lng<-180||lng>180)return;
        var time=stamp(item.gpsDatetime,formatter);
        if(!time||time.date<from||time.date>to)return;
        var speed=numeric(item.speed),shock=numeric(item.shock);
        points.push({order:time.order,sequence:sequence++,point:{lat:lat,lng:lng,gpsDatetime:time.raw,speed:speed!==null&&speed>=0?speed:null,shock:shock!==null&&shock>=0?shock:null}});
      });
    });
    points.sort(function(a,b){return a.order-b.order||a.sequence-b.sequence;});
    return points.map(function(item){return item.point;});
  }
  return {buildQuery:buildQuery,normalizeResponse:normalizeResponse,DEFAULT_TIME_ZONE:DEFAULT_TIME_ZONE};
});
