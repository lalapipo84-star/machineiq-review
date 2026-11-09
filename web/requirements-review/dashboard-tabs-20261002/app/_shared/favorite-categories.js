(function(root){
  'use strict';
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function count(state,id){return state.members.filter(function(item){return item.categoryId===id;}).length;}
  function options(state,all){return (all?'<option value="">전체 구분 · '+state.members.length+'대</option>':'')+state.categories.map(function(category){return '<option value="'+esc(category.id)+'">'+esc(category.name)+' · '+count(state,category.id)+'대</option>';}).join('');}
  function name(state,id){var category=state.categories.find(function(item){return item.id===id;})||state.categories.find(function(item){return item.id==='default';});return category?category.name:'기본';}
  root.MIQFavoriteCategories={esc:esc,count:count,options:options,name:name};
  var role=document.body.dataset.managementRole;
  if(!MIQFavorites.canUse(role)){
    if(document.body.dataset.sub==='categories')MIQCommon.view.set(document.querySelector('main'),"textContent",'이 메뉴를 사용할 권한이 없습니다.');
    return;
  }
  var pool=MIQFavorites.allowedPool(role,MIQ.FLEET_CATALOG||[]);
  var summarySelect=document.getElementById('favoriteCategoryFilter');
  if(summarySelect){
    try{
      var summary=MIQFavorites.readState(role,pool);
      MIQCommon.view.set(summarySelect,"innerHTML",options(summary,true));
      var requested=new URLSearchParams(location.search).get('favoriteCategory')||'';
      summarySelect.value=summary.categories.some(function(item){return item.id===requested;})?requested:'';
      summarySelect.addEventListener('change',function(){
        var url=new URL(location.href);
        if(summarySelect.value)url.searchParams.set('favoriteCategory',summarySelect.value);else url.searchParams.delete('favoriteCategory');
        ['veh','equipmentId','vehicleId','vin','companyId','group','type'].forEach(function(key){url.searchParams.delete(key);});
        location.href=url.href;
      });
    }catch(error){summarySelect.disabled=true;}
  }
  var form=document.getElementById('favoriteCategoryForm');
  if(!form)return;
  var state,editing=null,deleting=null,input=document.getElementById('favoriteCategoryName'),feedback=document.getElementById('categoryStatus');
  var editor=document.getElementById('favoriteCategoryEditor'),formFeedback=document.getElementById('categoryFormStatus');
  var dialog=document.getElementById('favoriteCategoryDialog');
  function read(){state=MIQFavorites.readState(role,pool);return state;}
  function render(){
    MIQCommon.view.set(document.getElementById('categoryTotal'),"textContent",state.categories.length);
    MIQCommon.view.set(document.querySelector('.favorite-category-note'),"textContent",'구분을 삭제하면 등록된 차량은 “'+name(state,'default')+'” 구분으로 이동합니다.');
    MIQCommon.view.set(document.getElementById('favoriteCategoryRows'),"innerHTML",state.categories.map(function(category){
      return '<tr><td>'+esc(category.name)+'</td><td>'+count(state,category.id)+'대</td><td><button class="btn btn--sm" data-category-edit="'+esc(category.id)+'">수정</button>'+(category.id==='default'?'':'<button class="btn btn--sm btn--danger" data-category-delete="'+esc(category.id)+'">삭제</button>')+'</td></tr>';
    }).join(''));
  }
  function reset(){editing=null;form.reset();MIQCommon.view.set(formFeedback,"textContent",'');}
  function openEditor(category){reset();editing=category?category.id:null;input.value=category?category.name:'';MIQCommon.view.set(document.getElementById('favoriteCategoryEditorTitle'),"textContent",category?'구분 수정':'구분 추가');MIQCommon.view.set(document.getElementById('categorySubmit'),"textContent",category?'저장':'추가');editor.showModal();input.focus();}
  try{read();render();}catch(error){MIQCommon.view.set(feedback,"textContent",'저장된 구분을 읽지 못했습니다. 새로고침 후 다시 확인해 주세요.');document.getElementById('categoryAdd').disabled=true;return;}
  document.getElementById('categoryAdd').addEventListener('click',function(){openEditor(null);});
  editor.querySelectorAll('[data-category-editor-close]').forEach(function(button){button.addEventListener('click',function(){editor.close();});});
  editor.addEventListener('close',reset);
  form.addEventListener('submit',function(event){
    event.preventDefault();var value=input.value.trim();
    if(!value){MIQCommon.view.set(formFeedback,"textContent",'구분 이름을 입력해 주세요.');input.focus();return;}
    try{
      read();
      if(state.categories.some(function(category){return category.id!==editing&&category.name.toLowerCase()===value.toLowerCase();}))throw new Error('같은 이름의 구분이 있습니다. 다른 이름을 입력해 주세요.');
      if(value.length>30)throw new Error('구분 이름은 30자 이내로 입력해 주세요.');
      if(editing){var category=state.categories.find(function(item){return item.id===editing;});if(!category)throw new Error('해당 구분이 삭제되었습니다. 다시 확인해 주세요.');category.name=value;}
      else state.categories.push({id:'category-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:value});
      state=MIQFavorites.saveState(role,state,pool);MIQCommon.view.set(feedback,"textContent",'“'+value+'” 구분을 '+(editing?'수정':'추가')+'했습니다.');render();editor.close();
    }catch(error){MIQCommon.view.set(formFeedback,"textContent",/^(같은 이름|구분 이름|해당 구분)/.test(error.message)?error.message:'저장하지 못했습니다. 다시 시도해 주세요.');input.focus();}
  });
  document.getElementById('favoriteCategoryRows').addEventListener('click',function(event){
    var edit=event.target.closest('[data-category-edit]'),remove=event.target.closest('[data-category-delete]');
    if(!edit&&!remove)return;
    try{read();}catch(error){MIQCommon.view.set(feedback,"textContent",'구분을 불러오지 못했습니다.');return;}
    var id=edit?edit.dataset.categoryEdit:remove.dataset.categoryDelete;
    var category=state.categories.find(function(item){return item.id===id;});if(!category||(remove&&id==='default'))return;
    if(edit){openEditor(category);}
    else{deleting=id;MIQCommon.view.set(document.getElementById('categoryDeleteMessage'),"textContent",'“'+category.name+'” 구분을 삭제할까요? 등록된 차량 '+count(state,id)+'대는 “'+name(state,'default')+'” 구분으로 이동합니다.');MIQCommon.view.set(document.getElementById('categoryDeleteStatus'),"textContent",'');dialog.showModal();}
  });
  dialog.querySelectorAll('[data-category-close]').forEach(function(button){button.addEventListener('click',function(){dialog.close();});});
  document.getElementById('categoryDeleteConfirm').addEventListener('click',function(){
    if(!deleting||deleting==='default')return;
    try{
      read();state.categories=state.categories.filter(function(category){return category.id!==deleting;});
      state.members.forEach(function(member){if(member.categoryId===deleting)member.categoryId='default';});
      state=MIQFavorites.saveState(role,state,pool);if(editing===deleting)reset();render();dialog.close();MIQCommon.view.set(feedback,"textContent",'구분을 삭제했습니다. 등록된 차량은 “'+name(state,'default')+'” 구분으로 이동했습니다.');
    }catch(error){MIQCommon.view.set(document.getElementById('categoryDeleteStatus'),"textContent",'삭제하지 못했습니다. 다시 시도해 주세요.');}
  });
})(window);
