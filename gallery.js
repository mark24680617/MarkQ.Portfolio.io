import * as THREE from 'three';

(function () {
  'use strict';

  var photos = [
    { src: 'pictures/personal_1.jpeg', genre: 'Portraits' },
    { src: 'pictures/personal_2.jpeg', genre: 'Portraits' },
    { src: 'pictures/personal_3.jpeg', genre: 'Portraits' },
    { src: 'pictures/personal_4.jpeg', genre: 'Portraits' },
    { src: 'pictures/personal_5.jpeg', genre: 'Portraits' },
    { src: 'pictures/personal_6.jpeg', genre: 'Portraits' },
    { src: 'pictures/Osaka_1.jpeg', genre: 'Japan' },
    { src: 'pictures/Osaka_2.jpeg', genre: 'Japan' },
    { src: 'pictures/Osaka_3.jpeg', genre: 'Japan' },
    { src: 'pictures/California_1.jpeg', genre: 'California' },
    { src: 'pictures/California_2.jpeg', genre: 'California' },
    { src: 'pictures/California_3.jpeg', genre: 'California' },
    { src: 'pictures/Yosemite_1.jpeg', genre: 'California' },
    { src: 'pictures/Yosemite_2.jpeg', genre: 'California' },
    { src: 'pictures/sequio.jpeg', genre: 'California' },
    { src: 'pictures/Joshua_1.jpeg', genre: 'California' },
    { src: 'pictures/Joshua_2.jpeg', genre: 'California' },
    { src: 'pictures/Cancun_1.jpeg', genre: 'M\u00e9xico' },
    { src: 'pictures/Cancun_2.jpeg', genre: 'M\u00e9xico' },
    { src: 'pictures/Dali_1.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Dali_2.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Dali_3.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Lijiang_1.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Lijiang_2.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Lijiang_3.jpeg', genre: 'Yunnan' },
    { src: 'pictures/Daochen_1.jpeg', genre: 'Sichuan' },
    { src: 'pictures/Daochen_2.jpeg', genre: 'Sichuan' },
    { src: 'pictures/Daochen_3.jpeg', genre: 'Sichuan' },
    { src: 'pictures/Daochen_4.jpeg', genre: 'Sichuan' },
    { src: 'pictures/Daochen_5.jpeg', genre: 'Sichuan' },
    { src: 'pictures/Daochen_6.jpeg', genre: 'Sichuan' },
    { src: 'pictures/dunhuang_1.jpeg', genre: 'Silk Road' },
    { src: 'pictures/dunhuang_2.jpeg', genre: 'Silk Road' },
    { src: 'pictures/dunhuang_3.jpeg', genre: 'Silk Road' },
    { src: 'pictures/danxia_1.jpeg', genre: 'Danxia' },
    { src: 'pictures/danxia_2.jpeg', genre: 'Danxia' },
    { src: 'pictures/Comet.jpeg', genre: 'Cosmos' },
  ];

  var VISIBLE = 12, DEPTH = 50, HALF = 25;
  var FADE_IN = [0.05, 0.25], FADE_OUT = [0.4, 0.43];
  var BLUR_IN = [0.0, 0.1], BLUR_OUT = [0.4, 0.43], MAX_BLUR = 8;

  var canvas = document.getElementById('gallery-canvas');
  var genreEl = document.getElementById('genre-text');
  var loadingEl = document.getElementById('loading');
  var loadingBar = document.getElementById('loading-bar');
  var loadingPct = document.getElementById('loading-pct');
  var hintEl = document.getElementById('nav-hint');
  if (!canvas) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var velocity = 0, autoPlay = true, lastInput = Date.now();
  var curGenre = '', inTransition = false;
  var total = photos.length;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
  var raycaster = new THREE.Raycaster();
  var pointer = new THREE.Vector2(-999, -999);

  var slots = [];
  for (var i = 0; i < VISIBLE; i++) {
    var ha = (i * 2.618) % (Math.PI * 2);
    var va = (i * 1.618 + Math.PI / 3) % (Math.PI * 2);
    slots.push({
      x: Math.sin(ha) * ((i % 3) * 1.2) * 8 / 3,
      y: Math.cos(va) * (((i + 1) % 4) * 0.8) * 8 / 4,
    });
  }

  var VERT = `
    uniform float scrollForce;
    uniform float time;
    uniform float isHovered;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vec3 pos = position;
      float ci = scrollForce * 0.3;
      float d = length(pos.xy);
      float curve = d * d * ci;
      float cloth = (sin(pos.x * 2.0 + scrollForce * 3.0) * 0.02
                    + sin(pos.y * 2.5 + scrollForce * 2.0) * 0.015) * abs(ci) * 2.0;
      float fw = 0.0;
      if (isHovered > 0.5) {
        float damp = smoothstep(-0.5, 0.5, pos.x);
        fw = sin(pos.x * 3.0 + time * 8.0) * 0.1 * damp
           + sin(pos.x * 5.0 + time * 12.0) * 0.03 * damp;
      }
      pos.z -= curve + cloth + fw;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  var FRAG = `
    uniform sampler2D map;
    uniform float opacity;
    uniform float blurAmount;
    uniform float scrollForce;
    varying vec2 vUv;
    void main() {
      vec4 color = texture2D(map, vUv);
      if (blurAmount > 0.0) {
        vec2 ts = vec2(0.001);
        vec4 b = vec4(0.0);
        float t = 0.0;
        for (float x = -2.0; x <= 2.0; x += 1.0) {
          for (float y = -2.0; y <= 2.0; y += 1.0) {
            float w = 1.0 / (1.0 + length(vec2(x, y)));
            b += texture2D(map, vUv + vec2(x, y) * ts * blurAmount) * w;
            t += w;
          }
        }
        color = b / t;
      }
      color.rgb += vec3(abs(scrollForce) * 0.005);
      gl_FragColor = vec4(color.rgb, color.a * opacity);
    }
  `;

  function makeMat() {
    return new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        map: { value: null },
        opacity: { value: 0 },
        blurAmount: { value: 0 },
        scrollForce: { value: 0 },
        time: { value: 0 },
        isHovered: { value: 0 },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
    });
  }

  var loader = new THREE.TextureLoader();
  var textures = new Array(total).fill(null);
  var loaded = 0, started = false;

  photos.forEach(function (p, idx) {
    loader.load(p.src, function (tex) {
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      textures[idx] = tex;
      loaded++;
      var pct = Math.round(loaded / total * 100);
      if (loadingBar) loadingBar.style.width = pct + '%';
      if (loadingPct) loadingPct.textContent = pct + '%';
      if (loaded >= Math.min(VISIBLE, total) && !started) {
        started = true;
        if (loadingEl) loadingEl.classList.add('hidden');
        init();
      }
    });
  });

  var geo = new THREE.PlaneGeometry(1, 1, 32, 32);
  var meshes = [], mats = [], planes = [];

  function setTex(i, imgIdx) {
    var tex = textures[imgIdx];
    if (!tex) return;
    mats[i].uniforms.map.value = tex;
    var a = tex.image ? tex.image.width / tex.image.height : 1;
    meshes[i].scale.set(a > 1 ? 2 * a : 2, a > 1 ? 2 : 2 / a, 1);
  }

  function init() {
    for (var i = 0; i < VISIBLE; i++) {
      var mat = makeMat();
      mats.push(mat);
      var mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      meshes.push(mesh);
      var imgIdx = i % total;
      planes.push({ z: (DEPTH / VISIBLE) * i, imageIndex: imgIdx });
      setTex(i, imgIdx);
    }
    genreEl.textContent = photos[0].genre;
    curGenre = photos[0].genre;
    if (hintEl) setTimeout(function () { hintEl.classList.add('hidden'); }, 6000);
    tick();
  }

  // --- Events ---

  canvas.addEventListener('wheel', function (e) {
    e.preventDefault();
    velocity += e.deltaY * 0.01;
    autoPlay = false;
    lastInput = Date.now();
  }, { passive: false });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      velocity -= 2; autoPlay = false; lastInput = Date.now();
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      velocity += 2; autoPlay = false; lastInput = Date.now();
    }
  });

  var ty = 0;
  canvas.addEventListener('touchstart', function (e) {
    ty = e.touches[0].clientY; autoPlay = false; lastInput = Date.now();
  }, { passive: true });
  canvas.addEventListener('touchmove', function (e) {
    var d = ty - e.touches[0].clientY;
    ty = e.touches[0].clientY;
    velocity += d * 0.03;
    lastInput = Date.now();
  }, { passive: true });

  canvas.addEventListener('pointermove', function (e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  setInterval(function () {
    if (Date.now() - lastInput > 3000) autoPlay = true;
  }, 1000);

  function setGenre(g) {
    if (g === curGenre || inTransition) return;
    inTransition = true;
    genreEl.classList.add('fade-out');
    setTimeout(function () {
      genreEl.textContent = g;
      curGenre = g;
      genreEl.classList.remove('fade-out');
      setTimeout(function () { inTransition = false; }, 400);
    }, 350);
  }

  // --- Render loop ---

  var clock = new THREE.Clock();

  function tick() {
    requestAnimationFrame(tick);
    var dt = clock.getDelta();
    var t = clock.getElapsedTime();

    if (autoPlay && !reduced) velocity += 0.3 * dt;
    velocity *= 0.95;

    raycaster.setFromCamera(pointer, camera);
    var hits = raycaster.intersectObjects(meshes);
    var hitIdx = hits.length > 0 ? meshes.indexOf(hits[0].object) : -1;

    mats.forEach(function (m, i) {
      m.uniforms.time.value = t;
      m.uniforms.scrollForce.value = reduced ? 0 : velocity;
      m.uniforms.isHovered.value = i === hitIdx ? 1 : 0;
    });

    var advance = VISIBLE % total || total;
    var nearZ = Infinity, nearGenre = curGenre;

    planes.forEach(function (p, i) {
      var nz = p.z + velocity * dt * 10;
      var wf = 0, wb = 0;
      if (nz >= DEPTH) { wf = Math.floor(nz / DEPTH); nz -= DEPTH * wf; }
      else if (nz < 0) { wb = Math.ceil(-nz / DEPTH); nz += DEPTH * wb; }
      if (wf > 0) { p.imageIndex = (p.imageIndex + wf * advance) % total; setTex(i, p.imageIndex); }
      if (wb > 0) { var s = p.imageIndex - wb * advance; p.imageIndex = ((s % total) + total) % total; setTex(i, p.imageIndex); }

      p.z = ((nz % DEPTH) + DEPTH) % DEPTH;
      meshes[i].position.set(slots[i].x, slots[i].y, p.z - HALF);

      var tex = textures[p.imageIndex];
      if (!tex) { mats[i].uniforms.opacity.value = 0; return; }
      if (mats[i].uniforms.map.value !== tex) setTex(i, p.imageIndex);

      var n = p.z / DEPTH;
      var op = 1;
      if (n < FADE_IN[0]) op = 0;
      else if (n <= FADE_IN[1]) op = (n - FADE_IN[0]) / (FADE_IN[1] - FADE_IN[0]);
      else if (n >= FADE_OUT[0]) op = n <= FADE_OUT[1] ? 1 - (n - FADE_OUT[0]) / (FADE_OUT[1] - FADE_OUT[0]) : 0;

      var bl = 0;
      if (n <= BLUR_IN[1]) bl = MAX_BLUR * (1 - n / BLUR_IN[1]);
      else if (n >= BLUR_OUT[0]) bl = n <= BLUR_OUT[1] ? MAX_BLUR * ((n - BLUR_OUT[0]) / (BLUR_OUT[1] - BLUR_OUT[0])) : MAX_BLUR;

      mats[i].uniforms.opacity.value = Math.max(0, Math.min(1, op));
      mats[i].uniforms.blurAmount.value = Math.max(0, Math.min(MAX_BLUR, bl));

      var az = Math.abs(p.z - HALF);
      if (az < nearZ && op > 0.3) { nearZ = az; nearGenre = photos[p.imageIndex].genre; }
    });

    if (nearGenre !== curGenre) setGenre(nearGenre);
    renderer.render(scene, camera);
  }
})();
