/* MACHINE IQ prototype fleet compatibility adapter.
   Canonical mock data: ../_mock-data/master/fleet.json
   Runtime bridge: ../_mock-data/generated/fleet.generated.js */
(function (global) {
  'use strict';

  function invariant(condition, message) {
    if (!condition) {
      throw new Error('[MACHINE IQ mock data] ' + message);
    }
  }

  function cloneRecord(record) {
    return Object.assign({}, record);
  }

  var source = global.MIQ_MOCK_DATA && global.MIQ_MOCK_DATA.fleet;
  invariant(source, 'fleet.generated.js must be loaded before _shared/fleet.js');
  invariant(source.schemaVersion === '1.0.0', 'unsupported fleet schemaVersion');
  invariant(source.defaultCompany && typeof source.defaultCompany.companyName === 'string', 'defaultCompany is required');
  invariant(Array.isArray(source.powerTypes), 'powerTypes must be an array');
  invariant(Array.isArray(source.vehicles), 'vehicles must be an array');

  var catalog = source.vehicles.map(cloneRecord);
  var fleet = catalog
    .filter(function (vehicle) { return vehicle.catalogOnly === false; })
    .map(function (vehicle) {
      var metric = cloneRecord(vehicle);
      delete metric.companyId;
      delete metric.companyName;
      delete metric.catalogOnly;
      return metric;
    });

  invariant(catalog.length === 45, 'fleet catalog must contain 42 original and 3 customer-staff demo vehicles');
  invariant(fleet.length === 13, 'metric fleet must contain 10 original and 3 customer-staff demo vehicles');

  var MIQ = global.MIQ = global.MIQ || {};
  MIQ.COMPANY = source.defaultCompany.companyName;
  MIQ.TYPES = source.powerTypes.slice();
  MIQ.FLEET = fleet;
  MIQ.FLEET_METRICS = MIQ.FLEET;
  MIQ.FLEET_CATALOG = catalog;
  MIQ.GROUPS = catalog
    .map(function (vehicle) { return vehicle.group; })
    .filter(function (group, index, groups) { return groups.indexOf(group) === index; });
})(window);
