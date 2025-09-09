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
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    const cards = document.querySelectorAll('.book-card');
    cards.forEach(function(card){
      card.addEventListener('click', function(e){
        if(e.target.tagName && e.target.tagName.toLowerCase() === 'a') return;
        card.classList.toggle('is-flipped');
      });
      card.addEventListener('keydown', function(e){
        if(e.key === 'Enter' || e.key === ' '){
          e.preventDefault();
          card.classList.toggle('is-flipped');
        } else if(e.key === 'Escape'){
          card.classList.remove('is-flipped');
        }
      });
      document.addEventListener('click', function(ev){
        if(!card.contains(ev.target)) card.classList.remove('is-flipped');
      }, true);
    });
    const section = document.querySelector('.books-section');
    if(section){
      const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if(en.isIntersecting) section.classList.add('is-visible');
        });
      },{threshold:0.12});
      observer.observe(section);
    }
  });
})();
