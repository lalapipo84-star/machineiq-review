/* Reuses the current Map/map-tobe.html marker/popup classes and markup order.
   Mount each returned node once; the map adapter owns coordinates and selection.
   Callbacks receive (row, event). Keep role/scope-aware URLs in the map adapter. */
(function (root) {
  'use strict';

  var doc = root.document;
  var DEFAULT_DETAIL = '../Vehicle%20Detail/vehicle-detail-tobe.html';
  var STATUS = {
    ok: { label: '정상', className: 'ok' },
    bad: { label: 'Fault', className: 'bad' },
    off: { label: '미연결', className: 'off' },
    unknown: { label: '통신 미수집', className: 'unknown' }
  };

  function text(value, fallback) {
    return value === null || value === undefined || String(value).trim() === ''
      ? (fallback === undefined ? '-' : fallback) : String(value);
  }

  function element(tag, className, value) {
    var node = doc.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) MIQCommon.view.set(node,"textContent",value);
    return node;
  }

  function statusFor(row) {
    return Object.prototype.hasOwnProperty.call(STATUS, row.st) ? STATUS[row.st] : STATUS.unknown;
  }

  function detailUrl(value) {
    try {
      var url = new URL(String(value || DEFAULT_DETAIL), doc.baseURI);
      if (url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'file:') return url.href;
    } catch (error) { /* Invalid or executable URLs never become link destinations. */ }
    return DEFAULT_DETAIL;
  }

  function labelNode(value) {
    var node = doc.createTextNode('');
    MIQCommon.view.set(node, 'textContent', value);
    return node;
  }

  function valueRow(label, value) {
    var row = element('div', 'map-pop__r');
    row.appendChild(labelNode(label));
    row.appendChild(element('b', '', text(value)));
    return row;
  }

  function createVehicle(row, options) {
    row = row || {};
    options = options || {};
    var popup = element('div', 'map-pop');
    popup.dataset.vin = text(row.vin, '');
    /* Google InfoWindow content must occupy height; the adapter owns the anchor. */
    popup.style.position = 'relative';
    popup.style.left = 'auto';
    popup.style.top = 'auto';
    popup.style.transform = 'none';
    /* Native InfoWindow parents use their own Roboto typography. */
    popup.style.fontFamily = "'Noto Sans KR', sans-serif";
    popup.style.fontSize = '14px';
    popup.style.fontWeight = '400';
    popup.style.lineHeight = 'normal';

    var close = element('button', 'map-pop__x', '✕');
    close.type = 'button';
    MIQCommon.view.call(close,"setAttribute",['aria-label','차량 위치 팝업 닫기']);
    close.style.border = '0';
    close.style.background = 'transparent';
    close.style.padding = '0';
    close.style.fontFamily = 'inherit';
    close.style.lineHeight = 'normal';
    close.addEventListener('click', function (event) {
      event.stopPropagation();
      if (typeof options.onClose === 'function') options.onClose(row, event);
    });
    popup.appendChild(close);

    var title = element('div', 'map-pop__t');
    title.appendChild(doc.createTextNode(text(row.model) + ' '));
    var vin = element('span', '', text(row.vin));
    vin.style.fontWeight = '400';
    vin.style.color = '#aaa';
    vin.style.fontSize = '11px';
    title.appendChild(vin);
    popup.appendChild(title);

    /* Older source rows omit hasPosition; only an explicit false is missing. */
    if (row.hasPosition === false) {
      popup.appendChild(valueRow('위치 정보', '수집 전'));
    } else {
      var status = statusFor(row);
      var stateRow = element('div', 'map-pop__r');
      stateRow.appendChild(labelNode('상태'));
      var stateValue = element('b');
      var pill = element('span', 'st-pill ' + status.className);
      var dot = element('i');
      MIQCommon.view.call(dot,"setAttribute",['aria-hidden','true']);
      pill.appendChild(dot);
      pill.appendChild(labelNode(status.label));
      stateValue.appendChild(pill);
      stateRow.appendChild(stateValue);
      popup.appendChild(stateRow);
      popup.appendChild(valueRow('소속 그룹', text(row.group)));
      popup.appendChild(valueRow('총 가동시간', row.runH === null || row.runH === undefined ? '-' : String(row.runH) + 'H'));
      popup.appendChild(valueRow('위치 기준 시간', text(row.posTime)));
      var address = element('div', 'map-pop__r', text(row.addr));
      address.style.display = 'block';
      address.style.color = '#555';
      address.style.paddingTop = '6px';
      popup.appendChild(address);
    }

    var detail = element('a', 'map-pop__go', '차량 상세 ›');
    detail.href = detailUrl(options.detailHref);
    popup.appendChild(detail);
    return popup;
  }

  // SVG paths from the supplied fleet EnergyIcon.vue; hydrogen deliberately excluded.
  var energyIcons = {"li": "<svg viewBox=\"0 0 72 91\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" > <path d=\"M71.5 36.5C71.5 49.9942 62.6138 63.373 53.6271 73.4353C49.145 78.4539 44.6613 82.6217 41.2976 85.5352C39.6162 86.9916 38.2155 88.1338 37.236 88.9112C36.7463 89.2998 36.362 89.5973 36.1006 89.7972C36.0647 89.8246 36.0312 89.8502 36 89.8739C35.9688 89.8502 35.9353 89.8246 35.8994 89.7972C35.638 89.5973 35.2537 89.2998 34.764 88.9112C33.7845 88.1338 32.3838 86.9916 30.7024 85.5352C27.3387 82.6217 22.855 78.4539 18.3729 73.4353C9.38623 63.373 0.5 49.9942 0.5 36.5C0.5 16.8939 16.3939 1 36 1C55.6061 1 71.5 16.8939 71.5 36.5Z\" stroke=\"#333333\" class=\"energy-icon__marker\" /> <circle cx=\"36\" cy=\"36.5\" r=\"27\" fill=\"white\" /> <rect x=\"44.1809\" y=\"39.3625\" width=\"6.31919\" height=\"0.900006\" rx=\"0.450003\" fill=\"black\" /> <path d=\"M26.3723 19.5V28.8405C26.3723 29.1166 26.5962 29.3405 26.8723 29.3405H41.8038C42.1332 29.3405 42.3726 29.0275 42.2864 28.7096L40.8651 23.4705C40.8366 23.3654 40.7746 23.2725 40.6884 23.2059L35.3856 19.1045C35.298 19.0368 35.1904 19 35.0797 19H26.8723C26.5962 19 26.3723 19.2239 26.3723 19.5Z\" fill=\"white\" stroke=\"black\" stroke-linejoin=\"round\" /> <path d=\"M38.7257 28.7662L37.7315 26.1027M36.1406 26.625L39.3223 25.3193\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <path d=\"M26.9453 26.4684H31.5411C32.8102 26.4684 33.839 27.4972 33.839 28.7663V28.7663\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <mask id=\"path-7-inside-1_0_1\" fill=\"white\" > <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" /> </mask> <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-7-inside-1_0_1)\" class=\"energy-icon__car\" /> <circle cx=\"29.2437\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <circle cx=\"39.5875\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <mask id=\"path-10-inside-2_0_1\" fill=\"white\" > <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" /> </mask> <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-10-inside-2_0_1)\" /> <path d=\"M36.6914 55.334V56.5H32.4082V55.334H36.6914ZM32.8184 47.9688V56.5H31.3477V47.9688H32.8184ZM39.6992 50.1602V56.5H38.2812V50.1602H39.6992ZM38.1875 48.4961C38.1875 48.2812 38.2578 48.1035 38.3984 47.9629C38.543 47.8184 38.7422 47.7461 38.9961 47.7461C39.2461 47.7461 39.4434 47.8184 39.5879 47.9629C39.7324 48.1035 39.8047 48.2812 39.8047 48.4961C39.8047 48.707 39.7324 48.8828 39.5879 49.0234C39.4434 49.1641 39.2461 49.2344 38.9961 49.2344C38.7422 49.2344 38.543 49.1641 38.3984 49.0234C38.2578 48.8828 38.1875 48.707 38.1875 48.4961Z\" fill=\"black\" /> </svg>", "pb": "<svg viewBox=\"0 0 72 91\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" > <path d=\"M71.5 36.5C71.5 49.9942 62.6138 63.373 53.6271 73.4353C49.145 78.4539 44.6613 82.6217 41.2976 85.5352C39.6162 86.9916 38.2155 88.1338 37.236 88.9112C36.7463 89.2998 36.362 89.5973 36.1006 89.7972C36.0647 89.8246 36.0312 89.8502 36 89.8739C35.9688 89.8502 35.9353 89.8246 35.8994 89.7972C35.638 89.5973 35.2537 89.2998 34.764 88.9112C33.7845 88.1338 32.3838 86.9916 30.7024 85.5352C27.3387 82.6217 22.855 78.4539 18.3729 73.4353C9.38623 63.373 0.5 49.9942 0.5 36.5C0.5 16.8939 16.3939 1 36 1C55.6061 1 71.5 16.8939 71.5 36.5Z\" stroke=\"#333333\" class=\"energy-icon__marker\" /> <circle cx=\"36\" cy=\"36.5\" r=\"27\" fill=\"white\" /> <rect x=\"44.1809\" y=\"39.3625\" width=\"6.31919\" height=\"0.900006\" rx=\"0.450003\" fill=\"black\" /> <path d=\"M26.3723 19.5V28.8405C26.3723 29.1166 26.5962 29.3405 26.8723 29.3405H41.8038C42.1332 29.3405 42.3726 29.0275 42.2864 28.7096L40.8651 23.4705C40.8366 23.3654 40.7746 23.2725 40.6884 23.2059L35.3856 19.1045C35.298 19.0368 35.1904 19 35.0797 19H26.8723C26.5962 19 26.3723 19.2239 26.3723 19.5Z\" fill=\"white\" stroke=\"black\" stroke-linejoin=\"round\" /> <path d=\"M38.7257 28.7662L37.7315 26.1027M36.1406 26.625L39.3223 25.3193\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <path d=\"M26.9453 26.4684H31.5411C32.8102 26.4684 33.839 27.4972 33.839 28.7663V28.7663\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <mask id=\"path-7-inside-1_0_1\" fill=\"white\" > <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" /> </mask> <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-7-inside-1_0_1)\" class=\"energy-icon__car\" /> <circle cx=\"29.2437\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <circle cx=\"39.5875\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <mask id=\"path-10-inside-2_0_1\" fill=\"white\" > <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" /> </mask> <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-10-inside-2_0_1)\" /> <path d=\"M32.1504 52.8184H29.9297V51.6523H32.1504C32.5371 51.6523 32.8496 51.5898 33.0879 51.4648C33.3262 51.3398 33.5 51.168 33.6094 50.9492C33.7227 50.7266 33.7793 50.4727 33.7793 50.1875C33.7793 49.918 33.7227 49.666 33.6094 49.4316C33.5 49.1934 33.3262 49.002 33.0879 48.8574C32.8496 48.7129 32.5371 48.6406 32.1504 48.6406H30.3809V56H28.9102V47.4688H32.1504C32.8105 47.4688 33.3711 47.5859 33.832 47.8203C34.2969 48.0508 34.6504 48.3711 34.8926 48.7812C35.1348 49.1875 35.2559 49.6523 35.2559 50.1758C35.2559 50.7266 35.1348 51.1992 34.8926 51.5938C34.6504 51.9883 34.2969 52.291 33.832 52.502C33.3711 52.7129 32.8105 52.8184 32.1504 52.8184ZM36.9395 47H38.3516V54.6465L38.2168 56H36.9395V47ZM42.4883 52.7715V52.8945C42.4883 53.3633 42.4355 53.7949 42.3301 54.1895C42.2285 54.5801 42.0723 54.9199 41.8613 55.209C41.6543 55.498 41.3965 55.7227 41.0879 55.8828C40.7832 56.0391 40.4297 56.1172 40.0273 56.1172C39.6328 56.1172 39.2891 56.043 38.9961 55.8945C38.7031 55.7461 38.457 55.5352 38.2578 55.2617C38.0625 54.9883 37.9043 54.6621 37.7832 54.2832C37.6621 53.9043 37.5762 53.4863 37.5254 53.0293V52.6367C37.5762 52.1758 37.6621 51.7578 37.7832 51.3828C37.9043 51.0039 38.0625 50.6777 38.2578 50.4043C38.457 50.127 38.7012 49.9141 38.9902 49.7656C39.2832 49.6172 39.625 49.543 40.0156 49.543C40.4219 49.543 40.7793 49.6211 41.0879 49.7773C41.4004 49.9336 41.6602 50.1562 41.8672 50.4453C42.0742 50.7305 42.2285 51.0703 42.3301 51.4648C42.4355 51.8594 42.4883 52.2949 42.4883 52.7715ZM41.0762 52.8945V52.7715C41.0762 52.4863 41.0527 52.2188 41.0059 51.9688C40.959 51.7148 40.8809 51.4922 40.7715 51.3008C40.666 51.1094 40.5215 50.959 40.3379 50.8496C40.1582 50.7363 39.9336 50.6797 39.6641 50.6797C39.4141 50.6797 39.1992 50.7227 39.0195 50.8086C38.8398 50.8945 38.6895 51.0117 38.5684 51.1602C38.4473 51.3086 38.3516 51.4805 38.2812 51.6758C38.2148 51.8711 38.1699 52.082 38.1465 52.3086V53.3691C38.1816 53.6621 38.2559 53.9316 38.3691 54.1777C38.4863 54.4199 38.6504 54.6152 38.8613 54.7637C39.0723 54.9082 39.3438 54.9805 39.6758 54.9805C39.9375 54.9805 40.1582 54.9277 40.3379 54.8223C40.5176 54.7168 40.6602 54.5703 40.7656 54.3828C40.875 54.1914 40.9531 53.9688 41 53.7148C41.0508 53.4609 41.0762 53.1875 41.0762 52.8945Z\" fill=\"black\" /> </svg>", "e": "<svg viewBox=\"0 0 72 91\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" > <path d=\"M71.5 36.5C71.5 49.9942 62.6138 63.373 53.6271 73.4353C49.145 78.4539 44.6613 82.6217 41.2976 85.5352C39.6162 86.9916 38.2155 88.1338 37.236 88.9112C36.7463 89.2998 36.362 89.5973 36.1006 89.7972C36.0647 89.8246 36.0312 89.8502 36 89.8739C35.9688 89.8502 35.9353 89.8246 35.8994 89.7972C35.638 89.5973 35.2537 89.2998 34.764 88.9112C33.7845 88.1338 32.3838 86.9916 30.7024 85.5352C27.3387 82.6217 22.855 78.4539 18.3729 73.4353C9.38623 63.373 0.5 49.9942 0.5 36.5C0.5 16.8939 16.3939 1 36 1C55.6061 1 71.5 16.8939 71.5 36.5Z\" stroke=\"#333333\" class=\"energy-icon__marker\" /> <circle cx=\"36\" cy=\"36.5\" r=\"27\" fill=\"white\" /> <rect x=\"44.1809\" y=\"39.3625\" width=\"6.31919\" height=\"0.900006\" rx=\"0.450003\" fill=\"black\" /> <path d=\"M26.3723 19.5V28.8405C26.3723 29.1166 26.5962 29.3405 26.8723 29.3405H41.8038C42.1332 29.3405 42.3726 29.0275 42.2864 28.7096L40.8651 23.4705C40.8366 23.3654 40.7746 23.2725 40.6884 23.2059L35.3856 19.1045C35.298 19.0368 35.1904 19 35.0797 19H26.8723C26.5962 19 26.3723 19.2239 26.3723 19.5Z\" fill=\"white\" stroke=\"black\" stroke-linejoin=\"round\" /> <path d=\"M38.7257 28.7662L37.7315 26.1027M36.1406 26.625L39.3223 25.3193\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <path d=\"M26.9453 26.4684H31.5411C32.8102 26.4684 33.839 27.4972 33.839 28.7663V28.7663\" stroke=\"black\" stroke-linecap=\"round\" stroke-linejoin=\"round\" /> <mask id=\"path-7-inside-1_0_1\" fill=\"white\" > <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" /> </mask> <rect x=\"23.5\" y=\"28.766\" width=\"21.8299\" height=\"11.4894\" rx=\"0.5\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-7-inside-1_0_1)\" class=\"energy-icon__car\" /> <circle cx=\"29.2437\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <circle cx=\"39.5875\" cy=\"39.1066\" r=\"2.94683\" fill=\"white\" stroke=\"black\" /> <mask id=\"path-10-inside-2_0_1\" fill=\"white\" > <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" /> </mask> <rect x=\"44.425\" y=\"23.5\" width=\"3.60002\" height=\"16.6501\" rx=\"0.5\" fill=\"white\" stroke=\"black\" stroke-width=\"2\" mask=\"url(#path-10-inside-2_0_1)\" /> </svg>"};
  var iconSequence=0;
  function createIcon(type,status){
    var key=type==='리튬'?'li':type==='납산'?'pb':'e',holder=element('span','miq-energy-pin '+status);
    var prefix='miq-energy-'+(++iconSequence)+'-';
    MIQCommon.view.set(holder,"innerHTML",energyIcons[key].replace(/path-(7|10)-inside/g,prefix+'path-$1-inside'));
    MIQCommon.view.call(holder.firstElementChild,"setAttribute",['aria-hidden','true']);
    return holder;
  }

  function createMarker(row, options) {
    row = row || {};
    options = options || {};
    var marker = element('div', 'marker');
    marker.dataset.vin = text(row.vin, '');
    marker.title = text(row.model) + ' · ' + text(row.vin);
    MIQCommon.view.call(marker,"setAttribute",['role','button']);
    MIQCommon.view.call(marker,"setAttribute",['aria-label',marker.title + ' 위치 정보 보기']);
    marker.tabIndex = 0;
    marker.style.fontFamily = "'Noto Sans KR', sans-serif";

    marker.appendChild(createIcon(row.type, statusFor(row).className));

    function select(event) {
      event.stopPropagation();
      if (typeof options.onSelect === 'function') options.onSelect(row, event);
    }
    marker.addEventListener('click', select);
    marker.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      select(event);
    });
    return marker;
  }

  root.MIQMapPopup = { createVehicle: createVehicle, createMarker: createMarker, createIcon: createIcon };
})(window);
