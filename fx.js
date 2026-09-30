/* ALPHA — shared effects: optional watch-tick sounds + smooth scrolling.
   Sound is OFF by default (browsers block autoplay and it is more polite);
   the visitor switches it on with the speaker button in the navbar. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var KEY = 'alpha-sound';
  var on = false;
  try { on = localStorage.getItem(KEY) === '1'; } catch (e) {}

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
  var ctx = null, flip = false, lastHover = 0;
  function ac() {
    if (!ctx) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // One soft, low "tap": a short sine note through a low-pass filter. Quiet and round, never sharp.
  function soft(freq, vol, dur) {
    if (!on) return;
    var c = ac(); if (!c) return;
    var t = c.currentTime;
    var o = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = freq;
    lp.type = 'lowpass'; lp.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp); lp.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function click() { soft(520, 0.05, 0.14); }
  function chime() { soft(660, 0.04, 0.6); }
  window.AlphaFX = { tick: function () { soft(440, 0.035, 0.18); }, click: click, chime: chime, isOn: function () { return on; } };

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
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('a,button,.slot');
      if (t && t.id !== 'fxToggle') click();
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
