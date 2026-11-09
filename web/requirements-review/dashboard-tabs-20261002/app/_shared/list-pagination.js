(function(){'use strict';var MIQ=window.MIQ=window.MIQ||{};
 MIQ.createListPager=function(anchor,options){options=options||{};var size=options.pageSize||20,page=1,lastKey=null,operations=options.presentation==='operations';
  var host=document.createElement('div');host.className='miq-list-pagination'+(operations?' miq-list-pagination--operations':'');anchor.insertAdjacentElement('afterend',host);
  host.addEventListener('click',function(event){var button=event.target.closest('[data-list-page]');if(!button||button.disabled)return;page=Number(button.dataset.listPage);options.onChange();host.querySelector('[aria-current="page"]')?.focus({preventScroll:true});});
  return {slice:function(rows,context){var key=(context||'')+'|'+rows.map(function(r){return r.vin||r.id||r.vehicle?.vin||r.equipmentId||r.dataset?.vin||r.dataset?.owner||r.dataset?.company||r._serviceOrder||MIQCommon.view.get(r,"textContent")||''}).join('|');if(lastKey!==null&&key!==lastKey)page=1;lastKey=key;var pages=Math.max(1,Math.ceil(rows.length/size));page=Math.min(page,pages);host.hidden=!operations&&pages===1;
   function button(n,label,aria){return '<button type="button"'+(operations?' class="btn btn--sm'+(n===page?' btn--pri':'')+'" aria-label="'+aria+'"':'')+' data-list-page="'+n+'"'+(n===page?' aria-current="page"':'')+(n<1||n>pages?' disabled':'')+'>'+label+'</button>';}
   var links=button(page-1,operations?'‹':'이전','이전 페이지'),start=Math.max(1,Math.min(page-2,pages-4));for(var n=start;n<=Math.min(pages,start+4);n++)links+=button(n,n,n+'페이지');links+=button(page+1,operations?'›':'다음','다음 페이지');
   var range=rows.length?((page-1)*size+1)+'–'+Math.min(page*size,rows.length):'0';
   var summary=operations?range+' / '+rows.length+(options.unit||'건'):(rows.length?(page-1)*size+1:0)+'–'+Math.min(page*size,rows.length)+' / '+rows.length+' · '+size+'개씩';
   MIQCommon.view.set(host,"innerHTML",'<span>'+summary+'</span><nav aria-label="목록 페이지">'+links+'</nav>');return rows.slice((page-1)*size,page*size);},reset:function(){page=1}};
 };
})();
