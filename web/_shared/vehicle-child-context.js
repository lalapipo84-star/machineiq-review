(function () {
  'use strict';

  var initialQuery = new URLSearchParams(location.search);
  var currentVin = initialQuery.get('veh') || initialQuery.get('equipmentId') || '';
  var currentPeriod = initialQuery.get('period') || 'm';

  function currentQuery() {
    return new URLSearchParams(location.search);
  }

  function replaceAddress(query) {
    var serialized = query.toString();
    history.replaceState(null, '', location.pathname + (serialized ? '?' + serialized : '') + location.hash);
    document.dispatchEvent(new CustomEvent('miq:query-change', {
      detail: { query: serialized }
    }));
  }

  function restoreCustomRange() {
    if (currentPeriod !== 'c') return;
    var query = currentQuery();
    var from = query.get('from');
    var to = query.get('to');
    var fromInput = document.getElementById('dFrom');
    var toInput = document.getElementById('dTo');
    if (!from || !to || !fromInput || !toInput) return;
    fromInput.value = from;
    toInput.value = to;
    fromInput.dispatchEvent(new Event('change', { bubbles: true }));
    toInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  document.addEventListener('change', function (event) {
    if (!event.target.matches('#vehSel')) return;
    currentVin = event.target.value;
    var query = currentQuery();
    query.set('veh', currentVin);
    query.delete('equipmentId');
    var selectedFleet = window.MIQ && Array.isArray(MIQ.FLEET_CATALOG) && MIQ.FLEET_CATALOG.length ? MIQ.FLEET_CATALOG : window.MIQ && Array.isArray(MIQ.FLEET) ? MIQ.FLEET : [];
    var selectedVehicle = selectedFleet.filter(function (vehicle) { return vehicle.vin === currentVin; })[0] || null;
    if (selectedVehicle) {
      query.set('companyId', selectedVehicle.companyId || '1933');
      query.set('group', selectedVehicle.group);
      query.set('type', selectedVehicle.type);
    }
    replaceAddress(query);
    document.dispatchEvent(new CustomEvent('miq:vehicle-context-change', {
      detail: { equipmentId: currentVin }
    }));
  });
  document.addEventListener('miq:period-change', function (event) {
    var detail = event.detail || {};
    var periods = { D: 'd', W: 'w', M: 'm', C: 'c' };
    currentPeriod = periods[detail.periodTypeCode] || currentPeriod;
    var query = currentQuery();
    query.set('period', currentPeriod);
    if (detail.startDate && detail.endDate) {
      query.set('from', detail.startDate);
      query.set('to', detail.endDate);
    } else {
      query.delete('from');
      query.delete('to');
    }
    replaceAddress(query);
  });
  document.addEventListener('click', function (event) {
    var button = event.target.closest('.period-tabs button[data-period]');
    if (!button || !button.closest('[data-chart]')) return;
    var filter = button.closest('.miq-period-filter');
    if (filter && filter.__miqPeriodController) return;
    currentPeriod = button.dataset.period || currentPeriod;
    var query = currentQuery();
    query.set('period', currentPeriod);
    if (currentPeriod !== 'c') {
      query.delete('from');
      query.delete('to');
    }
    replaceAddress(query);
  });
  restoreCustomRange();
})();
