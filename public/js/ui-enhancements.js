/**
 * UI Enhancements
 * Additional UI/UX improvements for better user experience
 */

(function() {
  'use strict';

  /**
   * Add smooth scroll behavior for anchor links
   */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Update URL without jumping
          if (history.pushState) {
            history.pushState(null, null, this.getAttribute('href'));
          }
        }
      });
    });
  }

  /**
   * Add focus visible polyfill for better keyboard navigation
   */
  function initFocusVisible() {
    let hadKeyboardEvent = false;
    
    const markFocusVisible = () => {
      hadKeyboardEvent = true;
    };
    
    document.addEventListener('keydown', markFocusVisible);
    document.addEventListener('mousedown', () => { hadKeyboardEvent = false; });
    
    document.addEventListener('focus', (e) => {
      if (hadKeyboardEvent) {
        e.target.classList.add('focus-visible');
      }
    }, true);
    
    document.addEventListener('blur', (e) => {
      e.target.classList.remove('focus-visible');
    }, true);
  }

  /**
   * Add character counter to textareas
   */
  function initCharacterCounters() {
    document.querySelectorAll('textarea[maxlength]').forEach(textarea => {
      const maxLength = parseInt(textarea.getAttribute('maxlength'));
      if (!maxLength) return;
      
      // Create counter element
      const counter = document.createElement('span');
      counter.className = 'char-counter';
      counter.setAttribute('aria-live', 'polite');
      
      const updateCounter = () => {
        const remaining = maxLength - textarea.value.length;
        const percentage = (textarea.value.length / maxLength) * 100;
        
        counter.textContent = `${textarea.value.length} / ${maxLength}`;
        
        // Update class based on remaining characters
        counter.classList.remove('warning', 'error');
        if (percentage >= 90) {
          counter.classList.add('error');
        } else if (percentage >= 75) {
          counter.classList.add('warning');
        }
      };
      
      // Insert counter after textarea
      textarea.parentNode.insertBefore(counter, textarea.nextSibling);
      
      // Update on input
      textarea.addEventListener('input', updateCounter);
      updateCounter();
    });
  }

  /**
   * Add confirmation dialogs with better styling
   */
  function enhanceConfirmDialogs() {
    document.querySelectorAll('[data-confirm]').forEach(element => {
      element.addEventListener('click', function(e) {
        const message = this.getAttribute('data-confirm');
        if (!confirm(message)) {
          e.preventDefault();
          return false;
        }
      });
    });
  }

  /**
   * Add loading state to links that navigate away
   */
  function initLinkLoading() {
    document.querySelectorAll('a[data-loading]').forEach(link => {
      link.addEventListener('click', function() {
        if (!this.hasAttribute('target') || this.getAttribute('target') === '_self') {
          this.classList.add('link-loading');
          this.style.opacity = '0.6';
          this.style.pointerEvents = 'none';
        }
      });
    });
  }

  /**
   * Add image lazy loading fallback
   */
  function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
      // Browser supports native lazy loading
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    } else {
      // Fallback for browsers without native lazy loading
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  /**
   * Add copy to clipboard functionality
   */
  function initCopyButtons() {
    document.querySelectorAll('[data-copy]').forEach(button => {
      button.addEventListener('click', async function() {
        const text = this.getAttribute('data-copy');
        
        try {
          await navigator.clipboard.writeText(text);
          
          // Visual feedback
          const originalText = this.textContent;
          this.textContent = '✓ Copied!';
          this.classList.add('btn-success');
          
          setTimeout(() => {
            this.textContent = originalText;
            this.classList.remove('btn-success');
          }, 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
      });
    });
  }

  /**
   * Add back to top button
   */
  function initBackToTop() {
    const button = document.createElement('button');
    button.className = 'back-to-top';
    button.innerHTML = '↑';
    button.setAttribute('aria-label', 'Back to top');
    button.style.cssText = `
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 100;
    `;
    
    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Show/hide based on scroll position
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300) {
        button.style.opacity = '1';
        button.style.visibility = 'visible';
      } else {
        button.style.opacity = '0';
        button.style.visibility = 'hidden';
      }
    });
    
    document.body.appendChild(button);
  }

  /**
   * Improve form validation feedback
   */
  function enhanceFormValidation() {
    document.querySelectorAll('input, textarea, select').forEach(field => {
      // Add real-time validation feedback
      field.addEventListener('blur', function() {
        if (this.validity.valid) {
          this.classList.remove('error');
          this.classList.add('success');
          
          // Remove any existing error message
          const feedback = this.parentNode.querySelector('.form-feedback.error');
          if (feedback) feedback.remove();
        } else if (this.value) {
          this.classList.remove('success');
          this.classList.add('error');
          
          // Show validation message
          let feedback = this.parentNode.querySelector('.form-feedback.error');
          if (!feedback) {
            feedback = document.createElement('span');
            feedback.className = 'form-feedback error';
            this.parentNode.appendChild(feedback);
          }
          feedback.textContent = this.validationMessage;
        }
      });
      
      // Remove error on focus
      field.addEventListener('focus', function() {
        if (this.classList.contains('error')) {
          this.classList.remove('error');
        }
      });
    });
  }

  /**
   * Add tooltip functionality
   */
  function initTooltips() {
    // Tooltips are handled by CSS, but we can add touch support
    if ('ontouchstart' in window) {
      document.querySelectorAll('[data-tooltip]').forEach(element => {
        element.addEventListener('touchstart', function(e) {
          e.preventDefault();
          this.classList.add('tooltip-visible');
          
          setTimeout(() => {
            this.classList.remove('tooltip-visible');
          }, 2000);
        });
      });
    }
  }

  /**
   * Initialize all enhancements
   */
  function init() {
    initSmoothScroll();
    initFocusVisible();
    initCharacterCounters();
    enhanceConfirmDialogs();
    initLinkLoading();
    initLazyLoading();
    initCopyButtons();
    initBackToTop();
    enhanceFormValidation();
    initTooltips();
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for manual use
  window.UIEnhancements = {
    init
  };
})();
