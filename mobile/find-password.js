(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  // Existing dealer UI, customer-only local authentication state.
  const auth=window.CustomerAuthCommon,role=auth.role(window.location.search),key=auth.key;
  ['temporary-password','temporary-expires','temporary-identifier','force-password-change'].forEach(name=>{try{sessionStorage.removeItem(key(name));}catch{}});
  let reached=1;
  let sentEmail='';
  let identifier='';
  document.querySelectorAll('a[href="./login.html"], a[href="./signup.html"]').forEach(link=>{link.href+='?role='+role;});
  let remaining = 0;
  let timerId = 0;

  function showToast(message) {
    const toast = $('.login-toast');
    toast.textContent = message;
    toast.hidden = false;
    window.setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function showStep(step) {
    $$('[data-recovery-stage]').forEach(stage => { stage.hidden = Number(stage.dataset.recoveryStage) !== step; });
    $('.recovery-links').hidden = step === 3;
    $$('[data-recovery-step]').forEach(button => {
      const number = Number(button.dataset.recoveryStep);
      button.classList.toggle('is-active', number === step);
      button.classList.toggle('is-complete', number < step);
      button.disabled=number>reached;
      if(number===step)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'instant'});
    window.lucide?.createIcons({attrs:{'stroke-width':2}});
  }

  function drawTimer() {
    $('#recovery-timer').textContent = `${String(Math.floor(remaining / 60)).padStart(2,'0')}:${String(remaining % 60).padStart(2,'0')}`;
  }

  function startTimer() {
    if (timerId) window.clearInterval(timerId);
    remaining = 180;
    drawTimer();
    timerId = window.setInterval(() => {
      remaining -= 1;
      drawTimer();
      if (remaining <= 0) { window.clearInterval(timerId); showToast('인증 시간이 만료되었습니다. 다시 발송해 주세요.'); }
    }, 1000);
  }

  $$('[data-recovery-step]').forEach(button => button.addEventListener('click', () => {
    const step = Number(button.dataset.recoveryStep);
    if (step<=reached)showStep(step);
  }));
  $('#recovery-identify-form').addEventListener('submit', event => {
    event.preventDefault();if(!event.target.reportValidity())return;
    identifier=$('#recovery-identifier').value.trim();if(!identifier)return;
    reached=2;showStep(2);
  });
  $('#recovery-send').addEventListener('click', () => {
    const email=$('#recovery-email').value.trim();
    if(!$('#recovery-name').value.trim()||!auth.email.test(email))return showToast('이름과 등록 이메일을 확인해 주세요.');
    sentEmail=email;$('#recovery-code').value='';startTimer();showToast('인증 코드 발송 시연입니다. 실제 이메일은 발송되지 않습니다.');
  });
  $('#recovery-email').addEventListener('input',()=>{sentEmail='';remaining=0;if(timerId)window.clearInterval(timerId);drawTimer();});
  $('#recovery-verify-form').addEventListener('submit', event => {
    event.preventDefault();
    if(!sentEmail||remaining<=0||sentEmail!==$('#recovery-email').value.trim())return showToast('인증 코드를 발송한 뒤 유효시간 내에 확인해 주세요.');
    if($('#recovery-code').value.trim()!=='123456')return showToast('인증 코드가 일치하지 않습니다.');
    const preview=auth.recoveryPreview.issue(identifier);
    if(!preview||preview.marker.identifier!==sentEmail.toLowerCase())return showToast('이 계정은 비밀번호 찾기 시연 데이터에 등록되어 있지 않습니다.');
    try{sessionStorage.setItem(key('recovery-preview'),JSON.stringify(preview.marker));}
    catch{return showToast('시연 상태를 저장하지 못했습니다. 다시 시도해 주세요.');}
    $('#temporary-password').textContent=preview.password;
    reached=3;
    if (timerId) window.clearInterval(timerId);
    showStep(3);
  });
  $('#copy-temporary-password').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('#temporary-password').textContent); showToast('임시 비밀번호를 복사했습니다.'); }
    catch { showToast('복사하지 못했습니다. 화면의 시연 비밀번호를 직접 입력해 주세요.'); }
  });
  window.addEventListener('beforeunload', () => { if (timerId) window.clearInterval(timerId); });

  showStep(1);
  window.lucide?.createIcons({attrs:{'stroke-width':2}});
})();
