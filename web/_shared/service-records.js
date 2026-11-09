(function (root) {
  'use strict';
  /* Service 공용 이력과 소모품 목록. 목록과 배지는 같은 품목·상태를 사용한다.
     날짜·호기를 변경하지 않으며 실제 서버 데이터나 차량 카탈로그를 만들지 않는다. */
  var kinds = ['maintenance', 'supply', 'error'];
  var sourceVehicles = {
    FBA32_224250271: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_224250383: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_032068: { model: 'B30S-7', group: '기본그룹', type: '리튬' },
    FBA32_032042: { model: 'B18S-7', group: '테스트그룹', type: '납산' },
    FBA32_DEMO_CS01: { model: 'B30S-7', group: '물류1팀', type: '리튬' }
  };
  /* Existing Service HTML fixtures; full consumable values are shared with vehicle detail. */
  var supplies = [
    { vin: 'FBA32_224250271', name: '트랜스미션 오일', cycle: 100, used: 231 },
    { vin: 'FBA32_224250271', name: '작동유 필터', cycle: 250, used: 231 },
    { vin: 'FBA32_224250383', name: '트랜스미션 오일 필터', cycle: 100, used: 105 },
    { vin: 'FBA32_032068', name: '엔진오일', cycle: 500, used: 231 },
    { vin: 'FBA32_032068', name: '엔진오일 필터', cycle: 250, used: 231 },
    { vin: 'FBA32_032068', name: '에어클리너', cycle: 300, used: 251 },
    { vin: 'FBA32_224250271', name: '감속기 오일', cycle: 500, used: 425 },
    { vin: 'FBA32_DEMO_CS01', name: '작동유 필터', cycle: 250, used: 240 },
    { vin: 'FBA32_DEMO_CS01', name: '감속기 오일', cycle: 500, used: 425 }
  ];
  function supplyStatus(cycle, used) {
    if ([cycle,used].some(function(v){return v==null || typeof v==='boolean' || typeof v==='string' && !v.trim();})) return { state:'unknown', percent:null, rawPercent:null, width:0 };
    cycle = Number(cycle); used = Number(used);
    if (!Number.isFinite(cycle) || cycle <= 0 || !Number.isFinite(used) || used < 0) return { state: 'unknown', percent: null, rawPercent: null, width: 0 };
    var rawPercent = used / cycle * 100;
    var percent = Math.round(rawPercent * 100) / 100;
    return { state: Math.round(rawPercent) >= 90 ? 'need' : Math.round(rawPercent) >= 80 ? 'soon' : 'ok', percent: percent, rawPercent: rawPercent, width: Math.min(100, percent) };
  }
  function supplyPreview(items, limit) {
    limit = limit === undefined ? 4 : Math.max(0, Math.floor(Number(limit) || 0));
    return (Array.isArray(items) ? items : []).map(function (item, index) {
      return Object.assign({}, item, supplyStatus(item.cycle, item.used), { sourceIndex: index });
    }).sort(function (a, b) { return (b.percent === null ? -1 : b.percent) - (a.percent === null ? -1 : a.percent) || a.sourceIndex - b.sourceIndex; }).slice(0, limit);
  }
  function supplyItems(vin) {
    return supplyPreview(supplies.filter(function (item) { return !vin || normalize(item.vin) === normalize(vin); }), supplies.length);
  }
  var sourceRows = [
    ['maintenance', 'FBA32_224250271', '2026-07-03'],
    ['maintenance', 'FBA32_224250271', '2026-07-08'],
    ['maintenance', 'FBA32_224250271', '2026-07-11'],
    ['maintenance', 'FBA32_224250383', '2026-07-14'],
    ['maintenance', 'FBA32_032042', '2026-07-18'],
    ['maintenance', 'FBA32_032042', '2026-07-22'],
    ['supply', 'FBA32_224250271', '2026-05-01'],
    ['supply', 'FBA32_224250271', '2026-05-01'],
    ['supply', 'FBA32_224250383', '2026-05-07'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['supply', 'FBA32_032068', '2026-06-01'],
    ['error', 'FBA32_224250271', '2026-07-25', 'current'],
    ['error', 'FBA32_032068', '2026-07-20', 'past'],
    ['error', 'FBA32_224250271', '2026-07-24', 'current'],
    ['error', 'FBA32_032042', '2026-07-15', 'past'],
    ['error', 'FBA32_032068', '2026-07-12', 'past'],
    ['error', 'FBA32_224250383', '2026-07-26', 'current'],
    ['supply', 'FBA32_224250271', '2026-06-01'],
    ['supply', 'FBA32_DEMO_CS01', '2026-06-01'],
    ['supply', 'FBA32_DEMO_CS01', '2026-06-01']
  ];
  var supplyIndex = 0;
  var records = sourceRows.map(function (row) {
    var vehicle = sourceVehicles[row[1]];
    var supply = row[0] === 'supply' ? supplies[supplyIndex++] : null;
    return {
      kind: row[0], companyId: '1933', company: '세종물류', group: vehicle.group,
      model: vehicle.model, vin: row[1], type: vehicle.type, date: row[2],
      supplyName: supply ? supply.name : '',
      supplyCycle: supply ? supply.cycle : undefined,
      supplyUsed: supply ? supply.used : undefined,
      supplyState: supply ? supplyStatus(supply.cycle, supply.used).state : '',
      errorState: row[0] === 'error' ? row[3] : ''
    };
  });

  function text(value) { return String(value == null ? '' : value).trim(); }
  function normalize(value) { return text(value).toUpperCase().replace(/[^0-9A-Z가-힣]/g, ''); }
  function matches(record, filter) {
    var companyId = text(filter.companyId);
    if (Array.isArray(filter.companyIds) && filter.companyIds.indexOf(record.companyId) < 0) return false;
    var vehicle = filter.vehicle || filter.veh || '';
    if (companyId && companyId !== 'all' && companyId !== record.companyId) return false;
    if (vehicle && normalize(vehicle) !== normalize(record.vin)) return false;
    if (filter.group && normalize(record.group).indexOf(normalize(filter.group)) < 0) return false;
    if (filter.group && filter.exactGroup && record.group !== filter.group) return false;
    if (filter.type && normalize(record.type) !== normalize(filter.type)) return false;
    if (record.kind === 'supply' && record.supplyState !== 'need' && record.supplyState !== 'soon') return false;
    if (record.kind === 'supply' && filter.supplyState && record.supplyState !== filter.supplyState) return false;
    if (record.kind === 'error' && filter.errorState && record.errorState !== filter.errorState) return false;
    /* 소모품은 교체 필요·임박 상태만 조회한다. 등록일이나 이력 기간은 적용하지 않는다. */
    if (record.kind !== 'supply') {
      if (record.date && filter.from && record.date < filter.from) return false;
      if (record.date && filter.to && record.date > filter.to) return false;
    }
    return true;
  }
  function count(kind, filter) {
    return records.filter(function (record) { return record.kind === kind && matches(record, filter || {}); }).length;
  }
  function totals(filter) {
    return { maintenance: count('maintenance', filter), supply: count('supply', filter), error: count('error', filter) };
  }
  function replace(kind, infos) {
    if (kinds.indexOf(kind) < 0) throw new RangeError('Unknown service record kind: ' + kind);
    if (!Array.isArray(infos)) throw new TypeError('Service record infos must be an array');
    if (kind === 'supply') infos.forEach(function (info) {
      var item = supplies.filter(function (candidate) { return normalize(candidate.vin) === normalize(info.vin) && candidate.name === info.supplyName; })[0];
      if (item && info.supplyCycle !== undefined && info.supplyUsed !== undefined) { item.cycle = Number(info.supplyCycle); item.used = Number(info.supplyUsed); }
    });
    var updated = infos.map(function (info) {
      var company = text(info.company);
      var date = text(info.date).match(/\d{4}-\d{2}-\d{2}/);
      return {
        kind: kind,
        companyId: text(info.companyId) || (normalize(company).indexOf('세종물류') > -1 ? '1933' : ''),
        company: company, group: text(info.group), model: text(info.model), vin: text(info.vin),
        type: text(info.type), date: date ? date[0] : '',
        supplyName: kind === 'supply' ? text(info.supplyName) : '',
        supplyCycle: kind === 'supply' ? info.supplyCycle : undefined,
        supplyUsed: kind === 'supply' ? info.supplyUsed : undefined,
        supplyState: kind === 'supply' ? (info.supplyCycle !== undefined && info.supplyUsed !== undefined ? supplyStatus(info.supplyCycle, info.supplyUsed).state : text(info.supplyState)) : '',
        errorState: kind === 'error' ? text(info.errorState) : ''
      };
    });
    var retained = records.filter(function (record) { return record.kind !== kind; });
    records.splice.apply(records, [0, records.length].concat(retained, updated));
    return updated.length;
  }
  // Service-only identities can open detail without creating collected telemetry
  // or adding vehicles to the fleet/summary population.
  function vehicleIdentity(vin) {
    var key = Object.keys(sourceVehicles).find(function (value) { return normalize(value) === normalize(vin); });
    if (!key) return null;
    return Object.assign({ vin: key, companyId: '1933', companyName: '세종물류',
      serviceOnly: true, catalogOnly: true, conn: null, km: null, min: null, shock: null,
      cumKm: null, cumH: null, soc: null }, sourceVehicles[key]);
  }
  var api = { records: records, count: count, totals: totals, replace: replace, supplyStatus: supplyStatus, supplyPreview: supplyPreview, supplyItems: supplyItems, vehicleIdentity: vehicleIdentity };
  root.MIQServiceRecords = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
