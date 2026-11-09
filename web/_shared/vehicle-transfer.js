(function () {
  'use strict';
  var types = {
    engine: { label: '엔진', shape: '<path d="M5 9h2l2-3h6l2 3h2v8H5z"/><path d="M3 11h2m14 1h2m-14 5v2m10-2v2M10 9h4m-5 4h6"/>' },
    lithium: { label: '리튬', shape: '<rect x="4" y="6" width="15" height="12" rx="2"/><path d="M19 10h2v4h-2M11 8.5 8.5 13H12l-1 3 4-5h-3z"/>' },
    lead: { label: '납산', shape: '<path d="M6 6V4h3v2m6 0V4h3v2"/><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M6 10h4m-2-2v4m7-2h3m-12 5c2-1 4 1 6 0s4 1 6 0"/>' }
  };
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function typeKey(value) { return Object.keys(types).filter(function (key) { return key === value || types[key].label === value; })[0]; }
  function icon(value) {
    var key = typeKey(value), type = types[key];
    if (!type) return '<span class="fuel-icon sm" role="img" aria-label="차량" title="차량"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16V9h10v7m0-4h4l3 4h-7M7 7V4h6v5"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></svg></span>';
    return '<span class="fuel-icon ' + key + ' sm" role="img" aria-label="' + type.label + '" title="' + type.label + '"><svg viewBox="0 0 24 24" aria-hidden="true">' + type.shape + '</svg></span>';
  }
  function identity(vin, model, context) {
    // Keep .vin and b available to the existing transfer confirmation logic.
    return '<span class="xfer__vehicle"><span class="vin">' + esc(vin) + '</span><small><b>' + esc(model) + '</b><span>' + esc(context) + '</span></small></span>';
  }
  function enhanceGroup() {
    var host = document.getElementById('tabAssign'); if (!host) return;
    Array.prototype.forEach.call(host.querySelectorAll('.xfer__it'), function (row) {
      if (row.querySelector('.xfer__vehicle')) return;
      var oldIcon = row.querySelector('.fuel-icon'), model = row.querySelector('b'), vin = row.querySelector('.vin');
      if (!oldIcon || !model || !vin) return;
      var key = Object.keys(types).filter(function (type) { return oldIcon.classList.contains(type); })[0];
      var vinText = MIQCommon.view.get(vin,"textContent").trim(), modelText = MIQCommon.view.get(model,"textContent").trim();
      MIQCommon.view.set(oldIcon,"outerHTML",icon(key));MIQCommon.view.call(model,"insertAdjacentHTML",['beforebegin',identity(vinText, modelText, types[key] ? types[key].label : '')]);model.remove();vin.remove();
    });
  }
  window.MIQVehicleTransfer = { icon: icon, identity: identity };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceGroup);else enhanceGroup();
})();
