'use client';

import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.css';

interface EnhancedMarkdownProps {
  content: string;
  className?: string;
}

export function EnhancedMarkdown({ content, className = '' }: EnhancedMarkdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize mermaid
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    });

    // Render mermaid diagrams
    if (containerRef.current) {
      const mermaidElements = containerRef.current.querySelectorAll('.language-mermaid');
      mermaidElements.forEach((element, index) => {
        const code = element.textContent || '';
        const id = `mermaid-${Date.now()}-${index}`;

        try {
          mermaid.render(id, code).then(({ svg }) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mermaid-diagram';
            wrapper.innerHTML = svg;
            element.parentElement?.replaceWith(wrapper);
          });
        } catch (error) {
          console.error('Mermaid rendering error:', error);
        }
      });
    }
  }, [content]);

  return (
    <div ref={containerRef} className={`enhanced-markdown ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // Custom heading with anchor links
          h1: ({ node, ...props }) => (
            <h1 className="mt-8 mb-4 border-b pb-2 text-4xl font-bold" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mt-6 mb-3 border-b pb-2 text-3xl font-bold" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mt-5 mb-2 text-2xl font-semibold" {...props} />
          ),
          h4: ({ node, ...props }) => <h4 className="mt-4 mb-2 text-xl font-semibold" {...props} />,
          h5: ({ node, ...props }) => <h5 className="mt-3 mb-2 text-lg font-semibold" {...props} />,
          h6: ({ node, ...props }) => (
            <h6 className="mt-2 mb-1 text-base font-semibold" {...props} />
          ),

          // Paragraphs with spacing
          p: ({ node, ...props }) => <p className="my-4 leading-7" {...props} />,

          // Code blocks with syntax highlighting
          code: ({
            node,
            inline,
            className,
            children,
            ...props
          }: React.HTMLAttributes<HTMLElement> & { node?: unknown; inline?: boolean }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (inline) {
              return (
                <code
                  className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:bg-neutral-800 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="my-4">
                {language && (
                  <div className="rounded-t-lg border-b border-neutral-700 bg-neutral-800 px-4 py-2 font-mono text-xs text-neutral-200">
                    {language}
                  </div>
                )}
                <pre
                  className={`overflow-x-auto p-4 ${
                    language ? 'rounded-b-lg' : 'rounded'
                  } bg-neutral-900`}
                >
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },

          // Blockquotes
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="my-4 border-l-4 border-neutral-300 pl-4 text-neutral-700 italic dark:border-neutral-700 dark:text-neutral-300"
              {...props}
            />
          ),

          // Lists
          ul: ({ node, ...props }) => <ul className="my-4 ml-6 list-disc space-y-2" {...props} />,
          ol: ({ node, ...props }) => (
            <ol className="my-4 ml-6 list-decimal space-y-2" {...props} />
          ),
          li: ({ node, ...props }) => <li className="leading-7" {...props} />,

          // Tables with GFM support
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className="min-w-full border-collapse border border-neutral-300 dark:border-neutral-700"
                {...props}
              />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-neutral-100 dark:bg-neutral-800" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-neutral-300 px-4 py-2 text-left font-semibold dark:border-neutral-700"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-neutral-300 px-4 py-2 dark:border-neutral-700"
              {...props}
            />
          ),

          // Task lists (GFM)
          input: ({
            node,
            ...props
          }: React.InputHTMLAttributes<HTMLInputElement> & { node?: unknown }) => {
            if (props.type === 'checkbox') {
              return <input type="checkbox" disabled className="mr-2 cursor-default" {...props} />;
            }
            return <input {...props} />;
          },

          // Links
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:underline dark:text-blue-400"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Images
          img: ({ node, ...props }) => (
            <img
              className="my-4 h-auto max-w-full rounded-lg shadow-md"
              loading="lazy"
              {...props}
            />
          ),

          // Horizontal rule
          hr: ({ node, ...props }) => (
            <hr className="my-8 border-t border-neutral-300 dark:border-neutral-700" {...props} />
          ),

          // Strong/Bold
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,

          // Emphasis/Italic
          em: ({ node, ...props }) => <em className="italic" {...props} />,

          // Strikethrough (GFM)
          del: ({ node, ...props }) => <del className="text-neutral-500 line-through" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>

      <style>{`
        /* Math equation styles */
        .katex {
          font-size: 1.1em;
        }

        .katex-display {
          margin: 1.5rem 0;
          overflow-x: auto;
          overflow-y: hidden;
        }

        /* Mermaid diagram styles */
        .mermaid-diagram {
          margin: 2rem 0;
          padding: 1rem;
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #e5e7eb;
          overflow-x: auto;
        }

        .dark .mermaid-diagram {
          background: #1f2937;
          border-color: #374151;
        }

        .mermaid-diagram svg {
          max-width: 100%;
          height: auto;
        }

        /* Syntax highlighting adjustments */
        .enhanced-markdown pre code.hljs {
          background: transparent;
          padding: 0;
        }

        /* Footnotes (if using remark-footnotes plugin) */
        .enhanced-markdown .footnotes {
          margin-top: 3rem;
          padding-top: 1rem;
          border-top: 1px solid #e5e7eb;
          font-size: 0.875rem;
        }

        .dark .enhanced-markdown .footnotes {
          border-top-color: #374151;
        }

        /* Task list styles */
        .enhanced-markdown input[type='checkbox'] {
          margin-right: 0.5rem;
          accent-color: #3b82f6;
        }

        /* Table responsive wrapper */
        .enhanced-markdown table {
          font-size: 0.875rem;
        }

        /* Code block scrollbar */
        .enhanced-markdown pre {
          scrollbar-width: thin;
          scrollbar-color: #4b5563 #1f2937;
        }

        .enhanced-markdown pre::-webkit-scrollbar {
          height: 8px;
        }

        .enhanced-markdown pre::-webkit-scrollbar-track {
          background: #1f2937;
        }

        .enhanced-markdown pre::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 4px;
        }

        .enhanced-markdown pre::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>
    </div>
  );
}

