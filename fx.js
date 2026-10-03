/* ALPHA — shared effects: optional watch-tick sounds + smooth scrolling.
   Sound is OFF by default (browsers block autoplay and it is more polite);
   the visitor switches it on with the speaker button in the navbar. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var KEY = 'alpha-sound';
  var on = true;   // sound is ON for new visitors; the speaker button mutes it and remembers the choice
  try { on = localStorage.getItem(KEY) !== '0'; } catch (e) {}

  /* ---------------- smooth scroll (Lenis, desktop only) ---------------- */
  if (window.Lenis && !reduce && !coarse) {
    var lenis = new Lenis({ lerp: 0.09, smoothWheel: true, anchors: true });
    window.__lenis = lenis;
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    var st = document.createElement('style');
    st.textContent = 'html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:hidden}.lenis.lenis-smooth iframe{pointer-events:none}';
    document.head.appendChild(st);
  }

  /* ---------------- sound (Web Audio, no audio files needed) ---------------- */
  var ctx = null, pending = false, t0 = Date.now();
  // iPhone: use the media channel so the silent switch does not mute the effects
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state !== 'running') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  // One short watch-like note (fundamental + octave). Loud enough for phone speakers.
  function note(freq, vol, dur, when) {
    var c = ctx; if (!c) return;
    var t = c.currentTime + (when || 0);
    var g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 5200;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(g); g.connect(c.destination);
    [1, 2].forEach(function (m, k) {
      var o = c.createOscillator(), og = c.createGain();
      o.type = 'sine'; o.frequency.value = freq * m; og.gain.value = k ? 0.35 : 1;
      o.connect(og); og.connect(lp); o.start(t); o.stop(t + dur + 0.05);
    });
  }
  function play(fn) { if (on && ac()) fn(); }
  function click() { play(function () { note(1480, 0.22, 0.09); }); }
  function openSound() { note(880, 0.2, 0.5); note(1320, 0.16, 0.7, 0.16); }
  // Preloader "open" sound. Phones block audio until the first touch, so it waits for that touch.
  function chime() {
    if (!on) return;
    var c = ac(); if (!c) return;
    if (c.state === 'running') openSound(); else pending = true;
  }
  function firstTouch() {
    if (!ac()) return;
    if (pending && on && Date.now() - t0 < 12000) openSound();
    pending = false;
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (n) { window.addEventListener(n, firstTouch, { passive: true }); });
  window.AlphaFX = { tick: function () { play(function () { note(1100, 0.12, 0.12); }); }, click: click, chime: chime, isOn: function () { return on; } };

  /* ---------------- sound toggle in the navbar ---------------- */
  function buildToggle() {
    var menuBtn = document.getElementById('menuBtn');
    if (!menuBtn || document.getElementById('fxToggle')) return;
    var st = document.createElement('style');
    st.textContent = '#fxToggle{width:42px;height:42px;flex:none;border:1px solid rgba(212,175,110,.45);background:transparent;color:#D4AF6E;display:grid;place-items:center;cursor:pointer;transition:background .3s,color .3s}#fxToggle:hover{background:rgba(212,175,110,.12)}#fxToggle svg{width:18px;height:18px}#fxToggle .wave{transition:opacity .3s}#fxToggle[aria-pressed=false] .wave{opacity:0}#fxToggle .mute{opacity:0;transition:opacity .3s}#fxToggle[aria-pressed=false] .mute{opacity:1}';
    document.head.appendChild(st);
    var b = document.createElement('button');
    b.id = 'fxToggle'; b.type = 'button';
    b.setAttribute('aria-label', 'Toggle sound effects'); b.title = 'Sound effects';
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path class="wave" d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/><path class="mute" d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      on = !on;
      try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (err) {}
      b.setAttribute('aria-pressed', String(on));
      if (on) { ac(); click(); }
    });
    menuBtn.parentNode.insertBefore(b, menuBtn.parentNode.firstChild);
  }

  function init() {
    buildToggle();
    // navigation bar + mobile menu: sound the moment it is touched
    document.addEventListener('pointerdown', function (e) {
      var t = e.target.closest && e.target.closest('a,button');
      if (t && t.id !== 'fxToggle' && t.closest('#navbar,#mobileMenu')) click();
    }, { passive: true });
    // everything else: sound on tap/click
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('a,button,.slot');
      if (t && t.id !== 'fxToggle' && !t.closest('#navbar,#mobileMenu')) click();
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
