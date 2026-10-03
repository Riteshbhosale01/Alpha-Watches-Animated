/* ALPHA — phones don't get the heavy Celestia scroll film; they get the Aurelis film page instead.
   PCs/laptops see both films. Loaded in <head> on every page.
   - Anything with class "celestia-link" is hidden on phones.
   - celestia.html redirects to aurelis-film.html on phones.
   - Re-checks when the window is resized / device mode is toggled, so no reload is needed. */
(function () {
  'use strict';
  var mq = window.matchMedia('(max-width: 767px), (pointer: coarse) and (max-width: 1024px)');
  var st = document.createElement('style');
  st.textContent = 'html.is-phone .celestia-link{display:none!important}';
  document.head.appendChild(st);

  function apply() {
    var phone = mq.matches;
    window.ALPHA_PHONE = phone;
    document.documentElement.classList.toggle('is-phone', phone);
    if (phone && /celestia\.html$/i.test(location.pathname)) {
      window.ALPHA_REDIRECT = true;
      document.documentElement.style.visibility = 'hidden';
      location.replace('aurelis-film.html');
    }
  }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply); else if (mq.addListener) mq.addListener(apply);
})();
