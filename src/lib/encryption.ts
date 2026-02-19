/**
 * Encryption utilities for sensitive data (GitHub tokens, etc.)
 * Uses AES-256-CBC encryption
 */

import crypto from 'crypto';

// Encryption key from environment (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.warn(
    '⚠️  ENCRYPTION_KEY not set or invalid! Using default key (INSECURE). ' +
      'Set ENCRYPTION_KEY to a 64-character hex string (32 bytes) in production.'
  );
}

// Use env key or generate a deterministic default (NOT secure for production)
const KEY = ENCRYPTION_KEY
  ? Buffer.from(ENCRYPTION_KEY, 'hex')
  : crypto.createHash('sha256').update('default-insecure-key').digest();

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

/**
 * Encrypt a string using AES-256-CBC
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: iv:encryptedData (both hex-encoded)
 */
export function encrypt(text: string): string {
  if (!text) return '';

  try {
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

    // Encrypt
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return format: iv:encrypted (both hex)
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('[Encryption] Failed to encrypt:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt a string encrypted with encrypt()
 * @param encrypted - Encrypted string in format: iv:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return '';

  try {
    // Split iv and encrypted data
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);

    // Decrypt
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('[Encryption] Failed to decrypt:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Check if a string appears to be encrypted (has iv:data format)
 * @param value - String to check
 * @returns True if string appears encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  const parts = value.split(':');
  return parts.length === 2 && parts[0].length === 32; // IV is 16 bytes = 32 hex chars
}

/**
 * Safely encrypt a token, checking if it's already encrypted
 * @param token - Token to encrypt
 * @returns Encrypted token
 */
export function encryptToken(token: string): string {
  if (!token) return '';
  if (isEncrypted(token)) {
    console.warn('[Encryption] Token appears already encrypted, returning as-is');
    return token;
  }
  return encrypt(token);
}

/**
 * Safely decrypt a token, handling plain text tokens gracefully
 * @param token - Token to decrypt
 * @returns Decrypted token (or original if not encrypted)
 */
export function decryptToken(token: string): string {
  if (!token) return '';
  if (!isEncrypted(token)) {
    console.warn('[Encryption] Token appears not encrypted, returning as-is');
    return token;
  }
  return decrypt(token);
}
