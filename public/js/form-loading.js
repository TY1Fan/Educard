/**
 * Form Loading States Handler
 * Adds loading indicators to forms during submission
 */

(function() {
  'use strict';

  // SVG spinner icon
  const spinnerSVG = `
    <svg class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="10 20" opacity="0.5"/>
    </svg>
  `;

  /**
   * Add loading state to a button
   */
  function setButtonLoading(button, isLoading) {
    if (isLoading) {
      // Store original content
      button.dataset.originalContent = button.innerHTML;
      button.dataset.wasDisabled = button.disabled;
      
      // Add loading state
      button.disabled = true;
      button.classList.add('btn-loading');
      
      // Determine loading text based on button content
      let loadingText = 'Processing...';
      const originalText = button.textContent.trim().toLowerCase();
      
      if (originalText.includes('submit') || originalText.includes('save') || originalText.includes('update')) {
        loadingText = 'Saving...';
      } else if (originalText.includes('delete') || originalText.includes('remove')) {
        loadingText = 'Deleting...';
      } else if (originalText.includes('login') || originalText.includes('sign in')) {
        loadingText = 'Logging in...';
      } else if (originalText.includes('register') || originalText.includes('sign up')) {
        loadingText = 'Creating account...';
      } else if (originalText.includes('post') || originalText.includes('reply')) {
        loadingText = 'Posting...';
      } else if (originalText.includes('search')) {
        loadingText = 'Searching...';
      }
      
      button.innerHTML = `${spinnerSVG} <span>${loadingText}</span>`;
    } else {
      // Restore original content
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        button.disabled = button.dataset.wasDisabled === 'true';
        button.classList.remove('btn-loading');
        delete button.dataset.originalContent;
        delete button.dataset.wasDisabled;
      }
    }
  }

  /**
   * Handle form submission
   */
  function handleFormSubmit(event) {
    const form = event.target;
    
    // Find submit button
    const submitButton = form.querySelector('button[type="submit"]') || 
                        form.querySelector('input[type="submit"]');
    
    if (submitButton) {
      // Validate form before showing loading state
      if (!form.checkValidity()) {
        return; // Let browser handle validation
      }
      
      // Set loading state
      setButtonLoading(submitButton, true);
      
      // Add loading class to form
      form.classList.add('form-loading');
      
      // Disable all form inputs during submission
      const inputs = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
      inputs.forEach(input => {
        if (!input.disabled) {
          input.dataset.wasEnabled = 'true';
          input.disabled = true;
        }
      });
    }
  }

  /**
   * Reset form loading state (for validation errors or page back)
   */
  function resetFormLoading() {
    // Reset all buttons with loading state
    document.querySelectorAll('.btn-loading').forEach(button => {
      setButtonLoading(button, false);
    });
    
    // Reset all forms with loading state
    document.querySelectorAll('.form-loading').forEach(form => {
      form.classList.remove('form-loading');
      
      // Re-enable inputs
      form.querySelectorAll('[data-was-enabled="true"]').forEach(input => {
        input.disabled = false;
        delete input.dataset.wasEnabled;
      });
    });
  }

  /**
   * Initialize form loading handlers
   */
  function init() {
    // Add submit listeners to all forms
    document.querySelectorAll('form').forEach(form => {
      // Skip forms with data-no-loading attribute
      if (form.dataset.noLoading) {
        return;
      }
      
      form.addEventListener('submit', handleFormSubmit);
    });
    
    // Reset loading states when page loads (e.g., browser back button)
    window.addEventListener('pageshow', function(event) {
      if (event.persisted) {
        // Page was restored from cache
        resetFormLoading();
      }
    });
    
    // Reset on DOMContentLoaded (if page loaded with validation errors)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', resetFormLoading);
    } else {
      resetFormLoading();
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export functions for manual use
  window.FormLoading = {
    setLoading: setButtonLoading,
    reset: resetFormLoading
  };
})();
