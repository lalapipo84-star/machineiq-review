/* Optional native Google Maps renderer. No key or sample data is embedded here.
   Requires MIQMapPopup; the controller owns authorized API data and credentials.
   create() rejects initialization failures; onFailure handles later auth failures.
   onSelect(vin), onClose(), onRoute(vin, row), detailHref(row). */
(function (root) {
  'use strict';
  var doc = root.document, sdkPromise = null, sdkReject = null;
  var authSubscribers = new Set(), authInstalled = false, callbackSequence = 0, authFailureError = null;

  function failure(code, message) { var error = new Error(message); error.code = code; return error; }
  function installAuthHandler() {
    if (authInstalled) return;
    authInstalled = true;
    var previous = root.gm_authFailure;
    root.gm_authFailure = function () {
      var error = failure('MAP_AUTH_FAILED', 'Google 지도 인증을 확인해 주세요.');
      authFailureError = error;
      if (sdkReject) sdkReject(error);
      authSubscribers.forEach(function (notify) { notify(error); });
      if (typeof previous === 'function') previous();
    };
  }
  function load(config) {
    if (!config || !String(config.apiKey || '').trim()) return Promise.reject(failure('MAP_KEY_MISSING', 'Google 지도 키가 설정되지 않았습니다.'));
    installAuthHandler();
    if (root.google && root.google.maps && root.google.maps.importLibrary) return root.google.maps.importLibrary('maps').then(function (library) { if (authFailureError) throw authFailureError; return library; });
    if (sdkPromise) return sdkPromise;
    sdkPromise = new Promise(function (resolve, reject) {
      var script = doc.createElement('script'), settled = false;
      var callback = '__miqGoogleSDKReady' + (++callbackSequence);
      function finish(error) {
        if (settled) return;
        settled = true; root.clearTimeout(timer); delete root[callback]; sdkReject = null;
        script.onerror = null;
        if (error) { script.remove(); sdkPromise = null; reject(error); }
        else root.google.maps.importLibrary('maps').then(function (library) { if (authFailureError) reject(authFailureError); else resolve(library); }, function () { reject(failure('MAP_LOAD_FAILED', 'Google 지도를 불러오지 못했습니다.')); });
      }
      sdkReject = finish;
      root[callback] = function () { finish(); };
      script.async = true;
      script.onerror = function () { finish(failure('MAP_LOAD_FAILED', 'Google 지도를 불러오지 못했습니다.')); };
      var url = new URL('https://maps.googleapis.com/maps/api/js');
      url.search = new URLSearchParams({ key: String(config.apiKey), loading: 'async', callback: callback, v: 'weekly', language: 'ko', region: 'KR' }).toString();
      script.src = url.href;
      var nonce = doc.querySelector('script[nonce]'); if (nonce) script.nonce = nonce.nonce;
      var timer = root.setTimeout(function () { finish(failure('MAP_LOAD_TIMEOUT', 'Google 지도 연결 시간이 초과되었습니다.')); }, 20000);
      doc.head.appendChild(script);
    });
    return sdkPromise;
  }
  function coordinate(value) {
    if (!value || value.lat === null || value.lng === null || value.lat === undefined || value.lng === undefined || value.lat === '' || value.lng === '') return null;
    var lat = Number(value.lat), lng = Number(value.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 ? { lat: lat, lng: lng } : null;
  }
  function node(tag, className, text) { var result = doc.createElement(tag); if (className) result.className = className; if (text !== undefined) MIQCommon.view.set(result,"textContent",text); return result; }
  function present(value, suffix) { return value === null || value === undefined || value === '' ? '-' : String(value) + (suffix || ''); }
  function applyStyles(element, styles) { Object.keys(styles).forEach(function (key) { element.style[key] = styles[key]; }); return element; }

  async function create(options) {
    options = options || {};
    if (!options.config || !String(options.config.apiKey || '').trim()) throw failure('MAP_KEY_MISSING', 'Google 지도 키가 설정되지 않았습니다.');
    if (!options.host || !options.canvas) throw failure('MAP_HOST_MISSING', '지도 영역이 없습니다.');
    if (!root.MIQMapPopup) throw failure('MAP_POPUP_MISSING', '지도 팝업 구성요소가 없습니다.');
    await load(options.config);
    var maps = root.google.maps, host = options.host, canvas = options.canvas;
    /* Do not replace the fallback iframe. The controller owns that surface. */
    var surface = node('div', 'miq-google-sdk-surface');
    applyStyles(surface, { position: 'absolute', inset: '0', width: '100%', height: '100%' });
    canvas.appendChild(surface);
    var map;
    try { map = new maps.Map(surface, {
      center: { lat: 36.5, lng: 127.5 }, zoom: 7,
      disableDefaultUI: true, zoomControl: false, mapTypeControl: false,
      streetViewControl: false, fullscreenControl: false, rotateControl: false,
      scaleControl: true, gestureHandling: 'greedy', scrollwheel: true, clickableIcons: false,
      keyboardShortcuts: true, mapTypeId: 'roadmap'
    }); } catch (error) { surface.remove(); throw failure('MAP_INIT_FAILED', 'Google 지도를 시작하지 못했습니다.'); }
    canvas.dataset.mapState = 'ready';
    var destroyed = false, rows = [], selectedVin = '', routeMode = false;
    var vehicleOverlays = [], routeOverlays = [], line = null, popup = null, pointTip = null;
    var popupIdentity = '', scopeKey = null, viewKey = null, routeKey = null, lastSelected = null;
    var listeners = [], activeRoutePoint = null;

    class DomOverlay extends maps.OverlayView {
      constructor(position, content, popupMode) {
        super(); this.position = new maps.LatLng(position.lat, position.lng);
        this.content = content; this.popupMode = !!popupMode;
        this.wrapper = node('div', popupMode ? 'miq-map-native-popup' : 'miq-map-native-marker');
        applyStyles(this.wrapper, { position: 'absolute', pointerEvents: 'auto', zIndex: popupMode ? '20' : '3' });
        this.wrapper.appendChild(content); this.setMap(map);
      }
      onAdd() {
        (this.popupMode ? this.getPanes().floatPane : this.getPanes().overlayMouseTarget).appendChild(this.wrapper);
        maps.OverlayView.preventMapHitsAndGesturesFrom(this.wrapper);
      }
      draw() {
        var projection = this.getProjection(); if (!projection || !this.wrapper) return;
        var pixel = projection.fromLatLngToDivPixel(this.position); if (!pixel) return;
        var x = pixel.x, y = pixel.y;
        if (this.popupMode) {
          var container = projection.fromLatLngToContainerPixel(this.position);
          if (!container) return;
          this.content.style.maxWidth = Math.max(80, canvas.clientWidth - 16) + 'px';
          this.content.style.maxHeight = Math.max(60, canvas.clientHeight - 16) + 'px';
          this.content.style.overflowY = 'auto';
          var width = this.wrapper.offsetWidth, height = this.wrapper.offsetHeight;
          var left = Math.max(8, Math.min(container.x + 12, canvas.clientWidth - width - 8));
          var top = Math.max(8, Math.min(container.y - height - 18, canvas.clientHeight - height - 8));
          x += left - container.x; y += top - container.y;
        }
        this.wrapper.style.left = x + 'px'; this.wrapper.style.top = y + 'px';
      }
      onRemove() { if (this.wrapper) { maps.event.clearInstanceListeners(this.wrapper); this.wrapper.remove(); } }
    }
    function removeOverlay(overlay) { if (overlay) overlay.setMap(null); }
    function clearPopup() { removeOverlay(popup); popup = null; popupIdentity = ''; }
    function clearPointTip() { removeOverlay(pointTip); pointTip = null; activeRoutePoint = null; }
    function clearRoute() {
      clearPointTip(); routeOverlays.forEach(removeOverlay); routeOverlays = [];
      if (line) line.setMap(null); line = null;
    }
    function clearVehicles() { vehicleOverlays.forEach(removeOverlay); vehicleOverlays = []; }
    function closeVehiclePopup() { clearPopup(); if (typeof options.onClose === 'function') options.onClose(); }
    function drawPopup(row) {
      var position = coordinate(row); if (!position) { clearPopup(); return; }
      var identity = JSON.stringify([row.vin, row.model, row.group, row.st, row.runH, row.posTime, row.addr, position]);
      if (popup && popupIdentity === identity) return;
      clearPopup();
      var content = root.MIQMapPopup.createVehicle(row, {
        onClose: closeVehiclePopup,
        detailHref: typeof options.detailHref === 'function' ? options.detailHref(row) : options.detailHref
      });
      var routeAction = node('button', 'map-pop__go miq-map-route-action', '이동 경로');
      routeAction.type = 'button';
      applyStyles(routeAction, { border: '0', background: 'transparent', padding: '0', marginLeft: '14px', cursor: 'pointer', fontFamily: 'inherit' });
      routeAction.addEventListener('click', function (event) { event.stopPropagation(); if (typeof options.onRoute === 'function') options.onRoute(row.vin, row); });
      content.appendChild(routeAction);
      popup = new DomOverlay(position, content, true); popupIdentity = identity;
    }
    function clusterPopup(group) {
      clearPopup();
      var content = node('div', 'map-pop');
      applyStyles(content, { position: 'relative', fontFamily: "'Noto Sans KR', sans-serif", fontWeight: '400', lineHeight: 'normal' });
      var close = node('button', 'map-pop__x', '✕'); close.type = 'button'; MIQCommon.view.call(close,"setAttribute",['aria-label','묶음 차량 목록 닫기']);
      applyStyles(close, { border: '0', background: 'transparent', padding: '0', cursor: 'pointer' });
      close.addEventListener('click', clearPopup); content.appendChild(close);
      content.appendChild(node('div', 'map-pop__t', '차량 ' + group.length + '대'));
      var list = node('div'); applyStyles(list, { maxHeight: '200px', overflowY: 'auto' });
      group.forEach(function (row) {
        var item = node('button', 'map-pop__r', present(row.model) + ' · ' + present(row.vin)); item.type = 'button';
        applyStyles(item, { width: '100%', border: '0', background: 'transparent', textAlign: 'left', padding: '8px 0', cursor: 'pointer', color: '#000000', fontFamily: 'inherit' });
        item.addEventListener('click', function () { clearPopup(); if (typeof options.onSelect === 'function') options.onSelect(row.vin); });
        list.appendChild(item);
      });
      content.appendChild(list); popup = new DomOverlay(coordinate(group[0]), content, true);
    }
    function buildVehicles() {
      clearVehicles();
      var groups = [], projection = map.getProjection && map.getProjection(), scale = Math.pow(2, map.getZoom() || 7);
      rows.slice().sort(function(a,b){return String(a.vin).localeCompare(String(b.vin));}).forEach(function (row) {
        var position = coordinate(row); if (!position || row.hasPosition === false) return;
        var pixel = projection && projection.fromLatLngToPoint(new maps.LatLng(position.lat,position.lng));
        var group = groups.find(function(g){
          var p=coordinate(g[0]);
          if(pixel&&g.pixel)return Math.hypot(pixel.x-g.pixel.x,pixel.y-g.pixel.y)*scale<48;
          return p.lat.toFixed(6)===position.lat.toFixed(6)&&p.lng.toFixed(6)===position.lng.toFixed(6);
        });
        if(group)group.push(row);else{group=[row];group.pixel=pixel;groups.push(group);}
      });
      groups.forEach(function (group) {
        var position = {lat:group.reduce(function(n,r){return n+Number(r.lat);},0)/group.length,lng:group.reduce(function(n,r){return n+Number(r.lng);},0)/group.length}, marker;
        if (group.length === 1) {
          marker = root.MIQMapPopup.createMarker(group[0], { onSelect: function (row) { if (typeof options.onSelect === 'function') options.onSelect(row.vin); } });
          marker.classList.toggle('on', group[0].vin === selectedVin);
        } else {
          marker = node('button', 'cluster', String(group.length)); marker.type = 'button';
          MIQCommon.view.call(marker,"setAttribute",['aria-label','주변 차량 ' + group.length + '대 확대']);
          marker.title = group.length + '대 · 클릭하여 확대';
          marker.addEventListener('click', function () {
            var same=group.every(function(r){return Math.abs(r.lat-group[0].lat)<.000001&&Math.abs(r.lng-group[0].lng)<.000001;});
            if(same||(map.getZoom()||0)>=20)clusterPopup(group);
            else{var previous=map.getZoom()||7;fit(group.map(coordinate));if((map.getZoom()||0)<=previous)map.setZoom(Math.min(21,previous+2));}
          });
          if (group.some(function (row) { return row.vin === selectedVin; })) marker.style.outline = '3px solid rgba(255,54,0,.35)';
        }
        marker.style.left = '0'; marker.style.top = '0';
        vehicleOverlays.push(new DomOverlay(position, marker, false));
      });
    }
    function pointDescription(point, index, count) {
      var label = count === 1 ? '단일 위치' : index === 0 ? '출발' : index === count - 1 ? '도착' : '경로 지점 ' + (index + 1);
      return [label, '시간 ' + present(point.gpsDatetime), '좌표 ' + point.lat.toFixed(6) + ', ' + point.lng.toFixed(6), '속도 ' + present(point.speed, ' km/h'), '충격 ' + present(point.shock)].join('\n');
    }
    function buildRoute(points) {
      clearRoute();
      if (!points.length) return;
      if (points.length > 1) line = new maps.Polyline({ map: map, path: points.map(coordinate), geodesic: true, strokeColor: '#ff3600', strokeOpacity: 1, strokeWeight: 2, clickable: false });
      points.forEach(function (point, index) {
        var edge = index === 0 || index === points.length - 1;
        var color = index === 0 ? '#158737' : index === points.length - 1 ? '#ff3600' : '#8aaabe';
        var marker = node('button', 'miq-map-route-point'); marker.type = 'button';
        MIQCommon.view.call(marker,"setAttribute",['aria-label',pointDescription(point, index, points.length)]);
        applyStyles(marker, { position: 'absolute', left: '0', top: '0', width: edge ? '16px' : '12px', height: edge ? '16px' : '12px', border: '2px solid #fff', borderRadius: '50%', padding: '0', background: color, boxShadow: '0 1px 4px rgba(0,0,0,.35)', transform: 'translate(-50%,-50%)', cursor: 'pointer' });
        function show() {
          if (activeRoutePoint === marker && pointTip) return;
          clearPointTip(); var content = node('div', 'map-pop', pointDescription(point, index, points.length));
          MIQCommon.view.call(content,"setAttribute",['role','tooltip']);
          applyStyles(content, { position: 'relative', whiteSpace: 'pre-line', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '11px', lineHeight: '1.7', color: '#000000', pointerEvents: 'none' });
          pointTip = new DomOverlay(point, content, true); activeRoutePoint = marker;
        }
        marker.addEventListener('mouseenter', show); marker.addEventListener('focus', show); marker.addEventListener('click', show);
        marker.addEventListener('mouseleave', function () { if (doc.activeElement !== marker) clearPointTip(); });
        marker.addEventListener('blur', clearPointTip);
        marker.addEventListener('keydown', function (event) { if (event.key === 'Escape') clearPointTip(); });
        routeOverlays.push(new DomOverlay(point, marker, false));
      });
    }
    function fit(positions) {
      if (!positions.length) return;
      var known = new Set();
      positions = positions.filter(function (position) { var key = position.lat.toFixed(6) + ',' + position.lng.toFixed(6); if (known.has(key)) return false; known.add(key); return true; });
      if (positions.length === 1) { map.setCenter(positions[0]); map.setZoom(16); return; }
      var bounds = new maps.LatLngBounds(); positions.forEach(function (position) { bounds.extend(position); });
      map.fitBounds(bounds, {top:55,left:50,right:280,bottom:45});
    }
    function sync(value) {
      if (destroyed) return;
      value = value || {}; rows = Array.isArray(value.rows) ? value.rows : [];
      selectedVin = value.selectedVin || ''; routeMode = !!value.routeMode;
      var previousScope = scopeKey;
      scopeKey = rows.map(function (row) { return String(row.vin || ''); }).sort().join('|');
      var selectionChanged = selectedVin !== lastSelected;
      var positions = rows.filter(function (row) { return row.hasPosition !== false; }).map(coordinate).filter(Boolean);
      var selected = rows.find(function (row) { return row.vin === selectedVin && row.hasPosition !== false && coordinate(row); });
      if (routeMode) { clearVehicles(); clearPopup(); }
      else { buildVehicles(); if (selected) drawPopup(selected); else clearPopup(); }
      var routeStatus = typeof value.routeState === 'string' ? value.routeState : value.routeState && value.routeState.status;
      var ready = routeMode && ['loading', 'empty', 'error'].indexOf(routeStatus) < 0;
      var points = ready && Array.isArray(value.points) ? value.points.map(function (point) { var valid = coordinate(point); return valid && Object.assign({}, point, valid); }).filter(Boolean) : [];
      var nextRouteKey = JSON.stringify([routeMode, routeStatus || '', selectedVin, points]);
      if (routeKey !== nextRouteKey) { buildRoute(points); routeKey = nextRouteKey; }
      var nextViewKey = routeMode && points.length ? JSON.stringify([selectedVin, points.map(function (point) { return [point.lat, point.lng, point.gpsDatetime]; })]) : null;
      if (nextViewKey && nextViewKey !== viewKey) fit(points.map(coordinate));
      else if (selectionChanged && selected && !nextViewKey) { map.panTo(coordinate(selected)); if ((map.getZoom() || 0) < 15) map.setZoom(16); }
      else if (scopeKey !== previousScope && !nextViewKey) fit(positions);
      viewKey = nextViewKey; lastSelected = selectedVin;
      canvas.dataset.selectedVin = selectedVin; canvas.dataset.positionCount = String(positions.length);
      canvas.dataset.routeState = routeMode ? (routeStatus || (points.length ? 'ready' : 'empty')) : 'off';
    }
    function updateZoom() { canvas.dataset.mapZoom = String(map.getZoom() || 0); }
    listeners.push(map.addListener('zoom_changed', updateZoom));
    listeners.push(map.addListener('idle', function(){if(!destroyed&&!routeMode)buildVehicles();}));
    listeners.push(map.addListener('click', function () { clearPointTip(); }));
    var resize = root.ResizeObserver ? new root.ResizeObserver(function () {
      if (destroyed) return; maps.event.trigger(map, 'resize'); if (popup) popup.draw(); if (pointTip) pointTip.draw();
    }) : null;
    if (resize) resize.observe(surface);
    function onAuthFailure(error) { if (destroyed) return; destroy(); if (typeof options.onFailure === 'function') options.onFailure(error); }
    authSubscribers.add(onAuthFailure);
    function destroy() {
      if (destroyed) return; destroyed = true;
      authSubscribers.delete(onAuthFailure); clearVehicles(); clearRoute(); clearPopup();
      if (resize) resize.disconnect(); listeners.forEach(function (listener) { listener.remove(); });
      maps.event.clearInstanceListeners(map); surface.remove();
    }
    updateZoom();
    return {
      sync: sync,
      zoomBy: function (amount) { if (!destroyed && Number.isFinite(Number(amount))) map.setZoom(Math.max(2, Math.min(21, (map.getZoom() || 7) + Number(amount)))); },
      setType: function (value) { if (!destroyed) { var type = value === 'sat' || value === 'satellite' ? 'satellite' : 'roadmap'; map.setMapTypeId(type); canvas.dataset.mapType = type; } },
      getZoom: function () { return destroyed ? null : map.getZoom(); },
      destroy: destroy
    };
  }
  root.MIQGoogleMapSDK = { create: create };
})(window);
