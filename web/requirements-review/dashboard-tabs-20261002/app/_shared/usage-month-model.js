/* Monthly calendar contract, shared by the page and date-boundary verification. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MIQUsageMonth = factory();
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  function pad(n) { return String(n).padStart(2, '0'); }
  function parse(value) {
    var match = /^(\d{4})-(\d{2})$/.exec(value || '');
    if (!match || Number(match[1]) < 1000 || Number(match[2]) < 1 || Number(match[2]) > 12) return null;
    return { year: Number(match[1]), month: Number(match[2]) };
  }
  function today(now) {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now || new Date());
    var values = {}; parts.forEach(function (part) { values[part.type] = part.value; });
    return values.year + '-' + values.month + '-' + values.day;
  }
  function range(value) {
    var month = parse(value);
    if (!month) return null;
    var days = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
    return { year: month.year, month: month.month, from: value + '-01', to: value + '-' + pad(days), days: days };
  }
  function shift(value, amount) {
    var month = parse(value); if (!month) return null;
    var date = new Date(Date.UTC(month.year, month.month - 1 + amount, 1));
    var next = date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1);
    return parse(next) ? next : null;
  }
  function initial(query, currentDate) {
    var candidates = [query.get('month'), (query.get('from') || '').slice(0, 7), (query.get('to') || '').slice(0, 7), currentDate.slice(0, 7)];
    var selected = candidates.filter(function (value) { return parse(value); })[0];
    return selected > currentDate.slice(0, 7) ? currentDate.slice(0, 7) : selected;
  }
  function selectable(value, currentDate) {
    return !!parse(value) && value <= currentDate.slice(0, 7);
  }
  function status(date, currentDate) {
    return date > currentDate ? 'future' : date === currentDate ? 'pending' : 'collected';
  }
  function label(value) { return { future: '미도래', pending: '집계 전', collected: '집계 완료' }[value]; }
  return { parse: parse, today: today, range: range, shift: shift, initial: initial, selectable: selectable, status: status, label: label };
});
