// Educard Forum - Client-side JavaScript

/**
 * Format timestamp as relative time (e.g., "2 hours ago", "3 days ago")
 */
function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
}

/**
 * Update all elements with class 'relative-time' to show relative time
 */
function updateRelativeTimes() {
  const timeElements = document.querySelectorAll('.relative-time');
  timeElements.forEach(element => {
    const datetime = element.getAttribute('datetime');
    if (datetime) {
      element.textContent = formatRelativeTime(datetime);
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Educard Forum loaded');
  
  // Initialize relative time display
  updateRelativeTimes();
  
  // Update relative times every minute
  setInterval(updateRelativeTimes, 60000);
  
  // Show/hide jump navigation buttons based on scroll position
  const jumpNav = document.getElementById('jump-nav');
  if (jumpNav) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        jumpNav.classList.add('visible');
      } else {
        jumpNav.classList.remove('visible');
      }
    });
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Shift + T = Jump to top
    if (e.shiftKey && e.key === 'T') {
      e.preventDefault();
      window.scrollTo({top: 0, behavior: 'smooth'});
    }
    // Shift + B = Jump to bottom
    if (e.shiftKey && e.key === 'B') {
      e.preventDefault();
      window.scrollTo({top: document.body.scrollHeight, behavior: 'smooth'});
    }
  });

  // Strong confirmation for thread deletion
  const threadDeleteForms = document.querySelectorAll('form[action*="/thread/"][action*="/delete"]');
  threadDeleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const confirmed = confirm('⚠️ DELETE ENTIRE THREAD?\n\nThis will permanently delete the thread and ALL posts in it.\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?');
      if (!confirmed) {
        e.preventDefault();
        return false;
      }
    });
  });

  // Confirmation for post delete actions
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    const form = button.closest('form');
    if (form && !form.action.includes('/thread/')) {
      button.addEventListener('click', function(e) {
        if (!confirm('Are you sure you want to delete this post?')) {
          e.preventDefault();
        }
      });
    }
  });

  // Form validation feedback (optional enhancement)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function() {
      // Could add loading states here
    });
  });
});
