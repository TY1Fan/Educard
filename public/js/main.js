// Educard Forum - Client-side JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Educard Forum loaded');

  // Confirmation for delete actions
  const deleteButtons = document.querySelectorAll('.delete-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      if (!confirm('Are you sure you want to delete this?')) {
        e.preventDefault();
      }
    });
  });

  // Form validation feedback (optional enhancement)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function() {
      // Could add loading states here
    });
  });
});
