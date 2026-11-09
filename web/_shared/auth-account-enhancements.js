(function () {
  'use strict';
  var MIQCommon = window.MIQCommon || {view:{
    get:function(node,prop){return node[prop];},
    set:function(node,prop,value){node[prop]=value;return value;},
    call:function(node,method,args){return node[method].apply(node,args);}
  }};

  var doc = document;
  var body = doc.body;
  var PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;
  var EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function one(selector, root) { return (root || doc).querySelector(selector); }
  function all(selector, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(selector)); }
  function storageGet(store, key) {
    try { return store.getItem(key); } catch (error) { return null; }
  }
  function storageSet(store, key, value) {
    try { store.setItem(key, value); } catch (error) { /* local prototype may block storage */ }
  }
  function storageRemove(store, key) {
    try { store.removeItem(key); } catch (error) { /* local prototype may block storage */ }
  }
  function visible(element) {
    if (!element || element.disabled) return false;
    return !element.closest('[hidden]');
  }
  function setAlert(element, message, kind) {
    if (!element) return;
    MIQCommon.view.set(element,"textContent",message || '');
    element.hidden = !message;
    element.className = 'aae-alert' + (kind ? ' is-' + kind : '');
  }
  function errorFor(input, message) {
    if (!input) return false;
    MIQCommon.view.call(input,"setAttribute",['aria-invalid',message ? 'true' : 'false']);
    var error = input.id ? one('[data-error-for="' + input.id + '"]') : null;
    if (error) MIQCommon.view.set(error,"textContent",message || '');
    return !message;
  }
  function clearErrors(root) {
    all('[aria-invalid="true"]', root).forEach(function (element) { MIQCommon.view.call(element,"setAttribute",['aria-invalid','false']); });
    all('[data-error-for]', root).forEach(function (element) { MIQCommon.view.set(element,"textContent",''); });
  }
  function focusFirstInvalid(root) {
    var target = one('[aria-invalid="true"]', root);
    if (target) target.focus();
  }
  function bindPasswordToggles(root) {
    all('[data-password-toggle]', root).forEach(function (button) {
      button.addEventListener('click', function () {
        var input = doc.getElementById(MIQCommon.view.call(button,"getAttribute",['data-password-toggle']));
        if (!input) return;
        var showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        MIQCommon.view.set(button,"textContent",showing ? '표시' : '숨김');
        MIQCommon.view.call(button,"setAttribute",['aria-pressed',showing ? 'false' : 'true']);
        input.focus();
      });
    });
  }

  function initLogin() {
    var form = one('#loginForm');
    if (!form) return;
    var identifier = one('#loginIdentifier');
    var password = one('#loginPassword');
    var remember = one('#rememberIdentifier');
    var status = one('#loginStatus');
    var retry = one('#loginRetry');
    var submit = one('#loginSubmit');
    var forced = one('#forcedPasswordPanel');
    var forcedForm = one('#forcedPasswordForm');
    var attempts = Number(storageGet(sessionStorage, 'miq-login-attempts') || 0);
    var savedIdentifier = storageGet(localStorage, 'miq-saved-identifier');
    var temporaryPassword = storageGet(sessionStorage, 'miq-temporary-password');

    if (savedIdentifier) {
      identifier.value = savedIdentifier;
      remember.checked = true;
    }
    if (temporaryPassword) password.value = temporaryPassword;

    function renderAttempts() {
      var remaining = Math.max(0, 5 - attempts);
      MIQCommon.view.set(retry,"innerHTML",attempts ? '<span>로그인 실패 <strong data-i18n-key="auth.attemptCount" data-count="'+attempts+'">' + attempts + '회</strong></span><span data-i18n-key="auth.remainingAttempts" data-count="'+remaining+'">남은 시도 ' + remaining + '회</span>' : '');
      retry.hidden = attempts === 0;
      var locked = attempts >= 5;
      identifier.disabled = locked;
      password.disabled = locked;
      remember.disabled = locked;
      submit.disabled = locked;
      one('#loginLocked').hidden = !locked;
      if (locked) setAlert(status, '비밀번호를 5회 연속 잘못 입력하여 계정이 잠겼습니다.', 'danger');
    }

    function openForcedChange() {
      form.hidden = true;
      one('#loginLinks').hidden = true;
      forced.hidden = false;
      one('#forcedPassword').focus();
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors(form);
      if (attempts >= 5) return;
      var idValue = identifier.value.trim();
      var passwordValue = password.value;
      var valid = true;
      if (!(EMAIL_RULE.test(idValue) || /^(?=.*[A-Za-z0-9])[A-Za-z0-9._-]{6,}$/.test(idValue))) {
        errorFor(identifier, '사용자 ID 또는 이메일을 올바르게 입력해 주세요.');
        valid = false;
      }
      if (!PASSWORD_RULE.test(passwordValue)) {
        errorFor(password, '12자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다.');
        valid = false;
      }
      if (!valid) { focusFirstInvalid(form); return; }

      var accepted = passwordValue === 'password12!@' || (temporaryPassword && passwordValue === temporaryPassword);
      if (!accepted) {
        attempts += 1;
        storageSet(sessionStorage, 'miq-login-attempts', String(attempts));
        renderAttempts();
        if (attempts < 5) setAlert(status, '비밀번호가 일치하지 않습니다. 다시 확인해 주세요.', 'danger');
        password.focus();
        password.select();
        return;
      }

      if (remember.checked) storageSet(localStorage, 'miq-saved-identifier', idValue);
      else storageRemove(localStorage, 'miq-saved-identifier');
      storageRemove(sessionStorage, 'miq-login-attempts');
      attempts = 0;
      renderAttempts();

      if (temporaryPassword && passwordValue === temporaryPassword) {
        storageSet(sessionStorage, 'miq-force-password-change', 'true');
        openForcedChange();
        return;
      }
      var access = window.MIQCustomerAccess;
      var account = access ? access.login(idValue) : null;
      var needsVehicle = account && access.requiresVehicle(account.role);
      setAlert(status, needsVehicle ? '인증되었습니다. 차량 등록 안내로 이동합니다.' : '인증되었습니다. 대시보드로 이동합니다.', 'success');
      window.setTimeout(function () { location.href = account ? access.url(needsVehicle ? 'required' : 'dashboard', account.role) : '../Dashboard/group-dashboard-tobe-v2.html'; }, 350);
    });

    if (forcedForm) {
      forcedForm.addEventListener('submit', function (event) {
        event.preventDefault();
        clearErrors(forcedForm);
        var next = one('#forcedPassword');
        var confirm = one('#forcedPasswordConfirm');
        var ok = true;
        if (!PASSWORD_RULE.test(next.value)) {
          errorFor(next, '12자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다.');
          ok = false;
        }
        if (confirm.value !== next.value) {
          errorFor(confirm, '새 비밀번호가 일치하지 않습니다.');
          ok = false;
        }
        if (temporaryPassword && next.value === temporaryPassword) {
          errorFor(next, '임시 비밀번호와 다른 비밀번호를 입력해 주세요.');
          ok = false;
        }
        if (!ok) { focusFirstInvalid(forcedForm); return; }
        storageRemove(sessionStorage, 'miq-temporary-password');
        storageRemove(sessionStorage, 'miq-force-password-change');
        setAlert(one('#forcedPasswordStatus'), '비밀번호가 변경되었습니다. 대시보드로 이동합니다.', 'success');
        window.setTimeout(function () { location.href = '../Dashboard/group-dashboard-tobe-v2.html'; }, 450);
      });
    }

    renderAttempts();
    if (storageGet(sessionStorage, 'miq-force-password-change') === 'true' && temporaryPassword) openForcedChange();
  }

  function initPasswordRecovery() {
    var root = one('[data-recovery-flow]');
    if (!root) return;
    var stepButtons = all('[data-recovery-step]', root);
    var stages = all('[data-recovery-stage]', root);
    var maxStep = 1;
    var currentStep = 1;
    var timerId = null;
    var remaining = 180;
    var recoveryIdentifier = '';

    function go(step) {
      if (step > maxStep) return;
      currentStep = step;
      stages.forEach(function (stage) { stage.hidden = Number(stage.dataset.recoveryStage) !== step; });
      stepButtons.forEach(function (button) {
        var number = Number(button.dataset.recoveryStep);
        button.removeAttribute('aria-current');
        button.classList.toggle('is-complete', number < currentStep);
        button.disabled = number > maxStep || number === currentStep;
        if (number === currentStep) MIQCommon.view.call(button,"setAttribute",['aria-current','step']);
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var first = one('input:not([disabled]), button:not([disabled])', stages[step - 1]);
      if (first) first.focus();
    }

    stepButtons.forEach(function (button) {
      button.addEventListener('click', function () { go(Number(button.dataset.recoveryStep)); });
    });

    one('#recoveryIdentifyForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var input = one('#recoveryIdentifier');
      errorFor(input, '');
      recoveryIdentifier = input.value.trim();
      if (!(EMAIL_RULE.test(recoveryIdentifier) || /^(?=.*[A-Za-z0-9])[A-Za-z0-9._-]{6,}$/.test(recoveryIdentifier))) {
        errorFor(input, '등록한 사용자 ID 또는 이메일을 입력해 주세요.');
        input.focus();
        return;
      }
      var email = one('#recoveryEmail');
      if (EMAIL_RULE.test(recoveryIdentifier)) email.value = recoveryIdentifier;
      maxStep = Math.max(maxStep, 2);
      go(2);
    });

    function drawTimer() {
      var minute = String(Math.floor(remaining / 60)).padStart(2, '0');
      var second = String(remaining % 60).padStart(2, '0');
      MIQCommon.view.set(one('#recoveryTimer'),"textContent",minute + ':' + second);
      one('#recoveryTimerBar').style.width = ((remaining / 180) * 100) + '%';
    }
    function stopTimer() {
      if (timerId) window.clearInterval(timerId);
      timerId = null;
    }
    function startTimer() {
      stopTimer();
      remaining = 180;
      drawTimer();
      timerId = window.setInterval(function () {
        remaining -= 1;
        drawTimer();
        if (remaining <= 0) {
          stopTimer();
          one('#recoveryVerify').disabled = true;
          setAlert(one('#recoveryMailStatus'), '인증 시간이 만료되었습니다. 재발송해 주세요.', 'danger');
        }
      }, 1000);
    }
    function sendCode(isResend) {
      var name = one('#recoveryName');
      var email = one('#recoveryEmail');
      errorFor(name, '');
      errorFor(email, '');
      var ok = true;
      if (!name.value.trim()) { errorFor(name, '이름을 입력해 주세요.'); ok = false; }
      if (!EMAIL_RULE.test(email.value.trim())) { errorFor(email, '이메일 형식을 확인해 주세요.'); ok = false; }
      if (!ok) { focusFirstInvalid(one('#recoveryVerifyForm')); return; }
      one('#recoveryCode').disabled = false;
      one('#recoveryVerify').disabled = false;
      one('#recoveryResend').disabled = false;
      one('#recoverySend').disabled = true;
      startTimer();
      setAlert(one('#recoveryMailStatus'), (isResend ? '인증 코드를 다시 발송했습니다.' : '인증 코드를 발송했습니다.'), 'info');
      one('#recoveryCode').focus();
    }
    one('#recoverySend').addEventListener('click', function () { sendCode(false); });
    one('#recoveryResend').addEventListener('click', function () { sendCode(true); });
    one('#recoveryVerifyForm').addEventListener('submit', function (event) {
      event.preventDefault();
      var code = one('#recoveryCode');
      if (code.disabled) {
        sendCode(false);
        return;
      }
      errorFor(code, '');
      if (remaining <= 0) {
        errorFor(code, '인증 시간이 만료되었습니다. 재발송해 주세요.');
        return;
      }
      if (code.value.trim() !== '123456') {
        errorFor(code, '인증 코드가 일치하지 않습니다.');
        code.focus();
        return;
      }
      stopTimer();
      var random = Math.random().toString(36).slice(2, 6).toUpperCase();
      var temp = 'MIQ-' + (Math.floor(1000 + Math.random() * 9000)) + '-' + random + '!';
      MIQCommon.view.set(one('#temporaryPassword'),"textContent",temp);
      storageSet(sessionStorage, 'miq-temporary-password', temp);
      storageSet(sessionStorage, 'miq-force-password-change', 'true');
      if (recoveryIdentifier) storageSet(localStorage, 'miq-saved-identifier', recoveryIdentifier);
      maxStep = 3;
      go(3);
    });
    one('#copyTemporaryPassword').addEventListener('click', function () {
      var value = MIQCommon.view.get(one('#temporaryPassword'),"textContent");
      var copyStatus = one('#temporaryCopyStatus');
      function done() { setAlert(copyStatus, '임시 비밀번호를 복사했습니다.', 'success'); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done).catch(function () {
          window.prompt('임시 비밀번호를 복사하세요.', value);
        });
      } else {
        window.prompt('임시 비밀번호를 복사하세요.', value);
      }
    });
    window.addEventListener('beforeunload', stopTimer);
    go(1);
  }

  var countryData = {
    // WEB: /api/common/country snapshot (2026-09-27). App reference unchanged.
    KR: { code: '+82', region: body.dataset.registrationMode === 'app' ? 'ALAO' : 'KOREA' }, US: { code: '+1', region: 'ALAO' },
    CN: { code: '+86', region: 'ALAO' }, JP: { code: '+81', region: 'ALAO' },
    DE: { code: '+49', region: 'EMEA' }, AU: { code: '+61', region: 'ALAO' },
    GB: { code: '+44', region: 'EMEA' }, FR: { code: '+33', region: 'EMEA' }
  };
  var dealerData = {
    ALAO: ['두산밥캣코리아 서울남', '두산밥캣코리아 경기', 'Bobcat of Los Angeles', 'Bobcat of New York', 'Bobcat China - Beijing', 'Bobcat Japan - Tokyo', 'Bobcat Australia - Sydney'],
    EMEA: ['Bobcat Germany - Munich', 'Bobcat Germany - Berlin', 'Bobcat UK - London', 'Bobcat UK - Manchester', 'Bobcat France - Paris', 'Bobcat France - Lyon']
  };
  // Country membership of the existing demonstration dealer catalog.
  var countryDealerIndexes = { KR:[0,1], US:[2,3], CN:[4], JP:[5], AU:[6], DE:[0,1], GB:[2,3], FR:[4,5] };
  // Reuse the Korean demo dealer entries; real IDs/list come from /common/dealer.
  dealerData.KOREA = dealerData.ALAO.slice(0, 2);
  var companyData = [
    '대한물류 주식회사', '대한건설기계', '한국지게차렌탈', '서울종합물류', '경기중공업',
    '부산항만물류', '인천국제물류센터', '삼성SDS 물류', 'CJ대한통운', '한진물류',
    '롯데글로벌로지스', '쿠팡풀필먼트', 'Doosan Logistics', 'Bobcat Demo Company', 'Global Material Handling'
  ];

  function initRegistration() {
    var root = one('[data-registration-flow]');
    if (!root) return;
    var isApp = body.dataset.registrationMode === 'app';
    var agreeStep = one('#registrationAgreement');
    var formStep = one('#registrationDetails');
    var stepButtons = all('[data-registration-step]');
    var requiredTerms = all('[data-term-required="true"]');
    var allTerms = all('[data-term]');
    var continueButton = one('#registrationContinue');
    // A missing legal-copy bundle must not make an empty required list pass.
    if (!isApp && (requiredTerms.length !== 4 || allTerms.length !== 6)) {
      continueButton.disabled = true;
      setAlert(one('#agreementStatus'), '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 'danger');
      return;
    }
    var allCheckbox = one('#registrationAgreeAll');
    var currentStep = 'agreement';
    var emailTimer = null;
    var emailRemaining = 0;

    function requiredTermsAccepted() { return requiredTerms.every(function (checkbox) { return checkbox.checked; }); }
    function updateAgreementState() {
      allCheckbox.checked = allTerms.every(function (checkbox) { return checkbox.checked; });
      allCheckbox.indeterminate = !allCheckbox.checked && allTerms.some(function (checkbox) { return checkbox.checked; });
      var accepted = requiredTermsAccepted();
      continueButton.disabled = !accepted;
      one('[data-registration-step="details"]').disabled = !accepted;
      setAlert(one('#agreementStatus'), accepted ? '필수 약관에 모두 동의했습니다.' : '', 'success');
    }
    function showRegistrationStep(step) {
      if (step === 'details' && !requiredTermsAccepted()) {
        setAlert(one('#agreementStatus'), '필수 약관 4개에 동의해야 정보 입력으로 이동할 수 있습니다.', 'danger');
        one('[data-term-required="true"]:not(:checked)').focus();
        return;
      }
      currentStep = step;
      agreeStep.hidden = step !== 'agreement';
      formStep.hidden = step !== 'details';
      stepButtons.forEach(function (button) {
        var active = button.dataset.registrationStep === step;
        if (active) MIQCommon.view.call(button,"setAttribute",['aria-current','step']);
        else button.removeAttribute('aria-current');
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      var target = step === 'details' ? one('#registrationUserId') : allCheckbox;
      if (target) target.focus();
    }

    allCheckbox.addEventListener('change', function () {
      allTerms.forEach(function (checkbox) { checkbox.checked = allCheckbox.checked; });
      updateAgreementState();
    });
    allTerms.forEach(function (checkbox) { checkbox.addEventListener('change', updateAgreementState); });
    continueButton.addEventListener('click', function () { showRegistrationStep('details'); });
    stepButtons.forEach(function (button) {
      button.addEventListener('click', function () { showRegistrationStep(button.dataset.registrationStep); });
    });
    all('.aae-agreement-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        var target = doc.getElementById(MIQCommon.view.call(button,"getAttribute",['aria-controls']));
        var willOpen = target.hidden;
        all('.aae-agreement__content').forEach(function (content) { content.hidden = true; });
        all('.aae-agreement-toggle').forEach(function (item) { MIQCommon.view.call(item,"setAttribute",['aria-expanded','false']); MIQCommon.view.set(item,"textContent",'열기'); });
        target.hidden = !willOpen;
        MIQCommon.view.call(button,"setAttribute",['aria-expanded',willOpen ? 'true' : 'false']);
        MIQCommon.view.set(button,"textContent",willOpen ? '닫기' : '열기');
      });
    });

    var country = one('#registrationCountry');
    var region = one('#registrationRegion');
    var dealer = one('#registrationDealer');
    var prefix = one('#registrationTelPrefix');
    function populateDealers(regionValue) {
      MIQCommon.view.set(dealer,"innerHTML",'<option value="">딜러를 선택하세요</option>');
      var names = dealerData[regionValue] || [];
      if (!isApp) names = (countryDealerIndexes[country.value] || []).map(function (index) { return names[index]; }).filter(Boolean);
      names.forEach(function (name) {
        var option = doc.createElement('option');
        option.value = name;
        MIQCommon.view.set(option,"textContent",name);
        dealer.appendChild(option);
      });
      MIQCommon.view.set(one('#registrationDealerHelp'),"textContent",regionValue ? (isApp ? regionValue : MIQCommon.view.get(country.options[country.selectedIndex],"textContent") + ' · ' + regionValue) + ' 딜러 ' + names.length + '개' : '국가를 먼저 선택해 주세요.');
      if (!isApp) dealer.disabled = roleValue() !== 'dealer-employee' || !names.length;
    }
    function applyCountry() {
      var value = countryData[country.value];
      MIQCommon.view.set(prefix,"textContent",value ? value.code : '+');
      region.value = value ? value.region : '';
      populateDealers(region.value);
      dealer.value = '';
    }
    country.addEventListener('change', applyCountry);
    if (isApp) region.addEventListener('change', function () { populateDealers(region.value); dealer.value = ''; });

    var companyInput = one('#registrationCompany');
    var companyList = one('#registrationCompanyList');
    var companyLabel = one('#registrationCompanyLabel');
    var companyHelp = one('#registrationCompanyHelp');
    var selectedCompany = '';
    var activeOption = -1;

    function roleValue() {
      var checked = one('input[name="registrationRole"]:checked');
      return checked ? checked.value : 'customer-owner';
    }
    function setRole(role, initializing) {
      all('[data-registration-roles]').forEach(function (field) {
        var enabled = field.dataset.registrationRoles.split(',').indexOf(role) > -1;
        field.hidden = !enabled;
        all('input, select, textarea', field).forEach(function (control) {
          control.disabled = !enabled;
          if (!enabled && !initializing) {
            if (control.type === 'checkbox' || control.type === 'radio') control.checked = false;
            else control.value = '';
          }
        });
      });
      selectedCompany = '';
      companyInput.value = '';
      companyList.hidden = true;
      if ((isApp && role !== 'customer-employee') || role === 'dealer-employee') {
        var mappedCountry = countryData[country.value];
        region.value = mappedCountry ? mappedCountry.region : '';
        populateDealers(region.value);
        dealer.value = '';
      }
      if (role === 'customer-owner') {
        MIQCommon.view.set(companyLabel,"textContent",'신규 업체명');
        MIQCommon.view.set(companyInput,"placeholder",'신규 업체명을 입력하세요');
        MIQCommon.view.set(companyHelp,"textContent",isApp ? '기존 업체와 중복되면 확인 메시지를 표시합니다.' : '업체명을 직접 입력해 주세요.');
      } else if (role === 'customer-employee') {
        MIQCommon.view.set(companyLabel,"textContent",'소속 업체');
        MIQCommon.view.set(companyInput,"placeholder",'2글자 이상 입력 후 소속 업체를 선택하세요');
        MIQCommon.view.set(companyHelp,"textContent",'등록된 업체 목록에서 선택해야 합니다.');
      }
      all('.aae-role').forEach(function (label) {
        label.classList.toggle('is-selected', !!one('input:checked', label));
      });
      if (!isApp) {
        MIQCommon.view.call(companyInput,"setAttribute",['role',role === 'customer-employee' ? 'combobox' : 'textbox']);
        MIQCommon.view.call(companyInput,"setAttribute",['aria-autocomplete',role === 'customer-employee' ? 'list' : 'none']);
        clearErrors(formStep);
      }
    }
    all('input[name="registrationRole"]').forEach(function (radio) {
      radio.addEventListener('change', function () { setRole(radio.value, false); });
    });

    function closeCompanyList() {
      companyList.hidden = true;
      MIQCommon.view.call(companyInput,"setAttribute",['aria-expanded','false']);
      activeOption = -1;
    }
    function chooseCompany(name) {
      companyInput.value = name;
      selectedCompany = name;
      closeCompanyList();
      MIQCommon.view.set(companyHelp,"textContent",'선택된 업체: ' + name);
      errorFor(companyInput, '');
    }
    function renderCompanies() {
      selectedCompany = '';
      if (!isApp && roleValue() !== 'customer-employee') { closeCompanyList(); return; }
      var query = companyInput.value.trim().toLowerCase();
      if (query.length < 2) { closeCompanyList(); return; }
      var matches = companyData.filter(function (name) { return name.toLowerCase().indexOf(query) > -1; });
      MIQCommon.view.set(companyList,"innerHTML",'');
      if (!matches.length) {
        var empty = doc.createElement('div');
        empty.className = 'aae-autocomplete-empty';
        MIQCommon.view.set(empty,"textContent",roleValue() === 'customer-owner' ? '기존 업체와 중복되지 않습니다. 신규 업체로 신청할 수 있습니다.' : '등록된 업체가 없습니다.');
        companyList.appendChild(empty);
      } else {
        matches.forEach(function (name) {
          var option = doc.createElement('button');
          option.type = 'button';
          option.className = 'aae-autocomplete-option';
          MIQCommon.view.call(option,"setAttribute",['role','option']);
          MIQCommon.view.set(option,"textContent",name);
          option.addEventListener('click', function () { chooseCompany(name); });
          companyList.appendChild(option);
        });
      }
      companyList.hidden = false;
      MIQCommon.view.call(companyInput,"setAttribute",['aria-expanded','true']);
    }
    companyInput.addEventListener('input', renderCompanies);
    companyInput.addEventListener('keydown', function (event) {
      var options = all('.aae-autocomplete-option', companyList);
      if (companyList.hidden || !options.length) return;
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        activeOption = event.key === 'ArrowDown' ? Math.min(options.length - 1, activeOption + 1) : Math.max(0, activeOption - 1);
        options.forEach(function (option, index) { option.classList.toggle('is-active', index === activeOption); });
      } else if (event.key === 'Enter' && activeOption > -1) {
        event.preventDefault();
        chooseCompany(MIQCommon.view.get(options[activeOption],"textContent"));
      } else if (event.key === 'Escape') {
        closeCompanyList();
      }
    });
    doc.addEventListener('click', function (event) { if (!event.target.closest('.aae-autocomplete')) closeCompanyList(); });

    var userId = one('#registrationUserId');
    var userIdStatus = one('#registrationUserIdStatus');
    one('#registrationCheckId').addEventListener('click', function () {
      var value = userId.value.trim();
      errorFor(userId, '');
      if (!EMAIL_RULE.test(value) && !/^(?=.*[A-Za-z0-9])[A-Za-z0-9._-]{6,}$/.test(value)) {
        errorFor(userId, '이메일 형식 또는 6자 이상의 영문·숫자 아이디를 입력해 주세요. 아이디에는 . _ -도 사용할 수 있습니다.');
        userId.focus();
        return;
      }
      userId.dataset.verifiedValue = value;
      setAlert(userIdStatus, '사용할 수 있는 사용자 ID입니다.', 'success');
    });
    userId.addEventListener('input', function () {
      if (userId.dataset.verifiedValue !== userId.value.trim()) {
        delete userId.dataset.verifiedValue;
        setAlert(userIdStatus, '', '');
      }
    });

    var email = one('#registrationEmail');
    var emailCode = one('#registrationEmailCode');
    var sendEmail = one('#registrationSendEmail');
    var verifyEmail = one('#registrationVerifyEmail');
    var resendEmail = one('#registrationResendEmail');
    var emailStatus = one('#registrationEmailStatus');
    function stopEmailTimer() { if (emailTimer) window.clearInterval(emailTimer); emailTimer = null; }
    function drawEmailTimer() {
      var timer = one('#registrationEmailTimer');
      if (!timer) return;
      MIQCommon.view.set(timer,"textContent",String(Math.floor(emailRemaining / 60)).padStart(2, '0') + ':' + String(emailRemaining % 60).padStart(2, '0'));
    }
    function beginEmailVerification(resend) {
      errorFor(email, '');
      if (!EMAIL_RULE.test(email.value.trim())) {
        errorFor(email, '이메일 형식을 확인해 주세요.');
        email.focus();
        return;
      }
      delete email.dataset.verifiedValue;
      emailCode.disabled = false;
      verifyEmail.disabled = false;
      resendEmail.disabled = false;
      sendEmail.disabled = true;
      stopEmailTimer();
      emailRemaining = 180;
      drawEmailTimer();
      emailTimer = window.setInterval(function () {
        emailRemaining -= 1;
        drawEmailTimer();
        if (emailRemaining <= 0) {
          stopEmailTimer();
          verifyEmail.disabled = true;
          setAlert(emailStatus, '인증 시간이 만료되었습니다. 재발송해 주세요.', 'danger');
        }
      }, 1000);
      setAlert(emailStatus, (resend ? '인증 코드를 다시 발송했습니다.' : '인증 코드를 발송했습니다.'), 'info');
      emailCode.focus();
    }
    sendEmail.addEventListener('click', function () { beginEmailVerification(false); });
    resendEmail.addEventListener('click', function () { beginEmailVerification(true); });
    verifyEmail.addEventListener('click', function () {
      errorFor(emailCode, '');
      if (emailRemaining <= 0) { errorFor(emailCode, '인증 시간이 만료되었습니다.'); return; }
      if (emailCode.value.trim() !== '123456') { errorFor(emailCode, '인증 코드가 일치하지 않습니다.'); emailCode.focus(); return; }
      email.dataset.verifiedValue = email.value.trim();
      stopEmailTimer();
      verifyEmail.disabled = true;
      setAlert(emailStatus, '이메일 인증이 완료되었습니다.', 'success');
    });
    email.addEventListener('input', function () {
      if (email.dataset.verifiedValue !== email.value.trim()) {
        delete email.dataset.verifiedValue;
        stopEmailTimer();
        emailRemaining = 0;
        emailCode.value = '';
        emailCode.disabled = true;
        sendEmail.disabled = false;
        resendEmail.disabled = true;
        verifyEmail.disabled = true;
        setAlert(emailStatus, '', '');
      }
    });

    var form = one('#registrationForm');
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors(form);
      var valid = true;
      all('[data-required="true"]', form).forEach(function (control) {
        if (!visible(control)) return;
        if (!String(control.value || '').trim()) { errorFor(control, '필수 입력 항목입니다.'); valid = false; }
      });
      if (!userId.dataset.verifiedValue || userId.dataset.verifiedValue !== userId.value.trim()) {
        errorFor(userId, '사용자 ID 중복확인을 완료해 주세요.'); valid = false;
      }
      if (!EMAIL_RULE.test(email.value.trim())) { errorFor(email, '이메일 형식을 확인해 주세요.'); valid = false; }
      else if (email.dataset.verifiedValue !== email.value.trim()) { errorFor(email, '이메일 인증을 완료해 주세요.'); valid = false; }
      var password = one('#registrationPassword');
      var confirm = one('#registrationPasswordConfirm');
      if (!PASSWORD_RULE.test(password.value)) { errorFor(password, '12자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다.'); valid = false; }
      if (confirm.value !== password.value) { errorFor(confirm, '비밀번호가 일치하지 않습니다.'); valid = false; }
      var phone = one('#registrationPhone');
      if (!/^\d{6,15}$/.test(phone.value.replace(/[-\s]/g, ''))) { errorFor(phone, '국가번호를 제외한 전화번호 숫자 6~15자를 입력해 주세요.'); valid = false; }
      if (roleValue() === 'customer-employee' && selectedCompany !== companyInput.value.trim()) {
        errorFor(companyInput, '등록된 업체 목록에서 소속 업체를 선택해 주세요.'); valid = false;
      }
      if (!isApp && roleValue() === 'dealer-employee') {
        var mapped = countryData[country.value];
        var permittedDealers = mapped ? (countryDealerIndexes[country.value] || []).map(function (index) { return dealerData[mapped.region][index]; }) : [];
        region.value = mapped ? mapped.region : '';
        if (permittedDealers.indexOf(dealer.value) < 0) { errorFor(dealer, '선택한 국가의 소속 딜러를 선택해 주세요.'); valid = false; }
      }
      if (!valid) {
        setAlert(one('#registrationStatus'), '입력 내용을 확인해 주세요.', 'danger');
        focusFirstInvalid(form);
        return;
      }
      var submit = one('#registrationSubmit');
      submit.disabled = true;
      MIQCommon.view.call(form,"setAttribute",['aria-busy','true']);
      setAlert(one('#registrationStatus'), '가입 신청 정보를 확인하고 있습니다.', 'info');
      window.setTimeout(function () {
        form.removeAttribute('aria-busy');
        if (isApp) {
          setAlert(one('#registrationStatus'), '가입 신청이 완료되었습니다. 승인 결과는 인증한 이메일로 안내됩니다.', 'success');
          return;
        }
        try {
          var registeredAccount = window.MIQCustomerAccess.register({ userId:userId.value.trim(), email:email.value.trim(), name:one('#registrationName').value.trim(), company:companyInput.value.trim(), role:roleValue() });
        } catch (error) {
          submit.disabled = false;
          setAlert(one('#registrationStatus'), error.message, 'danger');
          return;
        }
        location.href = window.MIQCustomerAccess.url('complete', registeredAccount.role);
      }, 450);
    });

    all('[data-registration-cancel]').forEach(function (button) {
      button.addEventListener('click', function () { location.href = '../Login/login-tobe.html'; });
    });
    var appBack = one('#registrationAppBack');
    if (appBack) appBack.addEventListener('click', function () {
      if (currentStep === 'details') showRegistrationStep('agreement');
      else location.href = '../Login/login-tobe.html';
    });
    window.addEventListener('beforeunload', stopEmailTimer);
    applyCountry();
    setRole(roleValue(), true);
    updateAgreementState();
    showRegistrationStep('agreement');
  }

  function renderAccountNotifications(form) {
    var role = MIQCommon.roles.resolve(body.dataset.managementRole || new URLSearchParams(location.search).get('role'));
    if (!MIQCommon.roles.isCustomer(role)) return;
    var host = one('.aae-account-form', form);
    if (!host || one('#accountNotificationTitle', host)) return;
    MIQCommon.view.call(host, 'insertAdjacentHTML', ['beforeend', `<section class="aae-account-section" aria-labelledby="accountNotificationTitle">
                <div class="aae-channel-head">
                  <h3 id="accountNotificationTitle">알림 채널</h3>
                  <span class="aae-chip" id="smsAvailability">SMS · 한국 사용자</span>
                </div>
                <table class="aae-channel-table">
                  <thead><tr><th scope="col">알림 항목</th><th scope="col">SMS</th><th scope="col">Email</th></tr></thead>
                  <tbody>
                    <tr><td>실시간 충격</td><td><input type="checkbox" name="smsRealtimeShock" data-sms-setting aria-label="실시간 충격 SMS"/></td><td class="aae-channel-na">—</td></tr>
                    <tr><td>실시간 차량 에러</td><td><input type="checkbox" name="smsRealtimeVehicleError" data-sms-setting aria-label="실시간 차량 에러 SMS"/></td><td class="aae-channel-na">—</td></tr>
                    <tr><td>실시간 배터리 경고</td><td><input type="checkbox" name="smsRealtimeBattery" data-sms-setting aria-label="실시간 배터리 경고 SMS"/></td><td class="aae-channel-na">—</td></tr>
                    <tr><td>주간 충격</td><td><input type="checkbox" name="smsWeeklyShock" data-sms-setting aria-label="주간 충격 SMS"/></td><td class="aae-channel-na">—</td></tr>
                    <tr><td>주간 차량 에러</td><td><input type="checkbox" name="smsWeeklyVehicleError" data-sms-setting aria-label="주간 차량 에러 SMS"/></td><td class="aae-channel-na">—</td></tr>
                    <tr><td>주간 소모품 교체 알림</td><td><input type="checkbox" name="smsWeeklySupply" data-sms-setting aria-label="주간 소모품 교체 SMS"/></td><td class="aae-channel-na">—</td></tr>

                    <tr><td>정기 리포트</td><td class="aae-channel-na">—</td><td><input type="checkbox" name="emailReport" aria-label="리포트 수신 동의"/></td></tr>
                  </tbody>
                </table>
                <span class="aae-help">SMS 알림은 한국 사용자에게만 제공됩니다. 지원 대상이 아니면 해당 열이 비활성화됩니다.</span>
              </section>`]);
  }

  function initAccount() {
    var modalLayer = one('#myAccountModal');
    var form = one('#accountForm');
    if (!modalLayer || !form) return;
    if (modalLayer._miqAccountController) return modalLayer._miqAccountController;
    renderAccountNotifications(form);
    var modal = one('[role="dialog"]', modalLayer);
    var saveButton = one('#accountSave');
    var status = one('#accountStatus');
    var initialSnapshot = '';
    var dirty = false;
    var returnUrl = new URLSearchParams(location.search).get('return');
    var inline = modalLayer.dataset.accountInline === 'true';
    var returnFocus = null;

    function serialise() {
      return all('input, select', form).filter(function (control) {
        return control.type !== 'password';
      }).map(function (control) {
        return control.name + ':' + (control.type === 'checkbox' ? control.checked : control.value);
      }).join('|');
    }
    function restoreSaved() {
      var raw = storageGet(localStorage, 'miq-account-settings');
      if (!raw) return;
      try {
        var saved = JSON.parse(raw);
        all('[name]', form).forEach(function (control) {
          if (!Object.prototype.hasOwnProperty.call(saved, control.name)) return;
          if (control.type === 'checkbox') control.checked = !!saved[control.name];
          else if (control.type !== 'password') control.value = saved[control.name];
        });
      } catch (error) { /* ignore malformed prototype data */ }
    }
    function setDirtyState() {
      dirty = serialise() !== initialSnapshot || !!one('#accountPassword').value || !!one('#accountPasswordConfirm').value;
      saveButton.disabled = !dirty;
      if (dirty) setAlert(status, '저장하지 않은 변경사항이 있습니다.', 'warning');
      else setAlert(status, '', '');
    }
    function focusInitialControl() {
      window.setTimeout(function () {
        var first = one('[data-account-initial-focus]', modal);
        if (first) first.focus();
      }, 0);
    }
    function openAccount(trigger) {
      returnFocus = trigger || doc.activeElement;
      restoreSaved();
      var publishedLanguage = one('#accountLanguage');
      if (publishedLanguage) publishedLanguage.value = 'ko';
      clearErrors(form);
      var password = one('#accountPassword');
      var confirm = one('#accountPasswordConfirm');
      if (password) password.value = '';
      if (confirm) confirm.value = '';
      applySmsAvailability();
      initialSnapshot = serialise();
      dirty = false;
      saveButton.disabled = true;
      setAlert(status, '', '');
      modalLayer.classList.add('open');
      MIQCommon.view.call(modalLayer,"setAttribute",['aria-hidden','false']);
      body.classList.add('aae-account-open');
      focusInitialControl();
    }
    function leaveAccount() {
      if (dirty && !window.confirm('저장하지 않은 변경사항을 취소하시겠습니까?')) return;
      dirty = false;
      if (inline) {
        modalLayer.classList.remove('open');
        MIQCommon.view.call(modalLayer,"setAttribute",['aria-hidden','true']);
        body.classList.remove('aae-account-open');
        if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
        return;
      }
      if (returnUrl && /^(\.\.\/|\.\/)/.test(returnUrl)) { location.href = returnUrl; return; }
      if (doc.referrer && doc.referrer !== location.href) { history.back(); return; }
      location.href = '../Vehicle%20Summary/vehicle-summary-tobe-3.html';
    }
    function applySmsAvailability() {
      var availability = one('#smsAvailability', form);
      if (!availability) return;
      var country = (modalLayer.dataset.accountCountry || body.dataset.accountCountry || '').trim().toUpperCase();
      var korean = country === 'KR';
      all('[data-sms-setting]').forEach(function (input) { input.disabled = !korean; });
      MIQCommon.view.set(availability,"textContent",korean ? 'SMS · 한국 사용자' : country ? 'SMS · 지원 국가 아님' : 'SMS · 국가 정보 확인 필요');
    }

    restoreSaved();
    var publishedLanguage = one('#accountLanguage');
    if (publishedLanguage) publishedLanguage.value = 'ko';
    applySmsAvailability();
    initialSnapshot = serialise();
    saveButton.disabled = true;
    all('input, select', form).forEach(function (control) {
      control.addEventListener('input', setDirtyState);
      control.addEventListener('change', setDirtyState);
    });
    all('[data-account-close]').forEach(function (button) { button.addEventListener('click', leaveAccount); });
    modalLayer.addEventListener('mousedown', function (event) {
      if (event.target === modalLayer) {
        event.stopPropagation();
        event.preventDefault();
        leaveAccount();
      }
    });
    modal.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        event.preventDefault();
        leaveAccount();
        return;
      }
      if (event.key !== 'Tab') return;
      var focusables = all('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]', modal).filter(visible);
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors(form);
      var password = one('#accountPassword');
      var confirm = one('#accountPasswordConfirm');
      var name = one('#accountName');
      var phone = one('#accountPhone');
      var email = one('#accountEmail');
      var valid = true;
      if (!name.value.trim()) { errorFor(name, '이름을 입력해 주세요.'); valid = false; }
      if (!/^\d{6,15}$/.test(phone.value.replace(/[-\s]/g, ''))) { errorFor(phone, '전화번호 숫자 6~15자를 입력해 주세요.'); valid = false; }
      if (!EMAIL_RULE.test(email.value.trim())) { errorFor(email, '이메일 형식을 확인해 주세요.'); valid = false; }
      if (password.value || confirm.value) {
        if (!PASSWORD_RULE.test(password.value)) { errorFor(password, '12자 이상이며 영문·숫자·특수문자를 모두 포함해야 합니다.'); valid = false; }
        if (confirm.value !== password.value) { errorFor(confirm, '비밀번호가 일치하지 않습니다.'); valid = false; }
      }
      if (!valid) { setAlert(status, '입력 내용을 확인해 주세요.', 'danger'); focusFirstInvalid(form); return; }
      var saved = {};
      // Preserve channels absent from this web form, including mobile PUSH.
      try { var prior = JSON.parse(storageGet(localStorage, 'miq-account-settings') || '{}');
        ['pushRealtimeShock','pushRealtimeVehicleError','pushRealtimeBattery','pushMarketing','smsRealtimeShock','smsRealtimeVehicleError','smsRealtimeBattery','smsWeeklyShock','smsWeeklyVehicleError','smsWeeklySupply','emailReport'].forEach(function(key){if(!one('[name="'+key+'"]',form)&&Object.prototype.hasOwnProperty.call(prior,key))saved[key]=prior[key];});
      } catch (error) {}
      all('[name]', form).forEach(function (control) {
        if (control.type === 'password') return;
        saved[control.name] = control.type === 'checkbox' ? control.checked : control.value;
      });
      storageSet(localStorage, 'miq-account-settings', JSON.stringify(saved));
      password.value = '';
      confirm.value = '';
      initialSnapshot = serialise();
      dirty = false;
      saveButton.disabled = true;
      setAlert(status, '내 계정 설정을 저장했습니다.', 'success');
    });
    modalLayer._miqAccountController = { open: openAccount, close: leaveAccount };
    if (inline) {
      modalLayer.classList.remove('open');
      MIQCommon.view.call(modalLayer,"setAttribute",['aria-hidden','true']);
    } else {
      body.classList.add('aae-account-open');
      focusInitialControl();
    }
    return modalLayer._miqAccountController;
  }

  function init() {

    bindPasswordToggles(doc);
    if (body.dataset.authPage === 'login') initLogin();
    if (body.dataset.authPage === 'find-password') initPasswordRecovery();
    if (body.dataset.authPage === 'registration') initRegistration();
    if (body.dataset.accountPage === 'true') initAccount();
  }

  window.MIQ_ACCOUNT_ENHANCEMENTS = window.MIQ_ACCOUNT_ENHANCEMENTS || {};
  window.MIQ_ACCOUNT_ENHANCEMENTS.initAccount = initAccount;

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
