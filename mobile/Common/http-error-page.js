// Separate HTML entries share only error copy and existing mobile navigation.
// Display pages do not simulate an API response or replay failed write requests.
(() => {
  'use strict';
  const status=Number(document.body.dataset.httpError);
  if(![400,401,403,500,503].includes(status))return;
  const description=window.CustomerWebContracts?.errors?.describe({status});
  if(description){
    document.querySelector('#http-error-title').textContent=description.title;
    document.querySelector('#http-error-detail').textContent=description.detail;
  }
  const routes=new Set(['home','summary','services','reports','settings','notifications']);
  if(status===401){
    // A session-error screen must not offer an alternate in-app entry.
    document.querySelectorAll('[data-http-error-go]').forEach(button=>{
      button.setAttribute('aria-label',(button.textContent.trim()||'알림 내역')+' · 로그인 필요');
    });
    document.querySelector('.header-back').setAttribute('aria-label','로그인 화면으로');
  }
  document.addEventListener('click',event=>{
    const retry=event.target.closest('[data-http-error-retry]');
    if(retry&&[500,503].includes(status)){window.location.reload();return;}
    const button=event.target.closest('[data-http-error-go]');
    if(!button||!routes.has(button.dataset.httpErrorGo))return;
    window.location.assign(status===401?'../login.html':'../index.html#'+button.dataset.httpErrorGo);
  });
  window.lucide?.createIcons({attrs:{'stroke-width':2}});
})();
