/* WEB-only original legal copy. UI translations must never rewrite legal text. */
(function (root, doc) {
  'use strict';
  var host = doc.querySelector('[data-registration-terms]');
  if (!host || doc.body.dataset.registrationMode !== 'web') return;
  var data = root.MIQRegistrationTermsData;
  if (!data) throw new Error('Registration terms data is required');
  var rows = [];
  function original(element) {
    element.setAttribute('translate', 'no');
    element.setAttribute('dir', 'ltr');
    return element;
  }
  data.locales.ko.items.forEach(function (term, index) {
    var article = doc.createElement('article');
    article.className = 'aae-agreement';
    var head = doc.createElement('div');
    head.className = 'aae-agreement__head';
    var label = doc.createElement('label');
    label.className = 'aae-check';
    var checkbox = doc.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-term', term.id);
    if (term.required) checkbox.setAttribute('data-term-required', 'true');
    var title = original(doc.createElement('span'));
    label.append(checkbox, title);
    var button = doc.createElement('button');
    button.className = 'aae-agreement-toggle';
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', 'webTerm' + (index + 1));
    button.textContent = '열기';
    var content = original(doc.createElement('div'));
    content.className = 'aae-agreement__content';
    content.id = 'webTerm' + (index + 1);
    content.hidden = true;
    head.append(label, button);
    article.append(head, content);
    host.append(article);
    rows.push({title: title, content: content});
  });
  function renderCopy() {
    var language = 'ko';
    var copy = data.locales[language];
    host.dataset.termsLanguage = language;
    host.dataset.termsVersion = data.version;
    var agreeAll = doc.querySelector('[data-registration-agree-all-text]');
    agreeAll.lang = language;
    agreeAll.replaceChildren();
    var prefixEnd = copy.agreeAll.indexOf(']') + 1;
    var prefix = doc.createElement('strong');
    prefix.textContent = copy.agreeAll.slice(0, prefixEnd);
    agreeAll.append(prefix, doc.createTextNode(copy.agreeAll.slice(prefixEnd)));
    rows.forEach(function (row, index) {
      row.title.lang = row.content.lang = language;
      row.title.textContent = copy.items[index].title;
      // Trusted, build-validated source markup only; no runtime user input.
      row.content.innerHTML = copy.items[index].html;
    });
  }
  renderCopy();

}(window, document));
