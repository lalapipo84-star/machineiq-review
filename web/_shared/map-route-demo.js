/* WEB acceptance fixtures, not recorded GPS. Only installed by the local prototype page.
   Explicit host loaders/endpoints take precedence. Samples follow the existing GPS response contract. */
(function (root) {
  'use strict';
  var offsets = [[0,0],[.0002,.0001],[.0004,.0001],[.0006,.0003],[.0006,.0006],[.0004,.0008],[.0002,.0008],[0,.0006],[0,.0003],[.0001,.0001]];
  var fixtureVins = ['FBA32_224250271', 'FBA32_DEMO_CS01', 'FBD30_DEMO_CS03'];
  function response(query, rows, now) {
    var vehicle = rows.find(function (row) { return row.vin === query.searchKeyword && row.hasPosition && fixtureVins.indexOf(row.vin) >= 0; });
    if (!vehicle) return { code: '00', result: [] };
    var today = root.MIQCommon.dates.today(now), earliest = root.MIQCommon.dates.addDays(today, -31);
    var points = [];
    for (var day = earliest; day <= today; day = root.MIQCommon.dates.addDays(day, 1)) {
      var date = root.MIQCommon.dates.format(day), compact = date.replace(/-/g, '');
      if (compact < query.startDate || compact > query.endDate) continue;
      offsets.forEach(function (offset, index) {
        var time = String(index).padStart(2, '0') + ':00:00';
        if (date === root.MIQCommon.dates.format(today) && index > now.getHours()) return;
        points.push({ latitude: vehicle.lat + offset[0], longitude: vehicle.lng + offset[1], gpsDatetime: date + ' ' + time, speed: index === 0 || index === offsets.length - 1 ? 0 : 4, shock: 0 });
      });
    }
    return { code: '00', result: [{ equipmentNumber: vehicle.vin, gpsTrackItems: points }] };
  }
  root.MIQMapRouteDemo = { response: response };
  var config = root.MIQMapConfig;
  if (!config || config.loadRoute || config.routeEndpoint || config.routeApiBaseUrl) return;
  config.demoRoute = true;
  config.loadRoute = function (query) {
    return response(query, root.MIQMapData ? root.MIQMapData.rows : [], new Date());
  };
})(window);
