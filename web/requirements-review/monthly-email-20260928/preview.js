'use strict';
(() => {
  const data=window.MIQMonthlyPreview,params=new URLSearchParams(location.search);
  const language=document.getElementById('mailLanguage'),scenario=document.getElementById('mailScenario'),frame=document.getElementById('mailFrame'),viewport=document.getElementById('viewport');
  language.value=Object.hasOwn(data,params.get('lang'))?params.get('lang'):'ko';
  scenario.value=Object.hasOwn(data.ko.scenarios,params.get('state'))?params.get('state'):'normal';
  let size=['desktop','mobile','narrow'].includes(params.get('width'))?params.get('width'):'desktop';
  function resize(){try{const height=Math.ceil(frame.contentDocument.body.getBoundingClientRect().height)+'px';if(frame.style.height!==height)frame.style.height=height;}catch(error){/* Direct file opening may restrict frame reads; retain a scrollable frame. */}}
  function render(){
    const selected=data[language.value].scenarios[scenario.value];
    document.getElementById('subject').textContent=selected.subject;
    document.getElementById('context').textContent=selected.preheader;
    document.getElementById('openMail').href=selected.path;
    document.getElementById('openJson').href=selected.json;
    document.getElementById('openText').href=selected.text;
    const download=document.getElementById('downloadMail');download.href=selected.path;download.download=`machine-iq-monthly-${language.value}-${scenario.value}.html`;
    document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.size===size)));
    viewport.classList.toggle('mobile',size==='mobile');viewport.classList.toggle('narrow',size==='narrow');
    frame.title='월간 이메일 · '+data[language.value].name+' · '+scenario.selectedOptions[0].textContent;
    if(frame.getAttribute('src')!==selected.path)frame.src=selected.path;
    history.replaceState(null,'','?'+new URLSearchParams({lang:language.value,state:scenario.value,width:size}));
    resize();
  }
  frame.addEventListener('load',resize);
  language.addEventListener('change',render);scenario.addEventListener('change',render);
  document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{size=button.dataset.size;render();}));
  new ResizeObserver(resize).observe(viewport);
  render();
})();
