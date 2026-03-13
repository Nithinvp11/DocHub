/**
 * Individual Diff Block Renderer
 * Renders ProseMirror nodes with diff highlighting
 */

'use client';

import { type DiffBlock } from '@/lib/diff-engine';
import { generateInlineDiff, mergeInlineSegments, type InlineDiffSegment } from '@/lib/inline-diff';
import type { ProseMirrorNode } from '@/types/prosemirror';
import React, { useMemo } from 'react';
import { CheckSquare, Square, ArrowRight, Image as ImageIcon } from 'lucide-react';

interface DiffBlockRendererProps {
  diffBlock: DiffBlock;
  side: 'left' | 'right';
  showUnchanged?: boolean;
}

export function DiffBlockRenderer({
  diffBlock,
  side,
  showUnchanged = true,
}: DiffBlockRendererProps) {
  // Determine which node to render based on side
  const node = side === 'left' ? diffBlock.oldNode : diffBlock.newNode;

  // Don't render if node doesn't exist on this side - prevents excessive blank spaces
  if (!node) {
    return null;
  }

  // Hide unchanged blocks if requested
  if (diffBlock.status === 'unchanged' && !showUnchanged) {
    return null;
  }

  // Determine border and background colors based on status and side
  let borderColor = '';
  let bgColor = '';

  if (diffBlock.status === 'added') {
    borderColor = side === 'right' ? 'border-l-4 border-green-500' : 'border-l-2 border-slate-200';
    bgColor = side === 'right' ? 'bg-green-50/50' : 'bg-slate-50/30';
  } else if (diffBlock.status === 'removed') {
    borderColor = side === 'left' ? 'border-l-4 border-red-500' : 'border-l-2 border-slate-200';
    bgColor = side === 'left' ? 'bg-red-50/50' : 'bg-slate-50/30';
  } else if (diffBlock.status === 'modified') {
    borderColor = 'border-l-4 border-yellow-500';
    bgColor = 'bg-yellow-50/50';
  } else if (diffBlock.status === 'moved') {
    borderColor = 'border-l-4 border-blue-500';
    bgColor = 'bg-blue-50/50';
  } else {
    // unchanged
    borderColor = 'border-l border-slate-200';
    bgColor = 'bg-white';
  }

  return (
    <div
      className={`group hover:bg-opacity-75 mb-3 rounded-lg px-6 py-4 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${borderColor} ${bgColor}`}
    >
      {/* Metadata indicators */}
      {diffBlock.metadata && (
        <div className="mb-3 flex flex-wrap gap-2.5 text-xs">
          {diffBlock.metadata.headingLevelChange && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 rounded-full bg-linear-to-r from-purple-500 to-violet-600 px-3 py-1.5 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              <ArrowRight className="h-3 w-3" />H{diffBlock.metadata.headingLevelChange.from} → H
              {diffBlock.metadata.headingLevelChange.to}
            </span>
          )}
          {diffBlock.metadata.checkboxStateChange && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 rounded-full bg-linear-to-r from-blue-500 to-cyan-600 px-3 py-1.5 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              {diffBlock.metadata.checkboxStateChange.to ? (
                <CheckSquare className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
              Checkbox: {diffBlock.metadata.checkboxStateChange.from ? '☑' : '☐'} →{' '}
              {diffBlock.metadata.checkboxStateChange.to ? '☑' : '☐'}
            </span>
          )}
          {diffBlock.metadata.linkHrefChange && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 rounded-full bg-linear-to-r from-cyan-500 to-teal-600 px-3 py-1.5 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              <ArrowRight className="h-3 w-3" />
              Link changed
            </span>
          )}
          {diffBlock.metadata.imageSrcChange && (
            <span className="animate-in fade-in slide-in-from-left-2 flex items-center gap-1.5 rounded-full bg-linear-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md">
              <ImageIcon className="h-3 w-3" />
              Image changed
            </span>
          )}
        </div>
      )}

      {/* Render node based on type */}
      <NodeRenderer node={node} diffBlock={diffBlock} side={side} />
    </div>
  );
}

interface NodeRendererProps {
  node: ProseMirrorNode;
  diffBlock: DiffBlock;
  side: 'left' | 'right';
}

