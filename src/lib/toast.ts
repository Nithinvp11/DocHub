import { toast as sonnerToast } from 'sonner';

// Helper to safely convert any value to a string
const toString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
    // Handle Zod/validation errors or other structured objects
    if ('message' in value && typeof value.message === 'string') {
      return value.message;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

// Wrapper for consistent toast notifications throughout the app
export const toast = {
  success: (message: unknown, description?: unknown) => {
    sonnerToast.success(toString(message), {
      description: description ? toString(description) : undefined,
      duration: 4000,
    });
  },

  error: (message: unknown, description?: unknown) => {
    sonnerToast.error(toString(message), {
      description: description ? toString(description) : undefined,
      duration: 5000,
    });
  },

  info: (message: unknown, description?: unknown) => {
    sonnerToast.info(toString(message), {
      description: description ? toString(description) : undefined,
      duration: 4000,
    });
  },

  warning: (message: unknown, description?: unknown) => {
    sonnerToast.warning(toString(message), {
      description: description ? toString(description) : undefined,
      duration: 4000,
    });
  },

  loading: (message: unknown) => {
    return sonnerToast.loading(toString(message));
  },

  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};
