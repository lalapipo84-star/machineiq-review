(function () {
  'use strict';
  var host = document.getElementById('map'), canvas = document.getElementById('googleMapCanvas');
  if (!host || !canvas) return;
  var frame = document.createElement('iframe');
  MIQCommon.view.set(frame,"title",'Google 지도'); frame.allowFullscreen = true; frame.referrerPolicy = 'no-referrer-when-downgrade';
  MIQCommon.view.call(frame,"setAttribute",['loading','eager']);
  host.dataset.mapProvider = 'loading';
  var status = document.createElement('div'); status.className = 'miq-map-status'; MIQCommon.view.call(status,"setAttribute",['role','status']);
  host.appendChild(status);
  var current = {}, scopeKey = '', selected = '', center = { lat: 36.5, lng: 127.5 }, point = null, zoom = 7, type = 'map', lastSrc = '';
  var renderer = null, upgrading = false, disposed = false;
  var route = {key: '', state: 'idle', points: [], controller: null, message: ''};
  function message(text) { MIQCommon.view.set(status,"textContent",text || ''); status.hidden = !text; }
  function view() {
    if (window.MIQMapRoutePreview) MIQMapRoutePreview.draw(canvas, current.routeMode && route.state === 'ready' ? route.points : [], selected);
    var url = new URL('https://maps.google.com/maps');
    url.search = new URLSearchParams({ output: 'embed', hl: 'ko', ll: center.lat + ',' + center.lng, z: String(zoom), t: type === 'sat' ? 'k' : 'm' }).toString();
    if (point && !current.routeMode) url.searchParams.set('q', point.lat + ',' + point.lng);
    if (url.href !== lastSrc) { lastSrc = url.href; frame.src = lastSrc; canvas.dataset.mapState = 'loading'; }
    canvas.dataset.mapType = type === 'sat' ? 'satellite' : 'roadmap'; canvas.dataset.mapZoom = String(zoom);
    canvas.dataset.selectedVin = selected; canvas.dataset.positionCount = String(current.positionCount || 0);
    canvas.dataset.routeState=route.state;canvas.dataset.routePoints=String(route.points.length);
  }
  function sync(value) {
    if (disposed) return;
    current = value || current;
    host.dataset.mapMode = current.routeMode ? 'route' : 'position';
    var data = window.MIQMapData ? MIQMapData.rows : [];
    var visible = new Set(current.visibleVins || []);
    var rows = data.filter(function (row) { return visible.has(row.vin) && row.hasPosition; });
    var scope = rows.map(function (row) { return row.vin; }).sort().join('|');
    var selectedRow = data.find(function (row) { return visible.has(row.vin) && row.vin === current.selectedVin; });
    if (scope !== scopeKey || selected !== (current.selectedVin || '')) {
      scopeKey = scope; selected = current.selectedVin || ''; point = null;
      if (selectedRow && selectedRow.hasPosition) {
        center = point = { lat: selectedRow.lat, lng: selectedRow.lng }; zoom = 16;
      } else if (rows.length === 1) {
        center = point = { lat: rows[0].lat, lng: rows[0].lng }; zoom = 16;
      } else if (rows.length) {
        var lats = rows.map(function (row) { return row.lat; }), lngs = rows.map(function (row) { return row.lng; });
        var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats), minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
        center = { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
        zoom = Math.max(3, Math.min(15, Math.floor(Math.log2(360 / Math.max(maxLat - minLat, maxLng - minLng, .005))) - 1));
      }
    }
    current.positionCount = rows.length;
    message(!visible.size ? '조회 조건에 해당하는 장비가 없습니다.'
      : selectedRow && !selectedRow.hasPosition ? '선택 차량의 위치 정보가 수집되지 않았습니다.'
      : !rows.length ? '조회 차량의 위치 정보가 수집되지 않았습니다.' : '');
    if (current.routeMode) message(selected ? '선택한 운행일의 이동 경로 기록이 없습니다.' : '경로를 조회할 차량을 선택해 주세요.');
    updateRoute();
    if (renderer) paintInteractive();
    else {
      if(host.dataset.mapProvider==='google-embed')view();
      if (current.routeMode && selected) message(routeMessage());
    }
  }
  function visibleRows() {
    var visible = new Set(current.visibleVins || []);
    return (window.MIQMapData ? MIQMapData.rows : []).filter(function(row) { return visible.has(row.vin); });
  }
  function routeMessage() {
    if (!current.routeMode) return '';
    if (!selected) return '경로를 조회할 차량을 선택해 주세요.';
    if (route.state === 'loading') return '이동 경로를 불러오는 중입니다.';
    if (route.message) return route.message;
    if (route.state === 'empty') return '선택 기간의 이동 경로 기록이 없습니다.';
    return '';
  }
  function paintInteractive() {
    var rows = visibleRows();
    var row = rows.find(function(value) { return value.vin === selected; });
    renderer.sync({rows: rows, selectedVin: selected, routeMode: !!current.routeMode, points: route.points, routeState: route.state});
    message(current.routeMode ? routeMessage() : !rows.length ? '조회 조건에 해당하는 장비가 없습니다.'
      : row && !row.hasPosition ? '선택 차량의 위치 정보가 수집되지 않았습니다.'
      : !rows.some(function(value) { return value.hasPosition; }) ? '조회 차량의 위치 정보가 수집되지 않았습니다.' : '');
    canvas.dataset.routeState = route.state;
    canvas.dataset.routePoints = String(route.points.length);
    canvas.dataset.selectedVin = selected;
  }
  function updateRoute() {
    var from = current.from || current.date, to = current.to || current.date;
    var eligible = current.routeMode && selected && visibleRows().some(function(row) { return row.vin === selected; });
    var key = eligible ? [selected, from, to, current.requestId || 0].join('|') : '';
    if (key === route.key) return;
    if (route.controller) route.controller.abort();
    route = {key:key, state: key ? 'loading' : 'idle', points:[], controller:key ? new AbortController() : null, message:''};
    if (!key) return;
    var request = route;
    window.MIQMapRouteSource.load({vin:selected,from:from,to:to}, {signal:request.controller.signal}).then(function(points) {
      if (disposed || route !== request) return;
      route.points = points; route.state = points.length ? 'ready' : 'empty';
      if (renderer) paintInteractive(); else {
        canvas.dataset.routeState = route.state; canvas.dataset.routePoints = String(points.length);
        if (host.dataset.mapProvider==='google-embed' && window.MIQMapRoutePreview) {
          MIQMapRoutePreview.draw(canvas, points, selected); message(routeMessage());
        } else message(points.length ? '이동 경로는 지도 연결 설정 후 표시할 수 있습니다.' : routeMessage());
      }
    }).catch(function(error) {
      if (disposed || route !== request || error.name === 'AbortError') return;
      route.state = error.code === 'ROUTE_NOT_CONFIGURED' ? 'unconfigured' : 'error';
      route.message = error.code === 'ROUTE_NOT_CONFIGURED' ? '이동 경로 조회 연결이 설정되지 않았습니다.' : error.status === 404 ? '조회할 정보를 찾을 수 없습니다. 목록을 새로 조회해 주세요.' : window.MIQErrors.describe(error).detail;
      if (renderer) paintInteractive(); else message(routeMessage());
    });
  }
  function routeFor(vin) { document.dispatchEvent(new CustomEvent('miq:map-route', {detail:{vin:vin}})); }
  function detailHref(row) {
    return window.MIQMapData && MIQMapData.detailUrl ? MIQMapData.detailUrl(row.vin, 'map-popup') : '../Vehicle%20Detail/vehicle-detail-tobe.html?veh=' + encodeURIComponent(row.vin);
  }
  function revertToEmbed() {
    if (renderer) renderer.destroy();
    renderer = null; host.dataset.mapProvider = 'google-embed';
    canvas.replaceChildren(frame); view();
    message(current.routeMode?routeMessage():'기본 지도를 표시합니다. 차량 아이콘·경로는 지도 연결 설정이 필요합니다.');
  }
  async function upgrade() {
    if (renderer || upgrading || disposed || !(window.MIQMapConfig && MIQMapConfig.apiKey)) return;
    upgrading = true;
    try {
      var next = await MIQGoogleMapSDK.create({host:host,canvas:canvas,config:MIQMapConfig,
        onSelect:function(vin){ MIQMapData.select(vin); }, onClose:function(){ MIQMapData.select(null); },
        onRoute:routeFor, detailHref:detailHref, onFailure:revertToEmbed});
      if (disposed) { next.destroy(); return; }
      if(window.MIQMapRoutePreview)MIQMapRoutePreview.draw(canvas,[],selected);
      renderer = next; frame.remove(); host.dataset.mapProvider = 'google-api';
      canvas.dataset.mapState = 'ready'; paintInteractive();
    } catch (error) { if (!disposed) revertToEmbed(); }
    finally { upgrading = false; }
  }
  frame.addEventListener('load', function () { canvas.dataset.mapState = 'ready'; canvas.dataset.embedLoaded = 'true'; });
  frame.addEventListener('error', function () { canvas.dataset.mapState = 'error'; message('지도를 불러오지 못했습니다. 네트워크 연결을 확인해 주세요.'); });
  window.MIQGoogleMap = {
    sync: sync,
    zoomBy: function (amount) { if (disposed) return; if (renderer) renderer.zoomBy(amount); else { zoom = Math.max(2, Math.min(21, zoom + amount)); view(); } },
    setType: function (value) { if (disposed) return; type = value === 'sat' ? 'sat' : 'map'; if (renderer) renderer.setType(type); else view(); },
    getZoom: function () { return renderer ? renderer.getZoom() : zoom; },
    destroy: function () {
      disposed = true; if (route.controller) route.controller.abort(); if (renderer) renderer.destroy();
      window.removeEventListener('miq:map-config-ready', upgrade); status.remove(); frame.remove();
    }
  };
  message('지도를 불러오는 중입니다.');
  if(!(window.MIQMapConfig&&MIQMapConfig.apiKey)){canvas.appendChild(frame);host.dataset.mapProvider='google-embed';view();}
  window.addEventListener('miq:map-config-ready', upgrade);
  upgrade();
})();
