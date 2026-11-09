(function () {
  'use strict';
  var params=new URLSearchParams(location.search), status=document.body.dataset.errorStatus;
  var info=MIQErrors.describe(status ? {status:status} : (params.get('type') || {status:404}));
  MIQCommon.view.set(document.getElementById('errorTitle'),'textContent',info.title);
  MIQCommon.view.set(document.getElementById('errorDetail'),'textContent',info.detail);
  var base=new URL('../',document.baseURI), login=new URL('Login/login-tobe.html',base);
  login.searchParams.set('lang','ko');
  document.getElementById('errorLogin').href=login.href;
  var target=MIQErrors.safeReturn(params.get('returnTo') || document.referrer,base.href);
  if (target && !['session','forbidden'].includes(info.type)) {
    var back=document.getElementById('errorReturn');back.href=target;back.hidden=false;back.classList.remove('aae-hidden');
    MIQCommon.view.set(back,'textContent',info.retry?'다시 시도':'이전 화면으로 이동');
  }
})();
