(function(){
  'use strict';
  var role=document.body.dataset.managementRole,main=document.querySelector('main');
  if(!MIQFavorites.canUse(role)){MIQCommon.view.set(main,"textContent",'이 메뉴를 사용할 권한이 없습니다.');return;}
  var pool=MIQFavorites.allowedPool(role,MIQ.FLEET_CATALOG||[]),ui=MIQFavoriteCategories;
  var stored,draft,status=document.getElementById('favoriteStatus');
  function clone(value){return JSON.parse(JSON.stringify(value));}
  try{stored=MIQFavorites.readState(role,pool);draft=clone(stored);}catch(e){MIQCommon.view.set(status,"textContent",'저장된 목록을 읽지 못했습니다. 새로고침 후 다시 확인해 주세요.');main.querySelectorAll('input,select,button').forEach(function(el){el.disabled=true;});return;}
  var source=document.getElementById('favoriteSource'),target=document.getElementById('favoriteTarget');
  var selections={source:new Set(),target:new Set()};
  var pagers={source:MIQ.createListPager(source,{pageSize:20,onChange:render}),target:MIQ.createListPager(target,{pageSize:20,onChange:render})};
  [source,target].forEach(function(host,index){host.addEventListener('change',function(event){if(!event.target.matches('input[type="checkbox"]'))return;var set=selections[index?'target':'source'];if(event.target.checked)set.add(event.target.value);else set.delete(event.target.value);});});
  var leftSearch=document.getElementById('favoriteSearchSource'),rightSearch=document.getElementById('favoriteSearchTarget');
  var company=document.getElementById('favoriteCompany'),category=document.getElementById('favoriteCategory'),move=document.getElementById('favoriteMoveCategory');
  var requested=new URLSearchParams(location.search).get('favoriteCategory');
  MIQCommon.view.set(category,"innerHTML",ui.options(draft,false));category.value=draft.categories.some(function(item){return item.id===requested;})?requested:'default';
  document.getElementById('favoriteCategoryManage').href='favorite-categories-tobe.html?role='+role;
  var customer=MIQCommon.roles.isCustomer(role),scopeField=customer?'group':'companyName';
  var companies=pool.map(function(v){return v[scopeField];}).filter(function(v,i,a){return a.indexOf(v)===i;});
  MIQCommon.view.set(company,"innerHTML",'<option value="">'+(customer?'그룹 전체':'업체 전체')+'</option>'+companies.map(function(c){return '<option>'+ui.esc(c)+'</option>';}).join(''));
  if(customer){
    var sourceLabel=role==='customer_staff'?'내 그룹 차량':'내 업체 차량';
    MIQCommon.view.set(document.getElementById('favoriteSourceLabel'),"textContent",sourceLabel);
    MIQCommon.view.call(source.closest('section'),"setAttribute",['aria-label',sourceLabel]);
    MIQCommon.view.call(leftSearch,"setAttribute",['aria-label',sourceLabel+' 검색']);
    leftSearch.placeholder=rightSearch.placeholder='그룹 · 기종 · 차대번호';
    MIQCommon.view.call(company,"setAttribute",['aria-label','그룹']);company.hidden=role==='customer_staff';
  }
  function member(vin){return draft.members.find(function(item){return item.vin===vin;});}
  function filtered(side){var q=(side==='source'?leftSearch:rightSearch).value.trim().toLowerCase();return pool.filter(function(v){var found=member(v.vin);return (side==='target'?found&&found.categoryId===category.value:!found)&&(!q||(v[scopeField]+' '+v.model+' '+v.vin+' '+v.type).toLowerCase().indexOf(q)>=0)&&(side==='target'||!company.value||company.value===v[scopeField]);});}
  function changed(){return JSON.stringify(draft)!==JSON.stringify(stored);}
  function render(){
    var selected=category.value,moveTo=move.value;
    MIQCommon.view.set(category,"innerHTML",ui.options(draft,false));category.value=selected;
    MIQCommon.view.set(move,"innerHTML",'<option value="">이동할 구분 선택</option>'+draft.categories.filter(function(item){return item.id!==selected;}).map(function(item){return '<option value="'+ui.esc(item.id)+'">'+ui.esc(item.name)+'</option>';}).join(''));move.value=moveTo===selected?'':moveTo;
    ['source','target'].forEach(function(side){var rows=filtered(side),host=side==='source'?source:target;
      var allowed=new Set(rows.map(function(v){return v.vin;}));selections[side].forEach(function(vin){if(!allowed.has(vin))selections[side].delete(vin);});
      MIQCommon.view.set(host,"innerHTML",pagers[side].slice(rows).map(function(v){return '<label class="xfer__it"><input type="checkbox" value="'+ui.esc(v.vin)+'"'+(selections[side].has(v.vin)?' checked':'')+' aria-label="'+ui.esc(v.vin)+' 선택"/>'+MIQVehicleTransfer.icon(v.type)+MIQVehicleTransfer.identity(v.vin,v.model,v[scopeField]+' · '+v.type)+'</label>';}).join('')||'<p class="favorite-empty">'+(side==='target'?'이 구분에 담은 차량이 없습니다.':customer?'조건에 해당하는 차량이 없습니다.':'조건에 해당하는 고객 차량이 없습니다.')+'</p>');
      MIQCommon.view.set(document.getElementById(side==='source'?'favoriteSourceCount':'favoriteTargetCount'),"textContent",rows.length+'대');
    });
    var added=draft.members.filter(function(item){return !stored.members.some(function(old){return old.vin===item.vin;});}).length;
    var removed=stored.members.filter(function(old){return !member(old.vin);}).length;
    var moved=draft.members.filter(function(item){return stored.members.some(function(old){return old.vin===item.vin&&old.categoryId!==item.categoryId;});}).length;
    MIQCommon.view.set(document.getElementById('favoriteChanges'),"textContent",changed()?'추가 '+added+'대 · 해제 '+removed+'대 · 구분 이동 '+moved+'대':'변경 없음');
    document.getElementById('favoriteSave').disabled=document.getElementById('favoriteCancel').disabled=!changed();
    MIQCommon.view.set(document.getElementById('favoriteTotal'),"textContent",draft.members.length);
    MIQCommon.view.set(document.getElementById('favoriteCategoryLabel'),"textContent",ui.name(draft,selected));
  }
  document.getElementById('favoriteTransfer').addEventListener('click',function(e){
    var b=e.target.closest('[data-favorite-action]');if(!b)return;var action=b.dataset.favoriteAction,add=action.indexOf('add')===0,host=add?source:target;
    var ids=action.indexOf('all')>=0?filtered(add?'source':'target').map(function(v){return v.vin;}):Array.from(selections[add?'source':'target']);
    if(!ids.length){MIQCommon.view.set(status,"textContent",'차량을 먼저 선택해 주세요.');return;}
    if(add)ids.forEach(function(vin){if(!member(vin))draft.members.push({vin:vin,categoryId:category.value});});
    else draft.members=draft.members.filter(function(item){return ids.indexOf(item.vin)<0;});
    MIQCommon.view.set(status,"textContent",'변경 후 저장해 주세요.');render();
  });
  document.getElementById('favoriteMove').addEventListener('click',function(){
    var ids=Array.from(selections.target);
    if(!ids.length){MIQCommon.view.set(status,"textContent",'이동할 차량을 선택해 주세요.');return;}
    if(!move.value){MIQCommon.view.set(status,"textContent",'이동할 구분을 선택해 주세요.');move.focus();return;}
    var label=ui.name(draft,move.value);
    draft.members.forEach(function(item){if(ids.indexOf(item.vin)>=0)item.categoryId=move.value;});
    MIQCommon.view.set(status,"textContent",ids.length+'대를 “'+label+'” 구분으로 이동했습니다. 변경 후 저장해 주세요.');render();
  });
  [leftSearch,rightSearch].forEach(function(el){el.addEventListener('input',render);});company.addEventListener('change',render);
  category.addEventListener('change',function(){rightSearch.value='';var url=new URL(location.href);url.searchParams.set('favoriteCategory',category.value);history.replaceState(null,'',url);render();});
  document.getElementById('favoriteCancel').addEventListener('click',function(){draft=clone(stored);MIQCommon.view.set(status,"textContent",'변경을 취소했습니다.');render();});
  document.getElementById('favoriteSave').addEventListener('click',function(){try{
    // Do not overwrite changes saved from another open tab.
    if(JSON.stringify(MIQFavorites.readState(role,pool))!==JSON.stringify(stored)){MIQCommon.view.set(status,"textContent",'다른 화면에서 목록이 변경되었습니다. 새로고침 후 다시 확인해 주세요.');return;}
    stored=MIQFavorites.saveState(role,draft,pool);draft=clone(stored);MIQCommon.view.set(status,"textContent",'관심차량 '+stored.members.length+'대와 구분을 저장했습니다.');render();
  }catch(e){MIQCommon.view.set(status,"textContent",'저장하지 못했습니다. 다시 시도해 주세요.');}});
  window.addEventListener('beforeunload',function(e){if(!changed())return;e.preventDefault();e.returnValue='';});
  render();
})();
