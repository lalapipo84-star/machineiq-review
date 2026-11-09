/* Vehicle registration lookup rules. The catalog is a local fixture, not an ERP response. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQVehicleRegistration = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function normalize(value) { return String(value == null ? '' : value).trim().toUpperCase(); }
  function pair(serial, terminal) { return JSON.stringify([normalize(serial), normalize(terminal)]); }
  function failure(code, message, field) { return { ok:false, code:code, message:message, field:field || '' }; }
  function sameVehicle(record, serial, terminal) {
    return normalize(record.vin) === serial || normalize(record.terminal) === terminal;
  }
  function lookup(catalog, requests, vehicles, serial, terminal) {
    serial = normalize(serial); terminal = normalize(terminal);
    if (!serial) return failure('SERIAL_REQUIRED', '차량 시리얼번호를 입력해 주세요.', 'serial');
    if (!terminal) return failure('TERMINAL_REQUIRED', '터미널 ID를 입력해 주세요.', 'terminal');
    var matches = catalog.filter(function (item) { return normalize(item.vin) === serial && normalize(item.terminal) === terminal; });
    if (!matches.length) return failure('NOT_FOUND', '입력한 차량 시리얼번호와 터미널 ID가 일치하는 차량이 없습니다. 두 값을 확인해 주세요.');
    if (matches.length !== 1) return failure('AMBIGUOUS', '차량 정보가 중복되어 담당 딜러를 확인할 수 없습니다. 관리자에게 문의해 주세요.');
    var item = matches[0];
    if (!item.model || !item.dealer || !item.dealerCompanyId) return failure('INCOMPLETE', '차량 기종 또는 담당 딜러 정보가 없습니다. 관리자에게 문의해 주세요.');
    if (vehicles.some(function (vehicle) { return sameVehicle(vehicle, serial, terminal); }) || requests.some(function (record) { return record.status === 'APRV' && sameVehicle(record, serial, terminal); })) {
      return failure('REGISTERED', '이미 등록된 차량 또는 터미널 ID입니다.');
    }
    if (requests.some(function (record) { return record.status === 'REQ' && sameVehicle(record, serial, terminal); })) {
      return failure('PENDING', '이미 등록 신청한 차량 또는 터미널 ID입니다. 내 차량신청 진행 현황을 확인해 주세요.');
    }
    return { ok:true, item:Object.assign({}, item), message:'조회된 차량 정보와 담당 딜러를 확인한 후 등록해 주세요.' };
  }
  function create(catalog, readRequests, readVehicles) {
    var confirmedPair = null;
    function invalidate() { confirmedPair = null; }
    function search(serial, terminal) {
      invalidate();
      var result = lookup(catalog, readRequests(), readVehicles(), serial, terminal);
      if (result.ok) confirmedPair = pair(serial, terminal);
      return result;
    }
    function confirm(serial, terminal) {
      if (confirmedPair === null || confirmedPair !== pair(serial, terminal)) {
        invalidate();
        return failure('LOOKUP_REQUIRED', '차량 정보를 다시 조회한 후 등록해 주세요.');
      }
      // Recheck pending/approved state immediately before registration.
      var result = lookup(catalog, readRequests(), readVehicles(), serial, terminal);
      if (!result.ok) invalidate();
      return result;
    }
    return { search:search, confirm:confirm, invalidate:invalidate };
  }
  return { lookup:lookup, create:create };
});
