/* ========================================================================
   Géraud Zoé — Portfolio
   script.js — toutes les interactions du site
   ======================================================================== */
 
document.addEventListener('DOMContentLoaded', () => {
 
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
  initTypewriter();
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initCounters();
  initBackToTop();
  if (!prefersReducedMotion) initParallax();
  initTestimonialSlider();
  initTiltCards();
 
  /* ======================================================================
     1) EFFET MACHINE À ÉCRIRE
     Texte : "Je suis Géraud KPOVIESSI, alias Géraud Zoé,
              développeur web et créateur digital."
     Les noms s'affichent en bleu, le reste en noir, avec un curseur
     clignotant en continu (géré en CSS via .tw-cursor).
     ==================================================================== */
  function initTypewriter() {
    const wrapper = document.getElementById('typewriter');
    const target = wrapper ? wrapper.querySelector('.tw-text') : null;
    if (!target) return;
 
    // Segments du texte : { text, isName }
    // isName = true -> span.tw-name (bleu) / false -> span.tw-plain (noir)
    const segments = [
      { text: 'Je suis ', isName: false },
      { text: 'Géraud KPOVIESSI', isName: true },
      { text: ', alias ', isName: false },
      { text: 'Géraud Zoé', isName: true },
      { text: ', développeur web et créateur digital.', isName: false }
    ];
 
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    if (prefersReduced) {
      // Pas d'animation : on affiche directement le texte complet
      segments.forEach(seg => target.appendChild(buildSpan(seg)));
      return;
    }
 
    const TYPE_SPEED = 38;   // ms entre chaque caractère
    const START_DELAY = 400; // petit délai avant de démarrer
 
    let segIndex = 0;
    let charIndex = 0;
    let currentSpan = null;
 
    function buildSpan(seg) {
      const span = document.createElement('span');
      span.className = seg.isName ? 'tw-name' : 'tw-plain';
      span.textContent = seg.text;
      return span;
    }
 
    function typeNextChar() {
      if (segIndex >= segments.length) return; // terminé
 
      const seg = segments[segIndex];
 
      if (charIndex === 0) {
        currentSpan = document.createElement('span');
        currentSpan.className = seg.isName ? 'tw-name' : 'tw-plain';
        target.appendChild(currentSpan);
      }
 
      currentSpan.textContent += seg.text.charAt(charIndex);
      charIndex++;
 
      if (charIndex >= seg.text.length) {
        segIndex++;
        charIndex = 0;
      }
 
      setTimeout(typeNextChar, TYPE_SPEED);
    }
 
    setTimeout(typeNextChar, START_DELAY);
  }
 
  /* ======================================================================
     2) NAVBAR DYNAMIQUE
     Ajout d'une classe "scrolled" (fond + ombre) dès que l'on défile,
     et masque légèrement la navbar quand on descend rapidement,
     la réaffiche quand on remonte.
     ==================================================================== */
  function initNavbar() {
    const header = document.getElementById('header');
    if (!header) return;
 
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 60;
 
    function onScroll() {
      const currentScrollY = window.scrollY;
 
      header.classList.toggle('scrolled', currentScrollY > 20);
 
      if (currentScrollY > SCROLL_THRESHOLD) {
        if (currentScrollY > lastScrollY) {
          // on descend -> on cache
          header.classList.add('nav-hidden');
        } else {
          // on remonte -> on affiche
          header.classList.remove('nav-hidden');
        }
      } else {
        header.classList.remove('nav-hidden');
      }
 
      lastScrollY = currentScrollY;
      ticking = false;
    }
 
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
  }
 
  /* ======================================================================
     3) MENU MOBILE AMÉLIORÉ
     ==================================================================== */
  function initMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');
    if (!toggle || !navLinks) return;
 
    function closeMenu() {
      navLinks.classList.remove('active');
      toggle.classList.remove('active');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    }
 
    function openMenu() {
      navLinks.classList.add('active');
      toggle.classList.add('active');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
    }
 
    toggle.setAttribute('aria-expanded', 'false');
 
    toggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('active');
      isOpen ? closeMenu() : openMenu();
    });
 
    // Ferme le menu quand on clique sur un lien
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
 
    // Ferme le menu si on clique en dehors
    document.addEventListener('click', (e) => {
      const isClickInside = navLinks.contains(e.target) || toggle.contains(e.target);
      if (!isClickInside && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });
 
    // Ferme le menu avec la touche Echap
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('active')) {
        closeMenu();
      }
    });
 
    // Ferme le menu si on repasse en desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }
 
  /* ======================================================================
     4) ANIMATIONS AU SCROLL (IntersectionObserver)
     Toute balise portant la classe .reveal apparaît en fondu/translation
     dès qu'elle entre dans le viewport. Optimisé : on arrête d'observer
     un élément une fois révélé (pas de calcul inutile en continu).
     ==================================================================== */
  function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;
 
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    if (prefersReduced) {
      revealEls.forEach(el => el.classList.add('in-view'));
      return;
    }
 
    // Léger décalage entre éléments proches (effet cascade) par section
    const groups = new Map();
 
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const parent = el.closest('section') || document.body;
 
          if (!groups.has(parent)) groups.set(parent, 0);
          const order = groups.get(parent);
          groups.set(parent, order + 1);
 
          el.style.transitionDelay = `${Math.min(order * 70, 420)}ms`;
          el.classList.add('in-view');
          obs.unobserve(el);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });
 
    revealEls.forEach(el => observer.observe(el));
  }
 
  /* ======================================================================
     5) COMPTEUR ANIMÉ
     Animation des <span class="counter" data-target="150">0</span>
     uniquement quand ils deviennent visibles.
     ==================================================================== */
  function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
 
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    function animateCounter(el) {
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
 
      if (prefersReduced) {
        el.textContent = target;
        return;
      }
 
      const duration = 1600;
      const startTime = performance.now();
 
      function easeOutQuint(t) {
        return 1 - Math.pow(1 - t, 5);
      }
 
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuint(progress);
        const value = Math.round(eased * target);
        el.textContent = value;
 
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.textContent = target;
        }
      }
 
      requestAnimationFrame(step);
    }
 
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
 
    counters.forEach(counter => observer.observe(counter));
  }
 
  /* ======================================================================
     6) BOUTON RETOUR EN HAUT
     ==================================================================== */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
 
    function toggleVisibility() {
      btn.classList.toggle('visible', window.scrollY > 420);
    }
 
    window.addEventListener('scroll', toggleVisibility, { passive: true });
    toggleVisibility();
 
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
 
  /* ======================================================================
     7) PARALLAXE LÉGÈRE DU HERO
     Les blobs et la photo bougent très légèrement au scroll et au
     mouvement de la souris. Désactivé si prefers-reduced-motion,
     et suspendu dès que le Hero sort de l'écran (perf).
     ==================================================================== */
  function initParallax() {
    const hero = document.getElementById('accueil');
    if (!hero) return;
 
    const photo = hero.querySelector('.parallax-img');
    const blobs = hero.querySelectorAll('.blob');
    let heroVisible = true;
    let ticking = false;
    let mouseX = 0, mouseY = 0;
 
    const heroObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { heroVisible = entry.isIntersecting; });
    }, { threshold: 0 });
    heroObserver.observe(hero);
 
    function applyParallax() {
      if (!heroVisible) { ticking = false; return; }
 
      const scrollY = window.scrollY;
      const scrollOffset = Math.min(scrollY * 0.12, 40);
 
      if (photo) {
        photo.style.transform =
          `translate3d(${mouseX * 10}px, ${scrollOffset + mouseY * 10}px, 0)`;
      }
 
      blobs.forEach((blob, i) => {
        const depth = (i + 1) * 6;
        blob.style.transform =
          `translate3d(${mouseX * depth}px, ${scrollOffset * (0.4 + i * 0.2) + mouseY * depth}px, 0)`;
      });
 
      ticking = false;
    }
 
    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(applyParallax);
        ticking = true;
      }
    }
 
    window.addEventListener('scroll', requestTick, { passive: true });
 
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;  // -1 à 1
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;  // -1 à 1
      requestTick();
    });
 
    hero.addEventListener('mouseleave', () => {
      mouseX = 0;
      mouseY = 0;
      requestTick();
    });
  }
 
  /* ======================================================================
     8) MICRO-INTERACTIONS CARTES (tilt léger au survol)
     S'applique aux .card, .process-card, .stat-card et .why-item.
     ==================================================================== */
  function initTiltCards() {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
 
    const tiltEls = document.querySelectorAll('.card, .stat-card');
 
    tiltEls.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = `perspective(700px) rotateX(${y * -6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
      });
 
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }
 
  /* ======================================================================
     9) SLIDER TÉMOIGNAGES
     Un témoignage visible à la fois, flèches, points de navigation,
     défilement tactile (swipe), pause au survol si autoplay actif.
     ==================================================================== */
  function initTestimonialSlider() {
    const track = document.getElementById('testimonialTrack');
    const viewport = track ? track.closest('.testimonial-viewport') : null;
    const dotsWrap = document.getElementById('testimonialDots');
    const prevBtn = document.getElementById('tPrev');
    const nextBtn = document.getElementById('tNext');
 
    if (!track || !viewport) return;
 
    const cards = Array.from(track.children);
    if (!cards.length) return;
 
    let currentIndex = 0;
    let autoplayTimer = null;
    const AUTOPLAY_DELAY = 6000;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    // Génère les points
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      cards.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'dot';
        dot.setAttribute('aria-label', `Aller au témoignage ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      });
    }
    const dots = dotsWrap ? Array.from(dotsWrap.children) : [];
 
    function update() {
      track.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
    }
 
    function goTo(index) {
      currentIndex = (index + cards.length) % cards.length;
      update();
      resetAutoplay();
    }
 
    function next() { goTo(currentIndex + 1); }
    function prev() { goTo(currentIndex - 1); }
 
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (prevBtn) prevBtn.addEventListener('click', prev);
 
    // Swipe tactile
    let touchStartX = 0;
    viewport.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
 
    viewport.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        diff > 0 ? next() : prev();
      }
    }, { passive: true });
 
    // Autoplay, en pause au survol, désactivé si mouvement réduit demandé
    function startAutoplay() {
      if (prefersReduced) return;
      autoplayTimer = setInterval(next, AUTOPLAY_DELAY);
    }
    function stopAutoplay() {
      clearInterval(autoplayTimer);
    }
    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }
 
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', startAutoplay);
 
    // Ne joue que lorsque le slider est visible à l'écran (perf)
    const sliderObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        entry.isIntersecting ? startAutoplay() : stopAutoplay();
      });
    }, { threshold: 0.3 });
    sliderObserver.observe(viewport);
 
    update();
  }
 
});