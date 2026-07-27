(function () {
  var counters = Array.prototype.slice.call(document.querySelectorAll('.hero .stat-counter'));
  if (!counters.length) return;

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var statsSection = document.querySelector('.hero-stats-wrap');
  if (!statsSection) return;

  function toPersianDigits(value) {
    var persianDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return String(value).replace(/\d/g, function (digit) {
      return persianDigits[digit];
    });
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatCounterValue(number, suffix) {
    return toPersianDigits(number) + (suffix || '');
  }

  function animateCounter(counter) {
    var target = parseInt(counter.dataset.target, 10);
    if (isNaN(target) || target < 0) target = 0;
    var suffix = counter.dataset.suffix || '';
    var duration = 4000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(progress);
      var current = Math.round(target * eased);
      counter.textContent = formatCounterValue(current, suffix);
      if (elapsed < duration) {
        requestAnimationFrame(step);
      } else {
        counter.textContent = formatCounterValue(target, suffix);
      }
    }

    requestAnimationFrame(step);
  }

  function startCounters() {
    counters.forEach(function (counter) {
      var target = parseInt(counter.dataset.target, 10);
      if (isNaN(target) || target < 0) target = 0;
      counter.textContent = formatCounterValue(0, counter.dataset.suffix || '');
      animateCounter(counter);
    });
  }

  function handleIntersection(entries, observer) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        observer.disconnect();
        if (reducedMotion) {
          counters.forEach(function (counter) {
            var target = parseInt(counter.dataset.target, 10);
            if (isNaN(target) || target < 0) target = 0;
            counter.textContent = formatCounterValue(target, counter.dataset.suffix || '');
          });
        } else {
          startCounters();
        }
      }
    });
  }

  if (reducedMotion || !window.IntersectionObserver) {
    counters.forEach(function (counter) {
      var target = parseInt(counter.dataset.target, 10);
      if (isNaN(target) || target < 0) target = 0;
      counter.textContent = formatCounterValue(target, counter.dataset.suffix || '');
    });
    return;
  }

  var observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.2,
  });

  observer.observe(statsSection);
})();
