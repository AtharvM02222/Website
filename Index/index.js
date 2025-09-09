(function(){
  'use strict';
  const BIRTH = new Date(2011,5,8,0,0,0);
  function updateBirthdayCountdown(){
    const el = document.getElementById('birthday-countdown') || document.getElementById('birthday-count') || document.querySelector('.birthday-countdown');
    if(!el) return;
    const now = new Date();
    let next = new Date(now.getFullYear(), BIRTH.getMonth(), BIRTH.getDate(), BIRTH.getHours(), BIRTH.getMinutes(), BIRTH.getSeconds());
    if(next <= now) next.setFullYear(next.getFullYear() + 1);
    let diff = next - now;
    if(diff <= 0){
      el.textContent = "🎉 It's your birthday! 🎂";
      return;
    }
    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000);
    diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);
    el.textContent = days + "d " + hours + "h " + minutes + "m " + seconds + "s";
  }
  updateBirthdayCountdown();
  setInterval(updateBirthdayCountdown,1000);
  (function(){
    const btn = document.querySelector('.scroll-top-btn');
    if(!btn) return;
    function onScroll(){
      if(window.scrollY > 300){
        btn.classList.add('show');
        btn.classList.remove('hide');
      } else {
        btn.classList.add('hide');
        btn.classList.remove('show');
      }
    }
    window.addEventListener('scroll', onScroll, {passive:true});
    btn.addEventListener('click', function(e){
      e.preventDefault();
      window.scrollTo({top:0,behavior:'smooth'});
      setTimeout(function(){ btn.classList.add('hidden'); },700);
    });
  })();
  (function(){
    const els = document.querySelectorAll('.reveal-on-scroll');
    if(!els.length) return;
    const io = new IntersectionObserver(function(entries,obs){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },{threshold:0.12});
    els.forEach(function(el){ io.observe(el); });
  })();
  (function(){
    const header = document.querySelector('.header-content');
    if(!header) return;
    function onScroll(){
      if(window.scrollY > 80) header.classList.add('nav-compact'); else header.classList.remove('nav-compact');
    }
    window.addEventListener('scroll', onScroll, {passive:true});
  })();
  (function(){
    document.addEventListener('click', function(e){
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if(!a) return;
      const id = a.getAttribute('href').slice(1);
      if(!id) return;
      const target = document.getElementById(id);
      if(!target) return;
      e.preventDefault();
      target.scrollIntoView({behavior:'smooth',block:'start'});
      history.pushState(null,'',`#${id}`);
    });
  })();
  (function(){
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    function apply(){
      if(mq.matches){
        document.documentElement.style.scrollBehavior = 'auto';
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    }
    apply();
    if(mq.addEventListener) mq.addEventListener('change', apply);
  })();
  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('[data-audio-toggle]');
    if(!btn) return;
    const id = btn.getAttribute('data-audio-toggle');
    const audio = document.getElementById(id);
    if(!audio) return;
    if(audio.paused){
      audio.play().catch(function(){});
      btn.setAttribute('aria-pressed','true');
    } else {
      audio.pause();
      btn.setAttribute('aria-pressed','false');
    }
  });
  (function(){
    if(!document.body.classList.contains('js-bg')) return;
    const colors = ['#000000','#001133','#002b80','#0b3dff','#000033'];
    let current = 0;
    const body = document.body;
    body.style.transition = 'background 6s linear';
    body.style.background = 'linear-gradient(135deg, ' + colors[0] + ', ' + colors[1] + ')';
    setInterval(function(){
      current = (current + 1) % colors.length;
      const next = (current + 1) % colors.length;
      body.style.background = 'linear-gradient(135deg, ' + colors[current] + ', ' + colors[next] + ')';
    },4000);
  })();
})();
// BOOKS 3D interaction (hover/tap/keyboard + mouse parallax)
(function(){
  'use strict';

  // Config
  const TILT_STRENGTH = 12; // degrees max tilt on mouse move (reduce for subtle)
  const ELEVATE_CLASS = 'is-flipped';
  const FLIPPING_CLASS = 'flipping';

  // Helpers
  function getRectCenter(rect){
    return { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
  }

  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  // Find all book cards
  const bookCards = document.querySelectorAll('.book-card');

  bookCards.forEach(card => {
    const book3d = card.querySelector('.book-3d');
    if(!book3d) return;

    // Toggle flip (click / tap)
    card.addEventListener('click', function(e){
      if(e.target.closest && e.target.closest('a')) return;
      card.classList.toggle(ELEVATE_CLASS);
      // add temporary class to ensure z-index during transition
      book3d.classList.add(FLIPPING_CLASS);
      setTimeout(()=> book3d.classList.remove(FLIPPING_CLASS), 900);
    });

    // keyboard support
    card.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){
        e.preventDefault();
        card.classList.toggle(ELEVATE_CLASS);
        book3d.classList.add(FLIPPING_CLASS);
        setTimeout(()=> book3d.classList.remove(FLIPPING_CLASS), 900);
      } else if(e.key === 'Escape'){
        card.classList.remove(ELEVATE_CLASS);
      }
    });

    // Close book when clicking outside (use capture to ensure early)
    document.addEventListener('click', function(ev){
      if(!card.contains(ev.target)) {
        card.classList.remove(ELEVATE_CLASS);
      }
    }, true);

    // Mouse tilt effect: subtle parallax on surfaces, disabled on touch devices
    let supportsTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if(!supportsTouch && window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      card.addEventListener('mousemove', function(e){
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = (e.clientX - cx) / (rect.width/2); // -1 .. 1
        const dy = (e.clientY - cy) / (rect.height/2);
        const rx = clamp(-dy * TILT_STRENGTH, -TILT_STRENGTH, TILT_STRENGTH);
        const ry = clamp(dx * TILT_STRENGTH, -TILT_STRENGTH, TILT_STRENGTH);
        // apply tilt on the 3d element (only visual)
        book3d.style.transform = `rotateX(${rx}deg) rotateY(${ry - 6}deg)`; // keep base -6deg for shelf look
        // tiny parallax on cover images
        const front = card.querySelector('.cover-front');
        const back = card.querySelector('.cover-back');
        if(front) front.style.transform = `translateZ(16px) translateX(${clamp(dx*6,-12,12)}px) translateY(${clamp(dy*6,-12,12)}px)`;
        if(back) back.style.transform = `translateZ(10px) translateX(${clamp(dx*4,-8,8)}px) translateY(${clamp(dy*4,-8,8)}px)`;
        // pages slight shift
        const pages = card.querySelector('.book-pages');
        if(pages) pages.style.transform = `translateX(${clamp(dx*6,-12,12)}px) translateZ(-2px)`;
      });

      card.addEventListener('mouseleave', function(){
        // reset transforms
        book3d.style.transform = '';
        const front = card.querySelector('.cover-front');
        const back = card.querySelector('.cover-back');
        if(front) front.style.transform = '';
        if(back) back.style.transform = '';
        const pages = card.querySelector('.book-pages');
        if(pages) pages.style.transform = '';
      });
    }

    // Ensure flipped card gets a high z-index during transition (prevents overlap)
    const observer = new MutationObserver(function(mutations){
      mutations.forEach(m => {
        if(m.attributeName === 'class'){
          if(card.classList.contains(ELEVATE_CLASS)){
            card.style.zIndex = 1200;
          } else {
            // delay resetting z-index to allow transition to finish
            setTimeout(()=> { if(!card.classList.contains(ELEVATE_CLASS)) card.style.zIndex = ''; }, 900);
          }
        }
      });
    });
    observer.observe(card, { attributes: true });
  });
})();
