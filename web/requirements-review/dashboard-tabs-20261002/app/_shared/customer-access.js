/* WEB prototype account/vehicle access. No password or authentication token is stored. */
(function (global) {
  'use strict';
  var key = 'miq.web.customer-access.v1';
  var roleMap = { 'customer-owner':'customer_owner', 'customer-employee':'customer_staff', 'dealer-employee':'dealer_staff' };
  var script = document.currentScript;
  var base = new URL('../', script.src);
  function read() {
    try {
      var value = JSON.parse(sessionStorage.getItem(key) || 'null');
      return value && value.version === 1 && value.userId && value.role ? value : null;
    } catch (error) { return null; }
  }
  function write(value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (error) { return false; }
  }
  function role() { return new URLSearchParams(location.search).get('role') || (read() || {}).role || 'customer_owner'; }
  function current(requestedRole) {
    var account = read();
    return account && account.active && account.role === (requestedRole || role()) ? account : null;
  }
  function isCustomer(value) { return value === 'customer_owner' || value === 'customer_staff'; }
  function url(page, requestedRole) {
    var paths = { complete:'registration/registration-complete.html', required:'registration/vehicle-required.html', vehicle:'Mgmt Vehicle/mgmt-vehicle-tobe.html', dashboard:'Dashboard/group-dashboard-tobe-v2.html' };
    var target = new URL(paths[page], base);
    target.searchParams.set('role', requestedRole || role());
    if (page === 'vehicle') target.searchParams.set('register', '1');
    return target.href;
  }
  function register(data) {
    var account = { version:1, active:true, id:'signup-' + Date.now(), companyId:900000000 + (Date.now() % 100000000),
      userId:data.userId, email:data.email, name:data.name, company:data.company,
      role:roleMap[data.role] || data.role, vehicleCount:0 };
    if (!write(account)) throw new Error('가입 정보를 저장할 수 없습니다. 브라우저의 사이트 저장 설정을 확인해 주세요.');
    return account;
  }
  function login(identifier) {
    var account = read();
    if (!account) return null;
    account.active = account.userId === identifier || account.email === identifier;
    write(account);
    return account.active ? account : null;
  }
  function setVehicleCount(count) {
    var account = current();
    if (!account || !Number.isInteger(count) || count < 0) return;
    account.vehicleCount = count;
    write(account);
  }
  function requiresVehicle(requestedRole, authorizedVehicles) {
    if (!isCustomer(requestedRole)) return false;
    var account = current(requestedRole);
    if (account) return account.vehicleCount === 0;
    // Unknown/loading/error is not the same as a confirmed empty authorized fleet.
    return Array.isArray(authorizedVehicles) && authorizedVehicles.length === 0;
  }
  function guardDashboard(requestedRole, authorizedVehicles) {
    if (!requiresVehicle(requestedRole, authorizedVehicles)) return false;
    location.replace(url('required', requestedRole));
    return true;
  }
  global.MIQCustomerAccess = { current:current, register:register, login:login, url:url, role:role,
    isCustomer:isCustomer, requiresVehicle:requiresVehicle, guardDashboard:guardDashboard, setVehicleCount:setVehicleCount };

  function guardPage() {
    var account = current();
    var pagePath = decodeURIComponent(location.pathname).slice(decodeURIComponent(base.pathname).length);
    var allowed = /^(?:registration\/|Login\/|Find Password\/|My Account\/|Mgmt Vehicle\/)/.test(pagePath);
    if (account && isCustomer(account.role) && account.vehicleCount === 0 && !allowed) location.replace(url('required', account.role));
  }
  guardPage();
  global.addEventListener('pageshow', guardPage);
})(window);
