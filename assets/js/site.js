/* 팀카시아 CSSIA — site.js */
(function () {
  'use strict';

  /* 모바일 드로어 메뉴 */
  var btn = document.querySelector('.menu-btn');
  var drawer = document.getElementById('drawer');
  if (btn && drawer) {
    var closeBtn = drawer.querySelector('.menu-close');
    var backdrop = drawer.querySelector('.drawer-backdrop');
    var lastFocus = null;
    function openMenu() {
      lastFocus = document.activeElement;
      drawer.hidden = false;
      document.body.classList.add('menu-open');
      btn.setAttribute('aria-expanded', 'true');
      (closeBtn || drawer).focus();
    }
    function closeMenu() {
      drawer.hidden = true;
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    btn.addEventListener('click', openMenu);
    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (backdrop) backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) closeMenu();
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
      if (e.matches && !drawer.hidden) closeMenu();
    });
  }

  /* 유튜브 facade: 퍼가기 허용 영상만 클릭 시 iframe 로드, 나머지는 유튜브 새 탭 */
  document.querySelectorAll('.video-facade[data-embed="true"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (a.classList.contains('is-playing')) return;
      e.preventDefault();
      var id = a.getAttribute('data-video');
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      iframe.title = a.getAttribute('data-title') || '피해자 후기 영상';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.setAttribute('allowfullscreen', '');
      iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      a.classList.add('is-playing');
      a.appendChild(iframe);
    });
  });

  /* FAQ: 하나 열면 같은 목록의 나머지는 닫기 (시니어 가독성) */
  document.querySelectorAll('.faq-list').forEach(function (list) {
    list.addEventListener('toggle', function (e) {
      var d = e.target;
      if (!d.open || d.tagName !== 'DETAILS') return;
      list.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
    }, true);
  });

  /* 절차 스테퍼: 스크롤 리빌, 활성 노드(호버·스와이프), 모바일 진행 점 */
  document.documentElement.classList.add('js');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.procedure .pstep'));
  if (steps.length) {
    function setActive(idx) {
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
    }
    var dots = Array.prototype.slice.call(document.querySelectorAll('.pstep-dots i'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
      steps.forEach(function (s) { io.observe(s); });
    } else {
      steps.forEach(function (s) { s.classList.add('is-in'); });
    }
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      steps.forEach(function (s, k) { s.addEventListener('mouseenter', function () { setActive(k); }); });
    }
    var track = document.querySelector('.procedure');
    if (track) {
      var tick = false;
      track.addEventListener('scroll', function () {
        if (tick) return; tick = true;
        requestAnimationFrame(function () {
          tick = false;
          var w = steps[0].getBoundingClientRect().width + 14;
          setActive(Math.min(steps.length - 1, Math.max(0, Math.round(track.scrollLeft / w))));
        });
      }, { passive: true });
    }
  }
})();
