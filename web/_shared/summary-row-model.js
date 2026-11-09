/* Shared summary row values. Dates are committed query dates; no DOM state is read. */
(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MIQSummaryRow = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  'use strict';
  function valid(value) { return typeof value === 'number' && Number.isFinite(value) && value >= 0; }
  function times(vehicle, periodMinutes) {
    var sample = vehicle.summaryDetail || {};
    var running = valid(periodMinutes) ? Math.round(periodMinutes) : null;
    var working = null, idle = null;
    if (running !== null && valid(sample.workMinutes) && valid(sample.idleMinutes)
      && valid(vehicle.min) && sample.workMinutes + sample.idleMinutes === vehicle.min) {
      working = vehicle.min > 0 ? Math.round(running * sample.workMinutes / vehicle.min) : 0;
      idle = running - working;
    }
    return {running: running, working: working, idle: idle};
  }
  // Communication has two UI states; only an explicit connection is shown as on.
  function connection(value) { return value === true ? 'on' : 'off'; }
  function historyCounts(service, vehicle, range) {
    var unavailable = {repair: null, fault: null};
    if (!service || typeof service.count !== 'function' || !Array.isArray(service.records)
      || !vehicle.vin || !range || !range[0] || !range[1]) return unavailable;
    var known = service.records.some(function(record) { return record.vin === vehicle.vin
      && (!vehicle.companyId || String(record.companyId) === String(vehicle.companyId)); });
    if (!known) return unavailable;
    var filter = {vehicle: vehicle.vin, companyId: vehicle.companyId, from: range[0], to: range[1]};
    return {repair: service.count('maintenance', filter), fault: service.count('error', filter)};
  }
  return {times: times, connection: connection, historyCounts: historyCounts};
});
