(function(){
  'use strict';
  var role=document.body.dataset.managementRole||MIQCommon.roles.resolve(new URLSearchParams(location.search).get('role'));
  var policy=MIQCommon.roles.targetPolicy(role);
  var source=window.MIQ_MOCK_DATA&&MIQ_MOCK_DATA.fleet;
  var companies=(source&&source.dashboardCompanies||[]).filter(function(c){return (!c.dashboardRoles||c.dashboardRoles.indexOf(role)>=0)&&(!policy.companyIds||policy.companyIds.indexOf(String(c.companyId))>=0);}).map(function(c){return c.companyName;});
  var companyId=policy.companyId || source.defaultCompany.companyId;
  var permitted=(source.vehicles||[]).filter(function(v){return String(v.companyId)===String(companyId);});
  var groups=Array.from(new Set(permitted.map(function(v){return v.group;}).filter(Boolean)));
  var scope=window.MIQReportScope=MIQMeeting.reportScope(role,companies,groups,policy.group);
  scope.resolve=function(name){
    if(scope.items.indexOf(name)<0)return {vehicles:[]};
    if(scope.customer)return {companyId:companyId,group:name,vehicles:permitted.filter(function(v){return v.group===name;})};
    var company=(source.dashboardCompanies||[]).find(function(c){return c.companyName===name;});
    return company?{companyId:company.companyId}:{vehicles:[]};
  };
  var incoming=new URLSearchParams(location.search);
  var requested=scope.customer?incoming.get('group'):incoming.get('company');
  if(!scope.customer&&incoming.get('companyId')){
    var requestedCompany=(source.dashboardCompanies||[]).find(function(c){return String(c.companyId)===incoming.get('companyId');});
    requested=requestedCompany&&requestedCompany.companyName;
  }
  if(scope.items.indexOf(requested)>=0)scope.items=[requested].concat(scope.items.filter(function(n){return n!==requested;}));
  function translate(s){return scope.customer?s.replace(/업체/g,'그룹').replace(scope.readOnly?/비교/g:/$^/g,'현황'):s;}
  function labels(){
    var main=document.querySelector('.main');if(!main)return;
    var walker=document.createTreeWalker(main,NodeFilter.SHOW_TEXT),node;
    while((node=walker.nextNode())){if(/^(SCRIPT|STYLE)$/.test(node.parentElement.tagName))continue;var original=MIQCommon.view.get(node,'textContent'),next=translate(original);if(next!==original)MIQCommon.view.set(node,'textContent',next);}
    main.querySelectorAll('[aria-label],[title]').forEach(function(el){['aria-label','title'].forEach(function(a){var s=MIQCommon.view.call(el,"getAttribute",[a]);if(s&&translate(s)!==s)MIQCommon.view.call(el,"setAttribute",[a,translate(s)]);});});
    if(scope.readOnly){
      main.querySelectorAll('.cmp-note,.compare-note,.tbl-note').forEach(function(el){el.hidden=true;});
      main.querySelectorAll('#coSel,#coWrap select').forEach(function(el){el.disabled=true;});
      main.querySelectorAll('#btnAdd,#btnDel').forEach(function(el){el.hidden=true;el.style.display='none';});
      var hint=document.getElementById('coHint');if(hint&&MIQCommon.view.get(hint,"textContent")!=='내 그룹 조회')MIQCommon.view.set(hint,"textContent",'내 그룹 조회');
    }
    var title=document.querySelector('title');
    if(title){var originalTitle=MIQCommon.view.get(title,'textContent'),nextTitle=translate(originalTitle);if(nextTitle!==originalTitle)MIQCommon.view.set(title,'textContent',nextTitle);}
  }
  document.addEventListener('DOMContentLoaded',function(){labels();new MutationObserver(labels).observe(document.querySelector('.main'),{childList:true,subtree:true,characterData:true});});
  scope.applyLabels=labels;
})();
