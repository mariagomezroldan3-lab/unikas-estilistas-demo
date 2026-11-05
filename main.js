(function () {
  'use strict';
  function safe(fn, name) { try { fn(); } catch (e) { console.warn('init ' + name, e); } }
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  var EASE = [0.22, 1, 0.36, 1];

  // Cabecera: transparente sobre la portada y clara al bajar.
  safe(function () {
    var top = document.getElementById('top'); if (!top) return;
    var on = function () { top.classList.toggle('solid', window.scrollY > 60); };
    on(); window.addEventListener('scroll', on, { passive: true });
  }, 'cabecera');

  // Hebras de la portada: curvas finas que se dibujan una a una y siguen levemente al cursor.
  var strands = [];
  safe(function () {
    var svg = document.getElementById('strands'); if (!svg) return;
    var n = 18, seed = 7;
    var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var i = 0; i < n; i++) {
      var y = 60 + i * 46 + rnd() * 20, amp = 90 + rnd() * 150, ph = rnd() * 60;
      var d = 'M-80 ' + y.toFixed(1) +
        ' C 240 ' + (y - amp + ph).toFixed(1) + ', 520 ' + (y + amp - ph).toFixed(1) + ', 760 ' + (y + ph * 0.4).toFixed(1) +
        ' S 1200 ' + (y - amp * 0.8).toFixed(1) + ', 1520 ' + (y + amp * 0.5).toFixed(1);
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d); p.setAttribute('pathLength', '1'); p.setAttribute('stroke-width', (i % 5 === 0 ? 1.6 : 0.8).toFixed(1));
      p.setAttribute('stroke-opacity', (0.22 + (i % 4) * 0.1).toFixed(2));
      svg.appendChild(p); strands.push(p);
    }
    if (reduce) return;
    var hero = document.getElementById('inicio'), tx = 0, ty = 0, cx = 0, cy = 0, run = false;
    function loop() { cx += (tx - cx) * 0.06; cy += (ty - cy) * 0.06; svg.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)'; if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) requestAnimationFrame(loop); else run = false; }
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect(); tx = -((e.clientX - r.left) / r.width - 0.5) * 36; ty = -((e.clientY - r.top) / r.height - 0.5) * 24;
      if (!run) { run = true; requestAnimationFrame(loop); }
    }, { passive: true });
  }, 'hebras');

  // Entrada de la portada con Motion: hebras que se dibujan, wordmark que sube y resto que aparece.
  safe(function () {
    var M = window.Motion;
    root.classList.add('ready');
    if (!M || reduce) return;
    strands.forEach(function (p) { p.style.strokeDasharray = '1'; });
    M.animate(strands, { strokeDashoffset: [1, 0] }, { duration: 2.8, delay: M.stagger(0.07), ease: EASE });
    M.animate('.wm', { opacity: [0, 1], y: [70, 0] }, { duration: 1.5, ease: EASE });
    M.animate('.sub-wm', { opacity: [0, 1], y: [30, 0] }, { duration: 1.2, delay: 0.25, ease: EASE });
    M.animate('.lede', { opacity: [0, 1], y: [24, 0] }, { duration: 1.1, delay: 0.45, ease: EASE });
    M.animate('.hero .actions', { opacity: [0, 1], y: [24, 0] }, { duration: 1.1, delay: 0.6, ease: EASE });
    M.animate('.portrait', { opacity: [0, 1], y: [50, 0] }, { duration: 1.6, delay: 0.5, ease: EASE });
  }, 'entrada');

  // Copiar dirección.
  safe(function () {
    var b = document.getElementById('copy'); if (!b) return;
    b.addEventListener('click', function () {
      var old = b.textContent;
      var done = function () { b.textContent = 'Dirección copiada'; setTimeout(function () { b.textContent = old; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(b.dataset.text).then(done, function () { window.prompt('Copia la dirección:', b.dataset.text); });
      else window.prompt('Copia la dirección:', b.dataset.text);
    });
  }, 'copy');

  // Aviso de cookies: aceptar o rechazar. El mapa de Google solo se carga si se aceptan.
  safe(function () {
    var KEY = 'cc-maps-v1', saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    var boxes = [].slice.call(document.querySelectorAll('.mapbox'));
    function mapsLink(box) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(box.dataset.q); }
    function renderMaps(state) {
      boxes.forEach(function (box) {
        box.textContent = '';
        if (state === 'yes') {
          var f = document.createElement('iframe');
          f.src = 'https://maps.google.com/maps?q=' + encodeURIComponent(box.dataset.q) + '&z=16&output=embed';
          f.title = box.dataset.title; f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
          box.appendChild(f); return;
        }
        var ph = document.createElement('div'); ph.className = 'map-ph';
        var p = document.createElement('p'); p.textContent = state === 'no' ? 'Mapa no disponible' : 'Mapa';
        var a = document.createElement('a'); a.className = 'btn mapbtn'; a.href = mapsLink(box); a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Abrir en Google Maps';
        ph.appendChild(p); ph.appendChild(a); box.appendChild(ph);
      });
    }
    function choose(v) { try { localStorage.setItem(KEY, v); } catch (e) {} var b = document.querySelector('.cc'); if (b) b.remove(); renderMaps(v); }
    function show() {
      if (document.querySelector('.cc')) return;
      var d = document.createElement('div'); d.className = 'cc'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Aviso de cookies');
      d.innerHTML = '<p><b>Cookies.</b> Usamos cookies de Google Maps para mostrarte el mapa. Puedes aceptarlas o rechazarlas. <a href="cookies.html">Más información</a>.</p><div class="cc-btns"><button type="button" class="cc-no">Rechazar</button><button type="button" class="cc-yes">Aceptar</button></div>';
      d.querySelector('.cc-no').addEventListener('click', function () { choose('no'); });
      d.querySelector('.cc-yes').addEventListener('click', function () { choose('yes'); });
      document.body.appendChild(d);
    }
    renderMaps(saved === 'yes' || saved === 'no' ? saved : null);
    if (saved !== 'yes' && saved !== 'no') show();
    var links = document.querySelector('.legal-links');
    if (links && boxes.length) { var c = document.createElement('button'); c.type = 'button'; c.className = 'cc-cfg'; c.textContent = 'Configurar cookies'; c.addEventListener('click', show); links.appendChild(c); }
  }, 'cookies');

  // Scroll con GSAP: frase que se ilumina, títulos que se rellenan de tinta, fotos con paralaje y revelado.
  function motion() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);
    var splitWords = function (el) {
      if (!el || el.dataset.split) return [];
      el.dataset.split = '1'; el.setAttribute('aria-label', el.textContent.trim());
      var wrap = function (t) { return t.split(/(\s+)/).map(function (w) { return /^\s*$/.test(w) ? w : '<span class="sw" aria-hidden="true">' + w + '</span>'; }).join(''); };
      el.innerHTML = el.innerHTML.replace(/(^|>)([^<]+)(?=<|$)/g, function (m, a, t) { return a + wrap(t); });
      return el.querySelectorAll('.sw');
    };
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
      // La portada se retira despacio al bajar y las hebras se abren.
      gsap.to('.hero-copy', { yPercent: -14, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '#inicio', start: '25% top', end: 'bottom top', scrub: true } });
      gsap.to('#strands', { scale: 1.12, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.portrait-img img', { yPercent: -9, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });

      // Frase central y frase de opiniones: se encienden palabra a palabra.
      [['#big', 'top 82%', 'bottom 45%']].forEach(function (c) {
        var w = splitWords(document.querySelector(c[0])); if (!w.length) return;
        gsap.fromTo(w, { opacity: 0.14 }, { opacity: 1, stagger: 0.14, ease: 'none', scrollTrigger: { trigger: c[0], start: c[1], end: c[2], scrub: true } });
      });

      // Servicios: cada título se rellena de tinta de izquierda a derecha.
      gsap.utils.toArray('.item').forEach(function (it) {
        var t = it.querySelector('.ttl');
        gsap.fromTo(t, { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: it, start: 'top 88%', end: 'top 42%', scrub: true } });
      });

      // Novias: la foto se revela y se desplaza más despacio; el título entra desde un lado.
      gsap.from('.nv-img', { clipPath: 'inset(100% 0 0 0)', duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: '.novias', start: 'top 70%' } });
      gsap.fromTo('.nv-img img', { yPercent: 6 }, { yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.novias', start: 'top bottom', end: 'bottom top', scrub: true } });
      gsap.from('.novias h2', { xPercent: -6, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.novias h2', start: 'top 85%' } });
      gsap.from('.nv-copy > *:not(h2)', { y: 30, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.nv-copy', start: 'top 75%' } });

      // Dónde: título, dirección y mapa.
      gsap.from('.donde h2', { y: 44, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: '.donde h2', start: 'top 88%' } });
      gsap.from('.dn-copy > *:not(h2)', { y: 26, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.dn-copy', start: 'top 78%' } });
      gsap.from('.mapbox', { clipPath: 'inset(0 100% 0 0)', duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.mapbox', start: 'top 88%' } });
    });
  }
  safe(function () {
    if (window.gsap) motion(); else window.addEventListener('load', function () { safe(motion, 'motion'); });
  }, 'scroll');

  // 3D de scroll (Unikas): el haz de hebras gira y la cámara entra; la foto y los servicios se inclinan en perspectiva.
  function motion3d() {
    if (!window.gsap || !window.ScrollTrigger) return;
    var gsap = window.gsap; gsap.registerPlugin(window.ScrollTrigger);
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', function () {
      if (window.UNI3D) gsap.to(window.UNI3D, { p: 1, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: 0.8 } });
      // La foto de la portada se inclina con el cursor.
      var pi = document.querySelector('.portrait-img'), hero = document.getElementById('inicio');
      if (pi && hero) {
        var rx = gsap.quickTo(pi, 'rotationX', { duration: 0.8, ease: 'power3' }), ry = gsap.quickTo(pi, 'rotationY', { duration: 0.8, ease: 'power3' });
        hero.addEventListener('pointermove', function (e) {
          if (e.pointerType === 'touch') return;
          var r = hero.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - 0.5) * 14); rx(-((e.clientY - r.top) / r.height - 0.5) * 12);
        }, { passive: true });
      }
      // Servicios: cada fila se abate hacia delante como una página que se levanta.
      gsap.utils.toArray('.item .cat').forEach(function (a) {
        gsap.from(a.querySelector('.cat-head'), { y: 36, opacity: 0, duration: 1.4, ease: 'power2.out', scrollTrigger: { trigger: a, start: 'top 85%' } });
        gsap.from(a.querySelectorAll('.prices li'), { y: 22, opacity: 0, rotationX: -8, transformPerspective: 1200, transformOrigin: '50% 0%', duration: 1.1, stagger: 0.07, ease: 'power2.out', scrollTrigger: { trigger: a, start: 'top 82%' } });
      });
      // Novias: la foto entra girada en el eje vertical y se endereza al subir.
      gsap.fromTo('.nv-img', { rotationY: -26, transformOrigin: '0% 50%' }, { rotationY: 0, ease: 'none', scrollTrigger: { trigger: '.novias', start: 'top 85%', end: 'center 45%', scrub: true } });
      // Opiniones: la nota, las barras y las estrellas.
      gsap.from('.op-num', { y: 40, opacity: 0, duration: 1.3, ease: 'power2.out', scrollTrigger: { trigger: '.opiniones', start: 'top 75%' } });
      gsap.from('.op-stars svg', { scale: 0, opacity: 0, duration: 0.6, stagger: 0.09, ease: 'back.out(2)', scrollTrigger: { trigger: '.op-stars', start: 'top 88%' } });
      gsap.from('.op-team i', { scaleX: 0, transformOrigin: '0 50%', duration: 1.4, stagger: 0.15, ease: 'power3.out', scrollTrigger: { trigger: '.op-team', start: 'top 82%' } });
      gsap.from('.op-team > *:not(ul)', { y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: 'power2.out', scrollTrigger: { trigger: '.op-team', start: 'top 80%' } });
    });
  }
  (function () { if (window.gsap) motion3d(); else window.addEventListener('load', motion3d); })();
})();
