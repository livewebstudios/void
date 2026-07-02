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

  /* Later-rendered elements (shop grid) register through this. */
  window.VOIDMotion = { observe: observe, RM: RM };
})();
