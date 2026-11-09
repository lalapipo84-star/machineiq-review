/* IMQ GPS-history adapter. No fabricated coordinates and no calls until configured. */
(function (root) {
  'use strict';
  function unavailable() {
    var error = new Error('이동 경로 조회 연결이 설정되지 않았습니다.');
    error.code = 'ROUTE_NOT_CONFIGURED';
    return error;
  }
  async function load(input, options) {
    var query = root.MIQMapRouteModel.buildQuery(input);
    var config = root.MIQMapConfig || {};
    var result;
    if (typeof config.loadRoute === 'function') {
      result = await config.loadRoute(query, options || {});
    } else if (config.routeEndpoint || config.routeApiBaseUrl) {
      var endpoint=config.routeEndpoint||(String(config.routeApiBaseUrl).replace(/\/$/,'')+'/common/gps/find-gps-track');
      var url = new URL(endpoint, root.location.href);
      if (!/^https?:$/.test(url.protocol)) throw unavailable();
      Object.keys(query).forEach(function (key) { url.searchParams.set(key, query[key]); });
      var contextHeaders=typeof config.routeHeaders==='function'?await config.routeHeaders(query):{};
      result = await root.MIQErrors.getJSON(url.href, {
        credentials: 'include', signal: options && options.signal,
        headers: Object.assign({ Accept: 'application/json', 'X-Client-Site':'fleet' },contextHeaders)
      });
    } else {
      throw unavailable();
    }
    return root.MIQMapRouteModel.normalizeResponse(result, input.vin, input.from, input.to, {timeZone: config.timeZone || 'Asia/Seoul'});
  }
  root.MIQMapRouteSource = {load: load};
})(window);
