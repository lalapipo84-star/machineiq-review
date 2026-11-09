(function () {
  'use strict';

  var roleRules = window.MIQCommon.roles;
  var role = roleRules.resolve(document.body.dataset.managementRole || new URLSearchParams(location.search).get('role'));
  var assignedGroupScope = roleRules.hideDashboardComparison(role);
  var policy = roleRules.targetPolicy(role);
  var mockFleet = window.MIQ_MOCK_DATA && window.MIQ_MOCK_DATA.fleet;
  var companies = mockFleet && Array.isArray(mockFleet.dashboardCompanies)
    ? mockFleet.dashboardCompanies.filter(function (company) {
      return (!policy.companyIds || policy.companyIds.indexOf(company.companyId) > -1) &&
        (!Array.isArray(company.dashboardRoles) || company.dashboardRoles.indexOf(role) > -1);
    }) : [];
  var committedReportPeriod = initialReportPeriod();
  var groupVehicles = assignedGroupScope ? roleRules.filterVehicles(role, mockFleet && mockFleet.vehicles || []) : [];
  if (assignedGroupScope) companies = [assignedGroupSummary()];

  function assignedGroupSummary() {
    // The authenticated company and assigned group must intersect. A same-named
    // group at another company must never supply this employee's example data.
    var windowNow = MIQMeeting.hourlyWindow(new Date(), 'Asia/Seoul');
    var samples = groupVehicles.map(function (vehicle) { return MIQMeeting.hourlyVehicle(vehicle, windowNow); });
    function count(key) { return samples.filter(function (sample) { return sample[key]; }).length; }
    function detailCount(key) { return groupVehicles.reduce(function (total, vehicle) { return total + (Number((vehicle.summaryDetail || {})[key]) || 0); }, 0); }
    var from = MIQCommon.dates.parse(committedReportPeriod.from), to = MIQCommon.dates.parse(committedReportPeriod.to);
    var days = MIQCommon.dates.dayCount(from, to);
    function periodMetrics(start) {
      var totals = [0, 0, 0, 0];
      for (var day = 0; day < days; day++) {
        var date = MIQCommon.dates.format(MIQCommon.dates.addDays(start, day));
        var dailyWindow = { date: date, hours: 24, slots: Array.from({ length: 24 }, function (_, hour) { return { from: hour, to: hour + 1 }; }) };
        groupVehicles.forEach(function (vehicle) {
          var sample = MIQMeeting.hourlyVehicle(vehicle, dailyWindow);
          ['km', 'runH', 'fuel', 'battery'].forEach(function (key, index) { totals[index] += Number(sample[key]) || 0; });
        });
      }
      return totals;
    }
    var previous = periodMetrics(MIQCommon.dates.addDays(from, -days)), current = periodMetrics(from), metrics = {};
    ['distance', 'time', 'fuel', 'battery'].forEach(function (key, index) { metrics[key] = [previous[index], current[index]]; });
    var efficiency = previous.map(function (value, index) { return groupVehicles.length ? [value / groupVehicles.length, current[index] / groupVehicles.length] : [0, 0]; });
    var knownEfficiency = groupVehicles.filter(function (vehicle) { return typeof vehicle.efficiencyRate === 'number' || vehicle.type !== '엔진' && typeof vehicle.eff === 'number'; });
    var operatingEfficiency = knownEfficiency.length ? knownEfficiency.reduce(function (total, vehicle) { return total + (vehicle.efficiencyRate == null ? vehicle.eff : vehicle.efficiencyRate); }, 0) / knownEfficiency.length : 0;
    efficiency.push([operatingEfficiency, operatingEfficiency]);
    return { companyId: policy.companyId, companyName: policy.group, assignedGroup: true, vehicleCount: groupVehicles.length,
      connected: count('connected'), disconnected: samples.filter(function (sample) { return sample.known && !sample.connected; }).length,
      running: count('running'), idle: count('idle'), fault: detailCount('activeErrorCount'), replacementNeeded: detailCount('supplyDueCount'),
      replacementSoon: detailCount('supplySoonCount'), metrics: metrics, efficiency: efficiency };
  }

  function initialReportPeriod() {
    var query = new URLSearchParams(location.search);
    var aliases = { d: 'd', day: 'd', w: 'w', week: 'w', m: 'm', month: 'm' };
    var requested = aliases[query.get('period')], period = requested || 'm';
    var dates = MIQCommon.dates, from = query.get('from'), to = query.get('to');
    var range = requested && dates.parse(from) && dates.parse(to) && from <= to
      ? { from: from, to: period === 'd' ? from : to } : dates.operatingRange(period);
    return { period: period, from: range.from, to: range.to };
  }

  window.MIQDashboardCompanyView={role:role,companies:companies};
})();
