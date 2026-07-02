if (!customElements.get('product-modal')) {
  customElements.define(
    'product-modal',
    class ProductModal extends ModalDialog {
      constructor() {
        super();
      }

      connectedCallback() {
        if (super.connectedCallback) super.connectedCallback();
        if (this.initialized) return;
        this.initialized = true;
        
        // Setup thumbnails switching
        this.querySelectorAll('.product-media-modal__thumbnail').forEach(thumb => {
          thumb.addEventListener('click', () => {
            const mediaId = thumb.getAttribute('data-target-media-id');
            this.switchActiveMedia(mediaId);
          });
        });

        // Setup Prev/Next switching
        const prevBtn = this.querySelector('.product-media-modal__nav--prev');
        const nextBtn = this.querySelector('.product-media-modal__nav--next');
        if (prevBtn) prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateMedia(-1);
        });
        if (nextBtn) nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.navigateMedia(1);
        });

        // Prevent pointerup from closing the modal when clicking navigation or sidebar/thumbnails
        this.querySelectorAll('.product-media-modal__sidebar, .product-media-modal__nav, .product-media-modal__thumbnail, .product-media-modal__toggle').forEach(el => {
          el.addEventListener('pointerup', (e) => {
            e.stopPropagation();
          });
        });

        // Setup Keyboard Navigation (Left and Right Arrow keys)
        window.addEventListener('keydown', (e) => {
          if (!this.hasAttribute('open')) return;
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            this.navigateMedia(-1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            this.navigateMedia(1);
          }
        });
      }

      hide() {
        super.hide();
      }

      show(opener) {
        super.show(opener);
        this.showActiveMedia();
      }

      showActiveMedia() {
        if (this.openedBy) {
          const mediaId = this.openedBy.getAttribute('data-media-id');
          this.switchActiveMedia(mediaId);
        }
      }

      switchActiveMedia(mediaId) {
        window.pauseAllMedia();
        
        // Hide all elements inside product-media-modal__content
        const contentContainer = this.querySelector('.product-media-modal__content');
        if (contentContainer) {
          Array.from(contentContainer.children).forEach(el => {
            el.classList.remove('active');
            // Check if this child or any descendant matches the target mediaId
            const matchesId = el.getAttribute('data-media-id') == mediaId || 
                              el.querySelector(`[data-media-id="${mediaId}"]`);
            if (matchesId) {
              el.classList.add('active');
              // Auto-play video inside target container if loaded
              const video = el.querySelector('video');
              if (video) {
                video.play().catch(() => {});
              }
            }
          });
        }

        // Search for specific active deferred-media or product-model target to load
        const targetMedia = this.querySelector(`.product-media-modal__content [data-media-id="${mediaId}"]`);

        // Update active class on thumbnails
        this.querySelectorAll('.product-media-modal__thumbnail').forEach(thumb => {
          if (thumb.getAttribute('data-target-media-id') == mediaId) {
            thumb.classList.add('active');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          } else {
            thumb.classList.remove('active');
          }
        });

        if (targetMedia) {
          if (targetMedia.nodeName == 'DEFERRED-MEDIA') {
            targetMedia.loadContent();
          }
        }
      }

      navigateMedia(direction) {
        const thumbs = Array.from(this.querySelectorAll('.product-media-modal__thumbnail'));
        if (thumbs.length === 0) return;
        const activeIdx = thumbs.findIndex(thumb => thumb.classList.contains('active'));
        if (activeIdx === -1) return;
        
        let newIdx = activeIdx + direction;
        if (newIdx < 0) newIdx = thumbs.length - 1;
        if (newIdx >= thumbs.length) newIdx = 0;
        
        const nextMediaId = thumbs[newIdx].getAttribute('data-target-media-id');
        this.switchActiveMedia(nextMediaId);
      }
    }
  );
}

