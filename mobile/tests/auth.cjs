const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const base=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(base,file),'utf8');
const stores=()=>Object.fromEntries(['localStorage','sessionStorage'].map(name=>{const values=new Map();return [name,{values,getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)}];}));
// Small in-memory DOM for form event tests, not a browser or visual inspection.
function page(file,query='',storage=stores()){
  const nodes=[],intervals=new Map();let intervalId=0;
  function element(tag,attrs={}){
    const n={tagName:tag.toUpperCase(),attrs:{...attrs},children:[],parent:null,events:{},dataset:{},style:{},textContent:'',innerHTML:'',value:attrs.value||'',id:attrs.id||'',name:attrs.name||'',type:attrs.type||'',href:attrs.href||'',className:attrs.class||'',hidden:'hidden'in attrs,disabled:'disabled'in attrs,checked:'checked'in attrs,
      append(...children){for(const child of children){child.parent=this;this.children.push(child);}},replaceChildren(...children){this.children=[];this.append(...children);},add(child){this.append(child);},
      setAttribute(key,value){this.attrs[key]=String(value);if(key==='class')this.className=String(value);if(key==='hidden')this.hidden=true;},getAttribute(key){return this.attrs[key]??null;},removeAttribute(key){delete this.attrs[key];if(key==='hidden')this.hidden=false;},hasAttribute(key){return key in this.attrs;},
      addEventListener(event,fn){(this.events[event]||=[]).push(fn);},fire(event){if(event==='click'&&this.disabled)return;for(const fn of this.events[event]||[])fn({target:this,preventDefault(){}});},focus(){},select(){},scrollIntoView(){},reportValidity(){return true;},toggleAttribute(k,on){if(on)this.setAttribute(k,'');else this.removeAttribute(k);},
      closest(selector){for(let x=this;x;x=x.parent)if(matches(x,selector))return x;return null;},querySelectorAll(selector){const found=[];const visit=p=>p.children.forEach(c=>{if(matches(c,selector))found.push(c);visit(c);});visit(this);return found;},querySelector(selector){return this.querySelectorAll(selector)[0]||null;}};
    for(const [key,value]of Object.entries(attrs))if(key.startsWith('data-'))n.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
    n.classList={add(...classes){n.className=[...new Set(n.className.split(' ').concat(classes))].join(' ').trim();},remove(...classes){n.className=n.className.split(' ').filter(c=>!classes.includes(c)).join(' ');},toggle(c,on){const wanted=on??!n.className.split(' ').includes(c);this[wanted?'add':'remove'](c);return wanted;}};
    Object.defineProperty(n,'options',{get:()=>n.children.filter(c=>c.tagName==='OPTION')});nodes.push(n);return n;
  }
  function matches(n,selector){return selector.split(',').some(part=>{
    let s=part.trim();if(!s)return false;
    if(s.includes(':not([disabled])')){if(n.disabled)return false;s=s.replace(':not([disabled])','');}
    if(s.endsWith(':checked')){if(!n.checked)return false;s=s.slice(0,-8);}
    for(const a of s.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)){const actual=a[1]==='hidden'?(n.hidden?'':undefined):n.attrs[a[1]];if(actual===undefined||(a[2]!==undefined&&actual!==a[2]))return false;}
    s=s.replace(/\[[^\]]+\]/g,'');if(s.startsWith('#'))return n.id===s.slice(1);if(s.startsWith('.'))return n.className.split(' ').includes(s.slice(1));return !s||n.tagName===s.toUpperCase();
  });}
  const document=element('document'),stack=[document];
  for(const match of read(file).matchAll(/<\/?([a-zA-Z][\w-]*)([^>]*)>/g)){
    const tag=match[1].toLowerCase();if(match[0].startsWith('</')){const i=stack.map(n=>n.tagName).lastIndexOf(tag.toUpperCase());if(i>0)stack.length=i;continue;}
    const attrs={};for(const a of match[2].matchAll(/([^\s=\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[a[1]]=a[2]??a[3]??a[4]??'';
    const n=element(tag,attrs);stack.at(-1).append(n);if(!['input','meta','link','img','br','hr','source'].includes(tag))stack.push(n);
  }
  document.body=nodes.find(n=>n.tagName==='BODY');document.documentElement=nodes.find(n=>n.tagName==='HTML');document.readyState='complete';document.createElement=tag=>element(tag);document.getElementById=id=>nodes.find(n=>n.id===id);
  // r88: no language select is injected; form initialization must not depend on it.
  for(const n of nodes.filter(n=>n.tagName==='SELECT'))n.value=n.options.find(o=>'selected'in o.attrs)?.value||n.options[0]?.value||'';
  const location={search:query,href:'http://localhost/'+file+query};
  const window={location,scrollTo(){},lucide:{createIcons(){}},addEventListener(){},setTimeout(fn){fn();},setInterval(fn){const id=++intervalId;intervals.set(id,fn);return id;},clearInterval(id){intervals.delete(id);},prompt(){}};
  const context=vm.createContext({document,window,location,navigator:{},URLSearchParams,Date,setTimeout:window.setTimeout,clearTimeout(){},...storage,Option:function(text,value){return element('option',{value});}});
  window.document=document;window.sessionStorage=storage.sessionStorage;
  vm.runInContext(read('onboarding.js'),context);
  vm.runInContext(read('auth-common.js'),context);
  vm.runInContext(read(file==='signup.html'?'signup.js':file==='login.html'?'login.js':'find-password.js'),context);
  return {node:id=>document.getElementById(id),document,storage,location,tick(count){for(let i=0;i<count;i++)for(const fn of intervals.values())fn();}};
}
for(const role of ['customer_owner','customer_staff','dealer_owner']){
  const p=page('login.html','?role='+role);p.node('mobile-login-form').fire('submit');assert.equal(p.location.href,'./index.html#home?role='+(role==='customer_staff'?role:'customer_owner'));
  assert.equal(p.storage.sessionStorage.getItem('linq-customer-prototype-authenticated-role'),role==='customer_staff'?role:'customer_owner');
}
// r24: dealer HTML/CSS is used directly; no web form classes or local overrides.
assert(read('login.html').includes('./shared/login.css'));
assert(read('login.html').includes('class="login-page"')&&read('login.html').includes('class="login-card"'));
assert.equal((read('login.html').match(/<h1\b/g)||[]).length,1);
assert(!/aae-|auth\.css/.test(read('login.html')+read('find-password.html')));

const passwordToggle=page('login.html'),eye=passwordToggle.node('password-toggle');
eye.fire('click');assert.equal(passwordToggle.node('login-password').type,'text');assert(eye.innerHTML.includes('eye-off'));
eye.fire('click');assert.equal(passwordToggle.node('login-password').type,'password');
const invalid=page('login.html');invalid.node('login-password').value='short!1';invalid.node('mobile-login-form').fire('submit');
assert(invalid.document.querySelector('.login-toast').textContent.includes('12자'));assert(!invalid.location.href.startsWith('./index'));
const lock=page('login.html');lock.node('login-password').value='wrongPassword123!';for(let i=0;i<5;i++)lock.node('mobile-login-form').fire('submit');assert(lock.node('login-id').disabled);
assert(page('login.html','',lock.storage).node('login-id').disabled);
const remembered=page('login.html');remembered.node('save-id').checked=true;remembered.node('mobile-login-form').fire('submit');
assert.equal(remembered.storage.localStorage.getItem('linq-customer-prototype-saved-identifier'),'fleet.admin@sejong-log.co.kr');
assert([...remembered.storage.localStorage.values.keys()].every(k=>k.startsWith('linq-customer-prototype-')));
for(const role of ['customer-owner','customer-employee'])for(const switchRole of [false,true]){
  const initialRole=switchRole?(role==='customer-owner'?'customer-employee':'customer-owner'):role;
  const p=page('signup.html',initialRole==='customer-employee'?'?role=customer_staff':'?role=customer_owner'),n=p.node;
  assert(n('signup-continue').disabled);n('signup-agree-all').checked=true;n('signup-agree-all').fire('change');assert(!n('signup-continue').disabled);n('signup-continue').fire('click');
  const roleInputs=p.document.querySelectorAll('input[name="signupRole"]');
  assert.equal(roleInputs.length,2);
  assert.equal(p.document.querySelector('input[name="signupRole"]:checked').value,initialRole);
  assert(p.document.querySelector('.signup-role-field').closest('[aria-labelledby="role-section-title"]'));
  if(switchRole){
    n('signup-name').value='유지할 이름';n('signup-company').value='전환 전 업체';
    roleInputs.forEach(input=>{input.checked=input.value===role;});
    roleInputs.find(input=>input.checked).fire('change');
    assert.equal(n('signup-name').value,'유지할 이름');assert.equal(n('signup-company').value,'');
  }
  for(const id of ['signup-region','signup-dealer','signup-representative','signup-equipment-serial','signup-terminal-serial'])assert.equal(n(id),undefined,'Obsolete customer signup field removed: '+id);
  for(const field of p.document.querySelectorAll('[data-required]'))if(!field.closest('[hidden]'))field.value='filled';
  n('signup-user-id').value=role==='customer-owner'?'new.owner':'new.staff';n('signup-check-id').fire('click');
  n('signup-name').value='김가입';n('signup-email').value=role+'@example.com';n('signup-send-email').fire('click');n('signup-email-code').value='123456';n('signup-verify-email').fire('click');
  n('signup-phone').value='01012345678';n('signup-password').value='newPassword123!';n('signup-password-confirm').value='newPassword123!';
  n('signup-company').value=role==='customer-owner'?'(주)세종물류중부지점':'세종';n('signup-company').fire('input');
  if(role==='customer-employee'){
    n('signup-form').fire('submit');assert(n('signup-complete').hidden,'Staff must select an existing company, including after changing role');
    assert(p.document.querySelector('[data-error-for="signup-company"]').textContent.includes('등록된 업체'));
    n('signup-company-list').children.find(c=>c.tagName==='BUTTON').fire('click');
  }
  if(role==='customer-owner')assert(n('signup-company-list').hidden,'Owner uses plain company input and permits same trade name');
  n('signup-form').fire('submit');assert(!n('signup-complete').hidden);assert(n('signup-vehicle-help').textContent.includes(role==='customer-owner'?'차량을 등록하고 승인':'소속 업체 대표'));
  assert.equal(n('signup-password').value,'');assert.equal(n('signup-password-confirm').value,'');
  const saved=JSON.parse(p.storage.sessionStorage.getItem('linq-customer-onboarding-v1')),mobileRole=role==='customer-owner'?'customer_owner':'customer_staff';
  assert.equal(saved.profile.role,mobileRole);assert.equal(saved.profile.approvedVehicleCount,0);assert.equal(saved.active,true);assert.equal(saved.requests.length,0);
  assert.deepEqual(Object.keys(saved.profile).sort(),['approvedVehicleCount','company','email','name','role','userId']);
  assert(!JSON.stringify(saved).includes('newPassword123!'));
  n('signup-next').fire('click');assert.equal(p.location.href,'./index.html#'+(role==='customer-owner'?'vehicleRegistration':'vehicleRequired')+'?role='+mobileRole);
  const login=page('login.html','',p.storage);login.node('login-id').value=saved.profile.userId;login.node('mobile-login-form').fire('submit');assert.equal(login.location.href,'./index.html#vehicleRequired?role='+mobileRole);
}
const recovery=page('find-password.html','?role=customer_staff');recovery.node('recovery-identify-form').fire('submit');recovery.node('recovery-send').fire('click');recovery.node('recovery-code').value='000000';recovery.node('recovery-verify-form').fire('submit');assert(recovery.document.querySelector('.login-toast').textContent.includes('일치하지'));
recovery.node('recovery-code').value='123456';recovery.node('recovery-verify-form').fire('submit');const temp=recovery.node('temporary-password').textContent;assert(temp.length>=12);assert.equal(recovery.storage.sessionStorage.getItem('linq-customer-prototype-force-password-change'),null);
const tempLogin=page('login.html','?role=customer_staff',recovery.storage);assert(tempLogin.node('forced-password-panel').hidden);tempLogin.node('mobile-login-form').fire('submit');assert(!tempLogin.node('forced-password-panel').hidden);
tempLogin.node('forced-password').value='differentPass123!';tempLogin.node('forced-password-confirm').value='differentPass123!';tempLogin.node('forced-password-form').fire('submit');assert.equal(tempLogin.location.href,'./index.html#home?role=customer_staff');assert.equal(recovery.storage.sessionStorage.getItem('linq-customer-prototype-temporary-password'),null);
assert.equal(tempLogin.node('forced-password').value,'');assert(![...recovery.storage.sessionStorage.values.values()].some(v=>v.includes('differentPass123!')));
const expiry=page('find-password.html');expiry.node('recovery-identify-form').fire('submit');expiry.node('recovery-send').fire('click');expiry.tick(180);expiry.node('recovery-code').value='123456';expiry.node('recovery-verify-form').fire('submit');assert(expiry.document.querySelector('[data-recovery-stage="3"]').hidden);
// r110: the WEB hint and accepted identifier formats must stay aligned.
const webIdHint='이메일 형식 또는 아이디 (영어, 숫자 6자리 이상)';
for(const role of ['customer_owner','customer_staff']){
  const p=page('signup.html','?role='+role),id=p.node('signup-user-id'),status=p.node('signup-user-id-status');
  p.node('signup-agree-all').checked=true;p.node('signup-agree-all').fire('change');p.node('signup-continue').fire('click');
  assert.equal(id.getAttribute('placeholder'),webIdHint);
  for(const [value,valid] of [['user@example.com',true],['a@b.c',true],['abcdef',true],['123456',true],['a.b_-1',true],['abc12',false],['______',false],['user@',false],['a b@example.com',false],['한글아이디',false]]){
    id.value=value;id.fire('input');p.node('signup-check-id').fire('click');
    assert.equal(id.getAttribute('aria-invalid'),String(!valid),role+': '+value);
    assert.equal(status.textContent,valid?'사용할 수 있는 사용자 ID입니다.':'');
  }
  id.value='user@example.com';id.fire('input');p.node('signup-check-id').fire('click');
  id.value='changed@example.com';id.fire('input');assert.equal(status.textContent,'','Editing a verified ID clears verification');
  p.node('signup-form').fire('submit');assert(p.document.querySelector('[data-error-for="signup-user-id"]').textContent.includes('중복확인'));
}
for(const file of ['login.html','find-password.html','signup.html'])assert(!/dealer-employee|ROLE_DEALER/.test(read(file)));
for(const file of ['login.js','signup.js','find-password.js'])assert(!/fetch\s*\(|XMLHttpRequest/.test(read(file)));
console.log('PASS: customer login, 12-character validation, retry lock, remembered ID, WEB-aligned signup fields/completion, own account without passwords or demo fleet, email code/expiry, temporary password and forced change. No real auth/mail/SMS calls.');
