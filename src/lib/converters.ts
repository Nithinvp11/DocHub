/**
 * Memory-Safe Converters for HTML <-> Markdown transformation
 * Used for GitHub synchronization
 *
 * CRITICAL: This converter uses ONLY regex-based transformations to avoid
 * memory issues with heavy libraries like Turndown/Cheerio.
 */

import { marked } from 'marked';

// Maximum content size for conversion (1MB - safe limit)
const MAX_CONVERSION_SIZE = 1 * 1024 * 1024; // 1MB

export class ContentTooLargeError extends Error {
  statusCode = 413;
  contentSizeBytes: number;
  maxSizeBytes: number;

  constructor(message: string, contentSizeBytes: number, maxSizeBytes: number) {
    super(message);
    this.name = 'ContentTooLargeError';
    this.contentSizeBytes = contentSizeBytes;
    this.maxSizeBytes = maxSizeBytes;
  }
}

export class ConversionTimeoutError extends Error {
  statusCode = 500;
  timeoutMs: number;

  constructor(message: string, timeoutMs: number) {
    super(message);
    this.name = 'ConversionTimeoutError';
    this.timeoutMs = timeoutMs;
  }
}

function getByteLength(value: string): number {
  if (typeof Buffer !== 'undefined') {
    return Buffer.byteLength(value, 'utf-8');
  }
  return new TextEncoder().encode(value).length;
}

/**
 * Memory-safe HTML to Markdown converter using regex only
 * This is the ONLY converter method we use to avoid OOM crashes
 */
export function htmlToMarkdown(html: string, options?: { maxBytes?: number }): string {
  const maxBytes = options?.maxBytes ?? MAX_CONVERSION_SIZE;
  const contentSize = getByteLength(html);

  console.log(`[Converter] HTML to Markdown - Size: ${contentSize} bytes`);

  if (contentSize > maxBytes) {
    throw new ContentTooLargeError(
      `Content exceeds maximum conversion size (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum: ${(maxBytes / 1024 / 1024).toFixed(2)}MB.`,
      contentSize,
      maxBytes
    );
  }

  try {
    return regexHtmlToMarkdown(html);
  } catch (error) {
    console.error('[Converter] Regex conversion failed, using plain text fallback:', error);
    // Last resort: strip all HTML and return plain text
    return htmlToPlainText(html);
  }
}

/**
 * Async version with timeout protection
 */
export async function htmlToMarkdownSafe(
  html: string,
  options?: {
    maxBytes?: number;
    timeoutMs?: number;
  }
): Promise<string> {
  const maxBytes = options?.maxBytes ?? MAX_CONVERSION_SIZE;
  const timeoutMs = options?.timeoutMs ?? 2000; // 2 second timeout
  const contentSize = getByteLength(html);

  console.log(
    `[Converter] Safe HTML to Markdown - Size: ${contentSize} bytes, Timeout: ${timeoutMs}ms`
  );

  if (contentSize > maxBytes) {
    throw new ContentTooLargeError(
      `Content exceeds maximum conversion size (${(contentSize / 1024 / 1024).toFixed(2)}MB). Maximum: ${(maxBytes / 1024 / 1024).toFixed(2)}MB.`,
      contentSize,
      maxBytes
    );
  }

  // Wrap in timeout promise
  return Promise.race([
    Promise.resolve(regexHtmlToMarkdown(html)),
    new Promise<string>((_, reject) =>
      setTimeout(
        () => reject(new ConversionTimeoutError('Conversion timed out', timeoutMs)),
        timeoutMs
      )
    ),
  ]).catch((error) => {
    console.warn('[Converter] Safe conversion failed, using plain text:', error);
    return htmlToPlainText(html);
  });
}

/**
 * Regex-based HTML to Markdown converter (memory-safe)
 * Handles common HTML elements without loading full DOM
 */
