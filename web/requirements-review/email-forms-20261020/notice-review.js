'use strict';
(()=>{
 const data=window.MIQNoticeReview,model=window.MIQNoticeModel,params=new URLSearchParams(location.search);
 const lang=model.locale(params.get('lang'),data.languages),view=document.body.dataset.noticeView;
 const el=id=>document.getElementById(id),node=(tag,text,className)=>{const out=document.createElement(tag);if(text!==undefined)out.textContent=text;if(className)out.className=className;return out;};
 const url=(file,values)=>file+'?'+new URLSearchParams(values);
 if(view==='detail'){
  el('noticeListLink').href=url('notices.html',{lang:lang||'ko'});
  const row=lang?model.detail(data,params.get('id'),lang):null;
  if(!row){el('noticeError').hidden=false;el('noticeErrorText').textContent=lang?'주소가 없거나 조회할 수 없는 공지입니다.':'지원하지 않는 언어입니다.';el('noticeMailLink').hidden=true;return;}
  const copy=row.copy;document.title='MACHINE IQ · '+copy.title;el('noticeTitle').textContent=copy.title;
  const meta=(label,text)=>{const wrap=node('div');wrap.append(node('dt',label),node('dd',text));el('noticeMeta').append(wrap);};
  meta('공지 종류',data.kinds[row.kind]);meta('게시일',copy.noticeDate);if(copy.termsTitle)meta('대상 약관',copy.termsTitle);if(copy.effectiveDate)meta('시행일',copy.effectiveDate);
  el('noticeArticle').dir=copy.direction||'ltr';el('noticeArticle').lang=row.bodyLanguage;
  el('noticeBodyHeading').textContent=row.kind==='TERMS'?'주요 변경 내용':'안내 내용';el('noticeBody').textContent=copy.body;
  el('termsDocuments').hidden=row.kind!=='TERMS';el('noticeMailLink').hidden=row.kind!=='TERMS';
  el('noticeMailLink').href=url('view.html',{mail:'terms-change',lang:lang||'ko'});el('noticeLanguageNote').hidden=row.bodyLanguage===lang;
  el('noticeArticle').hidden=false;return;
 }
 let page=1;
 for(const [key,label] of Object.entries(data.kinds)){const option=node('option',label);option.value=key;el('noticeKind').append(option);}
 const selected=params.get('kind')||'';el('noticeKind').value=Object.hasOwn(data.kinds,selected)?selected:'';
 el('noticeQuery').value=(params.get('q')||'').slice(0,100);
 function render(){
  const kind=el('noticeKind').value,query=el('noticeQuery').value;
  const result=model.list(data,{kind,query,lang:lang||'ko',page});page=result.page;
  el('noticeRows').replaceChildren();el('noticeCount').textContent=String(result.total);el('noticeEmpty').hidden=result.total!==0;
  for(const row of result.rows){const tr=node('tr');tr.append(node('td',data.kinds[row.kind],'notice-kind'));const title=node('td'),a=node('a',row.copy.title);a.href=url('notice.html',{id:row.id,lang:lang||'ko'});title.append(a);tr.append(title,node('td',row.publishedOn),node('td',row.pinned?'고정':'—'));el('noticeRows').append(tr);}
  el('noticePage').textContent=result.page+' / '+result.pages;el('noticePrev').disabled=result.page===1;el('noticeNext').disabled=result.page===result.pages;
  history.replaceState(null,'','?'+new URLSearchParams({lang:lang||'ko',kind,q:query}));
 }
 el('noticeFilters').addEventListener('submit',event=>{event.preventDefault();page=1;render();});el('noticePrev').addEventListener('click',()=>{page--;render();});el('noticeNext').addEventListener('click',()=>{page++;render();});render();
})();
