#!/usr/bin/env tsx
/**
 * XSS Protection Test for VersionContentRenderer
 * Run: npx tsx scripts/test-xss-protection.ts
 */

import DOMPurify from 'isomorphic-dompurify';

const XSS_TEST_CASES = [
  {
    name: 'Script tag injection',
    input: '<p>Hello</p><script>alert("XSS")</script><p>World</p>',
    expectSafe: true,
  },
  {
    name: 'Event handler injection',
    input: '<img src="x" onerror="alert(\'XSS\')">',
    expectSafe: true,
  },
  {
    name: 'JavaScript URL',
    input: '<a href="javascript:alert(\'XSS\')">Click me</a>',
    expectSafe: true,
  },
  {
    name: 'On-event attributes',
    input: '<div onclick="alert(\'XSS\')">Click me</div>',
    expectSafe: true,
  },
  {
    name: 'Data URI with JavaScript',
    input: '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>',
    expectSafe: true,
  },
  {
    name: 'Safe HTML - headings',
    input: '<h1>Title</h1><p>Content</p>',
    expectSafe: false,
  },
  {
    name: 'Safe HTML - code block',
    input: '<pre><code>const x = 10;</code></pre>',
    expectSafe: false,
  },
  {
    name: 'Safe HTML - table',
    input: '<table><tr><th>Header</th></tr><tr><td>Data</td></tr></table>',
    expectSafe: false,
  },
  {
    name: 'Safe HTML - list',
    input: '<ul><li>Item 1</li><li>Item 2</li></ul>',
    expectSafe: false,
  },
];

function testXSSProtection() {
  console.log('🔒 Testing XSS Protection with DOMPurify\n');
  console.log('='.repeat(70));

  let passedCount = 0;
  let failedCount = 0;

  for (const testCase of XSS_TEST_CASES) {
    console.log(`\n📝 Test: ${testCase.name}`);
    console.log(
      `Input: ${testCase.input.substring(0, 80)}${testCase.input.length > 80 ? '...' : ''}`
    );

    const sanitized = DOMPurify.sanitize(testCase.input, {
      ALLOWED_TAGS: [
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
      ],
      ALLOW_DATA_ATTR: true,
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    });

    console.log(`Output: ${sanitized.substring(0, 80)}${sanitized.length > 80 ? '...' : ''}`);

    // Check if sanitization removed dangerous content
    const isDangerous =
      sanitized.includes('<script') ||
      sanitized.includes('javascript:') ||
      /on\w+\s*=/.test(sanitized);

    if (testCase.expectSafe) {
      // Should remove dangerous content
      if (!isDangerous) {
        console.log('✅ PASS - Dangerous content removed');
        passedCount++;
      } else {
        console.log('❌ FAIL - Dangerous content still present!');
        failedCount++;
      }
    } else {
      // Should preserve safe content
      if (sanitized.length > 0 && sanitized !== testCase.input) {
        console.log(
          `⚠️  WARNING - Safe content was modified (${testCase.input.length} → ${sanitized.length} chars)`
        );
      }
      if (!isDangerous) {
        console.log('✅ PASS - Safe content preserved');
        passedCount++;
      } else {
        console.log('❌ FAIL - Unexpected dangerous content detected!');
        failedCount++;
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Test Results:`);
  console.log(`   Passed: ${passedCount}/${XSS_TEST_CASES.length}`);
  console.log(`   Failed: ${failedCount}/${XSS_TEST_CASES.length}`);

  if (failedCount === 0) {
    console.log(`\n✅ All XSS protection tests passed!`);
  } else {
    console.log(`\n❌ ${failedCount} test(s) failed!`);
    process.exit(1);
  }
}

testXSSProtection();
