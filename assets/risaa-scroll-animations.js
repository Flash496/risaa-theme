/**
 * RiSaa Scroll Animations — Reversible
 * Animations trigger on enter AND reverse on leave.
 * Handles: [data-anim], [data-anim-stagger], [data-anim-delay]
 * GPU-accelerated via CSS transforms/opacity only.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Scroll-driven (Scrubbed) animations for reveal-behind ─────────
  const scrubElements = [];
  const headingScrubTexts = new Set([
    'summer favourites',
    'new in',
    "designer's choice",
    'ready to ship',
    'in motion',
    'beauties of risaa',
  ]);

  function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function addScrubElement(el) {
    if (!scrubElements.includes(el)) {
      el.classList.add('risaa-scroll-slide-up');
      scrubElements.push(el);
    }
  }

  function updateScrub() {
    const vh = window.innerHeight;
    scrubElements.forEach((el) => {
      if (prefersReduced) {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        return;
      }

      const rect = el.getBoundingClientRect();
      
      // Calculate progress of entrance
      // Starts when element top enters bottom of viewport (rect.top = vh)
      // Ends when element top is at 55% of viewport height (rect.top = vh * 0.55)
      const start = vh;
      const end = vh * 0.55; 
      
      let p = 0;
      if (rect.top < start) {
        p = (start - rect.top) / (start - end);
      }
      p = Math.max(0, Math.min(1, p)); // Clamp 0 to 1

      // Apply opacity and translation
      const distance = el.classList.contains('risaa-scroll-slide-up') ? 46 : 80;
      const y = (1 - p) * distance;
      el.style.opacity = p.toFixed(3);
      el.style.transform = `translateY(${y.toFixed(2)}px)`;
    });
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrub();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // ── Single element observer ──────────────────────────────────────
  const singleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;

        if (prefersReduced) {
          el.classList.add('is-visible');
          return;
        }

        if (entry.isIntersecting) {
          const delay = el.dataset.animDelay || '0';
          // Clear any pending hide timeout
          if (el._animHideTimer) {
            clearTimeout(el._animHideTimer);
            el._animHideTimer = null;
          }
          setTimeout(() => el.classList.add('is-visible'), parseFloat(delay) * 1000);
        } else {
          // Reverse: remove visible so element animates back to hidden state
          el.classList.remove('is-visible');
        }
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.08 },
  );

  // ── Stagger parent observer ──────────────────────────────────────
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const parent = entry.target;
        const children = Array.from(parent.children);
        const baseDelay = parseFloat(parent.dataset.animDelay || '0');
        const step = parseFloat(parent.dataset.animStep || '0.1');

        if (prefersReduced) {
          parent.classList.add('is-visible');
          children.forEach((child) => (child.style.transitionDelay = '0s'));
          return;
        }

        if (entry.isIntersecting) {
          // Animate in — stagger forward
          children.forEach((child, i) => {
            child.style.transitionDelay = `${baseDelay + i * step}s`;
          });
          requestAnimationFrame(() => {
            requestAnimationFrame(() => parent.classList.add('is-visible'));
          });
        } else {
          // Reverse — remove stagger delays so exit is clean and simultaneous
          children.forEach((child) => {
            child.style.transitionDelay = '0s';
          });
          parent.classList.remove('is-visible');
        }
      });
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.06 },
  );

  // ── Init ─────────────────────────────────────────────────────────
  function init(root) {
    root = root || document;

    root.querySelectorAll('[data-anim]').forEach((el) => {
      if (el.dataset.anim === 'reveal-behind') {
        addScrubElement(el);
      } else {
        singleObserver.observe(el);
      }
    });

    root.querySelectorAll('h1, h2, .risaa-reviews__aggregate').forEach((el) => {
      const text = normalizeText(el.textContent);
      const isTargetHeading = headingScrubTexts.has(text);
      const isReviewsAggregate =
        el.classList.contains('risaa-reviews__aggregate') &&
        text.includes('4.9') &&
        text.includes('200+ happy clients');

      if (isTargetHeading || isReviewsAggregate) {
        addScrubElement(el);
      }
    });

    root.querySelectorAll('[data-anim-stagger]').forEach((el) => {
      staggerObserver.observe(el);
    });

    updateScrub();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  // Shopify theme editor support
  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', (e) => init(e.target));
  }
})();
