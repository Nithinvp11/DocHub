// Input sanitization utilities
// Simple HTML sanitization without external dependencies
// For production, consider using DOMPurify or sanitize-html

const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onload, etc.
  /<embed\b/gi,
  /<object\b/gi,
];

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  let sanitized = input;
  
  // Remove dangerous patterns
  DANGEROUS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized;
}

export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // Remove any HTML tags
  return input.replace(/<[^>]*>/g, '');
}

export function sanitizeMarkdown(input: string): string {
  if (!input) return '';
  
  // Allow markdown but remove dangerous HTML
  return sanitizeHtml(input);
}

export function truncate(input: string, maxLength: number): string {
  if (!input || input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + '...';
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
