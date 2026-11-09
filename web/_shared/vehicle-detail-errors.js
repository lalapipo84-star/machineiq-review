(function(){
  'use strict';
  var section=document.getElementById('vehicleErrors');
  if(!section)return;
  var body=section.querySelector('tbody'),count=section.querySelector('[data-error-count]'),current=[],sortKey='dateTime',direction=-1;
  var columns=['errorState','category','code','description','dateTime'];
  var dialog=document.getElementById('vehicleErrorDocument');
  function paint(){
    var rows=current.slice().sort(function(a,b){return String(a[sortKey]||'').localeCompare(String(b[sortKey]||''),'ko',{numeric:true})*direction;});
    MIQCommon.view.set(count,"textContent",rows.length);
    MIQCommon.view.set(body,"innerHTML",rows.length?rows.map(function(row){return '<tr data-error-index="'+current.indexOf(row)+'">'+MIQServiceErrors.cells(row).map(function(html,i){return '<td'+(i===3?' class="left"':'')+'>'+html+'</td>';}).join('')+'</tr>';}).join(''):'<tr><td colspan="6" class="vehicle-errors-empty">조회 기간에 해당하는 차량 에러가 없습니다.</td></tr>');
    section.querySelectorAll('th[data-error-sort]').forEach(function(th){var selected=th.dataset.errorSort===sortKey;MIQCommon.view.call(th,"setAttribute",['aria-sort',selected?(direction===1?'ascending':'descending'):'none']);MIQCommon.view.set(th.querySelector('.sort'),"textContent",selected?(direction===1?'↑':'↓'):'↕');});
  }
  window.MIQVehicleErrors={render:function(vehicle,range){
    MIQServiceErrors.enrich();
    current=MIQServiceRecords.records.filter(function(row){return row.kind==='error'&&row.vin===vehicle.vin&&(!range.from||row.date>=range.from)&&(!range.to||row.date<=range.to);});
    paint();
  }};
  section.addEventListener('click',function(event){
    var sort=event.target.closest('[data-error-sort-button]');
    if(sort){var key=sort.closest('th').dataset.errorSort;if(columns.indexOf(key)<0)return;direction=sortKey===key?-direction:1;sortKey=key;paint();return;}
    var pdf=event.target.closest('[data-error-pdf]');if(!pdf)return;
    var row=current[Number(pdf.closest('tr').dataset.errorIndex)];if(!row)return;
    MIQCommon.view.set(dialog.querySelector('.service-dialog__body'),"innerHTML",MIQServiceErrors.documentHtml(MIQServiceErrors.details(row)));
    dialog.showModal();
  });
  dialog.querySelectorAll('[data-error-close]').forEach(function(button){button.addEventListener('click',function(){dialog.close();});});
  dialog.querySelector('[data-error-print]').addEventListener('click',function(){document.body.classList.add('is-printing-vehicle-error');window.print();document.body.classList.remove('is-printing-vehicle-error');});
})();