function NodeRenderer({ node, diffBlock, side }: NodeRendererProps) {
  const inlineSegments = useMemo(() => {
    if (diffBlock.status === 'modified' && diffBlock.oldNode && diffBlock.newNode) {
      return mergeInlineSegments(generateInlineDiff(diffBlock.oldNode, diffBlock.newNode));
    }
    return null;
  }, [diffBlock]);

  switch (node.type) {
    case 'heading':
      return (
        <Heading
          level={(node.attrs?.level as number) || 1}
          segments={inlineSegments}
          node={node}
          side={side}
        />
      );

    case 'paragraph':
      return <Paragraph segments={inlineSegments} node={node} side={side} />;

    case 'bulletList':
      return <BulletList node={node} diffBlock={diffBlock} side={side} />;

    case 'orderedList':
      return <OrderedList node={node} diffBlock={diffBlock} side={side} />;

    case 'taskList':
      return <TaskList node={node} diffBlock={diffBlock} side={side} />;

    case 'blockquote':
      return <Blockquote segments={inlineSegments} node={node} side={side} />;

    case 'codeBlock':
      return <CodeBlock node={node} diffBlock={diffBlock} side={side} />;

    case 'horizontalRule':
      return <hr className="my-4 border-slate-300" />;

    case 'image':
      return <ImageNode node={node} diffBlock={diffBlock} />;

    default:
      return <Paragraph segments={inlineSegments} node={node} side={side} />;
  }
}

// Component renderers

function Heading({
  level,
  segments,
  node,
  side,
}: {
  level: number;
  segments: InlineDiffSegment[] | null;
  node: ProseMirrorNode;
  side: 'left' | 'right';
}) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  const className =
    {
      1: 'text-3xl font-bold bg-linear-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent',
      2: 'text-2xl font-bold bg-linear-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent',
      3: 'text-xl font-semibold text-slate-800',
    }[level] || 'text-lg font-semibold text-slate-700';

  return (
    <Tag className={`${className} animate-in fade-in slide-in-from-left-1 duration-500`}>
      {segments ? <InlineContent segments={segments} side={side} /> : <TextContent node={node} />}
    </Tag>
  );
}

function Paragraph({
  segments,
  node,
  side,
}: {
  segments: InlineDiffSegment[] | null;
  node: ProseMirrorNode;
  side: 'left' | 'right';
}) {
  return (
    <p className="animate-in fade-in text-base leading-relaxed text-slate-700 duration-300">
      {segments ? <InlineContent segments={segments} side={side} /> : <TextContent node={node} />}
    </p>
  );
}

