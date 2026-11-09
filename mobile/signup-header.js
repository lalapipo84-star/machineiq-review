(() => {
  document.querySelectorAll('[data-mobile-preauth-header]').forEach(host => {
    const brandHref = host.dataset.brandHref || './login.html';
    host.className = 'mobile-preauth-header';
    host.innerHTML = `
      <a class="mobile-preauth-header__brand" href="${brandHref}" aria-label="Bobcat MACHINE IQ 로그인">
        <img src="./shared/bobcat-machine-iq.svg" alt="Bobcat MACHINE IQ">
      </a>`;
  });
})();
