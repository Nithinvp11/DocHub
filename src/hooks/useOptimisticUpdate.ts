/**
 * Optimistic UI Updates Hook
 * Provides instant UI feedback while waiting for server responses
 */

import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

interface OptimisticUpdateOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

/**
 * Generic optimistic update hook
 */
export function useOptimisticUpdate<T>() {
  const [isUpdating, setIsUpdating] = useState(false);

  const update = useCallback(
    async (
      optimisticData: T,
      serverUpdate: () => Promise<T>,
      revert: (error: Error) => void,
      options?: OptimisticUpdateOptions<T>
    ) => {
      setIsUpdating(true);

      try {
        // Server update
        const result = await serverUpdate();

        // Success callback
        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        // Success toast
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }

        return result;
      } catch (error) {
        // Revert optimistic update
        revert(error as Error);

        // Error callback
        if (options?.onError) {
          options.onError(error as Error);
        }

        // Error toast
        const message = options?.errorMessage || 'Failed to update. Changes reverted.';
        toast.error(message);

        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  return { update, isUpdating };
}

/**
 * Optimistic array update hook
 */
export function useOptimisticArray<T extends { id: string }>() {
  const [items, setItems] = useState<T[]>([]);
  const { update, isUpdating } = useOptimisticUpdate<T | undefined>();

  const addItem = useCallback(
    async (newItem: T, serverAdd: () => Promise<T>, options?: OptimisticUpdateOptions<T>) => {
      // Optimistically add item
      setItems((prev) => [...prev, newItem]);

      return update(
        newItem,
        serverAdd,
        () => {
          // Revert: remove item
          setItems((prev) => prev.filter((item) => item.id !== newItem.id));
        },
        options as OptimisticUpdateOptions<T | undefined>
      );
    },
    [update]
  );

  const updateItem = useCallback(
    async (
      id: string,
      updates: Partial<T>,
      serverUpdate: () => Promise<T>,
      options?: OptimisticUpdateOptions<T>
    ) => {
      // Store original item for revert
      const originalItem = items.find((item) => item.id === id);
      if (!originalItem) return;

      // Optimistically update item
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));

      return update(
        { ...originalItem, ...updates } as T,
        serverUpdate,
        () => {
          // Revert: restore original item
          setItems((prev) => prev.map((item) => (item.id === id ? originalItem : item)));
        },
        options as OptimisticUpdateOptions<T | undefined>
      );
    },
    [items, update]
  );

  const removeItem = useCallback(
    async (
      id: string,
      serverRemove: () => Promise<void>,
      options?: OptimisticUpdateOptions<void>
    ) => {
      // Store original item for revert
      const originalItem = items.find((item) => item.id === id);
      if (!originalItem) return;

      // Optimistically remove item
      setItems((prev) => prev.filter((item) => item.id !== id));

      return update(
        undefined,
        async () => {
          await serverRemove();
          return undefined;
        },
        () => {
          // Revert: restore item
          setItems((prev) => [...prev, originalItem]);
        },
        options as OptimisticUpdateOptions<T | undefined>
      );
    },
    [items, update]
  );

  return {
    items,
    setItems,
    addItem,
    updateItem,
    removeItem,
    isUpdating,
  };
}

/**
 * Document-specific optimistic update hook
 */
export function useOptimisticDocument() {
  interface OptimisticDocumentItem {
    id: string;
    content: string;
  }

  type DocumentUpdateResult = Record<string, unknown>;

  const { update, isUpdating } = useOptimisticUpdate<DocumentUpdateResult>();

  const updateContent = useCallback(
    async (
      documentId: string,
      content: string,
      setDocuments: Dispatch<SetStateAction<OptimisticDocumentItem[]>>,
      originalContent: string
    ) => {
      // Optimistically update UI
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, content } : doc))
      );

      return update(
        { documentId, content },
        async () => {
          const response = await fetch(`/api/documents/${documentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content }),
          });

          if (!response.ok) {
            throw new Error('Failed to save document');
          }

          return (await response.json()) as DocumentUpdateResult;
        },
        () => {
          // Revert on error
          setDocuments((prev) =>
            prev.map((doc) => (doc.id === documentId ? { ...doc, content: originalContent } : doc))
          );
        },
        {
          successMessage: 'Document saved',
          errorMessage: 'Failed to save document',
        }
      );
    },
    [update]
  );

  return { updateContent, isUpdating };
}
