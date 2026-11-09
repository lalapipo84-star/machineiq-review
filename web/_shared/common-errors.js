/* Shared user-facing errors. Business failures stay in their current form/list. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQErrors = api;
})(typeof window === 'object' ? window : this, function () {
  'use strict';
  var messages = {
    missing: ['페이지를 찾을 수 없습니다.', '주소가 변경되었거나 더 이상 제공되지 않는 페이지입니다. 주소를 확인하거나 로그인 화면으로 이동해 주세요.'],
    server: ['잠시 서비스를 이용할 수 없습니다.', '일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.'],
    unavailable: ['서비스가 일시 중단되었습니다.', '서비스 점검 또는 일시적인 과부하로 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.'],
    session: ['다시 로그인이 필요합니다.', '로그인 상태가 만료되었습니다. 다시 로그인한 후 이용해 주세요.'],
    forbidden: ['접근 권한이 없습니다.', '이 정보를 이용할 권한이 없습니다. 소속 업체의 관리자에게 확인해 주세요.'],
    network: ['연결 상태를 확인해 주세요.', '서버에 연결하지 못했습니다. 인터넷 연결을 확인한 후 다시 시도해 주세요.'],
    timeout: ['응답이 지연되고 있습니다.', '요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'],
    busy: ['잠시 후 다시 시도해 주세요.', '요청이 많아 처리하지 못했습니다. 잠시 기다린 후 다시 시도해 주세요.'],
    conflict: ['변경된 정보를 확인해 주세요.', '이미 처리되었거나 다른 사용자가 변경한 정보입니다. 최신 상태를 확인해 주세요.'],
    validation: ['입력 내용을 확인해 주세요.', '필수 항목과 입력 형식을 확인한 후 다시 시도해 주세요.'],
    invalid: ['정보를 불러오지 못했습니다.', '응답 정보를 확인할 수 없습니다. 잠시 후 다시 조회해 주세요.']
  };
  function kind(error) {
    error = error || {};
    if (error.name === 'AbortError') return 'cancelled';
    if (error.code === 'TIMEOUT') return 'timeout';
    if (error.code === 'INVALID_RESPONSE') return 'invalid';
    if (error.code === 'NETWORK' || error.name === 'TypeError') return 'network';
    var status = Number(error.status);
    return ({401:'session',403:'forbidden',404:'missing',408:'timeout',409:'conflict',400:'validation',422:'validation',429:'busy',503:'unavailable'})[status] || 'server';
  }
  function describe(error) {
    var type = typeof error === 'string' && messages[error] ? error : kind(error);
    if (type === 'cancelled') return {type:type, silent:true};
    return {type:type, title:messages[type][0], detail:messages[type][1], retry:['server','unavailable','network','timeout','busy','invalid'].includes(type)};
  }
  function failure(status, code) {
    var error = new Error('Request failed');
    error.status = status; error.code = code;
    return error;
  }
  // Read-only requests only: never retry registration/approval/save automatically.
  async function getJSON(url, options) {
    options = options || {};
    var controller = new AbortController(), signal = options.signal, timedOut = false;
    function cancel() { controller.abort(); }
    if (signal && signal.aborted) { var cancelled=new Error('Cancelled');cancelled.name='AbortError';throw cancelled; }
    if (signal) signal.addEventListener('abort', cancel, {once:true});
    var timer = setTimeout(function(){timedOut=true;controller.abort();}, options.timeoutMs || 15000);
    try {
      var response = await (options.fetch || fetch)(url, {method:'GET',credentials:options.credentials || 'same-origin',headers:options.headers || {Accept:'application/json'},signal:controller.signal});
      if (!response.ok) throw failure(response.status, 'HTTP');
      try { return await response.json(); }
      catch (error) { if (controller.signal.aborted) throw error; throw failure(0, 'INVALID_RESPONSE'); }
    } catch (error) {
      if (timedOut) throw failure(0, 'TIMEOUT');
      if (signal && signal.aborted) {var abort=new Error('Cancelled');abort.name='AbortError';throw abort;}
      if (error.status || error.code) throw error;
      throw failure(0, 'NETWORK');
    } finally {
      clearTimeout(timer);
      if (signal) signal.removeEventListener('abort',cancel);
    }
  }
  // Conservative destinations for an explicit recovery button. Never use role as authorization.
  var returnPaths = ['Dashboard/group-dashboard-tobe-v2.html','Map/map-tobe.html','Vehicle Summary/vehicle-summary-tobe-3.html','Operational Efficiency/operational-efficiency-tobe-option-b.html','Report Status/report-status-tobe.html','Mgmt Vehicle/mgmt-vehicle-tobe.html','Login/login-tobe.html'];
  function safeReturn(value, base) {
    if (!value || /[\\\u0000-\u001f]/.test(value)) return null;
    try {
      var home=new URL(base), url=new URL(value,home);
      if (!['http:','https:','file:'].includes(url.protocol) || url.protocol!==home.protocol || url.origin!==home.origin || url.host!==home.host || url.username || url.password) return null;
      if (!url.pathname.startsWith(home.pathname)) return null;
      var path=decodeURIComponent(url.pathname.slice(home.pathname.length));
      if (!returnPaths.includes(path)) return null;
      // Carry only known view filters; never forward token/password/arbitrary query data.
      var result=new URL(path,home), keys=['lang','role','companyId','group','vin','period','from','to','state'];
      keys.forEach(function(key){var val=url.searchParams.get(key);if(val!==null && val.length<=200)result.searchParams.set(key,val);});
      return result.href;
    } catch (_) { return null; }
  }
  return {describe:describe, getJSON:getJSON, safeReturn:safeReturn};
});
