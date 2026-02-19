'use client';

import React, { useMemo } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { EnhancedMarkdown } from '@/components/EnhancedMarkdown';

interface VersionContentRendererProps {
  content: string;
  className?: string;
}

/**
 * Smart renderer for version content that handles both HTML and Markdown
 *
 * TipTap editor stores content as HTML (via getHTML()), so most versions
 * contain HTML. This component:
 * 1. Detects if content is HTML or Markdown
 * 2. Sanitizes HTML with DOMPurify to prevent XSS
 * 3. Renders HTML with proper prose styling matching the editor
 * 4. Falls back to Markdown rendering for markdown content
 */
export function VersionContentRenderer({ content, className = '' }: VersionContentRendererProps) {
  const { isHtml, sanitizedContent } = useMemo(() => {
    if (!content || content.trim().length === 0) {
      return { isHtml: false, sanitizedContent: '' };
    }

    // Detect if content is HTML by checking for common HTML tags
    // TipTap output typically starts with <p>, <h1>, <ul>, <ol>, etc.
    const htmlPatterns = [
      /^<[a-z][\s\S]*>/i, // Starts with an HTML tag
      /<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table)>/i, // Contains closing block tags
      /<(strong|em|code|a|span|br)\s*[/>]/i, // Contains inline HTML tags
    ];

    const looksLikeHtml = htmlPatterns.some((pattern) => pattern.test(content));

    if (looksLikeHtml) {
      // Sanitize HTML to prevent XSS attacks
      // DOMPurify removes dangerous attributes/tags but preserves safe HTML structure
      const cleaned = DOMPurify.sanitize(content, {
        ALLOWED_TAGS: [
          // Block elements
          'p',
          'div',
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'blockquote',
          'pre',
          'code',
          'ul',
          'ol',
          'li',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
          'hr',
          'br',
          // Inline elements
          'strong',
          'em',
          'u',
          'del',
          's',
          'strike',
          'a',
          'span',
          'mark',
          'sup',
          'sub',
          'abbr',
          'small',
          'img',
          // Form elements (for task list checkboxes)
          'input',
          'label',
        ],
        ALLOWED_ATTR: [
          'href',
          'title',
          'alt',
          'src',
          'class',
          'id',
          'style',
          'colspan',
          'rowspan',
          'data-type',
          'data-checked',
          'target',
          'rel',
          // Input attributes (for checkboxes)
          'type',
          'checked',
          'disabled',
        ],
        ALLOW_DATA_ATTR: true,
        ALLOWED_URI_REGEXP:
          /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
      });

      return { isHtml: true, sanitizedContent: cleaned };
    }

    // Not HTML, treat as markdown
    return { isHtml: false, sanitizedContent: content };
  }, [content]);

  if (!content || content.trim().length === 0) {
    return (
      <div className="text-slate-400 italic">
        <p>No content available</p>
      </div>
    );
  }

  if (isHtml) {
    // Render sanitized HTML with exact TipTap editor styling
    // Use both 'prose' wrapper AND 'ProseMirror' class to match editor output
    return (
      <div className={`prose prose-invert max-w-none ${className}`}>
        <div
          className="ProseMirror"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          style={{
            // Match TipTap editor styling
            color: 'white',
            padding: '1rem 1.5rem',
          }}
        />
      </div>
    );
  }

  // Render as Markdown
  return <EnhancedMarkdown content={sanitizedContent} className={className} />;
}

/**
 * Utility function to detect if content is HTML (can be used elsewhere)
 */
export function isHtmlContent(content: string): boolean {
  if (!content || content.trim().length === 0) return false;

  const htmlPatterns = [
    /^<[a-z][\s\S]*>/i,
    /<\/(p|div|h[1-6]|ul|ol|li|blockquote|pre|table)>/i,
    /<(strong|em|code|a|span|br)\s*[/>]/i,
  ];

  return htmlPatterns.some((pattern) => pattern.test(content));
}
