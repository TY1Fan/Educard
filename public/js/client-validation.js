/**
 * Client-Side Form Validation
 * Real-time validation with instant feedback
 */

(function() {
  'use strict';

  // Validation rules
  const validationRules = {
    username: {
      minLength: 3,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_]+$/,
      messages: {
        required: 'Username is required',
        minLength: 'Username must be at least 3 characters',
        maxLength: 'Username cannot exceed 50 characters',
        pattern: 'Username can only contain letters, numbers, and underscores'
      }
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      messages: {
        required: 'Email is required',
        pattern: 'Please enter a valid email address'
      }
    },
    password: {
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      messages: {
        required: 'Password is required',
        minLength: 'Password must be at least 8 characters',
        pattern: 'Password must contain uppercase, lowercase, number, and special character'
      }
    },
    threadTitle: {
      minLength: 5,
      maxLength: 200,
      messages: {
        required: 'Thread title is required',
        minLength: 'Title must be at least 5 characters',
        maxLength: 'Title cannot exceed 200 characters'
      }
    },
    postContent: {
      minLength: 10,
      maxLength: 10000,
      messages: {
        required: 'Content is required',
        minLength: 'Content must be at least 10 characters',
        maxLength: 'Content cannot exceed 10,000 characters'
      }
    },
    categoryDescription: {
      minLength: 10,
      maxLength: 500,
      messages: {
        required: 'Description is required',
        minLength: 'Description must be at least 10 characters',
        maxLength: 'Description cannot exceed 500 characters'
      }
    }
  };

  /**
   * Validate a single field
   */
  function validateField(field) {
    const fieldName = field.name;
    const value = field.value.trim();
    const rules = validationRules[fieldName];
    
    // Clear previous validation
    clearFieldValidation(field);
    
    // Skip if no rules defined
    if (!rules) {
      return { valid: true };
    }
    
    // Check required
    if (field.hasAttribute('required') && !value) {
      return {
        valid: false,
        message: rules.messages.required
      };
    }
    
    // Skip other checks if field is empty and not required
    if (!value && !field.hasAttribute('required')) {
      return { valid: true };
    }
    
    // Check min length
    if (rules.minLength && value.length < rules.minLength) {
      return {
        valid: false,
        message: rules.messages.minLength
      };
    }
    
    // Check max length
    if (rules.maxLength && value.length > rules.maxLength) {
      return {
        valid: false,
        message: rules.messages.maxLength
      };
    }
    
    // Check pattern
    if (rules.pattern && !rules.pattern.test(value)) {
      return {
        valid: false,
        message: rules.messages.pattern
      };
    }
    
    return { valid: true };
  }

  /**
   * Validate password confirmation
   */
  function validatePasswordConfirmation(confirmField) {
    const passwordField = document.getElementById('password');
    if (!passwordField) return { valid: true };
    
    clearFieldValidation(confirmField);
    
    const password = passwordField.value;
    const confirm = confirmField.value;
    
    if (confirmField.hasAttribute('required') && !confirm) {
      return {
        valid: false,
        message: 'Please confirm your password'
      };
    }
    
    if (confirm && password !== confirm) {
      return {
        valid: false,
        message: 'Passwords do not match'
      };
    }
    
    return { valid: true };
  }

  /**
   * Show field validation result
   */
  function showFieldValidation(field, result) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    if (result.valid) {
      field.classList.remove('error');
      field.classList.add('success');
      
      // Add success icon
      if (!formGroup.querySelector('.validation-icon')) {
        const icon = document.createElement('span');
        icon.className = 'validation-icon success';
        icon.innerHTML = '✓';
        icon.setAttribute('aria-hidden', 'true');
        formGroup.classList.add('has-validation-icon');
        field.parentNode.appendChild(icon);
      }
    } else {
      field.classList.remove('success');
      field.classList.add('error');
      
      // Add error icon
      if (!formGroup.querySelector('.validation-icon')) {
        const icon = document.createElement('span');
        icon.className = 'validation-icon error';
        icon.innerHTML = '⚠';
        icon.setAttribute('aria-hidden', 'true');
        formGroup.classList.add('has-validation-icon');
        field.parentNode.appendChild(icon);
      }
      
      // Show error message
      let feedback = formGroup.querySelector('.form-feedback.error');
      if (!feedback) {
        feedback = document.createElement('span');
        feedback.className = 'form-feedback error';
        feedback.setAttribute('role', 'alert');
        field.parentNode.appendChild(feedback);
      }
      feedback.textContent = result.message;
    }
  }

  /**
   * Clear field validation
   */
  function clearFieldValidation(field) {
    const formGroup = field.closest('.form-group');
    if (!formGroup) return;
    
    field.classList.remove('error', 'success');
    
    // Remove validation icon
    const icon = formGroup.querySelector('.validation-icon');
    if (icon) {
      icon.remove();
      formGroup.classList.remove('has-validation-icon');
    }
    
    // Remove error message
    const feedback = formGroup.querySelector('.form-feedback.error');
    if (feedback) {
      feedback.remove();
    }
  }

  /**
   * Validate entire form
   */
  function validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
    
    fields.forEach(field => {
      let result;
      
      // Special handling for password confirmation
      if (field.name === 'confirmPassword') {
        result = validatePasswordConfirmation(field);
      } else {
        result = validateField(field);
      }
      
      showFieldValidation(field, result);
      
      if (!result.valid) {
        isValid = false;
        
        // Focus first invalid field
        if (isValid === false && field === fields[0]) {
          field.focus();
        }
      }
    });
    
    return isValid;
  }

  /**
   * Show password strength indicator
   */
  function showPasswordStrength(passwordField) {
    const password = passwordField.value;
    const formGroup = passwordField.closest('.form-group');
    if (!formGroup) return;
    
    // Remove existing strength indicator
    let strengthBar = formGroup.querySelector('.password-strength');
    if (!strengthBar) {
      strengthBar = document.createElement('div');
      strengthBar.className = 'password-strength';
      strengthBar.innerHTML = `
        <div class="strength-bar">
          <div class="strength-fill"></div>
        </div>
        <span class="strength-text"></span>
      `;
      passwordField.parentNode.appendChild(strengthBar);
    }
    
    if (!password) {
      strengthBar.style.display = 'none';
      return;
    }
    
    strengthBar.style.display = 'block';
    
    // Calculate strength
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    };
    
    Object.values(checks).forEach(check => {
      if (check) strength++;
    });
    
    const fill = strengthBar.querySelector('.strength-fill');
    const text = strengthBar.querySelector('.strength-text');
    
    fill.className = 'strength-fill';
    
    if (strength <= 2) {
      fill.style.width = '33%';
      fill.classList.add('weak');
      text.textContent = 'Weak';
      text.className = 'strength-text weak';
    } else if (strength <= 3) {
      fill.style.width = '66%';
      fill.classList.add('medium');
      text.textContent = 'Medium';
      text.className = 'strength-text medium';
    } else {
      fill.style.width = '100%';
      fill.classList.add('strong');
      text.textContent = 'Strong';
      text.className = 'strength-text strong';
    }
  }

  /**
   * Initialize validation for a form
   */
  function initFormValidation(form) {
    // Skip forms with no-validate attribute
    if (form.hasAttribute('novalidate') || form.dataset.noValidate) {
      return;
    }
    
    const fields = form.querySelectorAll('input:not([type="hidden"]), textarea, select');
    
    fields.forEach(field => {
      // Real-time validation on blur
      field.addEventListener('blur', function() {
        if (this.value || this.classList.contains('error')) {
          let result;
          
          if (this.name === 'confirmPassword') {
            result = validatePasswordConfirmation(this);
          } else {
            result = validateField(this);
          }
          
          showFieldValidation(this, result);
        }
      });
      
      // Clear error on focus
      field.addEventListener('focus', function() {
        if (this.classList.contains('error')) {
          const formGroup = this.closest('.form-group');
          const feedback = formGroup?.querySelector('.form-feedback.error');
          if (feedback) {
            feedback.style.opacity = '0.5';
          }
        }
      });
      
      // Revalidate on input if field has error
      field.addEventListener('input', function() {
        if (this.classList.contains('error')) {
          let result;
          
          if (this.name === 'confirmPassword') {
            result = validatePasswordConfirmation(this);
          } else {
            result = validateField(this);
          }
          
          showFieldValidation(this, result);
        }
        
        // Show password strength for password fields
        if (this.type === 'password' && this.name === 'password') {
          showPasswordStrength(this);
        }
      });
    });
    
    // Validate password confirmation when password changes
    const passwordField = form.querySelector('input[name="password"]');
    const confirmField = form.querySelector('input[name="confirmPassword"]');
    
    if (passwordField && confirmField) {
      passwordField.addEventListener('input', function() {
        if (confirmField.value) {
          const result = validatePasswordConfirmation(confirmField);
          showFieldValidation(confirmField, result);
        }
      });
    }
    
    // Validate on submit
    form.addEventListener('submit', function(e) {
      const isValid = validateForm(this);
      
      if (!isValid) {
        e.preventDefault();
        
        // Scroll to first error
        const firstError = this.querySelector('.error');
        if (firstError) {
          firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstError.focus();
        }
        
        return false;
      }
    });
  }

  /**
   * Test for edge cases
   */
  function testEdgeCases() {
    // This function can be called manually for testing
    const tests = {
      'Empty username': '',
      'Short username': 'ab',
      'Long username': 'a'.repeat(51),
      'Invalid username chars': 'user@123',
      'Valid username': 'user_123',
      'Invalid email': 'notanemail',
      'Valid email': 'user@example.com',
      'Short password': '1234567',
      'Weak password': '12345678',
      'Strong password': 'Pass123!@#',
      'SQL injection': "' OR '1'='1",
      'XSS attempt': '<script>alert("xss")</script>',
      'Unicode chars': '你好世界',
      'Very long text': 'a'.repeat(10001)
    };
    
    console.log('Edge case validation tests:', tests);
    return tests;
  }

  /**
   * Initialize all forms
   */
  function init() {
    document.querySelectorAll('form').forEach(form => {
      initFormValidation(form);
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for manual use
  window.FormValidation = {
    validateField,
    validateForm,
    showFieldValidation,
    clearFieldValidation,
    testEdgeCases,
    init
  };
})();
