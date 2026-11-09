/* ══════════════════════════════════════════════════════════════
   Bobcat MachineIQ '26 — 충격 레벨 3구간 슬라이더 (_shared/shock-range.js)

   충격 레벨은 민감 · 주의 · 경고 3단계만 사용한다. (Lv1 미약 · Lv2 경미 폐기)
   수평선 위의 핸들 3개를 드래그해 각 구간의 시작 임계값(g)을 설정하고,
   구간은 민감(노랑) · 주의(주황) · 경고(빨강) 색으로 표시한다.
   임계값 미만 구간은 집계하지 않는 '미집계' 영역(사선)이다.

   저장 대상 : TB_GROUP.SHOCK3~5 (그룹 기본) / TB_EQUIPMENT.SHOCK3~5 (차량 재정의)

   사용법
     var rng = MIQ.shockRange(document.getElementById('vmRng'), {
       values: [1.2, 1.8, 2.5],
       onChange: function (v) { ... }        // 드래그 · 키보드 조작마다 호출
     });
     rng.get();                 → [1.2, 1.8, 2.5]
     rng.set([1.0, 1.6, 2.2]);  → 값 지정 (onChange 호출 없음)
     rng.readonly(true);        → 조작 불가 (그룹 기본값 상속 표시용)

   스타일은 _shared/mockup.css 의 .rng / .zone 규칙을 사용한다.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MIN = 0, MAX = 8, STEP = 0.1, GAP = 0.1;
  var LEVELS = [
    { cls: 's3', name: '민감' },
    { cls: 's4', name: '주의' },
    { cls: 's5', name: '경고' }
  ];

  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
  function snap(v) { return Math.round(v / STEP) * STEP; }
  function fix(v) { return Math.round(v * 10) / 10; }
  function pct(v) { return (v - MIN) / (MAX - MIN) * 100; }

  function shockRange(root, opts) {
    opts = opts || {};
    var vals = (opts.values || [1.2, 1.8, 2.5]).map(fix);
    var ro = false;

    root.classList.add('rng');
    MIQCommon.view.set(root,"innerHTML",'<div class="rng__bar">' +
        '<span class="rng__band ign"></span>' +
        '<span class="rng__band s3"></span>' +
        '<span class="rng__band s4"></span>' +
        '<span class="rng__band s5"></span>' +
      '</div>' +
      LEVELS.map(function (l, i) {
        return '<button type="button" class="rng__h ' + l.cls + '" data-i="' + i + '"' +
          ' role="slider" aria-label="' + l.name + ' 시작 임계값 (g)"' +
          ' aria-valuemin="' + MIN + '" aria-valuemax="' + MAX + '" aria-valuenow="' + vals[i] + '">' +
          '<b>' + l.name + '</b><i></i></button>';
      }).join('') +
      '<div class="rng__scale"><span>0</span><span>2</span><span>4</span><span>6</span><span>8 g</span></div>');

    var bar = root.querySelector('.rng__bar');
    var bands = {
      ign: root.querySelector('.rng__band.ign'),
      s3: root.querySelector('.rng__band.s3'),
      s4: root.querySelector('.rng__band.s4'),
      s5: root.querySelector('.rng__band.s5')
    };
    var handles = Array.prototype.slice.call(root.querySelectorAll('.rng__h'));

    function paint() {
      bands.ign.style.left = '0%';
      bands.ign.style.width = pct(vals[0]) + '%';
      bands.s3.style.left = pct(vals[0]) + '%';
      bands.s3.style.width = (pct(vals[1]) - pct(vals[0])) + '%';
      bands.s4.style.left = pct(vals[1]) + '%';
      bands.s4.style.width = (pct(vals[2]) - pct(vals[1])) + '%';
      bands.s5.style.left = pct(vals[2]) + '%';
      bands.s5.style.width = (100 - pct(vals[2])) + '%';
      handles.forEach(function (h, i) {
        h.style.left = pct(vals[i]) + '%';
        MIQCommon.view.set(h.querySelector('i'),"textContent",vals[i].toFixed(1));
        MIQCommon.view.call(h,"setAttribute",['aria-valuenow',vals[i].toFixed(1)]);
        MIQCommon.view.call(h,"setAttribute",['aria-valuetext',vals[i].toFixed(1) + ' g 이상 ' + LEVELS[i].name]);
      });
    }

    /* i 번째 핸들 값 설정 — 이웃 핸들과 최소 0.1g 간격을 유지해 순서가 뒤바뀌지 않는다 */
    function put(i, v) {
      var lo = i === 0 ? MIN + GAP : fix(vals[i - 1] + GAP);
      var hi = i === LEVELS.length - 1 ? MAX : fix(vals[i + 1] - GAP);
      var nv = fix(clamp(snap(v), lo, hi));
      if (nv === vals[i]) return false;
      vals[i] = nv;
      paint();
      return true;
    }
    function emit() { if (opts.onChange) opts.onChange(vals.slice()); }
    function fromX(x) {
      var r = bar.getBoundingClientRect();
      return MIN + (MAX - MIN) * clamp((x - r.left) / r.width, 0, 1);
    }

    /* 드래그 */
    var dragging = -1;
    function down(e) {
      if (ro) return;
      var h = e.target.closest('.rng__h');
      if (!h) return;
      dragging = parseInt(h.dataset.i, 10);
      h.focus();
      if (h.setPointerCapture && e.pointerId != null) h.setPointerCapture(e.pointerId);
      e.preventDefault();
    }
    function move(e) {
      if (ro || dragging < 0) return;
      if (put(dragging, fromX(e.clientX))) emit();
      e.preventDefault();
    }
    function up() {
      if (dragging < 0) return;
      dragging = -1;
      emit();
    }
    root.addEventListener('pointerdown', down);
    root.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);

    /* 바 클릭 : 가장 가까운 핸들을 그 지점으로 이동 */
    bar.addEventListener('pointerdown', function (e) {
      if (ro) return;
      var v = fromX(e.clientX), near = 0, best = Infinity;
      vals.forEach(function (x, i) {
        var d = Math.abs(x - v);
        if (d < best) { best = d; near = i; }
      });
      if (put(near, v)) emit();
      handles[near].focus();
    });

    /* 키보드 (a11y) */
    root.addEventListener('keydown', function (e) {
      if (ro) return;
      var h = e.target.closest('.rng__h');
      if (!h) return;
      var i = parseInt(h.dataset.i, 10), d = 0;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') d = -STEP;
      else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') d = STEP;
      else if (e.key === 'PageDown') d = -0.5;
      else if (e.key === 'PageUp') d = 0.5;
      else if (e.key === 'Home') { if (put(i, MIN)) emit(); e.preventDefault(); return; }
      else if (e.key === 'End') { if (put(i, MAX)) emit(); e.preventDefault(); return; }
      else return;
      if (put(i, fix(vals[i] + d))) emit();
      e.preventDefault();
    });

    paint();

    return {
      get: function () { return vals.slice(); },
      set: function (v) {
        vals = v.map(fix);
        for (var i = 1; i < vals.length; i++) {
          if (vals[i] <= vals[i - 1]) vals[i] = fix(vals[i - 1] + GAP);
        }
        paint();
      },
      readonly: function (on) {
        ro = !!on;
        root.classList.toggle('is-ro', ro);
        handles.forEach(function (h) { h.disabled = ro; });
      },
      /* 구간 요약 문구 : [미집계, 민감, 주의, 경고] */
      texts: function () {
        return [
          '0 ~ ' + vals[0].toFixed(1) + ' g',
          vals[0].toFixed(1) + ' ~ ' + vals[1].toFixed(1) + ' g',
          vals[1].toFixed(1) + ' ~ ' + vals[2].toFixed(1) + ' g',
          vals[2].toFixed(1) + ' g 이상'
        ];
      }
    };
  }

  window.MIQ = window.MIQ || {};
  window.MIQ.shockRange = shockRange;
  window.MIQ.SHOCK_LEVELS = LEVELS;
})();
