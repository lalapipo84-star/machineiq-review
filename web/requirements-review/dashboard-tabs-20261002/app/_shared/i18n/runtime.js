/* WEB presentation locale. Data, form values and legacy DOM reads retain source values. */
(function (root) {
  'use strict';
  var doc = root.document, records = new WeakMap(), attributes = new WeakMap();
  var catalogs=root.MIQTranslations || {}, keys=root.MIQTranslationKeys || {}, locales=root.MIQLocales || [{code:'ko',name:'한국어'},{code:'en',name:'English'}];
  var controls='.gnb__language select,.pre__lang,[data-language-select]';
  function supported(code){return locales.some(function(l){return l.code===code;}) && !!catalogs[code];}
  var messages = root.MIQEnglish || {}, requested = new URLSearchParams(root.location.search).get('lang'), saved;
  try { saved = root.localStorage.getItem('miq-language'); } catch (_) {}
  var language = supported(requested)?requested:supported(saved)?saved:'ko';
  function selectMessages(){messages={};Object.keys(keys).forEach(function(source){messages[source]=catalogs[language][keys[source]];});}
  selectMessages();
  var names = ['title', 'placeholder', 'aria-label', 'alt', 'data-chart-tip'];
  var phrases = Object.keys(messages).filter(function (k) { return k.length > 1; }).sort(function (a,b) { return b.length-a.length; });
  var pattern = new RegExp('(?<![가-힣])(' + phrases.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![가-힣])','g');
  function monthName(month){try{return new Intl.DateTimeFormat(language,{month:'short',timeZone:'UTC'}).format(new Date(Date.UTC(2026,Number(month)-1,1)));}catch(_){return month;}}
  function options(compact){return locales.map(function(l){return '<option value="'+l.code+'" lang="'+l.code+'" dir="'+(l.direction||'ltr')+'" translate="no"'+(l.code===language?' selected':'')+'>'+ (compact&&l.code===language?l.code.toUpperCase():l.name)+'</option>';}).join('');}
  function prepareControl(el){
    var compact=!!el.closest('.gnb__language');
    if(el.dataset.miqLanguages!==locales.map(function(l){return l.code;}).join(',')){
      el.innerHTML=options(compact);el.dataset.miqLanguages=locales.map(function(l){return l.code;}).join(',');
    }
    el.value=language;
    Array.from(el.options).forEach(function(option){var locale=locales.find(function(l){return l.code===option.value;});if(locale){option.setAttribute('translate','no');option.textContent=compact&&locale.code===language?locale.code.toUpperCase():locale.name;}});
  }
  function applyLanguage(){doc.documentElement.lang=language;doc.documentElement.dir=language==='ar'?'rtl':'ltr';}
  function format(key,parameters) {
    var catalog=root.MIQTranslations && root.MIQTranslations[language],message=catalog && catalog[key];
    return String(message==null?key:message).replace(/\{([^}]+)\}/g,function(token,name){return parameters && parameters[name]!=null ? String(parameters[name]) : token;});
  }
  function countContext(node) {
    var el=node.nodeType===1?node:node.parentElement;
    return el && el.closest && el.closest('[data-i18n-count="shock"],[data-metric="shock"],[data-k="shock"],#dcShock') ? 'shock' : null;
  }
  function translate(value,parameters,countKind) {
    var original = String(value == null ? '' : value), text = original.trim().replace(/\s+/g,' ');
    if (root.MIQTranslations && Object.prototype.hasOwnProperty.call(root.MIQTranslations.ko,text)) return format(text,parameters);
    if (language === 'ko') return original;
    if (countKind === 'shock') {
      text=text.replace(/([\d,.]+)\s*(?:건|회)(?![가-힣])/g,function(_,n){return format('count.shocks',{count:n});});
      text=text.replace(/(?<![가-힣])(?:건|회)(?![가-힣])/g,function(){return format('unit.shocks');});
      if(text!==original.trim().replace(/\s+/g,' '))return original.replace(original.trim(),translate(text));
    }
    if (Object.prototype.hasOwnProperty.call(messages,text)) return original.replace(original.trim(), messages[text]);
    if (!/[가-힣]/.test(text)) return original;
    (root.MIQTranslationPatterns || []).forEach(function(rule){
      text=text.replace(new RegExp(rule.pattern,rule.flags || 'g'),function(){
        var matches=arguments,template=catalogs[language][rule.key];
        return template.replace(/\{(\d+)\}/g,function(_,i){return matches[Number(i)] || '';});
      });
    });
    text = text.replace(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/g,'$1-$2-$3')
      .replace(/(\d{4})년/g,'$1').replace(/(\d{1,2})월/g,function(_,m){return monthName(m);})
      .replace(/([\d,.]+)시간/g,'$1 h').replace(/([\d,.]+)분/g,'$1 min').replace(/([\d,.]+)초/g,'$1 s')
      .replace(/([\d,.]+)(개|대)씩/g,function(_,n){return format('pagination.perPage',{1:n});})
      .replace(/([\d,.]+)대/g,function(_,n){return format('count.vehicles',{1:n});}).replace(/([\d,.]+)건/g,function(_,n){return format('count.records',{1:n});})
      .replace(/([\d,.]+)명/g,function(_,n){return format('count.users',{1:n});}).replace(/([\d,.]+)개/g,function(_,n){return format('count.items',{1:n});})
      .replace(/([\d,.]+)일/g,function(_,n){return format('time.daysUntil',{1:n});}).replace(/(\d+)페이지/g,function(_,n){return format('pagination.page',{1:n});});
    text = text.replace(pattern,function(k){return messages[k];});
    text=text.replace(/(?<![가-힣])(대|건|개|회)(?![가-힣])/g,function(k){return messages[k] || k;});
    return original.replace(original.trim(),text);
  }
  function excluded(el) { return el.closest && el.closest('script,style,textarea,[translate="no"],[data-i18n-ignore],.dc-entity-name'); }
  function localize(node,inheritedCountKind) {
    var countKind=countContext(node)||inheritedCountKind;
    // Nicknames and company/person/group names are data, not message keys.
    if ((node.nodeType===11 || node.tagName==='TR') && node.querySelector && node.querySelector('button[data-nick]')) {
      var rows=[node];
      rows.forEach(function(row){
        if(!row.querySelector('button[data-nick]'))return;
        var cells=Array.from(row.children||[]).filter(function(e){return e.tagName==='TD';});
        [0,1,2,3,9].forEach(function(i){if(cells[i])cells[i].setAttribute('translate','no');});
      });
    }
    if (node.nodeType === 3) {
      if (node.parentElement && excluded(node.parentElement)) return;
      var old = records.get(node), current = node.nodeValue;
      if (!old || current !== old.last) old = {source:current,last:current};
      var parent=node.parentElement,key=parent && parent.dataset && parent.dataset.i18nKey;
      node.nodeValue = old.last = key ? format(key,parent.dataset) : translate(old.source,null,countKind); records.set(node,old); return;
    }
    if (node.nodeType === 1) {
      if (excluded(node)) return;
      if (node.tagName==='SELECT' && node.matches(controls)) prepareControl(node);
      if (node.tagName === 'OPTION' && !node.hasAttribute('value')) node.setAttribute('value', node.textContent);
      var attrs = attributes.get(node) || {};
      names.forEach(function(name){
        if (!node.hasAttribute(name)) return;
        var cur=node.getAttribute(name), old=attrs[name];
        if (!old || old.last !== cur) old={source:cur,last:cur};
        old.last=translate(old.source,null,countKind);node.setAttribute(name,old.last);attrs[name]=old;
      });
      attributes.set(node,attrs);
    }
    Array.from(node.childNodes || []).forEach(function(child){localize(child,countKind);});
  }
  function sourceText(node) {
    if (node.nodeType === 3) {var r=records.get(node);return r && r.last===node.nodeValue ? r.source : node.nodeValue;}
    return Array.from(node.childNodes || []).map(sourceText).join('');
  }
  function restoreClone(source,clone) {
    if(source.nodeType===3) {clone.nodeValue=sourceText(source);return;}
    var attrs=attributes.get(source);
    if(attrs)Object.keys(attrs).forEach(function(k){clone.setAttribute(k,attrs[k].source);});
    Array.from(source.childNodes||[]).forEach(function(n,i){restoreClone(n,clone.childNodes[i]);});
  }
  function get(node,prop) {
    if (prop === 'textContent' || prop === 'innerText') return sourceText(node);
    if (prop === 'innerHTML' || prop === 'outerHTML') {var clone=node.cloneNode(true);restoreClone(node,clone);return clone[prop];}
    var attrs=attributes.get(node);return attrs && attrs[prop] ? attrs[prop].source : node[prop];
  }
  function fragment(node,html,outer) {
    var range=doc.createRange();
    if(outer && node.parentNode) range.selectNode(node);else range.selectNodeContents(node);
    var frag=range.createContextualFragment(String(html));localize(frag,countContext(node));return frag;
  }
  function set(node,prop,value) {
    if(prop==='innerHTML') node.replaceChildren(fragment(node,value,false));
    else if(prop==='outerHTML') node.replaceWith(fragment(node,value,true));
    else if(prop==='textContent'||prop==='innerText') {node[prop]=value;localize(node);}
    else {node[prop]=translate(value,null,countContext(node));var attrs=attributes.get(node)||{};attrs[prop]={source:String(value),last:node[prop]};attributes.set(node,attrs);}
    return value;
  }
  function call(node,method,args) {
    if (method==='insertAdjacentHTML') {
      var pos=args[0].toLowerCase(),outer=pos==='beforebegin'||pos==='afterend',f=fragment(node,args[1],outer);
      if(pos==='beforebegin')node.before(f);else if(pos==='afterend')node.after(f);else if(pos==='afterbegin')node.prepend(f);else node.append(f);return;
    }
    if(method==='setAttribute' && names.indexOf(args[0])>=0) {var attrs=attributes.get(node)||{};attrs[args[0]]={source:String(args[1]),last:translate(args[1],null,countContext(node))};attributes.set(node,attrs);return node.setAttribute(args[0],attrs[args[0]].last);}
    if(method==='getAttribute' && names.indexOf(args[0])>=0) {var records=attributes.get(node);return records&&records[args[0]] ? records[args[0]].source : node.getAttribute(args[0]);}
    if(method==='setCustomValidity'||method==='alert'||method==='confirm'||method==='prompt')args[0]=translate(args[0]);
    return node[method].apply(node,args);
  }
  function syncControls(){doc.querySelectorAll(controls).forEach(prepareControl);}
  function change(next) {
    if(!supported(next))return;
    language=next;selectMessages();applyLanguage();
    try{root.localStorage.setItem('miq-language',language);}catch(_){}
    var url=new URL(root.location.href);url.searchParams.set('lang',language);
    try{root.history.replaceState(root.history.state,'',url.href);}catch(_){}
    localize(doc.head);localize(doc.body);syncControls();
    doc.dispatchEvent(new CustomEvent('miq:languagechange',{detail:{language:language}}));
  }
  root.MIQI18n={get:get,set:set,call:call,t:translate,localize:localize,change:change,language:function(){return language;},options:options,languages:function(){return locales.map(function(l){return Object.assign({},l);});}};
  applyLanguage();doc.documentElement.dataset.miqLocale='pending';
  try{root.localStorage.setItem('miq-language',language);}catch(_){}
  doc.addEventListener('change',function(event){if(event.target.matches('.gnb__language select,.pre__lang,[data-language-select]'))change(event.target.value);},true);
  doc.addEventListener('DOMContentLoaded',function(){localize(doc.head);localize(doc.body);syncControls();delete doc.documentElement.dataset.miqLocale;},{once:true});
  doc.addEventListener('click',function(event){
    var a=event.target.closest('a[href]');if(!a||a.hasAttribute('download')||a.getAttribute('href').startsWith('#'))return;
    var url=new URL(a.href,root.location.href);
    if(url.origin===root.location.origin && /\.html$/.test(url.pathname)){url.searchParams.set('lang',language);a.href=url.href;}
  },true);
}(window));
