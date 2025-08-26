/* ========================
   index.js — merged & upgraded
   Birthdate corrected: 08 June 2011 (local time)
   - Keeps birthday/time-alive features
   - Adds reveal-on-scroll, header shrink, scroll-top, smooth anchors
   - Optional JS gradient bg if body has class "js-bg"
   - Safe (checks for elements before using them)
   ======================== */
(function () {
  'use strict';

  /***********************
   *  CONFIG / BIRTHDAY  *
   ***********************/
  // NOTE: months are 0-indexed in JS Date: 5 = June
  const BIRTH = new Date(2011, 5, 8, 0, 0, 0); // 2011-06-08 local time

  /*****************************
   *  Time-alive (age) display *
   *  Element IDs detected:
   *   - #time-alive  (preferred)
   *   - #timeAlive   (fallback)
   *   - [data-birthtime] (alternate)
   *****************************/
  function updateTimeAlive() {
    const el =
      document.getElementById('time-alive') ||
      document.getElementById('timeAlive') ||
      document.querySelector('[data-birthtime]');

    if (!el) return;

    const now = new Date();

    // compute whole years accurately
    let years = now.getFullYear() - BIRTH.getFullYear();
    const hadBirthdayThisYear =
      now.getMonth() > BIRTH.getMonth() ||
      (now.getMonth() === BIRTH.getMonth() && now.getDate() >= BIRTH.getDate());
    if (!hadBirthdayThisYear) years--;

    // find last birthday date/time
    const lastBirthday = new Date(
      hadBirthdayThisYear ? now.getFullYear() : now.getFullYear() - 1,
      BIRTH.getMonth(),
      BIRTH.getDate(),
      BIRTH.getHours(),
      BIRTH.getMinutes(),
      BIRTH.getSeconds()
    );

    let diff = now - lastBirthday; // ms since last birthday

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);

    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);

    const seconds = Math.floor(diff / 1000);

    // Render: keep markup small and safe (you can style with CSS)
    el.innerHTML = `
      <div class="time-alive-wrap" aria-live="polite" style="display:flex;gap:1rem;align-items:baseline;flex-wrap:wrap;">
        <div><strong style="font-size:1.5rem">${years}</strong> <div class="label">yrs</div></div>
        <div><strong>${days}</strong> <div class="label">days</div></div>
        <div><strong>${hours}</strong> <div class="label">hrs</div></div>
        <div><strong>${minutes}</strong> <div class="label">min</div></div>
        <div><strong>${seconds}</strong> <div class="label">sec</div></div>
      </div>
    `;
  }

  // start updating time-alive if element exists
  updateTimeAlive();
  setInterval(updateTimeAlive, 1000);

  /******************************
   *  Countdown to next birthday
   *  Element IDs detected:
   *   - #birthday-countdown
   *   - #birthday-count
   *   - .birthday-countdown (fallback)
   ******************************/
  function updateBirthdayCountdown() {
    const el =
      document.getElementById('birthday-countdown') ||
      document.getElementById('birthday-count') ||
      document.querySelector('.birthday-countdown');

    if (!el) return;

    const now = new Date();
    let next = new Date(now.getFullYear(), BIRTH.getMonth(), BIRTH.getDate(), BIRTH.getHours(), BIRTH.getMinutes(), BIRTH.getSeconds());
    if (next <= now) next.setFullYear(next.getFullYear() + 1);

    let diff = next - now;
    if (diff <= 0) {
      el.textContent = '🎉 Happy Birthday Atharv! 🎉';
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * (1000 * 60 * 60 * 24);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * (1000 * 60 * 60);
    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * (1000 * 60);
    const seconds = Math.floor(diff / 1000);

    el.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  updateBirthdayCountdown();
  setInterval(updateBirthdayCountdown, 1000);

  /*****************************
   *  Scroll-to-top button
   *  expects .scroll-top-btn element (your existing CSS handles visuals)
   *****************************/
  (function setupScrollTopBtn() {
    const btn = document.querySelector('.scroll-top-btn');
    if (!btn) return;

    function onScroll() {
      if (window.scrollY > 300) {
        btn.classList.add('show');
        btn.classList.remove('hide');
      } else {
        btn.classList.add('hide');
        btn.classList.remove('show');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // optional: hide after click briefly
      setTimeout(() => btn.classList.add('hidden'), 700);
    });
  })();

  /*****************************
   *  Reveal-on-scroll (IntersectionObserver)
   *  elements with class .reveal-on-scroll
   *****************************/
  (function setupRevealOnScroll() {
    const els = document.querySelectorAll('.reveal-on-scroll');
    if (!els.length) return;

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => io.observe(el));
  })();

  /*****************************
   *  Header compact on scroll
   *  toggles .nav-compact on .header-content
   *****************************/
  (function setupHeaderCompact() {
    const header = document.querySelector('.header-content');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 80) header.classList.add('nav-compact');
      else header.classList.remove('nav-compact');
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  })();

  /*****************************
   *  Smooth internal anchors fallback
   *  (click any <a href="#...">)
   *****************************/
  (function setupSmoothAnchors() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
    });
  })();

  /*****************************
   *  Reduced-motion handling
   *****************************/
  (function setupReducedMotion() {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function apply() {
      if (mq.matches) {
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
  })();

  /*****************************
   *  Audio toggle helper
   *  - add attribute: data-audio-toggle="bg-audio" on a button to toggle <audio id="bg-audio">
   *****************************/
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-audio-toggle]');
    if (!btn) return;
    const id = btn.getAttribute('data-audio-toggle');
    const audio = document.getElementById(id);
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => { /* ignore autoplay restrictions */ });
      btn.setAttribute('aria-pressed', 'true');
    } else {
      audio.pause();
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  /*****************************
   *  Optional: JS gradient background (only if body has class "js-bg")
   *  If you already implemented CSS pseudo-element waves in style.css,
   *  DON'T add class "js-bg" to the <body> — leave CSS to handle it.
   *****************************/
  (function setupOptionalJSBackground() {
    if (!document.body.classList.contains('js-bg')) return;

    const colors = ['#000000', '#001133', '#002b80', '#0b3dff', '#000033'];
    let current = 0;
    const body = document.body;

    // initialize
    body.style.transition = 'background 6s linear';
    body.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;

    setInterval(() => {
      current = (current + 1) % colors.length;
      const next = (current + 1) % colors.length;
      body.style.background = `linear-gradient(135deg, ${colors[current]}, ${colors[next]})`;
    }, 4000);
  })();

  /*****************************
   *  End of script
   *****************************/
})(); // IIFE
