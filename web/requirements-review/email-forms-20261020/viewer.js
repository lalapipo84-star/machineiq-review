'use strict';
(() => {
  const catalog=window.MIQMailGallery,params=new URLSearchParams(location.search);
  const type=document.getElementById('mailType'),variant=document.getElementById('mailVariant'),language=document.getElementById('mailLanguage');
  const frame=document.getElementById('mailFrame'),viewport=document.getElementById('viewport');
  let key=catalog.mails.some(item=>item.key===params.get('mail'))?params.get('mail'):'signup';
  let size=['desktop','mobile','narrow'].includes(params.get('width'))?params.get('width'):'desktop';
  const options=(select,items,selected)=>{
    select.replaceChildren(...items.map(item=>{const option=document.createElement('option');option.value=item.value;option.textContent=item.label;return option;}));
    select.value=items.some(item=>item.value===selected)?selected:items[0].value;
  };
  options(type,catalog.mails.map(item=>({value:item.key,label:item.title})),key);
  function resize(){
    const doc=frame.contentDocument;
    if(!doc||!doc.body)return;
    const height=Math.ceil(doc.body.getBoundingClientRect().height);
    const next=height+'px';if(frame.style.height!==next)frame.style.height=next;
  }
  function setup(requestedVariant,requestedLanguage){
    const mail=catalog.mails.find(item=>item.key===key);
    options(variant,mail.variants,requestedVariant);
    options(language,mail.locales.map(code=>({value:code,label:catalog.languages[code]})),requestedLanguage);
    document.getElementById('variantControl').firstChild.textContent=mail.variantLabel||'유형';
    document.getElementById('variantControl').hidden=mail.variants.length===1;
    document.getElementById('languageControl').hidden=mail.locales.length===1;
    document.getElementById('mailTitle').textContent=mail.title;
    document.getElementById('mailDescription').textContent=mail.description;
    document.getElementById('templateId').textContent=mail.templateId;
    document.getElementById('variantNote').textContent=mail.note||'';
    document.title='MACHINE IQ · '+mail.title;
    render();
  }
  function render(){
    const mail=catalog.mails.find(item=>item.key===key),selected=mail.variants.find(item=>item.value===variant.value);
    const preview=selected.previews[language.value],url=preview.path;
    document.getElementById('subject').textContent=preview.subject;
    const open=document.getElementById('openMail'),download=document.getElementById('downloadMail');
    open.href=url;download.href=url;download.download='machine-iq-'+selected.value+'-'+language.value+'.html';
    viewport.classList.toggle('mobile',size==='mobile');viewport.classList.toggle('narrow',size==='narrow');
    document.querySelectorAll('[data-size]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.size===size)));
    frame.title=mail.title+' · '+catalog.languages[language.value]+' · '+selected.label;
    if(frame.getAttribute('src')!==url){frame.style.height='800px';frame.src=url;}else resize();
    history.replaceState(null,'','?'+new URLSearchParams({mail:key,variant:variant.value,lang:language.value,width:size}));
  }
  frame.addEventListener('load',resize);
  type.addEventListener('change',()=>{key=type.value;setup('',language.value);});
  variant.addEventListener('change',render);language.addEventListener('change',render);
  document.querySelectorAll('[data-size]').forEach(button=>button.addEventListener('click',()=>{size=button.dataset.size;render();}));
  let previousWidth=0;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(width!==previousWidth){previousWidth=width;resize();}}).observe(viewport);
  setup(params.get('variant'),params.get('lang'));
})();
