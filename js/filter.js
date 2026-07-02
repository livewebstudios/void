/* ==========================================================================
   FOUR-COLOR VÖID — filter.js
   Shop page only. Renders the grid from data/products.json (with an inline
   fallback for file:// viewing, generated from the same file), then runs
   the department filter. No reload, obviously — it's 2026.
   ========================================================================== */

(function () {
  'use strict';

  var grid = document.getElementById('grid');
  if (!grid) return;

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function cardHTML(p) {
    return '<article class="card reveal" data-cat="' + p.cat + '">' +
      '<svg class="price-burst" viewBox="0 0 128 128" role="img" aria-label="Price ' + p.price + ' dollars">' +
        '<use href="#burst12"/><text x="64" y="76" text-anchor="middle" font-size="30">$' + p.price + '</text></svg>' +
      '<span class="dept">Dept: ' + p.catName + '</span>' +
      '<a class="art" href="product/' + p.slug + '.html" aria-label="' + p.name + ', full details">' +
        '<div class="dots-lite"></div><svg viewBox="0 0 200 160" aria-hidden="true"><use href="#' + p.symbol + '"/></svg>' +
        '<svg class="stamp" viewBox="0 0 140 140" aria-hidden="true"><use href="#void-stamp"/></svg></a>' +
      '<h3><a href="product/' + p.slug + '.html">' + p.name + '</a></h3>' +
      '<p class="blurb">' + p.blurb + '</p>' +
      '<button class="btn add" data-slug="' + p.slug + '" data-name="' + p.name + '" data-dept="' + p.catName + '" data-price="' + p.price + '">Rush Me Mine!</button>' +
    '</article>';
  }

  function boot(data) {
    var PRODUCTS = data.products;
    var CATS = data.categories;

    grid.innerHTML = PRODUCTS.map(cardHTML).join('');

    if (window.VOIDMotion) {
      grid.querySelectorAll('.reveal').forEach(window.VOIDMotion.observe);
    } else {
      grid.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
    }

    var showing = document.getElementById('showing');

    function applyFilter(cat) {
      var visible = 0;
      grid.querySelectorAll('.card').forEach(function (card) {
        var show = (cat === 'all' || card.dataset.cat === cat);
        card.classList.toggle('hide', !show);
        if (show) {
          visible++;
          if (!RM) { card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); }
          card.classList.add('in');
          var stamp = card.querySelector('.stamp');
          if (stamp) stamp.classList.add('slam');
        }
      });
      if (showing) {
        showing.textContent = cat === 'all'
          ? 'Showing all ' + visible + ' wonders'
          : 'Showing ' + visible + ' wonders of ' + CATS[cat];
      }
    }

    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        applyFilter(btn.dataset.cat);
      });
    });

    if (showing) showing.textContent = 'Showing all ' + PRODUCTS.length + ' wonders';
  }

  function inlineData() {
    var node = document.getElementById('products-data');
    if (!node) return null;
    try { return JSON.parse(node.textContent); }
    catch (e) { return null; }
  }

  fetch('data/products.json')
    .then(function (res) {
      if (!res.ok) throw new Error('bad status');
      return res.json();
    })
    .then(boot)
    .catch(function () {
      var data = inlineData();
      if (data) boot(data);
    });
})();
