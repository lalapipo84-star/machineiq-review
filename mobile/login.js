(() => {
  const $=selector=>document.querySelector(selector);
  const form=$('#mobile-login-form'),idInput=$('#login-id'),passwordInput=$('#login-password');
  const saveId=$('#save-id'),toggle=$('#password-toggle'),toast=$('.login-toast');
  const auth=window.CustomerAuthCommon,role=auth.role(window.location.search),key=auth.key;
  const dormant=window.CustomerDormantLogin.createPreview();
  const read=name=>{try{return sessionStorage.getItem(key(name));}catch{return null;}};
  const remove=name=>{try{sessionStorage.removeItem(key(name));}catch{}};
  const write=(name,value)=>{try{sessionStorage.setItem(key(name),value);return true;}catch{return false;}};
  const clearLegacy=()=>['temporary-password','temporary-expires','temporary-identifier','force-password-change'].forEach(remove);
  // Retire old plaintext/autofill state rather than importing it into this flow.
  clearLegacy();
  const recoveryMarker=()=>{try{return JSON.parse(read('recovery-preview'));}catch{return null;}};
  const passwordRule=auth.password,submit=form.querySelector('[type="submit"]');
  let attempts=Math.max(0,Number(read('login-attempts'))||0),toastTimer,forcedContext=null;
  const forced=$('#forced-password-panel'),forcedForm=$('#forced-password-form');
  const dialog=$('#dormant-login-dialog'),dialogPrimary=$('#dormant-login-primary'),dialogCancel=$('#dormant-login-cancel');
  let dialogIdentifier='',dialogGeneration=0;
  function lock(){[idInput,passwordInput,saveId,submit].forEach(input=>input.disabled=attempts>=5);}
  function showToast(message){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toast.hidden=true;},2200);}
  function clearPassword(){passwordInput.value='';passwordInput.type='password';toggle.setAttribute('aria-label','비밀번호 표시');toggle.innerHTML='<i data-lucide="eye"></i>';window.lucide?.createIcons({attrs:{'stroke-width':2}});}
  function rememberIdentifier(identifier){try{if(saveId.checked)localStorage.setItem(key('saved-identifier'),identifier);else localStorage.removeItem(key('saved-identifier'));}catch{showToast('아이디 저장을 사용할 수 없습니다.');}}
  function goHome(identifier){
    const account=window.CustomerOnboarding?.login(identifier);
    if(account===false){showLogin();return showToast('로그인 상태를 저장하지 못했습니다. 다시 시도해 주세요.');}
    const activeRole=account?.role||role;
    if(!write('authenticated-role',activeRole)){showLogin();return showToast('로그인 상태를 저장하지 못했습니다. 다시 시도해 주세요.');}
    window.location.href='./index.html#'+(account?.approvedVehicleCount===0?'vehicleRequired':'home')+'?role='+activeRole;
  }
  function showLogin(){forcedContext=null;forced.hidden=true;form.hidden=false;$('.login-card__head').hidden=false;$('#forced-password').value='';$('#forced-password-confirm').value='';clearPassword();}
  function showForced(origin,identifier,temporary){forcedContext={origin,identifier,temporary};clearPassword();form.hidden=true;$('.login-card__head').hidden=true;forced.hidden=false;$('#forced-password').focus();}
  function closeDormant(keepIssued=false){
    dialogGeneration+=1;
    if(!keepIssued)dormant.invalidate();
    dialogIdentifier='';dialog.dataset.state='closed';dialog.setAttribute('aria-busy','false');
    if(dialog.open)dialog.close();
    clearPassword();passwordInput.focus();
  }
  function showDormantState(state){
    dialog.dataset.state=state;dialog.setAttribute('aria-busy',String(state==='sending'));
    dialogPrimary.disabled=state==='sending';dialogCancel.hidden=['sent','rateLimited'].includes(state);
    $('#dormant-login-status').hidden=!['sending','sent','failed','rateLimited'].includes(state);
    const content={
      confirm:['휴면계정 안내','휴면계정입니다. 등록된 이메일로 임시 비밀번호를 받으시겠습니까?','','임시 비밀번호 받기'],
      sending:['임시 비밀번호 발송','등록된 이메일로 임시 비밀번호 발송을 요청하고 있습니다.','발송 요청 중입니다. 잠시 기다려 주세요.','발송 요청 중'],
      sent:['임시 비밀번호 발송 접수','등록된 이메일로 임시 비밀번호 발송이 접수된 상황입니다.','임시 비밀번호를 받은 뒤 로그인 화면에서 직접 입력해 주세요. 발송만으로 로그인되지는 않습니다.','로그인으로'],
      failed:['임시 비밀번호 발송 실패','임시 비밀번호 발송 요청을 처리하지 못했습니다.','잠시 후 다시 시도해 주세요. 로그인 상태는 변경되지 않았습니다.','다시 시도'],
      rateLimited:['발송 요청 제한','발송 요청이 많아 지금은 임시 비밀번호를 요청할 수 없습니다.','잠시 후 다시 시도해 주세요. 정확한 재시도 가능 시각은 서버 연동 후 안내합니다.','로그인으로']
    }[state];
    $('#dormant-login-title').textContent=content[0];$('#dormant-login-description').textContent=content[1];$('#dormant-login-status').textContent=content[2];dialogPrimary.textContent=content[3];
  }
  function openDormant(identifier,maskedEmail){
    dormant.invalidate();dialogGeneration+=1;dialogIdentifier=identifier;
    $('#dormant-login-email').textContent='등록 이메일: '+maskedEmail;
    showDormantState('confirm');dialog.showModal();dialogCancel.focus();
  }
  dialogCancel.addEventListener('click',()=>closeDormant());
  dialog.addEventListener('cancel',event=>{event.preventDefault();closeDormant();});
  dialog.addEventListener('click',event=>{if(event.target===dialog)closeDormant();});
  dialogPrimary.addEventListener('click',async()=>{
    const state=dialog.dataset.state;
    if(state==='sent'||state==='rateLimited')return closeDormant(state==='sent');
    if(!dialog.open||!['confirm','failed'].includes(state))return;
    const identifier=dialogIdentifier,generation=dialogGeneration;
    showDormantState('sending');
    let result;
    try{result=await dormant.request(identifier);}catch{result={kind:'failed'};}
    // Cancellation, navigation and edited identifiers discard late responses.
    if(!dialog.open||generation!==dialogGeneration||dialogIdentifier!==identifier||result?.kind==='stale')return;
    showDormantState(['sent','failed','rateLimited'].includes(result?.kind)?result.kind:'failed');
    dialogPrimary.focus();
  });
  idInput.addEventListener('input',()=>{dormant.invalidate();if(dialog.open)closeDormant();if(forcedContext)showLogin();});
  window.addEventListener('pagehide',()=>{dormant.clear();dialogGeneration+=1;dialogIdentifier='';if(dialog.open)dialog.close();dialog.dataset.state='closed';showLogin();});
  document.querySelectorAll('a[href="./find-password.html"], a[href="./signup.html"]').forEach(link=>{link.href+='?role='+role;});
  try{const savedId=localStorage.getItem(key('saved-identifier'));if(savedId)idInput.value=savedId;}catch{}
  lock();
  forcedForm.addEventListener('submit',event=>{
    event.preventDefault();
    const next=$('#forced-password'),confirm=$('#forced-password-confirm'),context=forcedContext;
    if(!context)return showToast('임시 비밀번호로 먼저 로그인해 주세요.');
    const valid=context.origin==='dormant'?dormant.inspect(context.identifier,context.temporary)?.kind==='temporary':auth.recoveryPreview.matches(recoveryMarker(),context.identifier,context.temporary);
    if(!valid){dormant.clear();remove('recovery-preview');showLogin();return showToast('임시 비밀번호가 만료되었습니다. 다시 요청해 주세요.');}
    if(!passwordRule.test(next.value))return showToast('비밀번호는 영문·숫자·특수문자를 포함해 12자 이상 입력해 주세요.');
    if(next.value!==confirm.value)return showToast('새 비밀번호가 일치하지 않습니다.');
    if(next.value===context.temporary)return showToast('임시 비밀번호와 다른 비밀번호를 입력해 주세요.');
    if(context.origin==='dormant'&&!dormant.finishChange(context.identifier)){showLogin();return showToast('임시 비밀번호가 만료되었습니다. 다시 요청해 주세요.');}
    // UI preview completion only: no account activation/password-update API.
    remove('recovery-preview');clearLegacy();forcedContext=null;
    next.value='';confirm.value='';clearPassword();
    if(context.origin==='dormant'){showLogin();passwordInput.focus();return showToast('변경 시연을 완료했습니다. 새 비밀번호로 다시 로그인해 주세요.');}
    goHome(context.identifier);
  });
  toggle.addEventListener('click',()=>{
    const visible=passwordInput.type==='text';passwordInput.type=visible?'password':'text';
    toggle.setAttribute('aria-label',visible?'비밀번호 표시':'비밀번호 숨기기');toggle.innerHTML='<i data-lucide="'+(visible?'eye':'eye-off')+'"></i>';
    window.lucide?.createIcons({attrs:{'stroke-width':2}});
  });
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(attempts>=5)return showToast('비밀번호를 5회 연속 잘못 입력하여 계정이 잠겼습니다.');
    if(dialog.open||forcedContext)return;
    const identifier=idInput.value.trim(),password=passwordInput.value;
    if(!form.reportValidity())return;
    if(!auth.userId(identifier))return showToast('사용자 ID 또는 이메일을 확인해 주세요.');
    if(!passwordRule.test(password))return showToast('비밀번호는 영문·숫자·특수문자를 포함해 12자 이상 입력해 주세요.');
    const preview=dormant.inspect(identifier,password);
    if(preview?.kind==='blocked')return showToast(preview.message);
    if(preview?.kind==='dormant')return openDormant(identifier,preview.maskedEmail);
    const recovery=!preview&&auth.recoveryPreview.matches(recoveryMarker(),identifier,password);
    const temporary=preview?.kind==='temporary';
    if(preview?.kind==='invalid'||(!temporary&&!recovery&&password!=='password12!@')){
      attempts+=1;write('login-attempts',String(attempts));lock();return showToast(attempts>=5?'계정이 잠겼습니다. 관리자에게 문의해 주세요.':'비밀번호가 일치하지 않습니다.');
    }
    attempts=0;remove('login-attempts');rememberIdentifier(identifier);
    if(temporary||recovery)return showForced(temporary?'dormant':'recovery',identifier,password);
    dormant.clear();goHome(identifier);
  });
  window.lucide?.createIcons({attrs:{'stroke-width':2}});
})();
