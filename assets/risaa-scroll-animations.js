/**
 * RiSaa Scroll Animations
 * Lightweight IntersectionObserver-based scroll animation engine.
 * Handles: [data-anim], [data-anim-stagger], [data-anim-delay]
 * GPU-accelerated via CSS transforms/opacity only.
 */

(function () {
  'use strict';

  if (typeof window === 'undefined') return;

  // Respect reduced motion at the JS level too
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Single element observer ──────────────────────────────────────
  const singleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const delay = el.dataset.animDelay || '0';
        if (prefersReduced) {
          el.classList.add('is-visible');
        } else {
          setTimeout(() => el.classList.add('is-visible'), parseFloat(delay) * 1000);
        }
        singleObserver.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -60px 0px', threshold: 0.08 },
  );

  // ── Stagger parent observer ──────────────────────────────────────
  const staggerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const parent = entry.target;
        const children = Array.from(parent.children);
        const baseDelay = parseFloat(parent.dataset.animDelay || '0');
        const step = parseFloat(parent.dataset.animStep || '0.1');

        if (prefersReduced) {
          parent.classList.add('is-visible');
          children.forEach((child) => {
            child.style.transitionDelay = '0s';
          });
        } else {
          children.forEach((child, i) => {
            child.style.transitionDelay = `${baseDelay + i * step}s`;
          });
          // Small rAF to ensure delays are applied before class fires
          requestAnimationFrame(() => {
            requestAnimationFrame(() => parent.classList.add('is-visible'));
          });
        }
        staggerObserver.unobserve(parent);
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

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init());
  } else {
    init();
  }

  // Shopify theme editor support — re-init on section load
  if (window.Shopify && Shopify.designMode) {
    document.addEventListener('shopify:section:load', (e) => init(e.target));
  }
})();
