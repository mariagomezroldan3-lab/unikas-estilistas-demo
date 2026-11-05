(function () {
  'use strict';
  // Escena 3D de la portada: un haz de hebras que ondulan en el espacio. La cámara avanza hacia dentro
  // y el haz gira al bajar por la página (el progreso llega desde main.js en window.UNI3D.p).
  window.UNI3D = { p: 0 };
  var canvas = document.getElementById('scene3d');
  if (!canvas || !window.THREE) return;
  var THREE = window.THREE, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return; }
  var hero = document.getElementById('inicio');
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x000000, 0);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x3a0b17, 7, 19);
  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  camera.position.set(0, 0, 10);

  var N = 54, M = 96, group = new THREE.Group(); scene.add(group);
  var seed = 11; var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  var rose = new THREE.Color(0xd7a39b), blush = new THREE.Color(0xf1e4e1);
  var strands = [];
  for (var i = 0; i < N; i++) {
    var pos = new Float32Array(M * 3);
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var mat = new THREE.LineBasicMaterial({ color: rnd() > 0.82 ? blush : rose, transparent: true, opacity: 0.28 + rnd() * 0.5 });
    var line = new THREE.Line(geo, mat); line.frustumCulled = false; group.add(line);
    strands.push({ pos: pos, geo: geo, y: (rnd() - 0.5) * 7.5, z: (rnd() - 0.5) * 9, a: 0.5 + rnd() * 1.4, f: 0.35 + rnd() * 0.5, g: 0.3 + rnd() * 0.5, ph: rnd() * 6.28, sp: 0.25 + rnd() * 0.4 });
  }
  // Algunas hebras gruesas y fijas dan cuerpo al haz.
  for (var k = 0; k < 6; k++) {
    var pts = []; var y0 = (rnd() - 0.5) * 5, z0 = (rnd() - 0.5) * 6, ph = rnd() * 6;
    for (var j = 0; j <= 40; j++) { var x = -10 + j * 0.5; pts.push(new THREE.Vector3(x, y0 + Math.sin(x * 0.5 + ph) * 1.2, z0 + Math.cos(x * 0.4 + ph) * 1.6)); }
    var tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.022 + rnd() * 0.02, 5, false), new THREE.MeshBasicMaterial({ color: rose, transparent: true, opacity: 0.32 }));
    group.add(tube);
  }

  function fill(t) {
    for (var s = 0; s < N; s++) {
      var d = strands[s], p = d.pos;
      for (var m = 0; m < M; m++) {
        var u = m / (M - 1), x = -10 + u * 20;
        p[m * 3] = x;
        p[m * 3 + 1] = d.y + Math.sin(x * d.f + d.ph + t * d.sp) * d.a + Math.sin(x * 1.3 + t * d.sp * 1.7 + d.ph) * 0.12;
        p[m * 3 + 2] = d.z + Math.cos(x * d.g + d.ph * 1.3 + t * d.sp * 0.7) * d.a * 1.4;
      }
      d.geo.attributes.position.needsUpdate = true;
    }
  }

  var w = 0, h = 0;
  function size() {
    var r = hero.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  size(); window.addEventListener('resize', size);

  var mx = 0, my = 0, tx = 0, ty = 0;
  hero.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var r = hero.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });

  var clock = new THREE.Clock(), t = 0, running = true, raf = 0;
  function render() {
    var p = window.UNI3D.p;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    group.rotation.y = p * 1.35 + mx * 0.22;
    group.rotation.x = my * 0.1 - p * 0.35;
    group.rotation.z = p * 0.25;
    camera.position.z = 10 - p * 7.2;
    camera.position.y = -p * 0.8;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  function loop() {
    if (!running) { raf = 0; return; }
    t += Math.min(clock.getDelta(), 0.05); fill(t); render();
    raf = requestAnimationFrame(loop);
  }
  fill(0); render();
  document.documentElement.classList.add('has-3d');
  if (reduce) return;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { running = es[0].isIntersecting; if (running && !raf) { clock.getDelta(); raf = requestAnimationFrame(loop); } }).observe(hero);
  raf = requestAnimationFrame(loop);
})();