function regexHtmlToMarkdown(html: string): string {
  let markdown = html;

  // Handle code blocks first (before other replacements)
  markdown = markdown.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (match, code) => {
    // Decode HTML entities in code
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return `\n\`\`\`\n${decodedCode}\n\`\`\`\n\n`;
  });

  // Inline code
  markdown = markdown.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, '`$1`');

  // Headings (h1-h6)
  markdown = markdown.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1\n\n');

  // Bold/Strong
  markdown = markdown.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b[^>]*>([\s\S]*?)<\/b>/g, '**$1**');

  // Italic/Emphasis
  markdown = markdown.replace(/<em[^>]*>([\s\S]*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i[^>]*>([\s\S]*?)<\/i>/g, '*$1*');

  // Underline (keep as HTML since Markdown doesn't support it)
  markdown = markdown.replace(/<u[^>]*>([\s\S]*?)<\/u>/g, '<u>$1</u>');

  // Strikethrough
  markdown = markdown.replace(/<s[^>]*>([\s\S]*?)<\/s>/g, '~~$1~~');
  markdown = markdown.replace(/<strike[^>]*>([\s\S]*?)<\/strike>/g, '~~$1~~');
  markdown = markdown.replace(/<del[^>]*>([\s\S]*?)<\/del>/g, '~~$1~~');

  //Links
  markdown = markdown.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Images
  markdown = markdown.replace(
    /<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*\/?>/gi,
    '![$2]($1)'
  );
  markdown = markdown.replace(
    /<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*\/?>/gi,
    '![$1]($2)'
  );
  markdown = markdown.replace(/<img[^>]*src=["']([^"']*)["'][^>]*\/?>/gi, '![]($1)');

  // Blockquotes
  markdown = markdown.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (match, content) => {
    const lines = content.trim().split('\n');
    return lines.map((line: string) => `> ${line}`).join('\n') + '\n\n';
  });

  // Horizontal rules
  markdown = markdown.replace(/<hr[^>]*\/?>/gi, '\n---\n\n');

  // Task lists (TipTap format)
  markdown = markdown.replace(
    /<li[^>]*data-type=["']taskItem["'][^>]*data-checked=["']true["'][^>]*>([\s\S]*?)<\/li>/gi,
    '- [x] $1\n'
  );
  markdown = markdown.replace(
    /<li[^>]*data-type=["']taskItem["'][^>]*data-checked=["']false["'][^>]*>([\s\S]*?)<\/li>/gi,
    '- [ ] $1\n'
  );
  markdown = markdown.replace(
    /<li[^>]*data-type=["']taskItem["'][^>]*>([\s\S]*?)<\/li>/gi,
    '- [ ] $1\n'
  );

  // Regular list items
  markdown = markdown.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n');

  // Lists (remove wrapper tags)
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, '$1\n');
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/g, '$1\n');

  // Paragraphs
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n');

  // Line breaks
  markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

  // Divs (treat as paragraph separators)
  markdown = markdown.replace(/<div[^>]*>([\s\S]*?)<\/div>/g, '$1\n\n');

  // Tables (basic support)
  markdown = markdown.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, content) => {
    // Simple table conversion - just preserve structure
    let tableMarkdown = '\n';
    const rows = content.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

    rows.forEach((row: string, index: number) => {
      const cells = row.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/gi) || [];
      const cellContents = cells.map((cell: string) =>
        cell.replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi, '$1').trim()
      );
      tableMarkdown += '| ' + cellContents.join(' | ') + ' |\n';

      // Add separator after header row
      if (index === 0) {
        tableMarkdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
      }
    });

    return tableMarkdown + '\n';
  });

  // Remove remaining HTML tags
  markdown = markdown.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  markdown = markdown
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // Clean up excessive newlines (but preserve some structure)
  markdown = markdown.replace(/\n{4,}/g, '\n\n\n');

  return markdown.trim();
}

/**
 * Strip all HTML and return plain text (absolute fallback)
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove scripts
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove styles
    .replace(/<[^>]+>/g, ' ') // Remove all tags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Convert Markdown to HTML
 * Uses 'marked' library which is memory-efficient
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  const contentSize = getByteLength(markdown);
  console.log(`[Converter] Markdown to HTML - Size: ${contentSize} bytes`);

  // Configure marked for GitHub Flavored Markdown
  marked.setOptions({
    gfm: true,
    breaks: true,
  });

  // Custom renderer for task lists
  const renderer = new marked.Renderer();

  // Task list items
  renderer.listitem = ({ text }) => {
    if (/^\[[ x]\] /.test(text)) {
      const checked = text.startsWith('[x] ');
      const content = text.replace(/^\[[ x]\] /, '');
      return `<li data-type="taskItem" data-checked="${checked}">${content}</li>\n`;
    }
    return `<li>${text}</li>\n`;
  };

  // Code blocks with language detection
  renderer.code = ({ text, lang }) => {
    if (lang === 'mermaid') {
      return `<div data-type="mermaid" data-code="${escapeHtml(text)}"></div>`;
    }
    return `<pre><code class="language-${lang || 'plaintext'}">${escapeHtml(text)}</code></pre>`;
  };

  // Highlight (using == ==)
  renderer.text = ({ text }) => {
    const highlightRegex = /==([^=]+)==/g;
    return text.replace(highlightRegex, '<mark class="highlight">$1</mark>');
  };

  return marked(markdown, { renderer });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Extract frontmatter from markdown
 */
export function extractFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown> | null;
  content: string;
} {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: null, content: markdown };
  }

  const frontmatterText = match[1];
  const content = match[2];

  // Simple YAML parsing (basic key: value pairs)
  const frontmatter: Record<string, unknown> = {};
  frontmatterText.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim();
      frontmatter[key.trim()] = value;
    }
  });

  return { frontmatter, content };
}

/**
 * Add frontmatter to markdown
 */
export function addFrontmatter(markdown: string, frontmatter: Record<string, unknown>): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n\n${markdown}`;
}

/**
 * Extract title from markdown
 */
export function extractTitle(markdown: string): string | null {
  const titleRegex = /^#\s+(.+)$/m;
  const match = markdown.match(titleRegex);
  return match ? match[1] : null;
}

/**
 * Generate table of contents from markdown
 */
export function generateToc(markdown: string): Array<{
  level: number;
  title: string;
  slug: string;
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc: Array<{ level: number; title: string; slug: string }> = [];

  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2];
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    toc.push({ level, title, slug });
  }

  return toc;
}
