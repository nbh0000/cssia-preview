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

  /* 절차 스테퍼: 스크롤 리빌, 자동 진행(1→2→3→4), 호버/스와이프로 활성, 모바일 진행 점 */
  document.documentElement.classList.add('js');
  var steps = Array.prototype.slice.call(document.querySelectorAll('.procedure .pstep'));
  if (steps.length) {
    var dots = Array.prototype.slice.call(document.querySelectorAll('.pstep-dots i'));
    var track = document.querySelector('.procedure');
    var cur = 0, pauseUntil = 0, autoTimer = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function setActive(idx, scroll) {
      cur = idx;
      steps.forEach(function (s, k) { s.classList.toggle('is-active', k === idx); s.classList.toggle('is-done', k < idx); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === idx); });
      if (scroll && track && track.scrollWidth > track.clientWidth + 8) {
        var w = steps[0].getBoundingClientRect().width + 14;
        track.scrollTo({ left: idx * w, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
    function advance() { if (Date.now() < pauseUntil) return; setActive((cur + 1) % steps.length, true); }
    function startAuto() { if (autoTimer || reduceMotion) return; autoTimer = setInterval(advance, 2600); }
    function stopAuto() { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.2 });
      steps.forEach(function (s) { io.observe(s); });
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) startAuto(); else stopAuto(); });
      }, { threshold: 0.25 }).observe(track);
    } else {
      steps.forEach(function (s) { s.classList.add('is-in'); });
      startAuto();
    }
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      steps.forEach(function (s, k) { s.addEventListener('mouseenter', function () { pauseUntil = Date.now() + 6000; setActive(k, false); }); });
      track.addEventListener('mouseleave', function () { pauseUntil = Date.now() + 1200; });
    }
    ['touchstart', 'pointerdown', 'wheel'].forEach(function (ev) {
      track.addEventListener(ev, function () { pauseUntil = Date.now() + 8000; }, { passive: true });
    });
    var tick = false;
    track.addEventListener('scroll', function () {
      if (tick) return; tick = true;
      requestAnimationFrame(function () {
        tick = false;
        if (track.scrollWidth <= track.clientWidth + 8) return;
        var w = steps[0].getBoundingClientRect().width + 14;
        var idx = Math.min(steps.length - 1, Math.max(0, Math.round(track.scrollLeft / w)));
        if (idx !== cur) setActive(idx, false);
      });
    }, { passive: true });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stopAuto(); });
  }

  /* 스크롤 연동: 상단 진행 바, 스크롤 뒤 헤더 축소, 섹션 배경 패럴랙스(스크롤 타임라인 미지원 브라우저용 폴백) */
  (function () {
    var bar = document.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var header = document.querySelector('.site-header');
    var bgs = Array.prototype.slice.call(document.querySelectorAll('.section-bg'));
    var nativeTimeline = CSS.supports && CSS.supports('animation-timeline: view()');
    var reduceM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var ticking = false, lastY = -1;
    function frame() {
      ticking = false;
      var y = window.scrollY || 0;
      var max = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      bar.style.transform = 'scaleX(' + Math.min(1, y / max) + ')';
      if (header) header.classList.toggle('is-scrolled', y > 24);
      if (!nativeTimeline && !reduceM) {
        var vh = window.innerHeight;
        bgs.forEach(function (img) {
          var r = img.parentElement.getBoundingClientRect();
          if (r.bottom < 0 || r.top > vh) return;
          var t = (r.top + r.height / 2 - vh / 2) / (vh + r.height);   /* -0.5 ~ 0.5 */
          img.style.transform = 'translateY(' + (t * -12).toFixed(2) + '%) scale(1.12)';
        });
      }
      lastY = y;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    frame();
  })();


  /* 스크롤 리빌: 제목 글리치, 카드 스캔, 이미지 플리커, 숫자·강조 디코드 */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var groups = [
    ['fx-glitch', '.section-title, .cta-final h2, .flow-label h2, .strip-title, .post-group h2, .post-related h2, .prose h2'],
    ['fx-scan', '.ledger li, .shelf li, .cert-list li, .post-card, .faq-item, .qa > div, .flow-steps li, .sol-list li, .strip-list li, .checklist li, .callout, .side-card, .key-points, .iso, .video, .award, .cert, .cert-feature, .related a, .media-badge, .cta-line'],
    ['fx-img', '.flow-img, .sol-img, .why-figure, .cta-figure, .tech-fig, .flow-label img'],
    ['fx-decode', '.ledger strong, .big-number, .card-number']
  ];
  var fxEls = [];
  groups.forEach(function (g) {
    var cls = g[0];
    var list = Array.prototype.slice.call(document.querySelectorAll(g[1]));
    var byParent = new Map();
    list.forEach(function (el) {
      if (el.closest('.hero') || el.closest('.page-hero')) return;   /* 첫 화면(LCP)은 건드리지 않음 */
      var k = el.parentElement; var n = byParent.get(k) || 0; byParent.set(k, n + 1);
      el.style.setProperty('--i', Math.min(n, 8));
      el.classList.add(cls); fxEls.push(el);
    });
  });
  var GLYPHS = '01!#%&?@ABCDEF<>/\\|ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊ';
  function decode(el) {
    if (reduce || el.dataset.decoded) return; el.dataset.decoded = '1';
    var txt = el.textContent, len = txt.length, t = 0, total = 14;
    if (!len || len > 40) return;
    var w = el.getBoundingClientRect().width; el.style.minWidth = w + 'px';
    var timer = setInterval(function () {
      t++;
      var keep = Math.ceil(len * t / total), out = '';
      for (var c = 0; c < len; c++) {
        var ch = txt[c];
        out += (c < keep || ch === ' ' || ch === '-') ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }
      el.textContent = out;
      if (t >= total) { clearInterval(timer); el.textContent = txt; el.style.minWidth = ''; }
    }, 36);
  }
  if (fxEls.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var fxio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('fx-in');
          if (en.target.classList.contains('fx-decode')) decode(en.target);
          fxio.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.15 });
      fxEls.forEach(function (el) { fxio.observe(el); });
    } else {
      fxEls.forEach(function (el) { el.classList.add('fx-in'); });
    }
  }
  /* 히어로 강조 문구: 로드 직후 한 번 디코드 */
  var heroEm = document.querySelector('.hero h1 em');
  if (heroEm && !reduce) { heroEm.addEventListener('animationend', function () { heroEm.classList.remove('fx-glitch-once'); }); setTimeout(function () { heroEm.classList.add('fx-glitch-once'); }, 400); }
})();

/* 표 가로 스크롤 끝 페이드: 더 볼 내용이 있을 때만 오른쪽에 페이드 표시 */
(function () {
  var wraps = document.querySelectorAll('.table-wrap > .table-scroll');
  if (!wraps.length) return;
  function update(sc) {
    var more = sc.scrollWidth - sc.clientWidth - sc.scrollLeft > 4;
    sc.parentNode.classList.toggle('has-more', more);
  }
  wraps.forEach(function (sc) {
    update(sc);
    sc.addEventListener('scroll', function () { update(sc); }, { passive: true });
  });
  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t); t = setTimeout(function () { wraps.forEach(update); }, 120);
  }, { passive: true });
})();
