'use strict';
(() => {
  const data=window.MIQEmailPreview,params=new URLSearchParams(location.search);
  const frame=document.getElementById('mailFrame'),viewport=document.getElementById('viewport');
  const language=document.getElementById('mailLanguage'),role=document.getElementById('mailRole');
  const labels={signup:'회원가입 완료',password:'비밀번호 찾기',verification:'회원 인증'};
  let key=Object.hasOwn(labels,params.get('template'))?params.get('template'):'signup';
  if([...role.options].some(o=>o.value===params.get('role')))role.value=params.get('role');
  let size=['desktop','mobile','narrow'].includes(params.get('width'))?params.get('width'):'desktop';
  function resize(){const doc=frame.contentDocument;if(doc&&doc.body)frame.style.height=Math.ceil(doc.body.getBoundingClientRect().height)+'px';}
  function render(){
    const filename=key==='signup'&&role.value!=='customer-owner'?key+'-'+role.value:key;
    const selected=data['ko'].mails[filename];
    document.querySelectorAll('[data-mail]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mail===key)));
    document.querySelectorAll('[data-size]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.size===size)));
    document.getElementById('subject').textContent=selected.subject;
    document.getElementById('context').textContent=selected.preheader;
    document.getElementById('recipient').textContent=selected.recipient;
    document.getElementById('roleRow').hidden=key!=='signup';
    document.getElementById('openMail').href=selected.path;
    const download=document.getElementById('downloadMail');download.href=selected.path;download.download='machine-iq-'+filename+'-'+'ko'+'.html';
    viewport.classList.toggle('mobile',size==='mobile');viewport.classList.toggle('narrow',size==='narrow');
    frame.title=labels[key]+' · '+data['ko'].name+' 이메일 미리보기';
    if(frame.getAttribute('src')!==selected.path)frame.src=selected.path;
    const state=new URLSearchParams({lang:'ko',template:key,role:role.value,width:size});
    history.replaceState(null,'','?'+state.toString());
    resize();
  }
  frame.addEventListener('load',resize);
  document.querySelectorAll('[data-mail]').forEach(button=>button.addEventListener('click',()=>{key=button.dataset.mail;render();}));
  document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{size=button.dataset.size;render();}));
  role.addEventListener('change',render);
  new ResizeObserver(resize).observe(viewport);
  render();
})();
