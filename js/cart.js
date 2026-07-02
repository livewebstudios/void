/* ==========================================================================
   FOUR-COLOR VÖID — cart.js
   Fake-functional mail-order cart. Real state in sessionStorage, header
   badge + "Acquired!" toast on every page, and placeOrder() which clears
   the cart, generates order no. VÖID-1955-XXXX, and routes to
   confirmation.html. No payment is collected anywhere — payment stays
   "check or money order / C.O.D." radios, exactly as printed.
   ========================================================================== */

(function () {
  'use strict';

  var CART_KEY = 'voidCart';
  var ORDER_KEY = 'voidOrder';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var memory = {};

  /* ---------- storage (sessionStorage with in-memory fallback) ---------- */

  function storeGet(k) {
    try { return window.sessionStorage.getItem(k); }
    catch (e) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; }
  }
  function storeSet(k, v) {
    try { window.sessionStorage.setItem(k, v); }
    catch (e) { memory[k] = v; }
  }
  function storeRemove(k) {
    try { window.sessionStorage.removeItem(k); }
    catch (e) { delete memory[k]; }
  }

  /* ---------- cart state ---------- */

  function getCart() {
    var raw = storeGet(CART_KEY);
    if (!raw) return [];
    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }
  function saveCart(items) { storeSet(CART_KEY, JSON.stringify(items)); }

  function clampQty(q) {
    q = parseInt(q, 10);
    if (isNaN(q) || q < 1) q = 1;
    return Math.min(q, 99);
  }

  function addToCart(slug, qty, meta) {
    qty = clampQty(qty);
    var items = getCart();
    var line = items.find(function (i) { return i.slug === slug; });
    if (line) {
      line.qty = Math.min(99, line.qty + qty);
    } else {
      items.push({ slug: slug, name: meta.name, dept: meta.dept, price: meta.price, qty: qty });
    }
    saveCart(items);
    syncBadge(true);
  }

  function removeFromCart(slug) {
    saveCart(getCart().filter(function (i) { return i.slug !== slug; }));
    syncBadge(true);
  }

  function updateQty(slug, qty) {
    if (qty < 1) { removeFromCart(slug); return; }
    var items = getCart();
    var line = items.find(function (i) { return i.slug === slug; });
    if (line) { line.qty = clampQty(qty); saveCart(items); }
    syncBadge(true);
  }

  function cartTotal() {
    return getCart().reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  }
  function cartCount() {
    return getCart().reduce(function (s, i) { return s + i.qty; }, 0);
  }
  function money(n) { return '$' + n.toLocaleString('en-US'); }

  /* ---------- header badge ---------- */

  function syncBadge(bump) {
    var c = cartCount();
    var badge = document.getElementById('cartCount');
    var cartBtn = document.getElementById('cartBtn');
    if (!badge || !cartBtn) return;
    badge.textContent = c;
    cartBtn.setAttribute('aria-label', 'Cart, ' + c + ' items');
    if (bump && !RM) {
      cartBtn.classList.remove('bump');
      void cartBtn.offsetWidth;
      cartBtn.classList.add('bump');
    }
  }

  /* ---------- toast ---------- */

  var toastTimer;
  function showToast(msg) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 1500);
  }

  /* ---------- add buttons (delegated; works for rendered grids too) ---------- */

  function initAddButtons() {
    document.addEventListener('click', function (ev) {
      var btn = ev.target.closest('.add[data-slug]');
      if (!btn) return;
      var qty = 1;
      var qNum = document.getElementById('qNum');
      if (btn.id === 'addBtn' && qNum) qty = clampQty(qNum.textContent);
      addToCart(btn.dataset.slug, qty, {
        name: btn.dataset.name,
        dept: btn.dataset.dept,
        price: parseInt(btn.dataset.price, 10)
      });
      showToast(qty > 1 ? 'Acquired ×' + qty + '!' : 'Acquired!');
    });
  }

  /* ---------- product page quantity stepper ---------- */

  function initStepper() {
    var qNum = document.getElementById('qNum');
    var minus = document.getElementById('qMinus');
    var plus = document.getElementById('qPlus');
    if (!qNum || !minus || !plus) return;
    var qty = 1;
    minus.addEventListener('click', function () { qty = Math.max(1, qty - 1); qNum.textContent = qty; });
    plus.addEventListener('click', function () { qty = Math.min(99, qty + 1); qNum.textContent = qty; });
  }

  /* ---------- cart page ---------- */

  function renderCart() {
    var lines = document.getElementById('lines');
    var cartGrid = document.getElementById('cartGrid');
    var empty = document.getElementById('empty');
    if (!lines || !cartGrid || !empty) return;

    var cart = getCart();
    if (cart.length === 0) {
      cartGrid.hidden = true;
      empty.hidden = false;
      syncBadge(false);
      return;
    }
    cartGrid.hidden = false;
    empty.hidden = true;

    lines.innerHTML = cart.map(function (i, idx) {
      return '<div class="line">' +
        '<div class="thumb"><div class="dots-lite"></div><svg viewBox="0 0 200 160" aria-hidden="true"><use href="#d-' + i.slug + '"/></svg></div>' +
        '<div><h3>' + i.name + '</h3>' +
          '<div class="dept">Dept: ' + i.dept + '</div>' +
          '<div class="unit">' + money(i.price) + ' each</div></div>' +
        '<div class="right">' +
          '<span class="lt">' + money(i.price * i.qty) + '</span>' +
          '<div class="qty" role="group" aria-label="Quantity for ' + i.name + '">' +
            '<button data-a="minus" data-i="' + idx + '" aria-label="Decrease quantity">−</button>' +
            '<span class="num">' + i.qty + '</span>' +
            '<button data-a="plus" data-i="' + idx + '" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button class="remove" data-a="remove" data-i="' + idx + '">Remove</button>' +
        '</div>' +
      '</div>';
    }).join('');

    var subtotal = document.getElementById('subtotal');
    var total = document.getElementById('total');
    if (subtotal) subtotal.textContent = money(cartTotal());
    if (total) total.textContent = money(cartTotal());
    syncBadge(false);
  }

  function initCartPage() {
    var lines = document.getElementById('lines');
    if (!lines) return;

    lines.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn) return;
      var cart = getCart();
      var i = +btn.dataset.i;
      if (!cart[i]) return;
      if (btn.dataset.a === 'plus') updateQty(cart[i].slug, cart[i].qty + 1);
      if (btn.dataset.a === 'minus') {
        if (cart[i].qty - 1 < 1) { removeFromCart(cart[i].slug); showToast('Removed!'); }
        else updateQty(cart[i].slug, cart[i].qty - 1);
      }
      if (btn.dataset.a === 'remove') { removeFromCart(cart[i].slug); showToast('Removed!'); }
      renderCart();
    });

    renderCart();
  }

  /* ---------- checkout page ---------- */

  function initCheckoutPage() {
    var form = document.getElementById('orderForm');
    if (!form) return;

    var cart = getCart();
    if (cart.length === 0) {
      window.location.replace('cart.html');
      return;
    }

    var sumLines = document.getElementById('sumLines');
    if (sumLines) {
      sumLines.innerHTML = cart.map(function (i) {
        return '<div class="line sum-line">' +
          '<div class="thumb"><div class="dots-lite"></div><svg viewBox="0 0 200 160" aria-hidden="true"><use href="#d-' + i.slug + '"/></svg></div>' +
          '<div><h3>' + i.name + '</h3><div class="unit">' + i.qty + ' × ' + money(i.price) + '</div></div>' +
          '<div class="right"><span class="lt">' + money(i.price * i.qty) + '</span></div>' +
        '</div>';
      }).join('');
    }
    var subtotal = document.getElementById('subtotal2');
    var total = document.getElementById('total2');
    if (subtotal) subtotal.textContent = money(cartTotal());
    if (total) total.textContent = money(cartTotal());

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      placeOrder();
    });
  }

  /* placeOrder(): no payment exists anywhere in this build. Clears the cart,
     generates the order number, routes to the confirmation page. */
  function placeOrder() {
    var no = 'VÖID-1955-' + String(Math.floor(1000 + Math.random() * 9000));
    storeSet(ORDER_KEY, JSON.stringify({ no: no }));
    storeRemove(CART_KEY);
    window.location.href = 'confirmation.html';
  }

  /* ---------- confirmation page ---------- */

  function initConfirmationPage() {
    var orderNo = document.getElementById('orderNo');
    if (!orderNo) return;

    var order = null;
    var raw = storeGet(ORDER_KEY);
    if (raw) { try { order = JSON.parse(raw); } catch (e) { order = null; } }

    var hasOrder = document.getElementById('hasOrder');
    var noOrder = document.getElementById('noOrder');

    if (!order || !order.no) {
      if (hasOrder) hasOrder.hidden = true;
      if (noOrder) noOrder.hidden = false;
      syncBadge(false);
      return;
    }

    if (hasOrder) hasOrder.hidden = false;
    if (noOrder) noOrder.hidden = true;
    orderNo.textContent = 'ORDER No. ' + order.no;

    var stamp = document.getElementById('confStamp');
    if (stamp) {
      if (!RM) { setTimeout(function () { stamp.classList.add('slam'); }, 450); }
      else { stamp.style.opacity = 1; stamp.style.transform = 'rotate(-8deg)'; }
    }
    syncBadge(false);
  }

  /* ---------- the VÖID Bulletin coupon (homepage) ---------- */

  function initBulletin() {
    var form = document.getElementById('bulletinForm');
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      showToast("You're on the list, citizen!");
      form.reset();
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    syncBadge(false);
    initAddButtons();
    initStepper();
    initCartPage();
    initCheckoutPage();
    initConfirmationPage();
    initBulletin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* exposed for demo walkthroughs */
  window.VOID = {
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    updateQty: updateQty,
    cartTotal: cartTotal,
    cartCount: cartCount,
    getCart: getCart,
    placeOrder: placeOrder
  };
})();
