(function(root){
  'use strict';
  var legacy = [{"kind": "error", "vin": "FBA32_224250271", "model": "B30S-7", "date": "2026-07-25", "dateTime": "2026-07-25 08:12", "errorState": "current", "category": "차량", "code": "P0003", "level": "a", "spn": "523", "fmi": "3", "description": "연료량 조절 밸브 회로 이상", "completedAt": "", "hasDocument": true}, {"kind": "error", "vin": "FBA32_032068", "model": "B30S-7", "date": "2026-07-20", "dateTime": "2026-07-20 13:40", "errorState": "past", "category": "차량", "code": "P0191", "level": "b", "spn": "157", "fmi": "2", "description": "연료 레일 압력 센서 범위 이상", "completedAt": "2026-07-21 13:40", "hasDocument": true}, {"kind": "error", "vin": "FBA32_224250271", "model": "B30S-7", "date": "2026-07-24", "dateTime": "2026-07-24 10:30", "errorState": "current", "category": "차량", "code": "A7", "level": "b", "spn": "-", "fmi": "-", "description": "주행 제어 시스템 경고", "completedAt": "", "hasDocument": false}, {"kind": "error", "vin": "FBA32_032042", "model": "B18S-7", "date": "2026-07-15", "dateTime": "2026-07-15 10:05", "errorState": "past", "category": "차량", "code": "51", "level": "c", "spn": "-", "fmi": "-", "description": "유압 온도 경고", "completedAt": "2026-07-16 10:05", "hasDocument": false}, {"kind": "error", "vin": "FBA32_032068", "model": "B30S-7", "date": "2026-07-12", "dateTime": "2026-07-12 09:15", "errorState": "past", "category": "차량", "code": "A", "level": "c", "spn": "-", "fmi": "-", "description": "시트 안전벨트 미착용", "completedAt": "2026-07-13 09:15", "hasDocument": false}, {"kind": "error", "vin": "FBA32_224250383", "model": "B30S-7", "date": "2026-07-26", "dateTime": "2026-07-26 09:30", "errorState": "current", "category": "배터리", "code": "16", "level": "a", "spn": "-", "fmi": "-", "description": "셀 밸런싱 이상", "completedAt": "", "hasDocument": false}];
  function esc(value){return String(value == null ? '' : value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cells(item){
    return [
      '<span class="state '+(item.errorState==='current'?'now':'past')+'">'+(item.errorState==='current'?'현재':'과거')+'</span>',
      '<span class="type'+(item.category==='배터리'?' battery':'')+'">'+esc(item.category||'차량')+'</span>',
      '<div class="errcode"><span class="errcode__main">'+esc(item.code)+' <span class="level '+esc(item.level)+'">'+esc((item.level||'').toUpperCase())+'</span></span><span class="errcode__sub">'+esc(item.spn||'—')+' / '+esc(item.fmi||'—')+'</span></div>',
      esc(item.description),
      '<div class="meta-stack"><strong>'+esc(item.dateTime||item.date)+'</strong><span>완료 '+esc(item.completedAt||'-')+'</span></div>',
      item.hasDocument===false?'-':'<button type="button" class="pdf" data-error-pdf aria-label="'+esc(item.vin+' '+item.code+' 에러 조치 정보 열기')+'">PDF</button>'
    ];
  }
  function documentHtml(d){
    return '<div class="service-dialog__summary"><strong>'+esc(d.info.vin+' · '+d.info.model)+'</strong><dl style="display:grid;grid-template-columns:120px 1fr;gap:8px 14px;margin-top:14px">'+
      [['구분',d.type],['현재/과거',d.state],['에러코드',d.code+' · '+(d.level&&d.level!=='-'?d.level+'등급':'-')],['SPN / FMI',d.sub],['설명',d.description],['발생 / 완료',d.date]].map(function(pair){return '<dt>'+pair[0]+'</dt><dd>'+esc(pair[1])+'</dd>';}).join('')+'</dl></div>';
  }
  function details(item){return {info:{vin:item.vin,model:item.model},state:item.errorState==='current'?'현재':'과거',type:item.category,code:item.code,level:(item.level||'').toUpperCase(),sub:(item.spn||'—')+' / '+(item.fmi||'—'),description:item.description,date:(item.dateTime||item.date)+' 완료 '+(item.completedAt||'-')};}
  function enrich(){
    if(!root.MIQServiceRecords)return;
    root.MIQServiceRecords.records.forEach(function(row){if(row.kind!=='error')return;var info=legacy.find(function(item){return item.vin===row.vin&&item.date===row.date;});if(info)Object.assign(row,info);});
  }
  root.MIQServiceErrors={legacy:legacy,cells:cells,documentHtml:documentHtml,details:details,enrich:enrich};
  enrich();
})(window);