/**
 * GitHub Flavored Markdown Preview Component
 */
export function GitHubMarkdownPreview({ content, className = '' }: EnhancedMarkdownProps) {
  return (
    <div className={`github-markdown-body ${className}`}>
      <EnhancedMarkdown content={content} />

      <style>{`
        .github-markdown-body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .github-markdown-body::before {
          display: table;
          content: '';
        }

        .github-markdown-body::after {
          display: table;
          clear: both;
          content: '';
        }

        /* Match GitHub's heading styles */
        .github-markdown-body h1 {
          font-size: 2em;
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #d0d7de;
        }

        .dark .github-markdown-body h1 {
          border-bottom-color: #30363d;
        }

        .github-markdown-body h2 {
          font-size: 1.5em;
          font-weight: 600;
          padding-bottom: 0.3em;
          border-bottom: 1px solid #d0d7de;
        }

        .dark .github-markdown-body h2 {
          border-bottom-color: #30363d;
        }

        /* GitHub code block style */
        .github-markdown-body pre {
          padding: 16px;
          overflow: auto;
          font-size: 85%;
          line-height: 1.45;
          background-color: #f6f8fa;
          border-radius: 6px;
        }

        .dark .github-markdown-body pre {
          background-color: #161b22;
        }

        /* GitHub table styles */
        .github-markdown-body table th {
          font-weight: 600;
        }

        .github-markdown-body table th,
        .github-markdown-body table td {
          padding: 6px 13px;
          border: 1px solid #d0d7de;
        }

        .dark .github-markdown-body table th,
        .dark .github-markdown-body table td {
          border-color: #30363d;
        }

        .github-markdown-body table tr {
          background-color: transparent;
          border-top: 1px solid #d0d7de;
        }

        .dark .github-markdown-body table tr {
          border-top-color: #30363d;
        }

        .github-markdown-body table tr:nth-child(2n) {
          background-color: #f6f8fa;
        }

        .dark .github-markdown-body table tr:nth-child(2n) {
          background-color: #0d1117;
        }
      `}</style>
    </div>
  );
}
