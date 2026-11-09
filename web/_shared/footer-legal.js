/* One read-only dialog shared by every current WEB footer. */
(function (root, doc) {
  'use strict';
  if (root.MIQFooterLegal) return;
  var scriptUrl = doc.currentScript.src;
  var titles = {terms:'이용약관', location:'위치정보 및 위치기반서비스 이용약관', privacy:'개인(위치)정보 처리방침', license:'오픈소스 고지'};
  var dialog, title, content, trigger, loading, activeKey, request = 0, previousOverflow, previousGutter;
  function loadDocuments() {
    if (root.MIQFooterLegalDocuments) return Promise.resolve(root.MIQFooterLegalDocuments);
    if (loading) return loading;
    loading = new Promise(function (resolve, reject) {
      var script = doc.createElement('script');
      script.src = new URL('footer-legal-documents-data.js?v=footer-legal-20260928', scriptUrl).href;
      script.onload = function () {
        if (root.MIQFooterLegalDocuments) resolve(root.MIQFooterLegalDocuments);
        else { script.remove(); loading = null; reject(new Error('Missing document data')); }
      };
      script.onerror = function () { script.remove(); loading = null; reject(new Error('Document load failed')); };
      doc.head.appendChild(script);
    });
    return loading;
  }
  function close() { if (dialog && dialog.open) dialog.close(); }
  function ensureDialog() {
    if (dialog) return;
    dialog = doc.createElement('dialog');
    dialog.id = 'miqFooterLegalDialog';
    dialog.className = 'miq-legal-modal';
    dialog.setAttribute('aria-labelledby', 'miqFooterLegalTitle');
    dialog.setAttribute('aria-modal', 'true');
    dialog.innerHTML = '<header class="miq-legal-modal__head"><h2 id="miqFooterLegalTitle" tabindex="-1" translate="no" lang="ko"></h2><button type="button" class="miq-legal-modal__x" data-legal-close aria-label="닫기">×</button></header>' +
      '<div class="miq-legal-modal__body" tabindex="0" role="region" aria-labelledby="miqFooterLegalTitle" translate="no" dir="ltr"></div>' +
      '<footer class="miq-legal-modal__foot"><button type="button" class="miq-legal-modal__close" data-legal-close>닫기</button></footer>';
    title = dialog.querySelector('h2');
    content = dialog.querySelector('.miq-legal-modal__body');
    dialog.addEventListener('click', function (event) {
      if (event.target.closest('[data-legal-close]')) close();
      if (event.target.closest('[data-legal-retry]')) render();
      if (event.target === dialog) {
        var rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      }
    });
    dialog.addEventListener('cancel', function (event) { event.preventDefault(); close(); });
    dialog.addEventListener('close', function () {
      request++;
      doc.documentElement.style.overflow = previousOverflow;
      doc.documentElement.style.scrollbarGutter = previousGutter;
      if (trigger && trigger.isConnected) trigger.focus({preventScroll:true});
    });
    doc.body.appendChild(dialog);
  }
  function render() {
    var current = ++request, key = activeKey;
    title.textContent = titles[key];
    content.lang = key === 'license' ? 'en' : 'ko';
    content.setAttribute('aria-busy', 'true');
    content.textContent = '내용을 불러오는 중입니다.';
    content.scrollTop = 0;
    loadDocuments().then(function (data) {
      if (current !== request || !dialog.open) return;
      var document = data.documents.find(function (item) { return item.id === key; });
      if (!document) throw new Error('Missing requested document');
      // Only build-validated original markup, never runtime user input or translated legal copy.
      content.innerHTML = document.html;
      content.dataset.document = key;
      content.dataset.sourceSha256 = document.sha256;
      content.scrollTop = 0;
      content.removeAttribute('aria-busy');
    }).catch(function () {
      if (current !== request || !dialog.open) return;
      content.removeAttribute('aria-busy');
      content.innerHTML = '<p role="status">내용을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p><button type="button" class="miq-legal-modal__close" data-legal-retry>다시 시도</button>';
    });
  }
  function open(key, opener) {
    if (!Object.prototype.hasOwnProperty.call(titles, key)) return;
    ensureDialog();
    activeKey = key;
    trigger = opener || doc.activeElement;
    if (!dialog.open) {
      previousOverflow = doc.documentElement.style.overflow;
      previousGutter = doc.documentElement.style.scrollbarGutter;
      doc.documentElement.style.scrollbarGutter = 'stable';
      doc.documentElement.style.overflow = 'hidden';
      dialog.showModal();
    }
    render();
    title.focus({preventScroll:true});
  }
  root.MIQFooterLegal = {open:open, close:close};
}(window, document));
