/* ================================================
   LUXURY GALLERY MODAL — نمایندگی ۱۷۳۷ زراعتکار
   FLIP shared-element transition · Zoom · Swipe
   ================================================ */
(function () {
  'use strict';

  /* ── Config ───────────────────────────────────── */
  var EASE    = 'cubic-bezier(.22,1,.36,1)';
  var DUR     = 420;
  var MAX_Z   = 5;

  /* ── State ────────────────────────────────────── */
  var S = {
    images : [],   /* [{ src, el }] */
    total  : 0,
    cur    : 0,
    open   : false,
    scrollY: 0,
    zoom   : 1,
    panX   : 0,
    panY   : 0,
    drag   : false,
    dsx:0, dsy:0, dpx:0, dpy:0,
    tsx:0, tsy:0, tst:0,
    lastTap: 0,
    pinchD : 0,
    pinchZ : 1,
  };

  /* ── DOM refs ─────────────────────────────────── */
  var overlay, blurEl, vignette, modal, imgWrap,
      imgEl, loaderEl, closeBtn, prevBtn, nextBtn,
      counterEl, dotsEl;

  /* ── Helpers ──────────────────────────────────── */
  function el(tag, cls) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    return e;
  }
  function raf(fn) { requestAnimationFrame(fn); }
  function css(node, styles) { Object.assign(node.style, styles); }

  /* ── Build DOM ────────────────────────────────── */
  function build() {
    overlay  = el('div', 'mg-overlay');
    blurEl   = el('div', 'mg-blur');
    vignette = el('div', 'mg-vignette');

    modal = el('div', 'mg-modal');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'نمایش تصویر خودرو');

    imgWrap  = el('div', 'mg-img-wrap');
    loaderEl = el('div', 'mg-loader');
    loaderEl.innerHTML = '<div class="mg-loader-ring"></div>';

    imgEl = el('img', 'mg-img');
    imgEl.alt      = 'تصویر خودرو';
    imgEl.draggable = false;

    imgWrap.appendChild(loaderEl);
    imgWrap.appendChild(imgEl);
    modal.appendChild(imgWrap);

    /* close */
    closeBtn = el('button', 'mg-close');
    closeBtn.setAttribute('aria-label', 'بستن');
    closeBtn.innerHTML =
      '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round">' +
      '<line x1="2" y1="2" x2="13" y2="13"/><line x1="13" y1="2" x2="2" y2="13"/></svg>';

    /* nav */
    prevBtn = mkNav('mg-nav mg-nav--prev', 'تصویر قبلی',
      '<polyline points="15 18 9 12 15 6"/>',
      function () { navigate(-1); });
    nextBtn = mkNav('mg-nav mg-nav--next', 'تصویر بعدی',
      '<polyline points="9 18 15 12 9 6"/>',
      function () { navigate(1); });

    counterEl = el('div', 'mg-counter');
    dotsEl    = el('div', 'mg-dots');

    [overlay, blurEl, vignette, modal, closeBtn, prevBtn, nextBtn, counterEl, dotsEl]
      .forEach(function (n) { document.body.appendChild(n); });
  }

  function mkNav(cls, label, polyline, onClick) {
    var btn = el('button', cls);
    btn.setAttribute('aria-label', label);
    btn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
      ' stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
      polyline + '</svg>';
    btn.addEventListener('click', function (e) { e.stopPropagation(); onClick(); });
    return btn;
  }

  /* ── Open ─────────────────────────────────────── */
  function openGallery(index, srcEl) {
    if (S.open) return;
    S.open    = true;
    S.cur     = index;
    S.scrollY = window.scrollY;

    lockScroll();

    raf(function () {
      overlay.classList.add('is-open');
      blurEl.classList.add('is-open');
      vignette.classList.add('is-open');
      modal.classList.add('is-open');
    });

    if (srcEl) flipOpen(srcEl);

    /* Load image — reveal after FLIP lands */
    loadImg(index, srcEl ? DUR - 40 : 0);

    setTimeout(showControls, srcEl ? Math.round(DUR * 0.65) : 180);
    buildDots();
    updateDots();
    preload(index);

    document.addEventListener('keydown', onKey);
  }

  /* ── FLIP: card → fullscreen ──────────────────── */
  function flipOpen(srcEl) {
    var r   = srcEl.getBoundingClientRect();
    var br  = window.getComputedStyle(srcEl).borderRadius;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var pad = Math.min(72, vw * 0.06);

    var clone = el('img', 'mg-flip-clone');
    clone.src = srcEl.src;
    css(clone, {
      top: r.top + 'px', left: r.left + 'px',
      width: r.width + 'px', height: r.height + 'px',
      borderRadius: br,
      objectFit: 'cover',
      opacity: '1',
      transition: 'none',
    });
    document.body.appendChild(clone);

    /* hide loader during FLIP */
    loaderEl.style.display = 'none';

    var tw = vw - pad * 2;
    var th = vh - pad * 2;

    raf(function () {
      raf(function () {
        clone.style.transition =
          'top ' + DUR + 'ms ' + EASE +
          ', left ' + DUR + 'ms ' + EASE +
          ', width ' + DUR + 'ms ' + EASE +
          ', height ' + DUR + 'ms ' + EASE +
          ', border-radius ' + DUR + 'ms ' + EASE +
          ', opacity ' + Math.round(DUR * .8) + 'ms ease';
        css(clone, {
          top: pad + 'px', left: pad + 'px',
          width: tw + 'px', height: th + 'px',
          borderRadius: '14px',
          objectFit: 'contain',
        });
      });
    });

    setTimeout(function () { clone.remove(); }, DUR + 60);
    /* show loader only if image not ready after FLIP */
    setTimeout(function () {
      if (!imgEl.classList.contains('is-loaded')) loaderEl.style.display = '';
    }, DUR);
  }

  /* ── Close ────────────────────────────────────── */
  function closeGallery() {
    if (!S.open) return;
    S.open = false;

    var srcEl = S.images[S.cur] && S.images[S.cur].el;

    hideControls();
    if (srcEl) flipClose(srcEl);

    var delay = srcEl ? Math.round(DUR * .8) : 0;
    setTimeout(function () {
      overlay.classList.remove('is-open');
      blurEl.classList.remove('is-open');
      vignette.classList.remove('is-open');
      modal.classList.remove('is-open');
      imgEl.classList.remove('is-loaded');
      imgEl.style.opacity = '';
      loaderEl.style.display = '';
      resetZoom();
    }, delay);

    setTimeout(unlockScroll, srcEl ? DUR + 20 : 80);
    document.removeEventListener('keydown', onKey);
  }

  /* ── FLIP: fullscreen → card ──────────────────── */
  function flipClose(srcEl) {
    var r   = srcEl.getBoundingClientRect();
    var br  = window.getComputedStyle(srcEl).borderRadius;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var pad = Math.min(72, vw * 0.06);

    var clone = el('img', 'mg-flip-clone');
    clone.src = S.images[S.cur].src;
    css(clone, {
      top: pad + 'px', left: pad + 'px',
      width: (vw - pad * 2) + 'px', height: (vh - pad * 2) + 'px',
      borderRadius: '14px',
      objectFit: 'contain',
      opacity: '1',
      transition: 'none',
    });
    document.body.appendChild(clone);
    imgEl.style.opacity = '0';

    raf(function () {
      raf(function () {
        clone.style.transition =
          'top ' + DUR + 'ms ' + EASE +
          ', left ' + DUR + 'ms ' + EASE +
          ', width ' + DUR + 'ms ' + EASE +
          ', height ' + DUR + 'ms ' + EASE +
          ', border-radius ' + DUR + 'ms ' + EASE +
          ', opacity 180ms ease ' + Math.round(DUR * .7) + 'ms';
        css(clone, {
          top: r.top + 'px', left: r.left + 'px',
          width: r.width + 'px', height: r.height + 'px',
          borderRadius: br,
          objectFit: 'cover',
          opacity: '0',
        });
      });
    });

    setTimeout(function () {
      clone.remove();
      imgEl.style.opacity = '';
    }, DUR + 60);
  }

  /* ── Image Loading ────────────────────────────── */
  function loadImg(index, delay) {
    var src = S.images[index].src;
    imgEl.classList.remove('is-loaded');

    function doLoad() {
      if (imgEl.src === src && imgEl.complete) {
        imgEl.classList.add('is-loaded');
        loaderEl.style.display = 'none';
        return;
      }
      imgEl.onload = function () {
        imgEl.classList.add('is-loaded');
        loaderEl.style.display = 'none';
      };
      imgEl.src = src;
      if (imgEl.complete) imgEl.onload();
    }

    if (delay > 0) setTimeout(doLoad, delay);
    else doLoad();
  }

  function preload(index) {
    [-1, 1].forEach(function (d) {
      var i   = (index + d + S.total) % S.total;
      var img = new Image();
      img.src = S.images[i].src;
    });
  }

  /* ── Navigation ───────────────────────────────── */
  function changeTo(newIdx, dir) {
    S.cur = (newIdx + S.total) % S.total;
    resetZoom();

    var outX = dir > 0 ? '-56px' : '56px';
    var inX  = dir > 0 ? '56px'  : '-56px';

    imgEl.style.transition = 'opacity 160ms ease, transform 160ms ease';
    imgEl.style.opacity    = '0';
    imgEl.style.transform  = 'translateX(' + outX + ') scale(.96)';
    loaderEl.style.display = '';

    var cur = S.cur;
    setTimeout(function () {
      imgEl.style.transition = 'none';
      imgEl.style.transform  = 'translateX(' + inX + ') scale(.96)';
      imgEl.classList.remove('is-loaded');
      imgEl.src = S.images[cur].src;

      imgEl.onload = function () {
        loaderEl.style.display = 'none';
        raf(function () {
          raf(function () {
            imgEl.style.transition =
              'opacity 260ms ease, transform 320ms ' + EASE;
            imgEl.style.opacity   = '1';
            imgEl.style.transform = '';
            imgEl.classList.add('is-loaded');
          });
        });
      };
      if (imgEl.complete) imgEl.onload();

    }, 160);

    updateCounter();
    updateDots();
    preload(cur);
  }

  function navigate(dir) { changeTo(S.cur + dir, dir); }
  function goTo(i) { if (i !== S.cur) changeTo(i, i > S.cur ? 1 : -1); }

  /* ── Zoom ─────────────────────────────────────── */
  function applyZoom(z) {
    S.zoom = Math.max(1, Math.min(MAX_Z, z));
    if (S.zoom === 1) { S.panX = 0; S.panY = 0; }
    imgEl.style.transform =
      'translate(' + S.panX + 'px, ' + S.panY + 'px) scale(' + S.zoom + ')';
    imgEl.classList.toggle('is-zoomed', S.zoom > 1);
    imgEl.style.cursor = S.zoom > 1 ? 'grab' : 'zoom-in';
  }

  function resetZoom() {
    S.zoom = 1; S.panX = 0; S.panY = 0;
    imgEl.style.transition = 'transform 300ms ' + EASE + ', opacity 200ms ease';
    imgEl.style.transform  = '';
    imgEl.classList.remove('is-zoomed');
    imgEl.style.cursor = '';
    setTimeout(function () { imgEl.style.transition = ''; }, 310);
  }

  /* Mouse wheel */
  function onWheel(e) {
    if (!S.open) return;
    e.preventDefault();
    applyZoom(S.zoom * (e.deltaY > 0 ? .88 : 1.14));
  }

  /* Double-click */
  function onDblClick() {
    if (!S.open) return;
    S.zoom > 1 ? resetZoom() : applyZoom(2.5);
  }

  /* Mouse drag (zoomed) */
  function onMouseDown(e) {
    if (!S.open || S.zoom <= 1) return;
    S.drag = true;
    S.dsx = e.clientX; S.dsy = e.clientY;
    S.dpx = S.panX;    S.dpy = S.panY;
    imgEl.classList.add('is-dragging');
    e.preventDefault();
  }
  function onMouseMove(e) {
    if (!S.drag) return;
    S.panX = S.dpx + (e.clientX - S.dsx);
    S.panY = S.dpy + (e.clientY - S.dsy);
    imgEl.style.transform =
      'translate(' + S.panX + 'px, ' + S.panY + 'px) scale(' + S.zoom + ')';
  }
  function onMouseUp() {
    if (!S.drag) return;
    S.drag = false;
    imgEl.classList.remove('is-dragging');
  }

  /* ── Touch ────────────────────────────────────── */
  function pinchDist(e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onTouchStart(e) {
    if (!S.open) return;
    if (e.touches.length === 2) {
      S.pinchD = pinchDist(e);
      S.pinchZ = S.zoom;
      return;
    }
    S.tsx = e.touches[0].clientX;
    S.tsy = e.touches[0].clientY;
    S.tst = Date.now();

    var now = Date.now();
    if (now - S.lastTap < 280) {
      e.preventDefault();
      S.zoom > 1 ? resetZoom() : applyZoom(2.5);
    }
    S.lastTap = now;
  }

  function onTouchMove(e) {
    if (!S.open) return;
    if (e.touches.length === 2) {
      e.preventDefault();
      applyZoom(S.pinchZ * (pinchDist(e) / S.pinchD));
      return;
    }
    if (S.zoom <= 1) e.preventDefault();
  }

  function onTouchEnd(e) {
    if (!S.open || e.touches.length) return;
    if (S.zoom > 1) return;
    var dx = e.changedTouches[0].clientX - S.tsx;
    var dy = e.changedTouches[0].clientY - S.tsy;
    var dt = Date.now() - S.tst;

    /* swipe down → close */
    if (dy > 80 && Math.abs(dx) < 60 && dt < 400) { closeGallery(); return; }
    /* swipe L/R → navigate */
    if (Math.abs(dx) > 50 && Math.abs(dy) < 80 && dt < 400) {
      navigate(dx < 0 ? 1 : -1);
    }
  }

  /* ── Keyboard ─────────────────────────────────── */
  function onKey(e) {
    if (e.key === 'Escape')     closeGallery();
    if (e.key === 'ArrowLeft')  navigate(-1);
    if (e.key === 'ArrowRight') navigate(1);
  }

  /* ── Controls ─────────────────────────────────── */
  function showControls() {
    [closeBtn, prevBtn, nextBtn, counterEl, dotsEl]
      .forEach(function (n) { n.classList.add('is-visible'); });
    updateCounter();
  }

  function hideControls() {
    [closeBtn, prevBtn, nextBtn, counterEl, dotsEl]
      .forEach(function (n) { n.classList.remove('is-visible'); });
  }

  function updateCounter() {
    counterEl.textContent = (S.cur + 1) + ' / ' + S.total;
  }

  function buildDots() {
    dotsEl.innerHTML = '';
    S.images.forEach(function (_, i) {
      var dot = el('button', 'mg-dot');
      dot.setAttribute('aria-label', 'تصویر ' + (i + 1));
      dot.addEventListener('click', function (e) {
        e.stopPropagation(); goTo(i);
      });
      dotsEl.appendChild(dot);
    });
  }

  function updateDots() {
    dotsEl.querySelectorAll('.mg-dot').forEach(function (d, i) {
      d.classList.toggle('is-active', i === S.cur);
    });
  }

  /* ── Scroll Lock ──────────────────────────────── */
  function lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top      = '-' + S.scrollY + 'px';
    document.body.style.width    = '100%';
  }

  function unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top      = '';
    document.body.style.width    = '';
    window.scrollTo(0, S.scrollY);
  }

  /* ── Init ─────────────────────────────────────── */
  function init() {
    /* Collect collage images */
    document.querySelectorAll('.collage-img').forEach(function (img, i) {
      S.images.push({ src: img.src, el: img });
      img.style.cursor = 'pointer';
      img.addEventListener('click', function (e) {
        e.stopPropagation();
        openGallery(i, img);
      });
    });
    S.total = S.images.length;
    if (!S.total) return;

    build();

    /* click backdrop to close */
    overlay.addEventListener('click', closeGallery);
    imgWrap.addEventListener('click', function (e) {
      if (e.target === imgWrap) closeGallery();
    });
    closeBtn.addEventListener('click', closeGallery);

    /* zoom */
    modal.addEventListener('wheel', onWheel, { passive: false });
    imgEl.addEventListener('dblclick', onDblClick);

    /* mouse drag */
    imgEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    /* touch */
    modal.addEventListener('touchstart', onTouchStart, { passive: false });
    modal.addEventListener('touchmove',  onTouchMove,  { passive: false });
    modal.addEventListener('touchend',   onTouchEnd);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
