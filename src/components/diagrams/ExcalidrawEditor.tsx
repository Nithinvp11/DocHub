'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

// Type definitions for Excalidraw
export interface ExcalidrawDiagramData {
  elements: readonly unknown[];
  appState: Record<string, unknown>;
  files: unknown;
}

// Dynamically import Excalidraw to avoid SSR issues
const Excalidraw = dynamic(
  async () => {
    const mod = await import('@excalidraw/excalidraw');
    return mod.Excalidraw;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[600px] w-full items-center justify-center rounded-lg border bg-slate-50">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-sm text-slate-600">Loading diagram editor...</p>
        </div>
      </div>
    ),
  }
);

interface ExcalidrawEditorProps {
  initialData?: ExcalidrawDiagramData;
  onSave?: (data: ExcalidrawDiagramData) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export function ExcalidrawEditor({
  initialData,
  onSave,
  onClose,
  readOnly = false,
}: ExcalidrawEditorProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<unknown | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI) return;

    setIsSaving(true);
    try {
      // Type assertion for API methods
      const api = excalidrawAPI as {
        getSceneElements: () => readonly unknown[];
        getAppState: () => Record<string, unknown>;
        getFiles: () => unknown;
      };

      const elements = api.getSceneElements();
      const appState = api.getAppState();
      const files = api.getFiles();

      const diagramData: ExcalidrawDiagramData = {
        elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
          currentItemFillStyle: appState.currentItemFillStyle,
          currentItemStrokeWidth: appState.currentItemStrokeWidth,
          currentItemRoughness: appState.currentItemRoughness,
          currentItemOpacity: appState.currentItemOpacity,
          currentItemFontFamily: appState.currentItemFontFamily,
          currentItemFontSize: appState.currentItemFontSize,
          currentItemTextAlign: appState.currentItemTextAlign,
        },
        files,
      };

      onSave?.(diagramData);
    } catch (error) {
      console.error('Failed to save diagram:', error);
    } finally {
      setIsSaving(false);
    }
  }, [excalidrawAPI, onSave]);

  return (
    <div className="relative h-full w-full">
      {/* Toolbar */}
      {!readOnly && (
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Diagram'}
          </Button>
          {onClose && (
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          )}
        </div>
      )}

      {/* Excalidraw Canvas */}
      <div className="h-[600px] w-full overflow-hidden rounded-lg border bg-white shadow-lg">
        <Excalidraw
          excalidrawAPI={(api: unknown) => setExcalidrawAPI(api)}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initialData={initialData as any}
          viewModeEnabled={readOnly}
          zenModeEnabled={false}
          gridModeEnabled={false}
          theme="light"
          name="Document Diagram"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: !readOnly,
              clearCanvas: !readOnly,
              export: false,
              loadScene: !readOnly,
              saveToActiveFile: false,
              toggleTheme: true,
            },
          }}
        />
      </div>
    </div>
  );
}

// Viewer component for read-only display
interface ExcalidrawViewerProps {
  data: ExcalidrawDiagramData;
  height?: string;
}

export function ExcalidrawViewer({ data, height = '400px' }: ExcalidrawViewerProps) {
  return (
    <div
      className="w-full overflow-hidden rounded-lg border bg-white shadow-sm"
      style={{ height: height }}
    >
      <Excalidraw
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialData={data as any}
        viewModeEnabled={true}
        zenModeEnabled={true}
        gridModeEnabled={false}
        theme="light"
        name="Diagram"
      />
    </div>
  );
}
