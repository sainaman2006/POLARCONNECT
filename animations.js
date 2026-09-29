/* POLAR CONNECT — shared interaction layer.
   Scroll reveals, nav behaviour, counters and a small hand-built icon set
   that replaces emoji so the chrome reads as designed rather than templated. */
(function(){
  "use strict";

  var ICONS = {
    cloud:     '<path d="M7 18a4 4 0 0 1-.6-8A5.5 5.5 0 0 1 17 8.6 4.7 4.7 0 0 1 17.5 18H7Z" stroke-linejoin="round"/>',
    eye:       '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    wave:      '<path d="M2 16c1.6 0 2.4-1.4 4-1.4s2.4 1.4 4 1.4 2.4-1.4 4-1.4 2.4 1.4 4 1.4 2.4-1.4 4-1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11c1.6 0 2.4-1.4 4-1.4s2.4 1.4 4 1.4 2.4-1.4 4-1.4 2.4 1.4 4 1.4 2.4-1.4 4-1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".45"/>',
    ice:       '<path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11" stroke-linecap="round"/><path d="M12 2l-2 2.4M12 2l2 2.4M12 22l-2-2.4M12 22l2-2.4M4.5 6.5l2.9-.7M4.5 6.5l1 2.8M19.5 6.5l-2.9-.7M19.5 6.5l-1 2.8M4.5 17.5l2.9.7M4.5 17.5l1-2.8M19.5 17.5l-2.9.7M19.5 17.5l-1-2.8" stroke-linecap="round"/>',
    wind:      '<path d="M3 8h10.5a2.75 2.75 0 1 0-2.6-3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 13h14.5a2.75 2.75 0 1 1-2.6 3.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M3 18h8.5a2.25 2.25 0 1 0-2.1-3" stroke-linecap="round" stroke-linejoin="round"/>',
    paw:       '<circle cx="12" cy="15.2" r="4"/><circle cx="5.4" cy="10.4" r="2"/><circle cx="18.6" cy="10.4" r="2"/><circle cx="8.6" cy="6.4" r="1.9"/><circle cx="15.4" cy="6.4" r="1.9"/>',
    globe:     '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 4 5.8 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.8-4-9s1.4-6.4 4-9Z"/>',
    book:      '<path d="M4 5.2C4 4 5 3.4 6.2 3.6 8 3.9 10 4.6 12 6c2-1.4 4-2.1 5.8-2.4C19 3.4 20 4 20 5.2V18c0 1-1 1.5-2 1.3-1.8-.4-3.7-1-5.8-1a1 1 0 0 1-.4-.1c-2.1 0-4 .6-5.8 1-1 .2-2-.3-2-1.3V5.2Z"/><path d="M12 6v13"/>',
    spark:     '<path d="M12 3v4M12 17v4M4.2 12H2M22 12h-2.2M6.3 6.3 4.8 4.8M19.2 19.2l-1.5-1.5M6.3 17.7l-1.5 1.5M19.2 4.8l-1.5 1.5"/><circle cx="12" cy="12" r="3.4"/>',
    chat:      '<path d="M4 5.5h16a1 1 0 0 1 1 1V16a1 1 0 0 1-1 1H9l-4.6 3.4A.5.5 0 0 1 3.6 20V17h-.1a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z"/>',
    compass:   '<circle cx="12" cy="12" r="9"/><path d="m14.8 9.2-1.7 4.9-4.9 1.7 1.7-4.9 4.9-1.7Z" stroke-linejoin="round"/>',
    station:   '<path d="M12 21s7-6.1 7-11.6A7 7 0 0 0 5 9.4C5 14.9 12 21 12 21Z"/><circle cx="12" cy="9.4" r="2.4"/>',
    send:      '<path d="m4 12 16-8-6 16-3-6-7-2Z" stroke-linejoin="round"/>',
    check:     '<path d="M5 12.5 9.5 17 19 7" stroke-linecap="round" stroke-linejoin="round"/>',
    ship:      '<path d="M4 15h16l-2 4.5H6L4 15Z"/><path d="M6 15V6h6l4 5" /><path d="M12 6V3" />',
    thermo:    '<path d="M12 3.5a2 2 0 0 0-2 2v8.2a4 4 0 1 0 4 0V5.5a2 2 0 0 0-2-2Z"/><path d="M12 9v5"/>',
    people:    '<circle cx="8.5" cy="8" r="2.6"/><circle cx="16" cy="9.4" r="2.1"/><path d="M3 19c.6-3 2.8-4.6 5.5-4.6S13.4 16 14 19"/><path d="M14.6 14.8c2.2.2 3.8 1.7 4.4 4.2"/>',
    layers:    '<path d="m12 3 9 5-9 5-9-5 9-5Z" stroke-linejoin="round"/><path d="m3 13 9 5 9-5" stroke-linejoin="round"/>',
    igloo:     '<path d="M3 19a9 8 0 0 1 18 0" stroke-linecap="round"/><path d="M3 19h18" stroke-linecap="round"/><path d="M6.2 15.6a6 4.6 0 0 1 11.6 0" stroke-linecap="round"/><path d="M10 19v-4.6a2 2 0 0 1 4 0V19" stroke-linecap="round" stroke-linejoin="round"/>',
    logout:    '<path d="M15 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12h11m0 0-3.5-3.5M21 12l-3.5 3.5" stroke-linecap="round" stroke-linejoin="round"/>',
    lock:      '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke-linecap="round"/>',
    heart:     '<path d="M12 20s-7.5-4.6-7.5-10.1A4.2 4.2 0 0 1 12 7.4a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20Z" stroke-linejoin="round"/>',
    shield:    '<path d="M12 3 5 6v5.5c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3Z" stroke-linejoin="round"/><path d="m9 12 2.2 2.2L15.5 10" stroke-linecap="round" stroke-linejoin="round"/>'
  };

  function injectIcons(){
    document.querySelectorAll('[data-icon]').forEach(function(el){
      var name = el.getAttribute('data-icon');
      if(!ICONS[name] || el.querySelector('svg')) return;
      el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">'+ICONS[name]+'</svg>';
    });
  }

  /* ---- scroll progress bar ---- */
  function initProgress(){
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function update(){
      var h = document.documentElement;
      var scrolled = h.scrollTop;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (scrolled/max)*100 : 0) + '%';
    }
    document.addEventListener('scroll', update, {passive:true});
    update();
  }

  /* ---- sticky nav shrink ---- */
  function initNav(){
    var bar = document.querySelector('.topbar');
    if(!bar) return;
    function onScroll(){
      if(window.scrollY > 12) bar.classList.add('is-scrolled');
      else bar.classList.remove('is-scrolled');
    }
    document.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  /* ---- scroll reveal: tag likely content blocks, then observe ---- */
  function tagRevealTargets(){
    var groups = [
      {sel:'.cards > *, .research-grid > *, .scientist-grid > *, .media-grid > *', dir:'up'},
      {sel:'.timeline .event', dir:'left'},
      {sel:'.section > .container > .panel, .section > .container > .grid2 > *', dir:'up'},
      {sel:'.station-list .station-card', dir:'left'}
    ];
    groups.forEach(function(g){
      document.querySelectorAll(g.sel).forEach(function(el,i){
        if(el.hasAttribute('data-reveal')) return;
        el.setAttribute('data-reveal', g.dir === 'left' ? 'left' : (g.dir === 'right' ? 'right' : ''));
        el.style.transitionDelay = Math.min(i*70,420)+'ms';
      });
    });
  }

  function initReveal(){
    tagRevealTargets();
    var targets = document.querySelectorAll('[data-reveal]');
    if(!('IntersectionObserver' in window)){
      targets.forEach(function(el){ el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, {threshold:.15, rootMargin:'0px 0px -6% 0px'});
    targets.forEach(function(el){ io.observe(el); });
  }

  /* ---- animated counters for elements like <span data-count="42">0</span> ---- */
  function initCounters(){
    var els = document.querySelectorAll('[data-count]');
    if(!els.length) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(!entry.isIntersecting) return;
        io.unobserve(entry.target);
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var decimals = (el.getAttribute('data-count').split('.')[1]||'').length;
        var suffix = el.getAttribute('data-suffix')||'';
        var start = performance.now();
        var dur = 1100;
        function tick(now){
          var p = Math.min(1,(now-start)/dur);
          var eased = 1 - Math.pow(1-p,3);
          el.textContent = (target*eased).toFixed(decimals) + suffix;
          if(p<1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, {threshold:.5});
    els.forEach(function(el){ io.observe(el); });
  }

  /* ---- gentle hover tilt on module cards (responds to the pointer, not scroll) ---- */
  function initTilt(){
    var cards = document.querySelectorAll('a.metric, .hero-card');
    cards.forEach(function(card){
      card.addEventListener('mousemove', function(e){
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left)/r.width - .5;
        var y = (e.clientY - r.top)/r.height - .5;
        card.style.transform = 'translateY(-5px) rotateX('+(-y*4)+'deg) rotateY('+(x*4)+'deg)';
      });
      card.addEventListener('mouseleave', function(){ card.style.transform = ''; });
      card.style.transformStyle = 'preserve-3d';
    });
  }

  /* ---- shared toast, used by the profile menu and available to any page ---- */
  function showToast(msg){
    var el = document.getElementById('toast');
    if(!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 2600);
  }
  window.showToast = showToast;

  /* ---- profile / account menu, injected into the nav next to the PolarAI pill ---- */
  function initProfileMenu(){
    var nav = document.querySelector('.nav');
    if(!nav || document.getElementById('profileMenu')) return;
    var pill = nav.querySelector('.pill');
    var wrap = document.createElement('div');
    wrap.className = 'profile-menu';
    wrap.id = 'profileMenu';
    wrap.innerHTML =
      '<button class="profile-btn" id="profileBtn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Account menu">'+
        '<span class="profile-avatar">JS</span>'+
      '</button>'+
      '<div class="profile-dropdown" id="profileDropdown" role="menu">'+
        '<div class="profile-dropdown-head"><span class="profile-avatar">JS</span><div><b>Jordan Singh</b><div class="small">Student account</div></div></div>'+
        '<button type="button" class="profile-item" data-icon="people">My profile</button>'+
        '<button type="button" class="profile-item" data-icon="layers">Saved research</button>'+
        '<button type="button" class="profile-item logout" id="logoutBtn" data-icon="logout">Log out</button>'+
      '</div>';
    if(pill && pill.parentNode) pill.insertAdjacentElement('afterend', wrap);
    else nav.appendChild(wrap);
    injectIcons();

    var btn = document.getElementById('profileBtn');
    var dd  = document.getElementById('profileDropdown');
    function close(){ dd.classList.remove('open'); btn.setAttribute('aria-expanded','false'); }
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
    document.getElementById('logoutBtn').addEventListener('click', function(){
      close();
      showToast('You have been logged out.');
    });
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectIcons();
    initProfileMenu();
    initProgress();
    initNav();
    initReveal();
    initCounters();
    initTilt();
  });
})();
