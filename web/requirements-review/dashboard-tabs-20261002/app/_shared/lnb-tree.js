/* Current pages use the common menu. This controller owns only vehicle selection state. */
(function(){'use strict';var MIQ=window.MIQ=window.MIQ||{};
 MIQ.lnbTree=function(root,opts){if(!root)return null;opts=opts||{};
  var all=(opts.vehicles||MIQ.FLEET_CATALOG||MIQ.FLEET||[]).slice(),company=opts.companyId||'all',pool=all;
  var state={group:opts.group||null,type:opts.type||null,vin:opts.vin||null};
  function selection(){var vehicle=state.vin?pool.find(function(v){return v.vin===state.vin})||null:null;return {group:state.group,type:state.type,vin:state.vin,vehicle:vehicle,label:vehicle?vehicle.vin:([state.group,state.type].filter(Boolean).join(' · ')||'전체'),vehicles:vehicle?[vehicle]:pool.filter(function(v){return (!state.group||v.group===state.group)&&(!state.type||v.type===state.type)})};}
  function setCompany(id){company=String(id||'all');pool=company==='all'?all:all.filter(function(v){return String(v.companyId||'1933')===company});if(company==='all'||!pool.some(function(v){return v.group===state.group}))state.group=null;if(state.type&&!pool.some(function(v){return v.type===state.type}))state.type=null;if(state.vin&&!pool.some(function(v){return v.vin===state.vin}))state.vin=null;}
  function set(next){if(!next)return;['group','type','vin'].forEach(function(key){if(key in next)state[key]=next[key]||null});var selected=selection();if(opts.label!==false)document.querySelectorAll('[data-lnb-label]').forEach(function(el){MIQCommon.view.set(el,"textContent",'- '+selected.label)});if(opts.onChange)opts.onChange(selected);}
  document.addEventListener('miq:target-change',function(e){if((e.detail||{}).profile!=='vehicle')setCompany((e.detail||{}).companyId)});
  if(window.MIQ_TARGET_CONTEXT&&MIQ_TARGET_CONTEXT.profile!=='vehicle')setCompany(MIQ_TARGET_CONTEXT.companyId);
  root.__miqLnb=true;return {get:selection,set:set,setCompany:setCompany,render:function(){}};
 };
})();
