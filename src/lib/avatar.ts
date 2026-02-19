/**
 * Generate avatar URL based on initials
 * Uses UI Avatars service for generated avatars
 */
export function generateAvatarUrl(name: string | null, username: string | null): string {
  const displayName = name || username || 'User';
  
  // Get initials (first letter of first two words)
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map(word => word[0])
    .join('')
    .toUpperCase();

  // Use UI Avatars API to generate avatar
  // Format: https://ui-avatars.com/api/?name=John+Doe&background=random&color=fff&size=200
  const params = new URLSearchParams({
    name: initials,
    background: generateColorFromString(displayName),
    color: 'fff',
    size: '200',
    bold: 'true',
  });

  return `https://ui-avatars.com/api/?${params.toString()}`;
}

/**
 * Generate a consistent color from a string (for avatar background)
 */
function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate pastel colors (lighter, more pleasant)
  const colors = [
    '3b82f6', // blue
    '10b981', // green
    'f59e0b', // amber
    'ef4444', // red
    '8b5cf6', // purple
    'ec4899', // pink
    '06b6d4', // cyan
    '84cc16', // lime
  ];

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Check if image URL is valid
 */
export function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Get display avatar URL (use provided image or generate from initials)
 */
export function getDisplayAvatar(
  image: string | null,
  name: string | null,
  username: string | null
): string {
  if (isValidImageUrl(image)) {
    return image!;
  }
  
  return generateAvatarUrl(name, username);
}
