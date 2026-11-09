/* Shared table geometry. Count displayed columns, including grouped headers. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQTableLayout = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var containers = new WeakMap();
  function displayed(node) {
    if (node.hidden) return false;
    var view = node.ownerDocument && node.ownerDocument.defaultView;
    return !view || view.getComputedStyle(node).display !== 'none';
  }
  function columnCount(table) {
    var rows = table && table.tHead && table.tHead.rows;
    if (!rows) return 1;
    var spans = [], count = 0;
    Array.prototype.forEach.call(rows, function (row, rowIndex) {
      if (!displayed(row)) return;
      var column = 0;
      Array.prototype.forEach.call(row.cells, function (cell) {
        if (!displayed(cell)) return;
        while (spans[column] > 0) column++;
        var width = cell.colSpan || 1;
        var height = cell.rowSpan === 0 ? rows.length - rowIndex : cell.rowSpan || 1;
        for (var offset = 0; offset < width; offset++) spans[column + offset] = height;
        column += width;
      });
      count = Math.max(count, column, spans.length);
      spans = spans.map(function (span) { return Math.max(0, span - 1); });
    });
    return Math.max(1, count);
  }
  function minimum(label) {
    label = String(label || '').replace(/[↕↑↓▲▼]/g, '').trim();
    if (/이메일|대표자\s*ID|등록자\s*ID|사용자\s*ID/i.test(label)) return 250;
    if (/차대번호|차량\s*ID|호기/.test(label)) return 190;
    if (/단말/.test(label)) return 130;
    if (/일시|수집일|확인일|게시 시작|게시 종료|Data Time|위치 기준 시간/i.test(label)) return 174;
    if (/등록일|수정일|적용일/.test(label)) return 144;
    if (/연락처|전화/.test(label)) return 160;
    if (/업체|고객명|딜러/.test(label)) return 210;
    if (/주소|경로/.test(label)) return 300;
    if (/설명|제목|English|한국어|日本語/.test(label)) return 230;
    if (/충격 레벨/.test(label)) return 250;
    if (/사유/.test(label)) return 300;
    if (/Timezone/i.test(label)) return 160;
    if (/그룹|구역명|위치/.test(label)) return 140;
    if (/사용자명|이름|담당자|처리자|등록자/.test(label)) return 120;
    if (/모델|기종|차종|장비코드/.test(label)) return 110;
    if (/권한|역할|부서/.test(label)) return 135;
    if (/관리|조치|상세/.test(label)) return 124;
    if (/IP/.test(label)) return 154;
    return 100;
  }
  // Column geometry belongs to the schema, never to the current rows. Each
  // flexible column receives equal spare space; compact controls keep their width.
  // Only the container is measured. Row content never participates in sizing.
  // Mixed percent/pixel calc widths are not honored by Chromium's fixed tables.
  function fit(table, definitions, options) {
    var withinContainer=!!(options&&options.withinContainer);
    if (!table || !table.tHead || !table.tHead.rows.length) return;
    var headers = Array.prototype.slice.call(table.tHead.rows[0].cells);
    var columns = headers.map(function (header, index) {
      var definition = definitions && definitions[index] || {};
      if (typeof definition === 'number') definition = { min: definition };
      var label = MIQCommon.view.get(header,"textContent").replace(/[↕↑↓▲▼]/g, '').trim();
      var labelWidth = Array.from(label).reduce(function (sum, ch) { return sum + (/[^\x00-\x7f]/.test(ch) ? 13 : 7); }, 32);
      return {header:header,visible:displayed(header),compact:!!definition.compact,min:Math.max(definition.min || minimum(label), labelWidth)};
    }).filter(function (column) { return column.visible; });
    if (!columns.length) return;
    var total = columns.reduce(function (sum, column) { return sum + column.min; }, 0);
    var flexible = columns.filter(function (column) { return !column.compact; }).length;
    if (!flexible) { columns.forEach(function (column) { column.compact=false; }); flexible=columns.length; }
    var view=table.ownerDocument.defaultView;
    var configuredMinimum=withinContainer?0:parseFloat(view.getComputedStyle(table).minWidth)||0;
    table.style.setProperty('table-layout','fixed');
    table.style.setProperty('width','100%','important');
    table.style.setProperty('min-width',(withinContainer?0:Math.max(total,configuredMinimum))+'px','important');
    function applyWidths() {
      if (!table.isConnected) return;
      var containerStyle=view.getComputedStyle(table.parentElement);
      var available=table.parentElement.clientWidth-(parseFloat(containerStyle.paddingLeft)||0)-(parseFloat(containerStyle.paddingRight)||0);
      var extra=Math.max(0,Math.max(available,configuredMinimum)-total)/flexible;
      var fixed=columns.reduce(function(sum,column){return sum+(column.compact?column.min:0);},0);
      var ratio=withinContainer&&available<total?Math.max(0,available-fixed)/(total-fixed):1;
      columns.forEach(function (column) {
        var width=(column.compact?column.min:column.min*ratio+extra)+'px';
        if(column.header.style.getPropertyValue('width')!==width)column.header.style.setProperty('width',width,'important');
      });
    }
    applyWidths();
    var container=table.parentElement,record=containers.get(container);
    if(!record){
      record={apply:applyWidths};
      record.observer=new view.ResizeObserver(function(){record.apply();});
      record.observer.observe(container);
      containers.set(container,record);
    }else record.apply=applyWidths;
  }
  return { columnCount: columnCount, fit: fit, minimum: minimum };
}));
