import * as React from 'react';
import { toast as sonnerToast } from 'sonner';

// Helper to safely convert values to strings
const toString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
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

// Compatibility wrapper for useToast to work with sonner
export function useToast() {
  return {
    toast: (props: {
      title?: unknown;
      description?: unknown;
      variant?: 'default' | 'destructive';
    }) => {
      const title = toString(
        props.title || (props.variant === 'destructive' ? 'Error' : 'Success')
      );
      const description = props.description ? toString(props.description) : undefined;

      if (props.variant === 'destructive') {
        sonnerToast.error(title, { description });
      } else {
        sonnerToast.success(title, { description });
      }
    },
  };
}
