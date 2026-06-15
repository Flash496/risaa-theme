const SCROLL_ANIMATION_TRIGGER_CLASSNAME = 'scroll-trigger';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute('data-cascade'))
          elementTarget.setAttribute('style', `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const animationTriggerElements = Array.from(rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME));
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic (layout cached & optimized)
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animationTriggerElements = Array.from(document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME));

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    let cachedPositionY = 0;
    let cachedHeight = 0;

    function updateCachedLayout() {
      const scrollY = window.scrollY || window.pageYOffset;
      cachedPositionY = element.getBoundingClientRect().top + scrollY;
      cachedHeight = element.offsetHeight;
    }

    const observer = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
        if (elementIsVisible) {
          updateCachedLayout();
          element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeenCached());
        }
      });
    });
    observer.observe(element);

    function percentageSeenCached() {
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;

      if (cachedPositionY > scrollY + viewportHeight) {
        return 0;
      } else if (cachedPositionY + cachedHeight < scrollY) {
        return 100;
      }

      const distance = scrollY + viewportHeight - cachedPositionY;
      let percentage = distance / ((viewportHeight + cachedHeight) / 100);
      return Math.round(percentage);
    }

    updateCachedLayout();
    element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeenCached());

    window.addEventListener(
      'scroll',
      throttle(() => {
        if (!elementIsVisible) return;
        element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeenCached());
      }, 16),
      { passive: true }
    );

    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      updateCachedLayout();
    });
  });
}

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => initializeScrollAnimationTrigger(event.target, true));
  document.addEventListener('shopify:section:reorder', () => initializeScrollAnimationTrigger(document, true));
}
