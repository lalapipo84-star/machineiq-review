'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MIQNoticeModel=api;})(typeof window==='undefined'?{}:window,function(){
 function locale(raw,languages){const code=String(raw||'ko').trim().toLowerCase().replace(/_/g,'-').split('-')[0];return languages.includes(code)?code:null;}
 function readable(row){return Boolean(row&&row.state==='PUBLISHED'&&row.audience==='ALL'&&row.publiclyReadable===true);}
 function localized(row,lang){const copy=row.locales[lang]||row.locales.ko;return {...row,copy,bodyLanguage:row.locales[lang]?lang:'ko'};}
 function detail(data,id,lang){const row=data.entries.find(x=>x.id===id&&readable(x)&&Object.hasOwn(data.kinds,x.kind));return row?localized(row,lang):null;}
 function list(data,{kind='',query='',lang='ko',page=1,pageSize=15}={}){
  if(kind&&!Object.hasOwn(data.kinds,kind))return {rows:[],total:0,page:1,pages:1};
  const text=String(query).trim().toLocaleLowerCase();
  const rows=data.entries.filter(x=>readable(x)&&Object.hasOwn(data.kinds,x.kind)).map(x=>localized(x,lang)).filter(x=>(!kind||x.kind===kind)&&(!text||(x.copy.title+' '+x.copy.body).toLocaleLowerCase().includes(text))).sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.publishedOn.localeCompare(a.publishedOn)||a.id.localeCompare(b.id));
  const limit=Number.isInteger(pageSize)&&pageSize>0?Math.min(pageSize,100):15;
  const pages=Math.max(1,Math.ceil(rows.length/limit)),current=Math.min(pages,Math.max(1,Number.isInteger(page)?page:1));
  return {rows:rows.slice((current-1)*limit,current*limit),total:rows.length,page:current,pages};
 }
 return Object.freeze({locale,readable,detail,list});
});
