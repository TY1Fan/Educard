// Educard Forum - Client-side JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Educard Forum loaded');

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
