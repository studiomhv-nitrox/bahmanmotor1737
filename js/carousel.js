(function () {
  const carousel = document.getElementById('hero-carousel');
  if (!carousel) return;

  const track   = carousel.querySelector('.carousel-track');
  const slides  = carousel.querySelectorAll('.carousel-slide');
  const dots    = carousel.querySelectorAll('.dot');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');

  const TOTAL    = slides.length;
  const INTERVAL = 4000;
  const EASING   = 'cubic-bezier(0.4, 0, 0.2, 1)';

  let current    = 0;
  let autoTimer  = null;
  let isDragging = false;
  let startX     = 0;
  let dragDelta  = 0;

  function w() { return carousel.offsetWidth; }

  /* Set each slide width explicitly so track expands correctly */
  function updateLayout() {
    const pw = w();
    track.style.width = (TOTAL * pw) + 'px';
    slides.forEach(s => { s.style.width = pw + 'px'; });
    goTo(current, false);
  }

  function goTo(index, animate) {
    current = ((index % TOTAL) + TOTAL) % TOTAL;
    track.style.transition = animate === false
      ? 'none'
      : `transform 0.55s ${EASING}`;
    track.style.transform  = `translateX(${-current * w()}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, INTERVAL);
  }

  /* Buttons */
  prevBtn.addEventListener('click', () => { prev(); startAuto(); });
  nextBtn.addEventListener('click', () => { next(); startAuto(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { goTo(i); startAuto(); }));

  /* Touch swipe */
  carousel.addEventListener('touchstart', e => {
    startX     = e.changedTouches[0].clientX;
    dragDelta  = 0;
    isDragging = true;
    clearInterval(autoTimer);
    track.style.transition = 'none';
  }, { passive: true });

  carousel.addEventListener('touchmove', e => {
    if (!isDragging) return;
    dragDelta = e.changedTouches[0].clientX - startX;
    track.style.transform = `translateX(${-current * w() + dragDelta}px)`;
  }, { passive: true });

  carousel.addEventListener('touchend', () => {
    isDragging = false;
    if (Math.abs(dragDelta) > 50) {
      dragDelta < 0 ? next() : prev();
    } else {
      goTo(current);
    }
    startAuto();
  }, { passive: true });

  /* Keyboard */
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { next(); startAuto(); }
    if (e.key === 'ArrowRight') { prev(); startAuto(); }
  });

  /* Pause on hover */
  carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
  carousel.addEventListener('mouseleave', startAuto);

  /* Resize */
  window.addEventListener('resize', updateLayout);

  updateLayout();
  startAuto();
})();
