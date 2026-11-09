/* Management column contracts remain stable across sorting, paging and filters. */
(function () {
  'use strict';
  if (document.body.dataset.gnb !== 'mgmt') return;
  var scope = document.body, pending = false, observer;
  var options = { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:['class','hidden','style'] };

  function balance(table) {
    if (!table.offsetWidth || !table.tHead) return;
    var vehicleList = table.tBodies[0] && table.tBodies[0].id === 'vehBody';
    var wideVehicleList = vehicleList && Array.prototype.filter.call(table.tHead.rows[0].cells,function(header){return getComputedStyle(header).display !== 'none';}).length > 9;
    table.toggleAttribute('data-wide-vehicle-list', wideVehicleList);
    var scrollLeft = table.parentElement.scrollLeft;
    // Apply one alignment contract to every management list, including rows
    // recreated by approval, search and role changes. Keep controls centered.
    Array.prototype.forEach.call(table.tHead.rows[0].cells, function (header) {
      var compact = header.hasAttribute('data-mgmt-compact');
      Array.prototype.forEach.call(table.tBodies, function (body) {
        Array.prototype.forEach.call(body.rows, function (row) {
          var cell = row.cells[header.cellIndex];
          if (cell && cell.colSpan === 1) cell.toggleAttribute('data-mgmt-compact', compact);
        });
      });
    });
    MIQTableLayout.fit(table,Array.prototype.map.call(table.tHead.rows[0].cells,function(header){
      var label=MIQCommon.view.get(header,"textContent").trim(),compact=header.hasAttribute('data-mgmt-compact');
      if(vehicleList){
        if (wideVehicleList) {
          var widths={'딜러':130,'고객사명':130,'그룹':100,'닉네임':104,'기종':80,'분류':100,'연식':60,'차대번호':174,'단말기ID':112,'사용자명':100,'충격 레벨':116,'관리':110};
          return {min:widths[label] || 130,compact:/^(기종|연식|차대번호|단말기ID|관리)$/.test(label)};
        }
        if (document.documentElement.lang !== 'ko') {
          if(label==='닉네임')return {min:104,compact:true};
          if(label==='분류')return {min:100,compact:true};
          if(label==='기종')return {min:100,compact:true};
          if(label==='연식')return {min:72,compact:true};
          if(label==='단말기ID')return {min:122,compact:true};
        }
        if(label==='차대번호')return {min:190,compact:true};
        if(label==='충격 레벨')return {min:116,compact:true};
        if(label==='관리')return {min:80,compact:true};
      }
      if(header.querySelector('input[type="checkbox"]'))return {min:48,compact:true};
      if(compact)return {min:table.id==='userTable'?160:table.classList.contains('mm-request-table')?80:132,compact:true};
      if(table.id==='userTable'&&label==='그룹명')return {min:140,compact:true};
      return {compact:false};
    }),{withinContainer:!wideVehicleList});
    table.parentElement.scrollLeft = scrollLeft;
  }

  function schedule() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      // Do not schedule another pass for our own column styles.
      observer.disconnect();
      try { scope.querySelectorAll('.miq-management-table').forEach(balance); }
      finally { observer.observe(scope, options); }
    });
  }

  scope.querySelectorAll('.miq-management-table').forEach(balance);
  observer = new MutationObserver(schedule);
  observer.observe(scope, options);
}());
