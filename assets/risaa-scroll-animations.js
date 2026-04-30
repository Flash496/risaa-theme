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
      singleObserver.observe(el);
    });

    root.querySelectorAll('[data-anim-stagger]').forEach((el) => {
      staggerObserver.observe(el);
    });
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
