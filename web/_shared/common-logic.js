/* DOM-free prototype rules. Keep business-specific forms and data in their pages.
   Classic-script + CommonJS entry points let the same rules run in browser/tests.
   Role policies below simulate QA visibility; they are NOT server authorization. */
(function (root, factory) {
  var api = factory();
  api.view = {
    get: function (node, prop) { return node[prop]; },
    set: function (node, prop, value) { node[prop] = value; return value; },
    call: function (node, method, args) { return node[method].apply(node, args); }
  };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQCommon = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var roles = [
    { code: 'internal', label: '내부 사용자' },
    { code: 'dealer_owner', label: '딜러 대표' },
    { code: 'dealer_staff', label: '딜러 직원' },
    { code: 'customer_owner', label: '고객 대표' },
    { code: 'customer_staff', label: '고객 직원' }
  ];
  var codes = roles.map(function (role) { return role.code; });
  var capabilities = {
    internal: [],
    dealer_owner: ['approveUserRequest', 'approveVehicleRequest'],
    dealer_staff: [],
    customer_owner: ['approveUserRequest', 'assignUserGroup', 'deactivateCustomerStaff', 'manageGroup', 'assignGroupVehicle', 'editVehicle', 'requestVehicle'],
    customer_staff: []
  };
  var targetPolicies = {
    internal:       { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    dealer_owner:   { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    dealer_staff:   { hideCompany: false, hideGroup: true,  companyId: '', companyIds: null },
    customer_owner: { hideCompany: true,  hideGroup: false, companyId: '1933', companyIds: ['1933'] },
    customer_staff: { hideCompany: true,  hideGroup: true,  companyId: '1933', companyIds: ['1933'] }
  };
  function resolveRole(value) { return codes.indexOf(value) > -1 ? value : 'customer_owner'; }
  function isDealer(role) { return role === 'dealer_owner' || role === 'dealer_staff'; }
  function isCustomer(role) { return role === 'customer_owner' || role === 'customer_staff'; }
  function canUseFavorites(role) { return isDealer(role) || isCustomer(role); }
  function roleLabel(role) { return roles[codes.indexOf(resolveRole(role))].label; }
  function targetPolicy(role) {
    var policy = targetPolicies[resolveRole(role)];
    return { hideCompany: policy.hideCompany, hideGroup: policy.hideGroup, companyId: policy.companyId,
      companyIds: policy.companyIds ? policy.companyIds.slice() : null,
      group: resolveRole(role) === 'customer_staff' ? '물류1팀' : '' };
  }
  function filterVehicles(role, vehicles) {
    var policy = targetPolicy(role);
    return (Array.isArray(vehicles) ? vehicles : []).filter(function (vehicle) {
      return vehicle && (!policy.companyIds || policy.companyIds.indexOf(String(vehicle.companyId || '')) > -1)
        && (!policy.group || vehicle.group === policy.group);
    });
  }

  function formatDate(date) {
    return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
  }
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var parts = value.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2] ? date : null;
  }
  function addDays(date, days) {
    var result = new Date(date.getTime());
    result.setDate(result.getDate() + days);
    return result;
  }
  function today(reference) {
    var value = new Date((reference || new Date()).getTime());
    value.setHours(12, 0, 0, 0);
    return value;
  }
  function yesterday(reference) { return addDays(today(reference), -1); }
  function dayCount(from, to) {
    function day(date) { return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()); }
    return Math.round((day(to) - day(from)) / 86400000) + 1;
  }
  function range(from, to) { return { from: formatDate(from), to: formatDate(to) }; }
  function operatingRange(mode, anchor) {
    var end = anchor || yesterday();
    var start = mode === 'w' ? addDays(end, -6) : mode === 'm' ? new Date(end.getFullYear(), end.getMonth(), 1, 12) : end;
    return range(start, end);
  }
  function linkedWeek(date, edge) {
    return edge === 'start' ? range(date, addDays(date, 6)) : range(addDays(date, -6), date);
  }
  function monthRange(anchor, latest) {
    var start = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12);
    var end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12);
    if (latest && end > latest && start <= latest) end = latest;
    return range(start, end);
  }
  function requestRange(period, reference) {
    if (period === 'all') return { from: '', to: '' };
    var end = today(reference);
    var start;
    if (period === 'w') start = addDays(end, -6);
    else {
      var months = period === 'q' ? 3 : 1;
      var lastDay = new Date(end.getFullYear(), end.getMonth() - months + 1, 0).getDate();
      start = new Date(end.getFullYear(), end.getMonth() - months, Math.min(end.getDate(), lastDay), 12);
    }
    return range(start, end);
  }

  function normalizeSearch(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().toLowerCase(); }
  function menuHref(path, role, base) {
    var url = new URL(path, base);
    url.search = '';
    url.hash = '';
    url.searchParams.set('role', resolveRole(role));
    return url.href;
  }
  function serviceMenuHref(path, role, base, committedQuery) {
    var url = new URL(menuHref(path, role, base));
    var current = new URL(base);
    if (typeof committedQuery === 'string') current.search = committedQuery;
    ['companyId', 'group', 'type', 'veh', 'period', 'from', 'to'].forEach(function (key) {
      var value = current.searchParams.get(key);
      if (value) url.searchParams.set(key, value);
    });
    return url.href;
  }
  function listReturnHref(saved, fallback, role, base) {
    var destination = new URL(fallback, base);
    var paths = ['../Vehicle%20Summary/vehicle-summary-tobe-option-a-expand.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-2.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-3.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-v2.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-option-b-sort.html',
      '../Vehicle%20Summary/vehicle-summary-tobe-option-c-reference-sort.html',
      '../Service/service-tobe-v2.html',
      '../Service/service-maintenance-tobe.html',
      '../Service/service-supply-tobe.html',
      '../Service/service-error-tobe.html'];
    if (canUseFavorites(role)) paths.push('../Interest%20Vehicles/interest-vehicles-status-tobe.html');
    try {
      var candidate = new URL(saved || '', base);
      if (saved && candidate.origin === destination.origin && paths.some(function (path) {
        return new URL(path, base).pathname === candidate.pathname;
      })) destination = candidate;
    } catch (error) { /* Invalid return context falls back to the summary list. */ }
    destination.searchParams.delete('returnTo');
    destination.searchParams.set('role', resolveRole(role));
    destination.hash = '';
    return destination.href;
  }
  function vehicleDetailReturnHref(savedQuery, role, base) {
    var destination = new URL('../Vehicle%20Detail/vehicle-detail-tobe.html', base);
    var saved = new URLSearchParams(savedQuery || '');
    ['companyId', 'group', 'type', 'veh', 'model', 'period', 'from', 'to', 'metric', 'sort', 'dir', 'source', 'returnTo'].forEach(function (key) {
      if (saved.has(key)) destination.searchParams.set(key, saved.get(key));
    });
    destination.searchParams.set('role', resolveRole(role));
    return destination.href;
  }
  function createSearch(initial) {
    var applied = String(initial == null ? '' : initial).trim();
    return {
      read: function () { return normalizeSearch(applied); },
      value: function () { return applied; },
      commit: function (value) { applied = String(value == null ? '' : value).trim(); return normalizeSearch(applied); }
    };
  }
  function bindSearch(input, submit, onApply) {
    var state = createSearch(input.value);
    function apply(event) {
      if (event) event.preventDefault();
      state.commit(input.value);
      onApply();
    }
    function keydown(event) {
      if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) apply(event);
    }
    input.addEventListener('keydown', keydown);
    submit.addEventListener('click', apply);
    state.destroy = function () {
      input.removeEventListener('keydown', keydown);
      submit.removeEventListener('click', apply);
    };
    return state;
  }

  // Display only. Never feed rounded labels back into metrics, thresholds or coordinates.
  function integer(value, grouped) {
    if (value === null || value === undefined || value === '' || typeof value === 'boolean') return '-';
    var numeric = Number(value);
    if (!Number.isFinite(numeric)) return '-';
    var rounded = Math.round(numeric);
    if (Object.is(rounded, -0)) rounded = 0;
    return grouped ? rounded.toLocaleString('ko-KR', { maximumFractionDigits: 0 }) : String(rounded);
  }

  return {
    numbers: { integer: integer },
    roles: {
      list: function () { return roles.map(function (role) { return { code: role.code, label: role.label }; }); },
      resolve: resolveRole, label: roleLabel, isDealer: isDealer, isCustomer: isCustomer, canUseFavorites: canUseFavorites,
      hasCapability: function (role, capability) { return codes.indexOf(role) > -1 && (!capability || capabilities[role].indexOf(capability) > -1); },
      targetPolicy: targetPolicy,
      filterVehicles: filterVehicles,
      scopeLabel: function (role) { return isCustomer(role) ? '전체 차량' : '전체 업체'; },
      dashboardDimension: function (role) { return role === 'internal' || isDealer(role) ? 'company' : 'group'; },
      hideDashboardComparison: function (role) { return role === 'customer_staff'; },
      hideMaintenanceDetails: isCustomer
    },
    dates: { format: formatDate, parse: parseDate, addDays: addDays, today: today, yesterday: yesterday,
      dayCount: dayCount, operatingRange: operatingRange, linkedWeek: linkedWeek, monthRange: monthRange, requestRange: requestRange },
    search: { normalize: normalizeSearch, create: createSearch, bind: bindSearch },
    navigation: { menuHref: menuHref, serviceMenuHref: serviceMenuHref, listReturnHref: listReturnHref, vehicleDetailReturnHref: vehicleDetailReturnHref }
  };
}));
