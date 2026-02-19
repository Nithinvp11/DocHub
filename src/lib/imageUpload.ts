// Image Upload Utility for TipTap
import { Editor } from '@tiptap/react';

interface UploadImageResult {
  url: string;
  alt?: string;
}

/**
 * Upload image to server (cloud storage or local storage)
 * @param file - Image file to upload
 * @param workspaceId - Workspace ID (required for authorization)
 */
export async function uploadImage(file: File, workspaceId?: string): Promise<UploadImageResult> {
  try {
    if (!workspaceId) {
      throw new Error('workspaceId is required for image uploads');
    }

    // Upload to server API endpoint
    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', workspaceId);

    const response = await fetch('/api/upload/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to upload image');
    }

    const data = await response.json();

    return {
      url: data.url,
      alt: file.name,
    };
  } catch (error) {
    console.error('Image upload failed:', error);

    // Fallback to base64 if upload fails
    console.warn('Falling back to base64 encoding');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          url: reader.result as string,
          alt: file.name,
        });
      };

      reader.onerror = () => {
        reject(new Error('Failed to read image file'));
      };

      reader.readAsDataURL(file);
    });
  }
}

/**
 * Handle image paste
 * @param editor - TipTap editor instance
 * @param event - Clipboard paste event
 * @param workspaceId - Workspace ID for authorization
 */
export function handleImagePaste(editor: Editor, event: ClipboardEvent, workspaceId?: string) {
  const items = event.clipboardData?.items;
  if (!items) return false;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.type.indexOf('image') !== -1) {
      event.preventDefault();

      const file = item.getAsFile();
      if (!file) continue;

      uploadImage(file, workspaceId)
        .then(({ url, alt }) => {
          editor.chain().focus().setImage({ src: url, alt }).run();
        })
        .catch((error) => {
          console.error('Failed to upload pasted image:', error);
        });

      return true;
    }
  }

  return false;
}

/**
 * Handle image drop
 * @param editor - TipTap editor instance
 * @param event - Drag and drop event
 * @param workspaceId - Workspace ID for authorization
 */
export function handleImageDrop(editor: Editor, event: DragEvent, workspaceId?: string) {
  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return false;

  const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
  if (imageFiles.length === 0) return false;

  event.preventDefault();

  // Get drop position
  const { view } = editor;
  const eventPos = view.posAtCoords({
    left: event.clientX,
    top: event.clientY,
  });

  if (!eventPos) return false;

  // Upload all images
  Promise.all(imageFiles.map((file) => uploadImage(file, workspaceId)))
    .then((results) => {
      results.forEach(({ url, alt }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(eventPos.pos, {
            type: 'image',
            attrs: { src: url, alt },
          })
          .run();
      });
    })
    .catch((error) => {
      console.error('Failed to upload dropped images:', error);
    });

  return true;
}

/**
 * Open file picker and insert image
 * @param editor - TipTap editor instance
 * @param workspaceId - Workspace ID for authorization
 */
export function insertImageFromFile(editor: Editor, workspaceId?: string) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;

  input.onchange = async () => {
    const files = input.files;
    if (!files || files.length === 0) return;

    try {
      const results = await Promise.all(
        Array.from(files).map((file) => uploadImage(file, workspaceId))
      );

      results.forEach(({ url, alt }) => {
        editor.chain().focus().setImage({ src: url, alt }).run();
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
    }
  };

  input.click();
}

/**
 * Insert image from URL
 */
export function insertImageFromUrl(editor: Editor, url: string, alt = '') {
  if (!url) return;

  editor.chain().focus().setImage({ src: url, alt }).run();
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'File must be an image' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'Image size must be less than 5MB' };
  }

  return { valid: true };
}
