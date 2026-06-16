/* ============================================================
   RSM INSIGHTS — main.js
   Three.js WebGL scenes + GSAP/ScrollTrigger choreography
   + Lenis smooth scroll. Vanilla ES module, no build step.
   ============================================================ */

import * as THREE from 'three';

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;

/* ───────────────────────── Accent palette ───────────────── */
const ACCENTS = {
  hero:       { a: '#36e0c8', b: '#7c5cff' },
  audit:      { a: '#36e0c8', b: '#1fae9c' },
  tax:        { a: '#7c5cff', b: '#a78bff' },
  consulting: { a: '#ff8a3d', b: '#ff5f6d' },
  grid:       { a: '#36e0c8', b: '#7c5cff' },
};
function setAccent(key) {
  const c = ACCENTS[key] || ACCENTS.hero;
  gsap.to(root, { duration: 0.9, ease: 'power2.out',
    '--accent': c.a, '--accent-2': c.b });
}

/* ============================================================
   1. WEBGL STAGE
   ============================================================ */
const StageFX = (() => {
  const canvas = document.getElementById('stage');
  let renderer, scene, camera, clock;
  const groups = {};
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let active = 'hero';
  let scrollY = 0;
  let supported = true;

  function colorVec(hex) { return new THREE.Color(hex); }

  function init() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { supported = false; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070a14, 0.018);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 34);

    clock = new THREE.Clock();

    scene.add(new THREE.AmbientLight(0x404a7a, 1.2));
    const key = new THREE.PointLight(0x7c5cff, 2.4, 200);
    key.position.set(20, 18, 30); scene.add(key);
    const rim = new THREE.PointLight(0x36e0c8, 2.0, 200);
    rim.position.set(-26, -10, 20); scene.add(rim);

    buildStarfield();
    groups.hero = buildHeroKnot();
    groups.audit = buildNetwork();
    groups.tax = buildWaveField();
    groups.consulting = buildDigitalTwin();
    groups.grid = buildLattice();

    // start: only hero visible
    Object.entries(groups).forEach(([k, g]) => setGroupOpacity(g, k === 'hero' ? 1 : 0));
    Object.entries(groups).forEach(([k, g]) => { g.visible = k === 'hero'; });

    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    renderer.setAnimationLoop(render);
    return true;
  }

  /* ── Background drifting particle field ──────────── */
  function buildStarfield() {
    const N = 1400;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i*3]   = (Math.random() - 0.5) * 160;
      pos[i*3+1] = (Math.random() - 0.5) * 120;
      pos[i*3+2] = (Math.random() - 0.5) * 120 - 20;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.16, color: 0x8fa0d6, transparent: true, opacity: 0.55,
      depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geo, mat);
    pts.userData.spin = 0.004;
    scene.add(pts);
    groups._stars = pts;
  }

  /* ── HERO: glowing wireframe torus knot ──────────── */
  function buildHeroKnot() {
    const g = new THREE.Group();
    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(8, 2.1, 220, 32, 2, 3),
      new THREE.MeshBasicMaterial({ color: 0x36e0c8, wireframe: true, transparent: true, opacity: 0.9 })
    );
    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.4, 1),
      new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.35 })
    );
    g.add(knot, inner);
    g.userData.update = (t) => { g.rotation.y = t * 0.12; g.rotation.x = Math.sin(t*0.2)*0.2; inner.rotation.y = -t*0.3; };
    scene.add(g);
    return g;
  }

  /* ── AUDIT: verification network mesh ────────────── */
  function buildNetwork() {
    const g = new THREE.Group();
    const COUNT = 90;
    const nodes = [];
    const nodePos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      // distribute on a rough sphere shell
      const r = 9 + Math.random() * 3;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(ph) * Math.cos(th);
      const y = r * Math.sin(ph) * Math.sin(th);
      const z = r * Math.cos(ph);
      nodes.push(new THREE.Vector3(x, y, z));
      nodePos[i*3]=x; nodePos[i*3+1]=y; nodePos[i*3+2]=z;
    }
    const ngeo = new THREE.BufferGeometry();
    ngeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const npts = new THREE.Points(ngeo, new THREE.PointsMaterial({
      size: 0.5, color: 0x36e0c8, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(npts);

    // edges between near neighbours
    const linePos = [];
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 5.2) {
          linePos.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
    const lines = new THREE.LineSegments(lgeo, new THREE.LineBasicMaterial({
      color: 0x36e0c8, transparent: true, opacity: 0.22 }));
    g.add(lines);

    g.userData.update = (t) => { g.rotation.y = t * 0.16; g.rotation.x = Math.sin(t*0.15)*0.15;
      npts.material.size = 0.45 + Math.sin(t*2)*0.12; };
    scene.add(g);
    return g;
  }

  /* ── TAX: scenario wave field ────────────────────── */
  function buildWaveField() {
    const g = new THREE.Group();
    const SEG = 60, SIZE = 30;
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
    const mat = new THREE.MeshBasicMaterial({ color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2.4;
    const base = geo.attributes.position.array.slice();
    g.add(mesh);
    g.userData.update = (t) => {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) {
        const x = base[i], y = base[i+1];
        p[i+2] = Math.sin(x*0.4 + t*1.4) * 1.6 + Math.cos(y*0.5 + t*1.1) * 1.4;
      }
      geo.attributes.position.needsUpdate = true;
      g.rotation.z = Math.sin(t*0.1)*0.08;
      g.rotation.y = t * 0.05;
    };
    scene.add(g);
    return g;
  }

  /* ── CONSULTING: enterprise digital twin ─────────── */
  function buildDigitalTwin() {
    const g = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(4.6, 1),
      new THREE.MeshBasicMaterial({ color: 0xff8a3d, wireframe: true, transparent: true, opacity: 0.85 }));
    g.add(core);
    const rings = [];
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(7 + i*2.4, 0.06, 12, 120),
        new THREE.MeshBasicMaterial({ color: i%2 ? 0xff5f6d : 0xff8a3d, transparent: true, opacity: 0.5 }));
      ring.rotation.x = Math.random() * Math.PI;
      ring.rotation.y = Math.random() * Math.PI;
      ring.userData.sp = (0.2 + Math.random()*0.3) * (i%2?-1:1);
      rings.push(ring); g.add(ring);
    }
    // orbiting nodes
    const ORB = 40;
    const op = new Float32Array(ORB*3);
    const orbits = [];
    for (let i=0;i<ORB;i++){ const r=7+Math.random()*6; const a=Math.random()*Math.PI*2; const tilt=Math.random()*Math.PI;
      orbits.push({r,a,tilt,sp:0.3+Math.random()*0.6}); }
    const ogeo = new THREE.BufferGeometry();
    ogeo.setAttribute('position', new THREE.BufferAttribute(op,3));
    const opts = new THREE.Points(ogeo, new THREE.PointsMaterial({ size:0.4, color:0xffc59e, transparent:true, blending:THREE.AdditiveBlending, depthWrite:false }));
    g.add(opts);
    g.userData.update = (t) => {
      core.rotation.y = t*0.25; core.rotation.x = t*0.12;
      rings.forEach(r => r.rotation.z = t * r.userData.sp);
      const arr = ogeo.attributes.position.array;
      orbits.forEach((o,i)=>{ const a=o.a+t*o.sp;
        arr[i*3]   = Math.cos(a)*o.r;
        arr[i*3+1] = Math.sin(a)*o.r*Math.cos(o.tilt);
        arr[i*3+2] = Math.sin(a)*o.r*Math.sin(o.tilt); });
      ogeo.attributes.position.needsUpdate = true;
    };
    scene.add(g);
    return g;
  }

  /* ── PLATFORM: floating wireframe lattice ────────── */
  function buildLattice() {
    const g = new THREE.Group();
    const boxes = [];
    for (let i = 0; i < 26; i++) {
      const s = 1 + Math.random()*2.4;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(s, s, s),
        new THREE.MeshBasicMaterial({ color: i%2?0x36e0c8:0x7c5cff, wireframe: true, transparent: true, opacity: 0.5 }));
      box.position.set((Math.random()-0.5)*26, (Math.random()-0.5)*20, (Math.random()-0.5)*16);
      box.userData.sp = (Math.random()-0.5)*0.6;
      box.userData.fl = Math.random()*Math.PI*2;
      boxes.push(box); g.add(box);
    }
    g.userData.update = (t) => { g.rotation.y = t*0.06;
      boxes.forEach(b => { b.rotation.x = t*b.userData.sp; b.rotation.y = t*b.userData.sp*0.7;
        b.position.y += Math.sin(t + b.userData.fl)*0.004; }); };
    scene.add(g);
    return g;
  }

  /* ── opacity helper ──────────────────────────────── */
  function setGroupOpacity(g, v) {
    g.traverse(o => { if (o.material) { o.material.transparent = true; o.material.opacity = (o.material.userData.base ?? (o.material.userData.base = o.material.opacity)) * v; } });
  }

  /* ── public: activate a scene group ──────────────── */
  function activate(key) {
    if (!supported || key === active || !groups[key]) return;
    const prev = groups[active];
    const next = groups[key];
    next.visible = true;
    // fade
    gsap.to({ v: 1 }, { v: 0, duration: 0.8, ease: 'power2.inOut',
      onUpdate: function () { setGroupOpacity(prev, this.targets()[0].v); },
      onComplete: () => { prev.visible = false; } });
    gsap.fromTo({ v: 0 }, { v: 0 }, { v: 1, duration: 1.0, ease: 'power2.out',
      onUpdate: function () { setGroupOpacity(next, this.targets()[0].v); } });
    active = key;
  }

  function setScroll(y) { scrollY = y; }

  function onPointer(e) {
    mouse.tx = (e.clientX / window.innerWidth - 0.5);
    mouse.ty = (e.clientY / window.innerHeight - 0.5);
  }
  function onResize() {
    if (!supported) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function render() {
    const t = clock.getElapsedTime();
    if (groups._stars) { groups._stars.rotation.y += 0.0004; groups._stars.rotation.x = Math.sin(t*0.05)*0.05; }
    const g = groups[active];
    if (g && g.userData.update) g.userData.update(t);

    // mouse parallax (lerp)
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    camera.position.x += (mouse.x * 6 - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y * 4 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  return { init, activate, setScroll, isSupported: () => supported, getRenderer: () => renderer };
})();

/* ============================================================
   2. TEXT SPLITTING (lightweight)
   ============================================================ */
function splitWords(el) {
  // Walk the original child nodes so structural tags (e.g. <br>) are preserved
  // and adjacent words aren't merged when separated only by markup.
  const nodes = Array.from(el.childNodes);
  const label = nodes.map(n => (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'BR') ? ' ' : n.textContent).join('');
  el.setAttribute('aria-label', label.replace(/\s+/g, ' ').trim());
  const frag = document.createDocumentFragment();
  nodes.forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'BR') {
      frag.appendChild(document.createElement('br'));
      return;
    }
    const text = node.textContent;
    text.split(/(\s+)/).forEach(tok => {
      if (tok === '') return;
      if (tok.trim() === '') { frag.appendChild(document.createTextNode(tok)); return; }
      const wrap = document.createElement('span');
      wrap.style.display = 'inline-block'; wrap.style.overflow = 'hidden';
      wrap.style.verticalAlign = 'top';
      const inner = document.createElement('span');
      inner.className = 'word'; inner.textContent = tok;
      inner.setAttribute('aria-hidden', 'true');
      wrap.appendChild(inner); frag.appendChild(wrap);
    });
  });
  el.innerHTML = '';
  el.appendChild(frag);
  return el.querySelectorAll('.word');
}

