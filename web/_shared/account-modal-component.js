/* MACHINE IQ common My Account overlay.
 * nav.js loads this component on demand so the current page remains in place.
 */
(function () {
  'use strict';

  var loader = document.currentScript;
  var base = loader && loader.dataset.base ? loader.dataset.base : '../';
  var triggerNode = null;

  function ensureStyles() {
    if (document.querySelector('link[data-miq-account-styles]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = base + '_shared/auth-account-enhancements.css?v=20260911-account-overlay&rev=font-black-20261012';
    link.dataset.miqAccountStyles = '';
    document.head.appendChild(link);
  }

  function ensureModal() {
    var existing = document.getElementById('myAccountModal');
    if (existing) return existing;
    var layer = document.createElement('div');
    layer.className = 'dim';
    layer.id = 'myAccountModal';
    layer.dataset.accountInline = 'true';
    // The same Korean demo account as the standalone My Account page.
    layer.dataset.accountCountry = document.body.dataset.accountCountry || 'KR';
    MIQCommon.view.call(layer,"setAttribute",['aria-hidden','true']);
    MIQCommon.view.set(layer,"innerHTML",`
      <div class="modal aae-account-modal" role="dialog" aria-modal="true" aria-labelledby="accountDialogTitle" aria-describedby="accountDialogDesc">
        <div class="modal__head">
          <div class="aae-modal-title-wrap">
            <div class="modal__title" id="accountDialogTitle">내 계정</div>
            <small id="accountDialogDesc">기본정보, 보안, 연락처와 알림 수신 설정을 관리합니다.</small>
          </div>
          <button class="aae-close" type="button" data-account-close data-account-initial-focus aria-label="내 계정 닫기">×</button>
        </div>
        <form id="accountForm" novalidate>
          <div class="modal__body">
            <div class="aae-account-form">
              <section class="aae-account-section" aria-labelledby="accountBasicTitle">
                <h3 id="accountBasicTitle">기본정보</h3>
                <div class="aae-account-grid">
                  <div class="aae-field">
                    <label class="aae-label" for="accountUserId">사용자 ID</label>
                    <input class="aae-control" id="accountUserId" name="userId" value="testcbcust" readonly/>
                    <span class="aae-help">사용자 ID는 내 계정에서 변경할 수 없습니다.</span>
                  </div>
                  <div class="aae-field">
                    <label class="aae-label" for="accountName">이름 <span class="aae-required">*</span></label>
                    <input class="aae-control" id="accountName" name="name" value="충북판매서비스 고객" autocomplete="name" required/>
                    <span class="aae-error" data-error-for="accountName"></span>
                  </div>
                </div>
              </section>
              <section class="aae-account-section" aria-labelledby="accountSecurityTitle">
                <h3 id="accountSecurityTitle">보안</h3>
                <div class="aae-account-grid">
                  <div class="aae-field">
                    <label class="aae-label" for="accountPassword">새 비밀번호</label>
                    <div class="aae-control-wrap">
                      <input class="aae-control" id="accountPassword" name="password" type="password" autocomplete="new-password" aria-describedby="accountPasswordHelp accountPasswordError"/>
                      <button class="aae-password-toggle" type="button" data-password-toggle="accountPassword" aria-pressed="false">표시</button>
                    </div>
                    <span class="aae-help" id="accountPasswordHelp">변경할 때만 입력 · 12자 이상, 영문 + 숫자 + 특수문자</span>
                    <span class="aae-error" id="accountPasswordError" data-error-for="accountPassword"></span>
                  </div>
                  <div class="aae-field">
                    <label class="aae-label" for="accountPasswordConfirm">새 비밀번호 확인</label>
                    <div class="aae-control-wrap">
                      <input class="aae-control" id="accountPasswordConfirm" name="passwordConfirm" type="password" autocomplete="new-password"/>
                      <button class="aae-password-toggle" type="button" data-password-toggle="accountPasswordConfirm" aria-pressed="false">표시</button>
                    </div>
                    <span class="aae-error" data-error-for="accountPasswordConfirm"></span>
                  </div>
                </div>
              </section>
              <section class="aae-account-section" aria-labelledby="accountContactTitle">
                <h3 id="accountContactTitle">언어 · 연락처</h3>
                <div class="aae-account-grid">
                  <div class="aae-field">
                    <label class="aae-label" for="accountLanguage">언어 변경</label>
                    <select class="aae-select" id="accountLanguage" name="language" data-language-select>
                      <option value="ko" lang="ko" dir="ltr" translate="no" selected>한국어</option><option value="en" lang="en" dir="ltr" translate="no">English</option><option value="de" lang="de" dir="ltr" translate="no">Deutsch</option><option value="ar" lang="ar" dir="rtl" translate="no">العربية</option><option value="es" lang="es" dir="ltr" translate="no">Español</option><option value="fr" lang="fr" dir="ltr" translate="no">Français</option><option value="it" lang="it" dir="ltr" translate="no">Italiano</option><option value="ja" lang="ja" dir="ltr" translate="no">日本語</option>
                    </select>
                  </div>
                  <div class="aae-field">
                    <label class="aae-label" for="accountPhone">연락처 <span class="aae-required">*</span></label>
                    <input class="aae-control" id="accountPhone" name="phone" type="tel" value="01089973747" inputmode="tel" autocomplete="tel" required/>
                    <span class="aae-error" data-error-for="accountPhone"></span>
                  </div>
                  <div class="aae-field aae-span-2">
                    <label class="aae-label" for="accountEmail">이메일 <span class="aae-required">*</span></label>
                    <input class="aae-control" id="accountEmail" name="email" type="email" value="seungtae4.kim@doosan.com" autocomplete="email" required/>
                    <span class="aae-error" data-error-for="accountEmail"></span>
                  </div>
                </div>
              </section>
            </div>
          </div>
          <div class="modal__foot">
            <div class="aae-alert" id="accountStatus" role="status" aria-live="polite" hidden style="margin-right:auto"></div>
            <button class="aae-button" type="button" data-account-close>취소</button>
            <button class="aae-button aae-button--primary" id="accountSave" type="submit" disabled>변경 저장</button>
          </div>
        </form>
      </div>`);
    document.body.appendChild(layer);
    return layer;
  }

  function initialiseAndOpen() {
    var enhancements = window.MIQ_ACCOUNT_ENHANCEMENTS;
    if (!enhancements || typeof enhancements.initAccount !== 'function') return;
    var controller = enhancements.initAccount();
    if (controller && typeof controller.open === 'function') controller.open(triggerNode);
  }

  function ensureEnhancements() {
    if (window.MIQ_ACCOUNT_ENHANCEMENTS) {
      initialiseAndOpen();
      return;
    }
    var existing = document.querySelector('script[data-miq-account-enhancements]');
    if (existing) {
      existing.addEventListener('load', initialiseAndOpen, { once: true });
      return;
    }
    var script = document.createElement('script');
    script.src = base + '_shared/auth-account-enhancements.js?rev=0a8cada7e4a3';
    script.dataset.miqAccountEnhancements = '';
    script.addEventListener('load', initialiseAndOpen, { once: true });
    document.body.appendChild(script);
  }

  function open(trigger) {
    triggerNode = trigger || document.activeElement;
    ensureStyles();
    ensureModal();
    ensureEnhancements();
  }

  window.MIQ_ACCOUNT_MODAL = { open: open };
  document.dispatchEvent(new CustomEvent('miq:account-modal-ready'));
})();
