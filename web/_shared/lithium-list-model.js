(function(root){
  'use strict';
  var errors = {
    FBA32_DEMO_CS01: [
      { st: 'cur', code: 'BM-0x0104', msg: '충전 전류 이상', lv: '주의', days: 0, done: null, act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA32_224250271: [
      { st: 'cur',  code: 'BM-0x0210', msg: '셀 과열 (43℃)',      lv: '주의', days: 0,  done: null,                 act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0308', msg: '셀 전압 편차 초과',   lv: '주의', days: 3,  done: '2026-08-09 15:22',   act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' },
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 12, done: '2026-07-31 09:14',   act: '단말 전원 재인입 후 통신 상태 확인' },
      { st: 'past', code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 24, done: '2026-07-19 20:41',   act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA20_224250312: [
      { st: 'cur',  code: 'BM-0x0210', msg: '셀 과열 (46℃)',      lv: '경고', days: 0,  done: null,                 act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0501', msg: '절연 저항 저하',       lv: '심각', days: 16, done: '2026-07-29 11:20',   act: '절연 저항 측정 후 서비스 센터 점검 요청' }
    ],
    FBA25_224250188: [
      { st: 'past', code: 'BM-0x0210', msg: '셀 과열 (44℃)',      lv: '경고', days: 11, done: '2026-08-01 16:02',   act: '차량 정지 후 30분 냉각, 배터리 팩 통풍구 이물 점검' },
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 27, done: '2026-07-16 10:51',   act: '단말 전원 재인입 후 통신 상태 확인' }
    ],
    FBA16_224250045: [
      { st: 'cur',  code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 0,  done: null,                 act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' },
      { st: 'cur',  code: 'BM-0x0308', msg: '셀 전압 편차 초과',    lv: '주의', days: 4,  done: null,                 act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' },
      { st: 'past', code: 'BM-0x0104', msg: '충전 전류 이상',       lv: '주의', days: 19, done: '2026-07-25 08:30',   act: '충전기 커넥터 접점 및 충전 케이블 단선 점검' }
    ],
    FBA35_224250403: [
      { st: 'past', code: 'BM-0x0402', msg: 'BMS 통신 지연',       lv: '정보', days: 2,  done: '2026-08-10 10:51',   act: '단말 전원 재인입 후 통신 상태 확인' },
      { st: 'past', code: 'BM-0x0308', msg: '셀 전압 편차 초과',    lv: '주의', days: 21, done: '2026-07-22 17:36',   act: '밸런싱 모드로 완충 1회 실시 후 편차 재확인' }
    ]
  };
  function hasNumber(value){return value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value));}
  function seeded(key){var seed=0;for(var i=0;i<key.length;i++)seed=(seed*31+key.charCodeAt(i))>>>0;return function(){seed=(seed*1103515245+12345)&0x7fffffff;return seed/0x7fffffff;};}
  function snapshot(vehicle){
    var soc=hasNumber(vehicle.soc)?Number(vehicle.soc):null, known=!vehicle.catalogOnly&&soc!==null;
    var current=(errors[vehicle.vin]||[]).filter(function(error){return error.st==='cur';});
    function has(word){return current.some(function(error){return error.msg.indexOf(word)>=0;});}
    return {soc:soc,known:known,soh:known?88+Math.round(seeded(vehicle.vin+'stat')()*11):null,
      workMinutes:known?Math.round(soc/100*348):null,chargeMinutes:known?Math.round((100-soc)/100*120):null,
      temperature:known?(has('과열')?'경고':'정상'):'수집 전',charge:known?(has('충전')?'이상':'정상'):'수집 전',battery:known?(has('전압')?'주의':'정상'):'수집 전',abnormal:known&&current.length>0};
  }
  function allowed(rows,role,policy){
    return rows.filter(function(vehicle){return vehicle.type==='리튬'&&(!policy.companyIds||policy.companyIds.indexOf(String(vehicle.companyId||'1933'))>=0)&&(role!=='customer_staff'||vehicle.group==='물류1팀');});
  }
  function filter(rows,selection){return rows.filter(function(vehicle){
    return (!selection.companyId||selection.companyId==='all'||String(vehicle.companyId||'1933')===String(selection.companyId))
      &&(!selection.group||vehicle.group===selection.group)&&(!selection.veh||vehicle.vin===selection.veh)&&(!selection.abnormal||snapshot(vehicle).abnormal);
  });}
  var sortKeys=['vin','soc','soh','workMinutes','chargeMinutes','smartCharge'];
  function sort(rows,key,direction,readSmartCharge){
    if(sortKeys.indexOf(key)<0)return rows.slice();
    var factor=direction==='desc'?-1:1;
    function value(vehicle){
      if(key==='vin')return vehicle.vin||null;
      var info=snapshot(vehicle);
      if(key==='smartCharge'){
        if(!info.known)return null;
        var charge=readSmartCharge?readSmartCharge(vehicle,info.known):'켜짐';
        return charge==='켜짐'?1:charge==='꺼짐'?0:null;
      }
      return info[key];
    }
    return rows.map(function(vehicle,index){return {vehicle:vehicle,value:value(vehicle),index:index};}).sort(function(a,b){
      // Unavailable telemetry remains at the bottom in both directions; zero is a value.
      var aMissing=a.value===null||a.value===undefined,bMissing=b.value===null||b.value===undefined;
      if(aMissing!==bMissing)return aMissing?1:-1;
      if(aMissing)return a.index-b.index;
      var compared=typeof a.value==='number'?a.value-b.value:String(a.value).localeCompare(String(b.value),'ko',{numeric:true});
      return compared?compared*factor:a.index-b.index;
    }).map(function(item){return item.vehicle;});
  }
  root.MIQLithiumListModel={errors:errors,snapshot:snapshot,allowed:allowed,filter:filter,sortKeys:sortKeys,sort:sort};
  if(typeof module==='object'&&module.exports)module.exports=root.MIQLithiumListModel;
})(typeof window!=='undefined'?window:globalThis);
