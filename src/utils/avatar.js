const crypto = require('crypto');

/**
 * Generate Gravatar URL from email
 * @param {string} email - User email address
 * @param {number} size - Avatar size in pixels (default: 80)
 * @param {string} defaultType - Default avatar type: 'identicon', 'monsterid', 'wavatar', 'retro', 'robohash', 'mp' (default: 'identicon')
 * @returns {string} - Gravatar URL
 */
function getGravatarUrl(email, size = 80, defaultType = 'identicon') {
  if (!email) {
    return getDefaultAvatar('', size);
  }
  
  // Trim and lowercase email
  const normalizedEmail = email.trim().toLowerCase();
  
  // Generate MD5 hash
  const hash = crypto.createHash('md5').update(normalizedEmail).digest('hex');
  
  // Construct Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultType}&r=pg`;
}

/**
 * Get avatar URL for a user
 * @param {Object} user - User object with email
 * @param {number} size - Avatar size (default: 80)
 * @returns {string} - Avatar URL
 */
function getUserAvatar(user, size = 80) {
  if (!user) {
    return getDefaultAvatar('', size);
  }
  
  // If user has uploaded avatar, use it (future enhancement)
  if (user.avatarUrl) {
    return user.avatarUrl;
  }
  
  // Use Gravatar
  return getGravatarUrl(user.email, size);
}

/**
 * Generate default avatar with user initials
 * @param {string} name - User's display name or username
 * @param {number} size - Avatar size
 * @returns {string} - SVG data URL
 */
function getDefaultAvatar(name = '', size = 80) {
  // Get initials (first 2 characters of name or "?")
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  
  // Generate consistent color from name
  const hue = name
    ? (name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360)
    : 200;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
      <rect width="100" height="100" fill="hsl(${hue}, 60%, 50%)" />
      <text x="50" y="50" text-anchor="middle" dominant-baseline="central" 
            font-family="Arial, sans-serif" font-size="40" font-weight="bold" fill="white">
        ${initials}
      </text>
    </svg>
  `;
  
  // Convert SVG to base64 data URL
  const base64 = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Get avatar size classes for CSS
 * @param {string} size - Size name: 'small', 'medium', 'large'
 * @returns {number} - Pixel size
 */
function getAvatarSize(size = 'medium') {
  const sizes = {
    small: 32,
    medium: 48,
    large: 80,
    xlarge: 120
  };
  
  return sizes[size] || sizes.medium;
}

/**
 * Generate avatar HTML element
 * @param {Object} user - User object
 * @param {string} size - Size name
 * @param {boolean} linkToProfile - Whether to wrap in profile link
 * @returns {string} - HTML string
 */
function generateAvatarHtml(user, size = 'medium', linkToProfile = false) {
  const pixelSize = getAvatarSize(size);
  const avatarUrl = getUserAvatar(user, pixelSize);
  const displayName = user.displayName || user.username;
  const username = user.username;
  
  const imgTag = `<img src="${avatarUrl}" alt="${displayName}'s avatar" class="avatar avatar-${size}" width="${pixelSize}" height="${pixelSize}" loading="lazy">`;
  
  if (linkToProfile) {
    return `<a href="/profile/${username}" class="avatar-link" title="${displayName}">${imgTag}</a>`;
  }
  
  return imgTag;
}

module.exports = {
  getGravatarUrl,
  getUserAvatar,
  getDefaultAvatar,
  getAvatarSize,
  generateAvatarHtml
};
