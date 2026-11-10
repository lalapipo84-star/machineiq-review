/* 화면 설명(화면설계서 번호) — 검수·전달용 보조 기능. 실제 화면 코드와 분리되어 있다.
   사용법: 페이지에 screen-spec.css / screen-spec.js 와 화면별 설명 파일(screen-spec/<화면>.js)을 넣는다.
   빼는 법: 페이지의 "[화면 설명] 시작 ~ 끝" 주석 사이 줄만 지우면 된다. 다른 코드는 이 파일을 참조하지 않는다.
   설명 파일 형식: MIQScreenSpec.define({ screen: '화면명', items: [{ no, target: 'CSS 선택자', title, body: 'HTML', ref: '관련 정책' }] }) */
(function (root) {
  'use strict';
  if (root.MIQScreenSpec) return;
  // 화면에 들어올 때마다 설명은 꺼진 상태로 시작한다. 오른쪽 아래 [화면 설명 보기]로 켠다 (2026-11-10 요청).
  var shown = false;
  var spec = null, layer = null, pop = null, toggle = null, openNo = null, returnFocus = null, frame = 0;

  function visible() { return shown; }
  function setVisible(on) { shown = !!on; apply(); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function target(item) { var el = document.querySelector(item.target); return el && el.getClientRects().length ? el : null; }

  function build() {
    layer = document.createElement('div'); layer.className = 'miq-spec-layer'; layer.setAttribute('aria-label', '화면 설명 번호');
    spec.items.forEach(function (item) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'miq-spec-badge'; b.dataset.specNo = item.no;
      b.textContent = item.no; b.setAttribute('aria-label', item.no + '번 설명: ' + item.title); b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', function (ev) { ev.stopPropagation(); openNo === item.no ? close(true) : open(item, b); });
      layer.appendChild(b);
    });
    pop = document.createElement('div'); pop.className = 'miq-spec-pop'; pop.hidden = true;
    pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'false'); pop.setAttribute('aria-labelledby', 'miqSpecTitle');
    pop.addEventListener('click', function (ev) { ev.stopPropagation(); });
    toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'miq-spec-toggle';
    toggle.addEventListener('click', function () { setVisible(!visible()); });
    document.body.appendChild(layer); document.body.appendChild(pop); document.body.appendChild(toggle);
    document.addEventListener('click', function () { if (openNo != null) close(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && openNo != null) { ev.stopPropagation(); close(true); } }, true);
    root.addEventListener('resize', schedule);
    root.addEventListener('scroll', schedule, true);   // 표·흐름 영역 안쪽 스크롤도 따라간다
    new MutationObserver(function (list) {
      if (list.every(function (m) { return layer.contains(m.target) || pop.contains(m.target) || m.target === toggle; })) return;
      schedule();
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] });
    apply();
  }
  function schedule() { if (!frame) frame = root.requestAnimationFrame(function () { frame = 0; place(); }); }

  // 번호는 영역 왼쪽 위 모서리에 걸쳐 놓는다 (영역 내용을 가리지 않게 바깥쪽으로 반쯤)
  function place() {
    if (!layer) return;
    var on = visible();
    spec.items.forEach(function (item) {
      var b = layer.querySelector('[data-spec-no="' + item.no + '"]'), el = on && target(item);
      if (!el) { b.hidden = true; if (openNo === item.no) close(false); return; }
      var r = el.getBoundingClientRect(), dx = item.offset ? item.offset[0] : 0, dy = item.offset ? item.offset[1] : 0;
      b.hidden = false;
      b.style.left = (r.left + root.scrollX - 11 + dx) + 'px';
      b.style.top = (r.top + root.scrollY - 11 + dy) + 'px';
    });
    if (openNo != null) position(layer.querySelector('[data-spec-no="' + openNo + '"]'));
  }
  function apply() {
    var on = visible();
    toggle.textContent = on ? '화면 설명 끄기' : '화면 설명 보기';
    toggle.setAttribute('aria-pressed', String(on));
    layer.hidden = !on;
    if (!on) close(false);
    place();
  }

  function open(item, badge) {
    close(false);
    openNo = item.no; returnFocus = badge;
    badge.classList.add('is-open'); badge.setAttribute('aria-expanded', 'true');
    pop.innerHTML = '<div class="miq-spec-pop__head"><span class="miq-spec-pop__no">' + esc(item.no) + '</span><h3 id="miqSpecTitle" tabindex="-1">' + esc(item.title) + '</h3>' +
      '<button type="button" class="miq-spec-pop__x" aria-label="설명 닫기">×</button></div>' +
      '<div class="miq-spec-pop__body">' + item.body + '</div>' +
      (item.ref ? '<div class="miq-spec-pop__ref">관련 정책: ' + esc(item.ref) + '</div>' : '');
    pop.querySelector('.miq-spec-pop__x').addEventListener('click', function () { close(true); });
    pop.hidden = false;
    position(badge);
    pop.querySelector('h3').focus({ preventScroll: true });
  }
  // 번호 오른쪽 아래에 띄우고, 화면 밖으로 나가면 왼쪽/위로 옮긴다
  function position(badge) {
    if (!badge || pop.hidden) return;
    if (badge.hidden) { close(false); return; }
    var b = badge.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight, vw = document.documentElement.clientWidth, vh = root.innerHeight;
    var left = b.right + 8, top = b.top;
    if (left + w > vw - 12) left = Math.max(12, b.left - w - 8);
    if (top + h > vh - 12) top = Math.max(12, vh - h - 12);
    pop.style.left = (left + root.scrollX) + 'px'; pop.style.top = (top + root.scrollY) + 'px';
  }
  function close(restore) {
    if (openNo == null) return;
    var b = layer.querySelector('[data-spec-no="' + openNo + '"]');
    if (b) { b.classList.remove('is-open'); b.setAttribute('aria-expanded', 'false'); }
    openNo = null; pop.hidden = true; pop.innerHTML = '';
    if (restore && returnFocus && returnFocus.isConnected && !returnFocus.hidden) returnFocus.focus();
  }

  root.MIQScreenSpec = {
    define: function (s) {
      spec = s;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build, { once: true }); else build();
    }
  };
}(window));
