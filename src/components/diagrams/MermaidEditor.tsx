'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, Eye, Code, AlertCircle } from 'lucide-react';

// Initialize mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  });
}

interface MermaidEditorProps {
  initialCode?: string;
  onSave?: (code: string) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

export function MermaidEditor({
  initialCode = '',
  onSave,
  onClose,
  readOnly = false,
}: MermaidEditorProps) {
  const [code, setCode] = useState(initialCode || getDefaultDiagram());
  const [showPreview, setShowPreview] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Render mermaid diagram
  const renderDiagram = useCallback(async () => {
    if (!mermaidRef.current || !code.trim()) return;

    try {
      setError(null);
      const id = `mermaid-${Date.now()}`;
      const { svg } = await mermaid.render(id, code);
      mermaidRef.current.innerHTML = svg;
    } catch (err) {
      console.error('Mermaid render error:', err);
      setError(err instanceof Error ? err.message : 'Failed to render diagram');
      mermaidRef.current.innerHTML = '';
    }
  }, [code]);

  // Debounced rendering
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    renderTimeoutRef.current = setTimeout(() => {
      renderDiagram();
    }, 500);

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [code, renderDiagram]);

  const handleSave = () => {
    if (!error) {
      onSave?.(code);
    }
  };

  return (
    <div className="flex h-full w-full flex-col rounded-lg border bg-white shadow-lg">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Mermaid Diagram</h3>
          {!readOnly && (
            <div className="flex rounded-lg border bg-white p-1">
              <Button
                size="sm"
                variant={!showPreview ? 'default' : 'ghost'}
                onClick={() => setShowPreview(false)}
                className="h-7 px-3"
              >
                <Code className="mr-1 h-3 w-3" />
                Code
              </Button>
              <Button
                size="sm"
                variant={showPreview ? 'default' : 'ghost'}
                onClick={() => setShowPreview(true)}
                className="h-7 px-3"
              >
                <Eye className="mr-1 h-3 w-3" />
                Preview
              </Button>
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!!error}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Diagram
            </Button>
            {onClose && (
              <Button size="sm" variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" />
                Close
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Code Editor */}
        {!readOnly && !showPreview && (
          <div className="flex flex-1 flex-col p-4">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter your Mermaid diagram code here..."
              className="h-full font-mono text-sm"
              spellCheck={false}
            />
            <div className="mt-2 text-xs text-slate-500">
              Learn Mermaid syntax:{' '}
              <a
                href="https://mermaid.js.org/syntax/flowchart.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-700"
              >
                Documentation
              </a>
            </div>
          </div>
        )}

        {/* Preview */}
        {showPreview && (
          <div className="flex flex-1 flex-col overflow-auto p-4">
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-800">Diagram Error</p>
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              </div>
            )}
            <div
              ref={mermaidRef}
              className="flex min-h-[400px] items-center justify-center rounded-lg bg-slate-50 p-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Viewer component for read-only display
interface MermaidViewerProps {
  code: string;
  height?: string;
}

export function MermaidViewer({ code, height = '400px' }: MermaidViewerProps) {
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!mermaidRef.current || !code.trim()) return;

      try {
        setError(null);
        const id = `mermaid-viewer-${Date.now()}`;
        const { svg } = await mermaid.render(id, code);
        mermaidRef.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        setError(err instanceof Error ? err.message : 'Failed to render diagram');
        mermaidRef.current.innerHTML = '';
      }
    };

    renderDiagram();
  }, [code]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="w-full overflow-auto rounded-lg border bg-slate-50 p-4 shadow-sm"
      style={{ height: height }}
    >
      <div ref={mermaidRef} className="flex items-center justify-center" />
    </div>
  );
}

// Default diagram templates
function getDefaultDiagram(): string {
  return `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`;
}

// Export diagram type templates
export const mermaidTemplates = {
  flowchart: `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,

  sequence: `sequenceDiagram
    participant User
    participant Frontend
    participant Backend
    participant Database
    
    User->>Frontend: Request
    Frontend->>Backend: API Call
    Backend->>Database: Query
    Database-->>Backend: Data
    Backend-->>Frontend: Response
    Frontend-->>User: Display`,

  class: `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat`,

  gantt: `gantt
    title Project Timeline
    dateFormat YYYY-MM-DD
    
    section Planning
    Requirements    :2024-01-01, 7d
    Design         :7d
    
    section Development
    Backend        :14d
    Frontend       :14d
    
    section Testing
    QA Testing     :7d
    Bug Fixes      :5d`,

  er: `erDiagram
    USER ||--o{ DOCUMENT : creates
    USER ||--o{ COMMENT : writes
    DOCUMENT ||--o{ VERSION : has
    DOCUMENT ||--o{ COMMENT : contains
    
    USER {
        string id
        string name
        string email
    }
    DOCUMENT {
        string id
        string title
        string content
    }`,

  state: `stateDiagram-v2
    [*] --> Draft
    Draft --> Review : Submit
    Review --> Approved : Accept
    Review --> Draft : Reject
    Approved --> Published : Publish
    Published --> [*]`,
};
