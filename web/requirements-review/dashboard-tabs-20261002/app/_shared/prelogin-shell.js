(function () {
  const host = document.querySelector('[data-miq-auth-header]');
  if (!host) return;

  const base = host.dataset.base || '../';
  const page = document.body.dataset.authPage || '';
  const loginHref = page === 'login' ? '#login-panel' : base + 'Login/login-tobe.html';
  const currentLanguage = 'ko';

  host.className = 'miq-auth-header';
  MIQCommon.view.set(host,"innerHTML",`
    <a class="miq-auth-brand" href="${base}Login/login-tobe.html" aria-label="Bobcat MACHINE IQ MATERIAL HANDLING 로그인">
      <img src="${base}_shared/machine-iq-material-handling-white.svg" alt="Bobcat MACHINE IQ MATERIAL HANDLING"/>
    </a>
    <div class="miq-auth-actions">
      <label class="miq-auth-language">
        <select class="pre__lang" aria-label="언어 선택" title="화면 언어 선택">
          <option value="ko" lang="ko" dir="ltr" translate="no" selected>한국어</option><option value="en" lang="en" dir="ltr" translate="no">English</option><option value="de" lang="de" dir="ltr" translate="no">Deutsch</option><option value="ar" lang="ar" dir="rtl" translate="no">العربية</option><option value="es" lang="es" dir="ltr" translate="no">Español</option><option value="fr" lang="fr" dir="ltr" translate="no">Français</option><option value="it" lang="it" dir="ltr" translate="no">Italiano</option><option value="ja" lang="ja" dir="ltr" translate="no">日本語</option>
        </select>
      </label>
      <a class="miq-auth-login" href="${loginHref}">로그인</a>
    </div>`);

  const language = host.querySelector('select');
  language.value = currentLanguage;

})();
