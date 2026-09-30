// Mobile menu toggle shared by the inner pages
(function () {
  var btn = document.getElementById('menuBtn');
  var menu = document.getElementById('mobileMenu');
  if (!btn || !menu) return;
  function set(open) {
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    document.body.classList.toggle('menu-open', open);
    if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
  }
  btn.addEventListener('click', function () { set(!menu.classList.contains('open')); });
  menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  window.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', function () { if (getComputedStyle(btn).display === 'none') set(false); });
})();
