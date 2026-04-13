import createGlobe from 'https://esm.sh/cobe@0.6.3';

(function () {
  'use strict';

  var canvas = document.getElementById('globe-canvas');
  var container = document.getElementById('globe-container');
  if (!canvas || !container) return;

  var DEG2RAD = Math.PI / 180;

  var markerData = [
    { location: [37.75, -119.59], size: 0.02 },
    { location: [34.69, 135.50], size: 0.02 },
    { location: [25.59, 100.23], size: 0.02 },
    { location: [21.16, -86.85], size: 0.02 },
    { location: [26.87, 100.23], size: 0.02 },
    { location: [40.14, 94.66], size: 0.02 },
  ];

  var polaroids = container.querySelectorAll('.polaroid');
  var rotations = [];
  for (var i = 0; i < polaroids.length; i++) {
    rotations.push(Number(polaroids[i].getAttribute('data-rotate')) || 0);
  }

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
    for (var i = 0; i < markerData.length; i++) {
      var m = markerData[i];
      var proj = projectMarker(m.location[0], m.location[1], currentPhi, currentTheta);
      var el = polaroids[i];
      if (!el) continue;

      var vis = Math.max(0, Math.min(1, proj.visible * 3));
      el.style.transform = 'translate(' + proj.screenX + 'px, ' + proj.screenY + 'px) translate(-50%, -100%) rotate(' + rotations[i] + 'deg)';
      el.style.opacity = vis;
      el.style.filter = vis < 1 ? 'blur(' + ((1 - vis) * 8) + 'px)' : 'none';
    }
  }

  function init() {
    var width = canvas.offsetWidth;
    if (width === 0 || globe) return;

    globeCenterX = width / 2;
    globeCenterY = width / 2;
    globeRadius = 0.4 * width;

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
      markerColor: [0.4, 0.6, 0.9],
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

  if (canvas.offsetWidth > 0) {
    init();
  } else {
    var ro = new ResizeObserver(function (entries) {
      if (entries[0] && entries[0].contentRect.width > 0) {
        ro.disconnect();
        init();
      }
    });
    ro.observe(canvas);
  }
})();
