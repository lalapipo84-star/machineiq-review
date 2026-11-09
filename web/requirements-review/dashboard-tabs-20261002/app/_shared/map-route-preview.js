/* Coordinate trace for the keyless WEB prototype. This is not a road-routing result. */
(function (root) {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  function element(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (key) { MIQCommon.view.call(node,"setAttribute",[key,attrs[key]]); });
    if (text !== undefined) MIQCommon.view.set(node,"textContent",text);
    return node;
  }
  function draw(canvas, points, vin) {
    var old = canvas.querySelector('.miq-route-preview');
    if (old) old.remove();
    if (!points.length) return;
    var panel = document.createElement('div'); panel.className = 'miq-route-preview';
    var title = document.createElement('strong'); MIQCommon.view.set(title,"textContent",vin + ' · 이동 경로'+(root.MIQMapConfig&&root.MIQMapConfig.demoRoute?' · 시연 데이터':'')); panel.appendChild(title);
    var info = document.createElement('div'); info.className = 'miq-route-preview__info';
    MIQCommon.view.set(info,"textContent",'시작 ' + points[0].gpsDatetime + ' · 종료 ' + points[points.length - 1].gpsDatetime + ' · 위치 기록 ' + points.length + '개'); panel.appendChild(info);
    var svg = element('svg', { viewBox: '0 0 1000 340', role: 'img', 'aria-label': vin + ' 이동 경로 · 위치 좌표 기준' });
    var lats = points.map(function (p) { return p.lat; }), lngs = points.map(function (p) { return p.lng; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats), minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var dx = Math.max(maxLng - minLng, .0002), dy = Math.max(maxLat - minLat, .0002);
    function xy(p) { return [130 + (p.lng - minLng) / dx * 740, 290 - (p.lat - minLat) / dy * 230]; }
    for (var i = 0; i < 5; i++) {
      var x = 130 + i * 185, y = 60 + i * 57.5;
      svg.appendChild(element('line', { x1:x,y1:50,x2:x,y2:300,stroke:'#e6e9ed' }));
      svg.appendChild(element('line', { x1:120,y1:y,x2:880,y2:y,stroke:'#e6e9ed' }));
      svg.appendChild(element('text', { x:x,y:320,'text-anchor':'middle',fill:'#768396','font-size':11 }, (minLng + i * dx / 4).toFixed(5) + '°E'));
      svg.appendChild(element('text', { x:108,y:y+4,'text-anchor':'end',fill:'#768396','font-size':11 }, (minLat + (4-i) * dy / 4).toFixed(5) + '°N'));
    }
    svg.appendChild(element('polyline', { points:points.map(function(p){return xy(p).join(',');}).join(' '),fill:'none',stroke:'#ff3600','stroke-width':2 }));
    var unique = points.filter(function(p,i){return i===0||i===points.length-1||points.findIndex(function(v){return v.lat===p.lat&&v.lng===p.lng;})===i;});
    unique.forEach(function(p,i){var pos=xy(p),start=i===0,end=i===unique.length-1;var dot=element('circle',{cx:pos[0],cy:pos[1],r:start||end?7:4,fill:start?'#158737':end?'#ff3600':'#8aaabe',stroke:'#fff','stroke-width':2,tabindex:0,role:'button','aria-label':p.gpsDatetime+' · '+p.lat.toFixed(5)+', '+p.lng.toFixed(5)});
      var detail=p.gpsDatetime+' · 위도 '+p.lat.toFixed(5)+' · 경도 '+p.lng.toFixed(5)+' · 속도 '+(p.speed==null?'-':p.speed+' km/h')+' · 충격 '+(p.shock==null?'-':p.shock+'건');
      dot.appendChild(element('title',{},detail));
      function show(){MIQCommon.view.set(info,"textContent",detail);}
      dot.addEventListener('click',show);dot.addEventListener('focus',show);svg.appendChild(dot);
    });
    panel.appendChild(svg);canvas.appendChild(panel);
  }
  root.MIQMapRoutePreview = { draw:draw };
})(window);
