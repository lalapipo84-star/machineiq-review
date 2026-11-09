/* Shared synthetic observations for dashboard/status/comparison/heatmap.
 * The same entity/date/metric is independent of the selected screen or range.
 * Replace this fixture provider with collected daily data for production.
 */
(function (root) {
  'use strict';
  var charts = root.MIQCharts, observations = root.MIQObservations;
  var metrics = [
    { key:'eff', label:'운영효율', unit:'%', agg:'avg', dec:1, betterHigh:true },
    { key:'shock', label:'충격횟수', unit:'건', agg:'sum', dec:0, betterHigh:false },
    { key:'fuel', label:'연료소비량', rateLabel:'시간당 연료소비량', unit:'L/H', agg:'avg', dec:1, betterHigh:false },
    { key:'batt', label:'배터리 충전량', unit:'%', agg:'avg', dec:1, betterHigh:true },
    { key:'dist', label:'운행거리', unit:'Km', agg:'sum', dec:1, betterHigh:true },
    { key:'hour', label:'운행시간', unit:'H', agg:'sum', dec:0, betterHigh:true }
  ];
  function metric(key) { return metrics.find(function (m) { return m.key === key; }); }
  function round(value, dec) { var p = Math.pow(10, dec); return Math.round(value * p) / p; }
  function iso(date) { return date.toISOString().slice(0, 10); }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    var d = new Date(value + 'T00:00:00Z');
    return isFinite(d.getTime()) && iso(d) === value ? d : null;
  }
  function shift(value, days) { return iso(new Date(date(value).getTime() + days * 86400000)); }
  function cutoff() { return iso(new Date(Date.now() + 9 * 3600000 - 86400000)); }
  function periods(params) {
    var end = cutoff(), month = end.slice(0, 7) + '-01';
    return {
      d:{from:end, to:end, cur:'조회일', prev:'전일'},
      w:{from:shift(end, -6), to:end, cur:'조회주', prev:'이전주'},
      m:{from:month, to:end, cur:'조회월', prev:'이전월'},
      c:{from:params.get('from') || month, to:params.get('to') || end, cur:'조회기간', prev:'이전기간'}
    };
  }
  function query(entity, key, period, from, to, end) {
    var m=metric(key), axis=charts.axis(period,from,to), limit=end || observations.windowAt();
    var values=axis.dates.map(function(day,hour) {
      return m ? observations.value(observations.aggregate(entity,day,day,limit,period==='d'?hour:null),key) : null;
    });
    var raw=observations.aggregate(entity,from,period==='d'?from:to,limit);
    return {m:m,labels:axis.labels,detailLabels:axis.detailLabels,dates:axis.dates,series:values,
      filled:values.filter(function(v){return v!==null;}).length,total:m?observations.value(raw,key):null,coverage:raw};
  }
  function previous(period, from, to) {
    if (!date(from) || !date(to)) return {from:from, to:to};
    if (period === 'm') {
      function priorMonth(value) {
        var d = date(value), y = d.getUTCFullYear(), m = d.getUTCMonth();
        return iso(new Date(Date.UTC(y, m - 1, Math.min(d.getUTCDate(), new Date(Date.UTC(y, m, 0)).getUTCDate()))));
      }
      return {from:priorMonth(from), to:priorMonth(to)};
    }
    var days = period === 'd' ? 1 : Math.round((date(to) - date(from)) / 86400000) + 1;
    return {from:shift(from, -days), to:shift(period === 'd' ? from : to, -days)};
  }
  function status(entity, key, period, from, to, end) {
    var cur = query(entity, key, period, from, to, end), prior = previous(period, from, to);
    var prev = query(entity, key, period, prior.from, prior.to, end);
    return {m:cur.m, labels:cur.labels, detailLabels:cur.detailLabels,
      cols:cur.series.map(function (v, i) { return {cur:v, prev:prev.series[i] == null ? null : prev.series[i]}; }),
      filled:cur.filled, cur:cur.total, prev:prev.total, previous:prior};
  }
  function aggregate(entities,key,from,to,end) {
    var vehicles=observations.unique(entities.reduce(function(all,e){return all.concat(observations.select(e));},[]));
    return observations.value(observations.aggregate(vehicles,from,to,end || observations.windowAt()),key);
  }
  function annual(entities, key, year, end) {
    return Array.from({length:12}, function (_, i) {
      var month = year + '-' + String(i + 1).padStart(2, '0');
      return aggregate(entities, key, month + '-01', iso(new Date(Date.UTC(year, i + 1, 0))), end);
    });
  }
  var api = {metrics:metrics, metric:metric, round:round, cutoff:cutoff, periods:periods, query:query, status:status, previous:previous, aggregate:aggregate, annual:annual};
  root.MIQReportSeries = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);
