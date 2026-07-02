/* ==========================================================================
   FOUR-COLOR VÖID — motion.js
   Scroll reveals, action-burst pops, Code Authority stamp slams, and the
   homepage cover parallax. Everything is static under prefers-reduced-motion.
   Extracted from the root mockups.
   ========================================================================== */

(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll reveals + stamp slams + burst pops ---- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      var stamp = e.target.querySelector('.stamp');
      if (stamp && !RM) {
        setTimeout(function () { stamp.classList.add('slam'); }, 260);
      } else if (stamp) {
        stamp.style.opacity = 1;
        stamp.style.transform = 'rotate(-8deg)';
      }
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });

  function observe(el) { io.observe(el); }

  document.querySelectorAll('.reveal, .boom').forEach(observe);

  /* ---- cover parallax (halftone layers + far skyline; homepage only) ---- */
  var layers = document.querySelectorAll('.cover [data-speed]');
  if (layers.length && !RM) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        layers.forEach(function (l) {
          var base = l.classList.contains('far') ? 'translateX(-52px) scaleX(1.07) ' : '';
          l.style.transform = base + 'translateY(' + (y * parseFloat(l.dataset.speed)) + 'px)';
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---- punch clicks: every click socks the site ---- */
  var PUNCH_WORDS = ['POW!', 'WHAM!', 'BAM!', 'SOCK!'];
  var PUNCH_STAR = '126,64 102.6,74.4 117.7,95 92.3,92.3 95,117.7 74.4,102.6 64,126 ' +
    '53.6,102.6 33,117.7 35.7,92.3 10.3,95 25.4,74.4 2,64 25.4,53.6 10.3,33 ' +
    '35.7,35.7 33,10.3 53.6,25.4 64,2 74.4,25.4 95,10.3 92.3,35.7 117.7,33 102.6,53.6';
  var hitTimer;

  document.addEventListener('click', function (ev) {
    if (RM) return;
    if (ev.detail === 0) return; /* keyboard "clicks" don't punch */
    if (ev.target.closest('input, textarea, select, label')) return;

    var word = PUNCH_WORDS[Math.floor(Math.random() * PUNCH_WORDS.length)];
    var punch = document.createElement('div');
    punch.className = 'punch';
    punch.setAttribute('aria-hidden', 'true');
    punch.style.left = ev.pageX + 'px';
    punch.style.top = ev.pageY + 'px';
    punch.style.setProperty('--pr', (Math.random() * 20 - 10).toFixed(1) + 'deg');
    punch.innerHTML =
      '<svg viewBox="0 0 128 128" width="112" height="112">' +
        '<polygon points="' + PUNCH_STAR + '" fill="#D63426" stroke="#1A161B" stroke-width="4" stroke-linejoin="round"/>' +
        '<text x="64" y="74" text-anchor="middle" font-size="' + (word.length > 4 ? 24 : 28) + '" ' +
          'stroke="#1A161B" stroke-width="5" paint-order="stroke">' + word + '</text>' +
      '</svg>';
    document.body.appendChild(punch);

    document.body.classList.remove('hit');
    void document.body.offsetWidth; /* restart the jolt on rapid jabs */
    document.body.classList.add('hit');
    clearTimeout(hitTimer);
    hitTimer = setTimeout(function () { document.body.classList.remove('hit'); }, 220);

    setTimeout(function () { punch.remove(); }, 520);
  });

  /* Later-rendered elements (shop grid) register through this. */
  window.VOIDMotion = { observe: observe, RM: RM };
})();
