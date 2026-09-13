import createGlobe from 'https://esm.sh/cobe@0.6.3';

(function () {
  'use strict';

  var canvas = document.getElementById('globe-canvas');
  var container = document.getElementById('globe-container');
  if (!canvas || !container) return;

  var DEG2RAD = Math.PI / 180;

  // The first eight line up, in order, with the .polaroid cards in index.html.
  // The rest are the other places in the gallery, drawn as plain dots.
  var markerData = [
    { location: [37.75, -119.59], size: 0.03 }, // Yosemite
    { location: [34.69, 135.50], size: 0.03 },  // Osaka
    { location: [25.59, 100.23], size: 0.03 },  // Dali
    { location: [21.16, -86.85], size: 0.03 },  // Cancún
    { location: [26.87, 100.23], size: 0.03 },  // Lijiang
    { location: [40.14, 94.66], size: 0.03 },   // Dunhuang
    { location: [45.58, -122.12], size: 0.03 }, // Columbia River Gorge
    { location: [33.93, -116.19], size: 0.03 }, // Joshua Tree
    { location: [36.55, -118.77], size: 0.03 }, // Sequoia
    { location: [33.68, -117.83], size: 0.03 }, // Irvine
    { location: [33.99, -117.76], size: 0.03 }, // Chino Hills
    { location: [36.86, -111.37], size: 0.03 }, // Antelope Canyon
    { location: [36.88, -111.51], size: 0.03 }, // Horseshoe Bend
    { location: [45.52, -122.68], size: 0.03 }, // Portland
    { location: [45.89, -123.96], size: 0.03 }, // Cannon Beach
    { location: [23.25, -106.41], size: 0.03 }, // Mazatlán
    { location: [33.59, 130.42], size: 0.03 },  // Fukuoka
    { location: [33.35, 130.79], size: 0.03 },  // Ukiha
    { location: [33.27, 131.36], size: 0.03 },  // Yufuin
    { location: [31.23, 121.47], size: 0.03 },  // Shanghai
    { location: [28.43, 100.35], size: 0.03 },  // Daocheng Yading
    { location: [38.93, 100.12], size: 0.03 },  // Zhangye Danxia
  ];

  var polaroids = container.querySelectorAll('.polaroid');
  var rotations = [];
  var shifts = [];
  var below = [];
  var pins = [];
  var stems = [];
  for (var i = 0; i < polaroids.length; i++) {
    rotations.push(Number(polaroids[i].getAttribute('data-rotate')) || 0);
    // data-shift moves a card sideways, in card widths, and data-below hangs it
    // under its pin, so neighbouring cards clear each other and the dots.
    shifts.push(Number(polaroids[i].getAttribute('data-shift')) || 0);
    below.push(polaroids[i].hasAttribute('data-below'));
    // The pin marks the exact spot; the stem carries the card clear of it.
    var stem = document.createElement('span');
    stem.className = 'globe-stem';
    stem.setAttribute('aria-hidden', 'true');
    var pin = document.createElement('span');
    pin.className = 'globe-pin';
    pin.setAttribute('aria-hidden', 'true');
    container.appendChild(stem);
    container.appendChild(pin);
    stems.push(stem);
    pins.push(pin);
  }
  var cardWidth = 0;
  var stemLength = 0;

  var pointerDown = null;
  var dragOffset = { phi: 0, theta: 0 };
  var phiOffset = 0;
  var thetaOffset = 0;
  var paused = false;
  var globe = null;
  var phi = 0;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var speed = prefersReduced ? 0 : 0.003;
  var globeCenterX = 0;
  var globeCenterY = 0;
  var globeRadius = 0;
  var lastWidth = 0;
  var resizeTimer = null;

  canvas.addEventListener('pointerdown', function (e) {
    pointerDown = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = 'grabbing';
    paused = true;
  });

  window.addEventListener('pointermove', function (e) {
    if (pointerDown) {
      dragOffset.phi = (e.clientX - pointerDown.x) / 300;
      dragOffset.theta = (e.clientY - pointerDown.y) / 1000;
    }
  }, { passive: true });

  window.addEventListener('pointerup', function () {
    if (pointerDown) {
      phiOffset += dragOffset.phi;
      thetaOffset += dragOffset.theta;
      dragOffset = { phi: 0, theta: 0 };
    }
    pointerDown = null;
    canvas.style.cursor = 'grab';
    paused = false;
  }, { passive: true });

  function projectMarker(lat, lng, currentPhi, currentTheta) {
    var latRad = lat * DEG2RAD;
    var lngRad = lng * DEG2RAD;

    var cosLat = Math.cos(latRad);
    var sinLat = Math.sin(latRad);
    var p0 = cosLat * Math.cos(lngRad);
    var p1 = sinLat;
    var p2 = -cosLat * Math.sin(lngRad);

    var cp = Math.cos(currentPhi);
    var sp = Math.sin(currentPhi);
    var ct = Math.cos(currentTheta);
    var st = Math.sin(currentTheta);

    var rx = cp * p0 + sp * p2;
    var ry = st * sp * p0 + ct * p1 - st * cp * p2;
    var rz = -ct * sp * p0 + st * p1 + ct * cp * p2;

    return {
      screenX: globeCenterX + rx * globeRadius,
      screenY: globeCenterY - ry * globeRadius,
      visible: rz
    };
  }

  function updatePolaroids(currentPhi, currentTheta) {
    for (var i = 0; i < polaroids.length; i++) {
      var m = markerData[i];
      var proj = projectMarker(m.location[0], m.location[1], currentPhi, currentTheta);
      var el = polaroids[i];
      var x = proj.screenX;
      var y = proj.screenY;
      var dx = shifts[i] * cardWidth;
      var dy = below[i] ? stemLength : -stemLength;

      var vis = Math.max(0, Math.min(1, proj.visible * 3));
      pins[i].style.transform = 'translate(' + x + 'px, ' + y + 'px)';
      stems[i].style.height = Math.hypot(dx, dy) + 'px';
      stems[i].style.transform = 'translate(' + x + 'px, ' + y + 'px) rotate(' + Math.atan2(-dx, dy) + 'rad)';
      el.style.transform = 'translate(' + (x + dx) + 'px, ' + (y + dy) + 'px) translate(-50%, ' + (below[i] ? '0' : '-100%') + ') rotate(' + rotations[i] + 'deg)';
      pins[i].style.opacity = vis;
      stems[i].style.opacity = vis;
      el.style.opacity = vis;
      el.style.filter = vis < 1 ? 'blur(' + ((1 - vis) * 8) + 'px)' : 'none';
    }
  }

  function measure(width) {
    globeCenterX = width / 2;
    globeCenterY = width / 2;
    globeRadius = 0.4 * width;
    // Cards shrink at each breakpoint along with the globe, so the offsets and
    // stem are measured from a card rather than fixed in pixels.
    if (polaroids.length) {
      cardWidth = polaroids[0].offsetWidth;
      stemLength = Math.round(polaroids[0].offsetHeight * 0.14);
    }
  }

  function build(width) {
    globe = createGlobe(canvas, {
      devicePixelRatio: 1,
      width: width,
      height: width,
      phi: 0,
      theta: 0.2,
      dark: 0,
      diffuse: 1.5,
      mapSamples: 16000,
      mapBrightness: 9,
      baseColor: [1, 1, 1],
      markerColor: [1, 0.42, 0.21],
      glowColor: [0, 0, 0],
      markers: markerData,
      onRender: function (state) {
        if (!paused) phi += speed;
        var cp = phi + phiOffset + dragOffset.phi;
        var ct = 0.2 + thetaOffset + dragOffset.theta;
        state.phi = cp;
        state.theta = ct;
        updatePolaroids(cp, ct);
      },
    });

    canvas.style.opacity = '1';
  }

  // cobe bakes the sphere's radius in at construction time, so a globe built at
  // one width keeps drawing at that scale after its canvas is resized: the sphere
  // spills out of the box, and the polaroids — which project onto 0.4 x the
  // *current* width — no longer sit on it. Rebuilding at the new width keeps the
  // drawn sphere and the projection in agreement. Rotation lives in phi/phiOffset/
  // thetaOffset out here, so it carries across the rebuild.
  function sync() {
    var width = canvas.offsetWidth;
    if (width === 0 || width === lastWidth) return;
    lastWidth = width;
    measure(width);
    if (globe) {
      globe.destroy();
      globe = null;
    }
    build(width);
  }

  var ro = new ResizeObserver(function () {
    if (!globe) {
      // First paint, including the case where the canvas starts at zero width.
      sync();
      return;
    }
    // Rebuilds allocate a WebGL context, so coalesce the burst of callbacks a
    // window drag produces instead of rebuilding on every frame of it.
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(sync, 150);
  });
  ro.observe(canvas);
})();
