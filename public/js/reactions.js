/**
 * Post Reactions Handler
 * Manages like/unlike functionality with AJAX
 */

class ReactionManager {
  constructor() {
    this.init();
  }

  init() {
    // Handle reaction button clicks
    document.addEventListener('click', (e) => {
      const reactionBtn = e.target.closest('.reaction-btn');
      if (reactionBtn) {
        this.toggleReaction(reactionBtn);
      }
    });
  }

  async toggleReaction(button) {
    const postId = button.dataset.postId;
    const reactionType = button.dataset.reaction || 'like';

    // Disable button during request
    button.disabled = true;

    try {
      const response = await fetch(`/post/${postId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: reactionType }),
      });

      const data = await response.json();

      if (data.success) {
        // Update UI
        this.updateReactionUI(button, data);
      } else {
        console.error('Reaction toggle failed:', data.message);
        alert(data.message || 'Failed to update reaction');
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      alert('An error occurred. Please try again.');
    } finally {
      // Re-enable button
      button.disabled = false;
    }
  }

  updateReactionUI(button, data) {
    const countSpan = button.querySelector('.reaction-count');
    
    // Update count
    if (countSpan) {
      countSpan.textContent = data.reactionCount || 0;
    }

    // Toggle active state
    if (data.action === 'added') {
      button.classList.add('active');
      button.title = 'Unlike this post';
      
      // Add animation
      button.classList.add('reaction-animate');
      setTimeout(() => button.classList.remove('reaction-animate'), 300);
    } else {
      button.classList.remove('active');
      button.title = 'Like this post';
    }
  }

  async getPostReactions(postId, type = null) {
    try {
      const url = type 
        ? `/post/${postId}/reactions?type=${type}`
        : `/post/${postId}/reactions`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        return data.reactions;
      } else {
        console.error('Failed to fetch reactions:', data.message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching reactions:', error);
      return [];
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.reactionManager = new ReactionManager();
});
