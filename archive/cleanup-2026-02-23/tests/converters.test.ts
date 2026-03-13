import test from 'node:test';
import assert from 'node:assert/strict';

import { htmlToMarkdownSafe, htmlToMarkdown, ContentTooLargeError } from '../src/lib/converters';

test('converts simple paragraph', async () => {
  const html = '<p>hi</p>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.equal(markdown.trim(), 'hi');
});

test('converts nested divs with paragraphs', async () => {
  const html = '<div><p>A</p><p>B</p></div>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('A'));
  assert.ok(markdown.includes('B'));
});

test('handles malformed HTML without crashing', async () => {
  const html = '<p>Unclosed paragraph<div>nested<span>content';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.length > 0, 'Should return some content');
  assert.ok(markdown.includes('Unclosed'), 'Should preserve text content');
});

test('converts headings correctly', async () => {
  const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('# Title'), 'H1 should convert to # ');
  assert.ok(markdown.includes('## Subtitle'), 'H2 should convert to ##');
  assert.ok(markdown.includes('### Section'), 'H3 should convert to ###');
});

test('converts bold and italic formatting', async () => {
  const html = '<p><strong>bold</strong> and <em>italic</em> and <b>also bold</b></p>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('**bold**'), 'Should convert strong to **');
  assert.ok(markdown.includes('*italic*'), 'Should convert em to *');
});

test('converts links correctly', async () => {
  const html = '<a href="https://example.com">Example Link</a>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.equal(markdown.trim(), '[Example Link](https://example.com)');
});

test('converts images', async () => {
  const html = '<img src="/image.png" alt="Test Image"/>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('![Test Image](/image.png)'), 'Should convert img to ![alt](src)');
});

test('converts code blocks', async () => {
  const html = '<pre><code>const x = 42;</code></pre>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('```'), 'Should use fenced code blocks');
  assert.ok(markdown.includes('const x = 42;'), 'Should preserve code content');
});

test('converts inline code', async () => {
  const html = '<p>Use <code>console.log()</code> for debugging</p>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('`console.log()`'), 'Should convert code to backticks');
});

test('converts task lists (TipTap format)', async () => {
  const html = `
    <ul>
      <li data-type="taskItem" data-checked="true">Completed task</li>
      <li data-type="taskItem" data-checked="false">Pending task</li>
    </ul>
  `;
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('- [x] Completed task'), 'Should convert checked task');
  assert.ok(markdown.includes('- [ ] Pending task'), 'Should convert unchecked task');
});

test('converts regular lists', async () => {
  const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('- Item 1'), 'Should convert list items');
  assert.ok(markdown.includes('- Item 2'), 'Should convert list items');
});

test('converts blockquotes', async () => {
  const html = '<blockquote>This is a quote</blockquote>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('> This is a quote'), 'Should convert blockquote to >');
});

test('handles HTML entities', async () => {
  const html = '<p>&lt;tag&gt; &amp; &quot;quotes&quot;</p>';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('<tag>'), 'Should decode &lt; and &gt;');
  assert.ok(markdown.includes('&'), 'Should decode &amp;');
  assert.ok(markdown.includes('"quotes"'), 'Should decode &quot;');
});

test('rejects content exceeding maxBytes limit', async () => {
  const largeHtml = '<p>' + 'x'.repeat(2 * 1024 * 1024) + '</p>'; // 2MB
  await assert.rejects(
    async () => await htmlToMarkdownSafe(largeHtml, { maxBytes: 1 * 1024 * 1024 }),
    ContentTooLargeError,
    'Should throw ContentTooLargeError for content > 1MB'
  );
});

test('respects timeout and falls back to plain text', async () => {
  const html = '<p>Normal content</p>';
  // Even with very short timeout, should fall back gracefully (not crash)
  const markdown = await htmlToMarkdownSafe(html, { timeoutMs: 1 });
  assert.ok(markdown.length > 0, 'Should return fallback content');
});

test('handles empty HTML', async () => {
  const html = '';
  const markdown = await htmlToMarkdownSafe(html);
  assert.equal(markdown, '', 'Empty HTML should return empty string');
});

test('handles only whitespace HTML', async () => {
  const html = '   \n  \t  ';
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.length === 0 || markdown.trim() === '', 'Whitespace should be trimmed');
});

test('handles deeply nested HTML without stack overflow', async () => {
  let html = '<div>';
  for (let i = 0; i < 100; i++) {
    html += '<div><p>Level ' + i + '</p>';
  }
  for (let i = 0; i < 100; i++) {
    html += '</div>';
  }
  html += '</div>';

  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.length > 0, 'Should handle deeply nested HTML');
  assert.ok(markdown.includes('Level 0'), 'Should preserve content');
});

test('converts complex TipTap document', async () => {
  const html = `
    <h1>Project Documentation</h1>
    <p>This is the <strong>main</strong> documentation.</p>
    <h2>Features</h2>
    <ul>
      <li data-type="taskItem" data-checked="true">Authentication</li>
      <li data-type="taskItem" data-checked="false">GitHub Integration</li>
    </ul>
    <h2>Code Example</h2>
    <pre><code>function hello() {
  return "world";
}</code></pre>
    <p>Visit <a href="https://example.com">our website</a> for more info.</p>
  `;
  const markdown = await htmlToMarkdownSafe(html);

  assert.ok(markdown.includes('# Project Documentation'), 'Should have H1');
  assert.ok(markdown.includes('**main**'), 'Should have bold');
  assert.ok(markdown.includes('## Features'), 'Should have H2');
  assert.ok(markdown.includes('- [x] Authentication'), 'Should have checked task');
  assert.ok(markdown.includes('- [ ] GitHub Integration'), 'Should have unchecked task');
  assert.ok(markdown.includes('```'), 'Should have code block');
  assert.ok(markdown.includes('function hello'), 'Should preserve code');
  assert.ok(markdown.includes('[our website](https://example.com)'), 'Should have link');
});

test('synchronous htmlToMarkdown works the same way', () => {
  const html = '<p><strong>Hello</strong> <em>World</em></p>';
  const markdown = htmlToMarkdown(html);
  assert.ok(markdown.includes('**Hello**'), 'Should convert strong');
  assert.ok(markdown.includes('*World*'), 'Should convert em');
});

test('handles tables', async () => {
  const html = `
    <table>
      <tr><th>Name</th><th>Age</th></tr>
      <tr><td>Alice</td><td>30</td></tr>
      <tr><td>Bob</td><td>25</td></tr>
    </table>
  `;
  const markdown = await htmlToMarkdownSafe(html);
  assert.ok(markdown.includes('Name'), 'Should preserve table headers');
  assert.ok(markdown.includes('Alice'), 'Should preserve table data');
  assert.ok(markdown.includes('|'), 'Should use markdown table syntax');
});
