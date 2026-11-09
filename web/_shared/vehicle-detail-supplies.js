(function (root) {
  'use strict';
  // WEB vehicle-detail demo inventory only. These are not manufacturer service intervals.
  // Keep the existing service ledger authoritative for matching item names.
  function items(vehicle, records) {
    if (!vehicle || !vehicle.vin || !records) return [];
    var existing = records.supplyItems(vehicle.vin);
    if (vehicle.serviceOnly) return records.supplyPreview(existing, existing.length);
    var normalDemo = vehicle.type === '엔진' ? [
      { name: '엔진오일', cycle: 500, used: 150 },
      { name: '엔진오일 필터', cycle: 250, used: 100 },
      { name: '에어클리너', cycle: 300, used: 180 }
    ] : [
      { name: '작동유', cycle: 1000, used: 300 },
      { name: '작동유 필터', cycle: 250, used: 100 },
      { name: '감속기 오일', cycle: 500, used: 300 }
    ];
    var combined = existing.concat(normalDemo.filter(function (item) {
      return !existing.some(function (source) { return source.name === item.name; });
    }).map(function (item) { return Object.assign({ vin: vehicle.vin, demoSource: 'vehicle-detail-normal-20260915' }, item); }));
    return records.supplyPreview(combined, combined.length);
  }
  function summary(items) {
    var counts = { need: 0, soon: 0, ok: 0 };
    items.forEach(function (item) { if (counts[item.state] !== undefined) counts[item.state]++; });
    return { counts: counts, preview: items.slice(0, 4) };
  }
  var api = { items: items, summary: summary };
  root.MIQVehicleDetailSupplies = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