// Global script helpers for Hover-to-Play, Premium Controls, and Sound Toggle
(function() {
  // Inject custom sound toggle styles and native volume hiding stylesheet rules
  const style = document.createElement('style');
  style.innerHTML = `
    deferred-media,
    .deferred-media,
    .product-media-modal__content,
    .product-media-container {
      position: relative !important;
    }
    .custom-video-sound-toggle {
      position: absolute !important;
      top: 15px !important;
      left: auto !important;
      right: 15px !important;
      z-index: 99 !important;
      background: #ffffff !important;
      border: 1px solid #000000 !important;
      width: 36px !important;
      height: 36px !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      cursor: pointer !important;
      color: #000000 !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
      transition: all 0.2s ease !important;
      padding: 0 !important;
      margin: 0 !important;
      line-height: 1 !important;
    }
    .custom-video-sound-toggle:hover {
      background: #000000 !important;
      color: #ffffff !important;
      border-color: #000000 !important;
      transform: scale(1.05) !important;
    }
    .custom-video-sound-toggle svg {
      width: 16px !important;
      height: 16px !important;
      display: block !important;
      margin: auto !important;
    }
    /* Hide native controls buttons, timelines, and time indicators */
    video::-webkit-media-controls-mute-button,
    video::-webkit-media-controls-volume-slider,
    video::-webkit-media-controls-timeline,
    video::-webkit-media-controls-current-time-display,
    video::-webkit-media-controls-time-remaining-display {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  function setupPremiumVideoAttributes(video) {
    video.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
    video.setAttribute('disablePictureInPicture', 'true');
    video.setAttribute('disableRemotePlayback', 'true');
    video.style.webkitMediaControlsFullscreenButton = 'none';
  }

  function setupMuteToggle(video) {
    if (video.dataset.hasMuteToggle) return;
    video.dataset.hasMuteToggle = 'true';

    // Mute by default so autoplay/hoverplay is not blocked
    video.muted = true;
    setupPremiumVideoAttributes(video);

    const container = video.closest('deferred-media, .product-media-modal__content, .product-media-container');
    if (!container) return;

    const toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'custom-video-sound-toggle';

    const muteSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-1 3.69-1.81L19.73 21 21 19.73 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
      </svg>
    `;

    const unmuteSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
      </svg>
    `;

    toggleBtn.innerHTML = muteSvg;

    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      video.muted = !video.muted;
      toggleBtn.innerHTML = video.muted ? muteSvg : unmuteSvg;
    });

    toggleBtn.addEventListener('pointerup', (e) => {
      e.stopPropagation();
    });

    video.addEventListener('click', (e) => {
      // If inside the modal, toggle play/pause on clicking the video itself
      if (video.closest('product-modal')) {
        e.preventDefault();
        e.stopPropagation();
        if (video.paused) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });

    container.appendChild(toggleBtn);
  }

  function setupAllVideos() {
    document.querySelectorAll('video').forEach(setupMuteToggle);
  }

  // Monitor DOM for dynamically added video elements
  const observer = new MutationObserver((mutations) => {
    let hasVideo = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeName === 'VIDEO' || (node.querySelector && node.querySelector('video'))) {
          hasVideo = true;
        }
      });
    });
    if (hasVideo) {
      setupAllVideos();
    }
  });
  
  document.addEventListener('DOMContentLoaded', () => {
    setupAllVideos();
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Global hover play listener
  document.addEventListener('mouseover', function(e) {
    const container = e.target.closest('deferred-media');
    if (container) {
      if (!container.getAttribute('loaded')) {
        container.loadContent();
      }
      const video = container.querySelector('video');
      if (video) {
        video.play().catch(err => console.log('Hover play blocked:', err));
      }
    } else if (e.target.nodeName === 'VIDEO') {
      e.target.play().catch(err => console.log('Hover play blocked:', err));
    }
  });

  document.addEventListener('mouseout', function(e) {
    const container = e.target.closest('deferred-media');
    if (container) {
      const video = container.querySelector('video');
      if (video) {
        video.pause();
      }
    } else if (e.target.nodeName === 'VIDEO') {
      e.target.pause();
    }
  });

  // Capture phase document click listener to redirect page-level video clicks to opening the modal
  document.addEventListener('click', (e) => {
    // If click is inside the slider, let normal behavior handle it (play/pause toggle)
    if (e.target.closest('product-modal')) return;

    const deferredMedia = e.target.closest('deferred-media');
    if (deferredMedia) {
      const mediaId = deferredMedia.getAttribute('data-media-id');
      if (mediaId) {
        e.preventDefault();
        e.stopPropagation();

        const modal = document.querySelector('product-modal');
        if (modal) {
          const opener = document.querySelector(`button[data-media-id="${mediaId}"].product__media-toggle`) || deferredMedia;
          modal.openedBy = opener;
          modal.show(opener);
        }
      }
    }
  }, true);
})();
