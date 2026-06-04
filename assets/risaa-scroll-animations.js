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
      const animType = el.dataset.anim;

      // Calculate progress of entrance
      const start = vh;
      const end = vh * 0.4; // Shifted completion threshold 15% later (from 0.55 to 0.40)

      let p = 0;
      if (rect.top < start) {
        p = (start - rect.top) / (start - end);
      }
      p = Math.max(0, Math.min(1, p)); // Clamp 0 to 1

      if (animType === 'roll-up') {
        const clipPercent = (1 - p) * 100;
        el.style.clipPath = `inset(${clipPercent.toFixed(2)}% 0 0 0)`;

        // Trigger bloom on children when background is fully rolled up
        const layout = el.querySelector('.risaa-reels-layout');
        if (layout) {
          if (p >= 1) {
            if (!layout._bloomTimer) {
              layout._bloomTimer = setTimeout(() => {
                layout.classList.add('is-bloomed');
                layout._bloomTimer = null;
              }, 500);
            }
          } else {
            if (layout._bloomTimer) {
              clearTimeout(layout._bloomTimer);
              layout._bloomTimer = null;
            }
            layout.classList.remove('is-bloomed');
          }
        }
      } else {
        // Default reveal-behind or scrub text
        const distance = el.classList.contains('risaa-scroll-slide-up') ? 46 : 80;
        const y = (1 - p) * distance;
        el.style.opacity = p.toFixed(3);
        el.style.transform = `translateY(${y.toFixed(2)}px)`;
      }
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
      if (el.dataset.anim === 'reveal-behind' || el.dataset.anim === 'roll-up') {
        addScrubElement(el);
      } else {
        singleObserver.observe(el);
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
