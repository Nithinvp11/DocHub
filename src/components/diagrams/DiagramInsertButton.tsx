'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PenTool, GitBranch, ChevronDown } from 'lucide-react';
import { ExcalidrawEditor, type ExcalidrawDiagramData } from './ExcalidrawEditor';
import { MermaidEditor, mermaidTemplates } from './MermaidEditor';

type DiagramData = ExcalidrawDiagramData | string;

interface DiagramInsertButtonProps {
  onInsertDiagram: (type: 'excalidraw' | 'mermaid', data: DiagramData) => void;
}

export function DiagramInsertButton({ onInsertDiagram }: DiagramInsertButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [diagramType, setDiagramType] = useState<'excalidraw' | 'mermaid' | null>(null);
  const [mermaidTemplate, setMermaidTemplate] = useState<string>('flowchart');

  const handleOpenExcalidraw = () => {
    setDiagramType('excalidraw');
    setDialogOpen(true);
  };

  const handleOpenMermaid = (template: string) => {
    setMermaidTemplate(template);
    setDiagramType('mermaid');
    setDialogOpen(true);
  };

  const handleSaveDiagram = (data: DiagramData) => {
    if (diagramType) {
      onInsertDiagram(diagramType, data);
      setDialogOpen(false);
      setDiagramType(null);
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setDiagramType(null);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <PenTool className="h-4 w-4" />
            Insert Diagram
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Visual Diagrams</DropdownMenuLabel>
          <DropdownMenuItem onClick={handleOpenExcalidraw} className="cursor-pointer">
            <PenTool className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Excalidraw</div>
              <div className="text-xs text-slate-500">Hand-drawn style diagrams</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuLabel>Code-based Diagrams</DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => handleOpenMermaid('flowchart')}
            className="cursor-pointer"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Flowchart</div>
              <div className="text-xs text-slate-500">Process flows and workflows</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleOpenMermaid('sequence')}
            className="cursor-pointer"
          >
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Sequence Diagram</div>
              <div className="text-xs text-slate-500">Interaction sequences</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleOpenMermaid('class')} className="cursor-pointer">
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Class Diagram</div>
              <div className="text-xs text-slate-500">Object-oriented structures</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleOpenMermaid('er')} className="cursor-pointer">
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">ER Diagram</div>
              <div className="text-xs text-slate-500">Database relationships</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleOpenMermaid('gantt')} className="cursor-pointer">
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">Gantt Chart</div>
              <div className="text-xs text-slate-500">Project timelines</div>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => handleOpenMermaid('state')} className="cursor-pointer">
            <GitBranch className="mr-2 h-4 w-4" />
            <div>
              <div className="font-medium">State Diagram</div>
              <div className="text-xs text-slate-500">State machines</div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diagram Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="h-[80vh] max-w-6xl">
          <DialogHeader>
            <DialogTitle>
              {diagramType === 'excalidraw' ? 'Create Visual Diagram' : 'Create Mermaid Diagram'}
            </DialogTitle>
            <DialogDescription>
              {diagramType === 'excalidraw'
                ? 'Draw diagrams with a hand-drawn look and feel'
                : 'Create diagrams using Mermaid syntax'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {diagramType === 'excalidraw' && (
              <ExcalidrawEditor onSave={handleSaveDiagram} onClose={handleClose} />
            )}
            {diagramType === 'mermaid' && (
              <MermaidEditor
                initialCode={mermaidTemplates[mermaidTemplate as keyof typeof mermaidTemplates]}
                onSave={handleSaveDiagram}
                onClose={handleClose}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Export for use in document editor
export { ExcalidrawEditor, ExcalidrawViewer } from './ExcalidrawEditor';
export { MermaidEditor, MermaidViewer, mermaidTemplates } from './MermaidEditor';