function BulletList({
  node,
  diffBlock,
  side,
}: {
  node: ProseMirrorNode;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  return (
    <ul className="list-disc space-y-1 pl-6">
      {node.content?.map((item, i: number) => (
        <ListItem key={i} item={item} index={i} diffBlock={diffBlock} side={side} />
      ))}
    </ul>
  );
}

function OrderedList({
  node,
  diffBlock,
  side,
}: {
  node: ProseMirrorNode;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  return (
    <ol className="list-decimal space-y-1 pl-6">
      {node.content?.map((item, i: number) => (
        <ListItem key={i} item={item} index={i} diffBlock={diffBlock} side={side} />
      ))}
    </ol>
  );
}

function ListItem({
  item,
  index,
  diffBlock,
  side,
}: {
  item: ProseMirrorNode;
  index: number;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  // Generate inline diff for this specific list item if parent is modified
  const inlineSegments = useMemo(() => {
    if (diffBlock?.status === 'modified' && diffBlock.oldNode && diffBlock.newNode) {
      const oldItems = diffBlock.oldNode.content || [];
      const newItems = diffBlock.newNode.content || [];

      const oldItem = oldItems[index];
      const newItem = newItems[index];

      if (oldItem && newItem) {
        return mergeInlineSegments(generateInlineDiff(oldItem, newItem));
      }
    }
    return null;
  }, [item, index, diffBlock]);

  return (
    <li>
      {inlineSegments ? (
        <InlineContent segments={inlineSegments} side={side} />
      ) : (
        <TextContent node={item} />
      )}
    </li>
  );
}

function TaskList({
  node,
  diffBlock,
  side,
}: {
  node: ProseMirrorNode;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  return (
    <ul className="list-none space-y-2 pl-0">
      {node.content?.map((item, i: number) => (
        <TaskListItem key={i} item={item} index={i} diffBlock={diffBlock} side={side} />
      ))}
    </ul>
  );
}

function TaskListItem({
  item,
  index,
  diffBlock,
  side,
}: {
  item: ProseMirrorNode;
  index: number;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  const isChecked = (item.attrs?.checked as boolean) || false;

  // Generate inline diff for this specific task item if parent is modified
  const inlineSegments = useMemo(() => {
    if (diffBlock?.status === 'modified' && diffBlock.oldNode && diffBlock.newNode) {
      const oldItems = diffBlock.oldNode.content || [];
      const newItems = diffBlock.newNode.content || [];

      // Match this task item by index (or could use more sophisticated matching)
      const oldItem = oldItems[index];
      const newItem = newItems[index];

      if (oldItem && newItem) {
        // Generate inline diff for the task item content
        return mergeInlineSegments(generateInlineDiff(oldItem, newItem));
      }
    }
    return null;
  }, [item, index, diffBlock]);

  // Detect checkbox state change
  const checkboxChanged = useMemo(() => {
    if (diffBlock?.status === 'modified' && diffBlock.oldNode && diffBlock.newNode) {
      const oldItems = diffBlock.oldNode.content || [];
      const newItems = diffBlock.newNode.content || [];
      const oldItem = oldItems[index];
      const newItem = newItems[index];

      if (oldItem && newItem) {
        const oldChecked = (oldItem.attrs?.checked as boolean) || false;
        const newChecked = (newItem.attrs?.checked as boolean) || false;
        return oldChecked !== newChecked;
      }
    }
    return false;
  }, [index, diffBlock]);

  return (
    <li className="animate-in fade-in slide-in-from-left-1 flex items-start gap-3 duration-300">
      <span
        className={`transition-all duration-300 ${checkboxChanged ? 'animate-pulse rounded-lg bg-linear-to-br from-amber-200 to-yellow-200 p-1 shadow-sm' : 'p-1'}`}
      >
        {isChecked ? (
          <CheckSquare className="mt-0.5 h-5 w-5 text-emerald-600 transition-all hover:scale-110" />
        ) : (
          <Square className="mt-0.5 h-5 w-5 text-slate-400 transition-all hover:scale-110 hover:text-slate-600" />
        )}
      </span>
      <span className="flex-1">
        {inlineSegments ? (
          <InlineContent segments={inlineSegments} side={side} />
        ) : (
          <TaskItemContent node={item} />
        )}
      </span>
    </li>
  );
}

function TaskItemContent({ node }: { node: ProseMirrorNode }) {
  // Render task item content (usually a paragraph)
  if (node.content && Array.isArray(node.content)) {
    return (
      <>
        {node.content.map((child, i) => (
          <span key={i}>{extractText(child)}</span>
        ))}
      </>
    );
  }
  return <>{extractText(node)}</>;
}

function Blockquote({
  segments,
  node,
  side,
}: {
  segments: InlineDiffSegment[] | null;
  node: ProseMirrorNode;
  side: 'left' | 'right';
}) {
  return (
    <blockquote className="animate-in fade-in slide-in-from-left-2 border-gradient-to-b rounded-r-lg border-l-4 bg-linear-to-r from-blue-500 from-slate-50 via-purple-500 to-blue-50/30 to-pink-500 py-2 pr-4 pl-5 text-slate-700 italic shadow-sm duration-500">
      {segments ? <InlineContent segments={segments} side={side} /> : <TextContent node={node} />}
    </blockquote>
  );
}

function CodeBlock({
  node,
  diffBlock,
  side,
}: {
  node: ProseMirrorNode;
  diffBlock?: DiffBlock;
  side: 'left' | 'right';
}) {
  const language = (node.attrs?.language as string) || 'text';

  // Generate inline diff for code content if modified
  const inlineSegments = useMemo(() => {
    if (diffBlock?.status === 'modified' && diffBlock.oldNode && diffBlock.newNode) {
      return mergeInlineSegments(generateInlineDiff(diffBlock.oldNode, diffBlock.newNode));
    }
    return null;
  }, [diffBlock]);

  return (
    <div className="group animate-in fade-in slide-in-from-bottom-2 relative duration-500">
      <div className="absolute top-3 right-3 rounded-full bg-linear-to-r from-indigo-600 to-purple-600 px-3 py-1 text-xs font-medium text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl">
        {language}
      </div>
      <pre className="overflow-x-auto rounded-lg border border-slate-700/50 bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 p-5 text-sm text-slate-100 shadow-md transition-all hover:shadow-lg">
        <code>
          {inlineSegments ? (
            <InlineContentCode segments={inlineSegments} side={side} />
          ) : (
            extractText(node)
          )}
        </code>
      </pre>
    </div>
  );
}

function InlineContentCode({
  segments,
  side,
}: {
  segments: InlineDiffSegment[];
  side: 'left' | 'right';
}) {
  // Filter segments based on which side we're rendering
  const filteredSegments = segments.filter((segment) => {
    if (segment.status === 'unchanged') return true;
    if (side === 'left' && segment.status === 'removed') return true;
    if (side === 'right' && segment.status === 'added') return true;
    return false;
  });

  return (
    <>
      {filteredSegments.map((segment, i) => {
        let className = '';
        if (segment.status === 'added') {
          className = 'bg-linear-to-r from-green-600 to-emerald-600 px-1 rounded';
        } else if (segment.status === 'removed') {
          className = 'bg-linear-to-r from-red-600 to-rose-600 px-1 rounded line-through';
        }
        return (
          <span key={i} className={className}>
            {segment.text}
          </span>
        );
      })}
    </>
  );
}

function ImageNode({ node, diffBlock }: { node: ProseMirrorNode; diffBlock: DiffBlock }) {
  const src = (node.attrs?.src as string) || '';
  const alt = (node.attrs?.alt as string) || '';

  const hasChange = diffBlock.metadata?.imageSrcChange;

  return (
    <div className="animate-in fade-in zoom-in-95 flex flex-col gap-3 duration-500">
      {src ? (
        <img
          src={src}
          alt={alt}
          className="max-h-64 rounded-xl border-2 border-slate-200 object-contain shadow-md transition-all hover:scale-[1.02] hover:shadow-xl"
        />
      ) : (
        <div className="flex h-32 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-linear-to-br from-slate-50 to-slate-100">
          <ImageIcon className="h-10 w-10 text-slate-400 transition-all hover:scale-110 hover:text-slate-600" />
        </div>
      )}
      {hasChange && (
        <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 shadow-sm">
          <ArrowRight className="h-4 w-4" /> Image source changed
        </div>
      )}
    </div>
  );
}

// Helper components

function InlineContent({
  segments,
  side,
}: {
  segments: InlineDiffSegment[];
  side: 'left' | 'right';
}) {
  // Filter segments based on which side we're rendering
  const filteredSegments = segments.filter((segment) => {
    if (segment.status === 'unchanged') return true;
    if (side === 'left' && segment.status === 'removed') return true;
    if (side === 'right' && segment.status === 'added') return true;
    return false;
  });

  return (
    <>
      {filteredSegments.map((segment, i) => (
        <InlineSegment key={i} segment={segment} />
      ))}
    </>
  );
}

function InlineSegment({ segment }: { segment: InlineDiffSegment }) {
  // Separate styling for each status type
  let className = '';

  if (segment.status === 'added') {
    className =
      'bg-linear-to-r from-green-200 to-emerald-200 px-1 py-0.5 rounded transition-all hover:from-green-300 hover:to-emerald-300';
  } else if (segment.status === 'removed') {
    className =
      'bg-linear-to-r from-red-200 to-rose-200 px-1 py-0.5 rounded line-through transition-all hover:from-red-300 hover:to-rose-300';
  }
  // unchanged has no special styling

  // Start with the text wrapped in a span with status styling
  let content: React.ReactNode = <span className={className}>{segment.text}</span>;

  // Apply marks if present (order matters for proper nesting)
  if (segment.marks && segment.marks.length > 0) {
    for (const mark of segment.marks) {
      if (mark.type === 'bold') {
        content = <strong>{content}</strong>;
      } else if (mark.type === 'italic') {
        content = <em>{content}</em>;
      } else if (mark.type === 'underline') {
        content = <u>{content}</u>;
      } else if (mark.type === 'strike') {
        content = <s>{content}</s>;
      } else if (mark.type === 'code') {
        content = <code className="rounded bg-slate-200 px-1 py-0.5 text-sm">{content}</code>;
      } else if (mark.type === 'link') {
        content = (
          <a
            href={mark.attrs?.href as string}
            className="text-blue-600 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {content}
          </a>
        );
      }
    }
  }

  // Show mark changes if any
  if (segment.markChanges) {
    const { added, removed } = segment.markChanges;
    if (added.length > 0 || removed.length > 0) {
      return (
        <span className="relative">
          {content}
          <span className="ml-1 text-xs text-slate-500">
            {added.map((m, i) => (
              <span key={`add-${i}`}> +{m.type}</span>
            ))}
            {removed.map((m, i) => (
              <span key={`rem-${i}`}> -{m.type}</span>
            ))}
          </span>
        </span>
      );
    }
  }

  return <>{content}</>;
}

function TextContent({ node }: { node: ProseMirrorNode }) {
  const text = extractText(node);
  return <>{text}</>;
}

function extractText(node: ProseMirrorNode): string {
  if (node.text) {
    return node.text;
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map((child) => extractText(child)).join('');
  }

  return '';
}
