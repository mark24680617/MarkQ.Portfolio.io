(function () {
  'use strict';

  function initHeroLetters() {
    var el = document.querySelector('.hero-title');
    if (!el) return;
    var text = el.textContent;
    el.setAttribute('aria-label', text);
    while (el.firstChild) el.removeChild(el.firstChild);
    var letters = [];
    for (var i = 0; i < text.length; i++) {
      var span = document.createElement('span');
      span.className = 'letter';
      span.textContent = text[i] === ' ' ? '\u00A0' : text[i];
      span.style.transitionDelay = (i * 60) + 'ms';
      el.appendChild(span);
      letters.push(span);
    }
    setTimeout(function () {
      letters.forEach(function (s) { s.classList.add('visible'); });
    }, 200);
  }

  function initHeroSequence() {
    setTimeout(function () {
      var bars = document.querySelectorAll('.hero-divider span');
      bars.forEach(function (b, i) {
        setTimeout(function () { b.classList.add('visible'); }, i * 120);
      });
    }, 600);

    setTimeout(function () {
      var sub = document.querySelector('.hero-subtitle');
      if (sub) sub.classList.add('visible');
    }, 900);

    setTimeout(function () {
      var btns = document.querySelectorAll('.hero-buttons .btn');
      btns.forEach(function (b, i) {
        setTimeout(function () { b.classList.add('visible'); }, i * 120);
      });
    }, 1100);
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    if (!els.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach(function (el) { observer.observe(el); });
  }

  function initScrollSpy() {
    var navLinks = document.querySelectorAll('.nav-links a');
    var mobileLinks = document.querySelectorAll('.nav-mobile a');
    var allLinks = [];
    navLinks.forEach(function (a) { allLinks.push(a); });
    mobileLinks.forEach(function (a) { allLinks.push(a); });

    var sections = [];
    allLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href && href.charAt(0) === '#') {
        var target = document.querySelector(href);
        if (target && sections.indexOf(target) === -1) sections.push(target);
      }
    });

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          var scrollY = window.scrollY;
          var current = null;
          sections.forEach(function (sec) {
            if (sec.offsetTop <= scrollY + 80) current = sec;
          });
          allLinks.forEach(function (a) {
            var href = a.getAttribute('href');
            if (current && href === '#' + current.id) {
              a.classList.add('active');
            } else {
              a.classList.remove('active');
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  function initHamburger() {
    var btn = document.querySelector('.nav-hamburger');
    var mobile = document.querySelector('.nav-mobile');
    if (!btn || !mobile) return;
    btn.addEventListener('click', function () {
      btn.classList.toggle('open');
      mobile.classList.toggle('open');
      btn.setAttribute('aria-expanded', btn.classList.contains('open'));
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        btn.classList.remove('open');
        mobile.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeroLetters();
    initHeroSequence();
    initReveal();
    initScrollSpy();
    initHamburger();
  });
})();
