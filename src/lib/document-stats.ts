/**
 * Document Statistics Utility
 * Calculates word count, character count, reading time, etc.
 */

export interface DocumentStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  paragraphCount: number;
  readingTime: number; // in minutes
}

/**
 * Calculate document statistics from HTML content
 * @param html HTML content from TipTap editor
 * @returns DocumentStats object
 */
export function calculateDocumentStats(html: string): DocumentStats {
  // Strip HTML tags to get plain text
  const text = html.replace(/<[^>]*>/g, ' ').trim();
  
  // Calculate character counts
  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  
  // Calculate word count
  const words = text
    .split(/\s+/)
    .filter(word => word.length > 0);
  const wordCount = words.length;
  
  // Calculate paragraph count (approximate from HTML)
  const paragraphCount = Math.max(
    1,
    (html.match(/<p>/g) || []).length || 
    (html.match(/<\/p>/g) || []).length
  );
  
  // Calculate reading time (average 200 words per minute)
  const readingTime = Math.ceil(wordCount / 200);
  
  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    paragraphCount,
    readingTime: readingTime || 1, // Minimum 1 minute
  };
}

/**
 * Format reading time for display
 * @param minutes Reading time in minutes
 * @returns Formatted string (e.g., "5 min read", "1 hour 30 min read")
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  if (minutes < 60) return `${minutes} min read`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour read' : `${hours} hours read`;
  }
  
  return `${hours}h ${remainingMinutes}m read`;
}

/**
 * Format number with thousands separator
 * @param num Number to format
 * @returns Formatted string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}