/* ============================================================
   3. BOOT
   ============================================================ */
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year').textContent = new Date().getFullYear();

  const webgl = StageFX.init();

  /* ── Lenis smooth scroll ──────────────────────── */
  let lenis = null;
  if (!prefersReduced && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true, touchMultiplier: 1.4 });
    lenis.on('scroll', (e) => { StageFX.setScroll(e.scroll); if (window.ScrollTrigger) ScrollTrigger.update(); });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    window.__lenis = lenis;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (window.ScrollToPlugin) gsap.registerPlugin(ScrollToPlugin);

  /* ── Preloader ─────────────────────────────────── */
  const loader = document.getElementById('loader');
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  let p = 0;
  const tick = setInterval(() => {
    p += Math.random() * 18;
    if (p >= 100) { p = 100; clearInterval(tick); setTimeout(finishLoad, 350); }
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
  }, 130);

  function finishLoad() {
    loader.classList.add('is-done');
    if (lenis) lenis.start();
    playIntro();
  }

  /* ── Hero intro timeline ───────────────────────── */
  function playIntro() {
    if (prefersReduced) {
      document.querySelectorAll('.hero__title .word, .reveal').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    const words = document.querySelectorAll('.hero__title .word');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(words, { yPercent: 120, duration: 1.1, stagger: 0.08 })
      .from('.hero__eyebrow', { y: 20, opacity: 0, duration: 0.8 }, 0.2)
      .to('.hero__lede', { opacity: 1, y: 0, duration: 0.9 }, '-=0.6')
      .to('.hero__meta', { opacity: 1, y: 0, duration: 0.9 }, '-=0.7');
  }

  /* ── Split section headings ────────────────────── */
  document.querySelectorAll('.split').forEach(h => {
    const words = splitWords(h);
    gsap.set(words, { yPercent: 110 });
    ScrollTrigger.create({
      trigger: h, start: 'top 82%',
      onEnter: () => gsap.to(words, { yPercent: 0, duration: 1.0, ease: 'expo.out', stagger: 0.05 }),
    });
  });

  /* ── Generic reveals (skip hero ones handled above) ─ */
  gsap.utils.toArray('.reveal').forEach(el => {
    if (el.closest('.hero')) return; // hero handled in intro
    ScrollTrigger.create({
      trigger: el, start: 'top 88%',
      onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }),
    });
  });

  /* ── Counters ──────────────────────────────────── */
  gsap.utils.toArray('.stat__num').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => {
        gsap.to({ v: 0 }, { v: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () { el.textContent = this.targets()[0].v.toFixed(decimals); } });
      }
    });
  });

  /* ── Scene + accent switching per section ──────── */
  const hudName = document.getElementById('hudSectionName');
  document.querySelectorAll('[data-section]').forEach(sec => {
    const sceneKey = sec.dataset.scene;
    const name = sec.dataset.section;
    ScrollTrigger.create({
      trigger: sec, start: 'top 55%', end: 'bottom 45%',
      onToggle: (self) => {
        if (!self.isActive) return;
        if (hudName) hudName.textContent = name;
        if (sceneKey) { StageFX.activate(sceneKey); setAccent(sceneKey); }
        else { setAccent('hero'); }
      }
    });
    // subtle parallax drift of glass panels
    const glass = sec.querySelector('.glass');
    if (glass && !prefersReduced) {
      gsap.fromTo(glass, { y: 40 }, { y: -40, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom top', scrub: true } });
    }
  });

  /* ── Nav state + smooth anchor scroll ──────────── */
  const nav = document.getElementById('nav');
  ScrollTrigger.create({ start: 'top -80', onUpdate: (self) => {
    nav.classList.toggle('is-stuck', self.scroll() > 80);
    const cue = document.getElementById('scrollCue');
    if (cue) cue.style.opacity = self.scroll() > 200 ? '0' : '1';
  }});

  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
      else target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── FPS HUD ───────────────────────────────────── */
  const hudFps = document.getElementById('hudFps');
  if (hudFps && webgl) {
    let last = performance.now(), frames = 0;
    (function loop(now) {
      frames++;
      if (now - last >= 1000) { hudFps.textContent = 'FPS · ' + frames; frames = 0; last = now; }
      requestAnimationFrame(loop);
    })(performance.now());
  } else if (hudFps) {
    hudFps.textContent = 'ENGINE · 2D FALLBACK';
  }

  ScrollTrigger.refresh();
});
