/**
 * Typography Utilities
 * Consistent typography system throughout the app
 */

export const typography = {
  // Headings
  h1: 'scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
  h2: 'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
  h5: 'scroll-m-20 text-lg font-semibold',
  h6: 'scroll-m-20 text-base font-semibold',

  // Body text
  body: {
    lg: 'text-lg leading-7',
    base: 'text-base leading-7',
    sm: 'text-sm leading-6',
    xs: 'text-xs leading-5',
  },

  // Labels
  label: {
    lg: 'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
    base: 'text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  },

  // Code and monospace
  code: {
    inline: 'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
    block: 'relative rounded-lg bg-muted p-4 font-mono text-sm overflow-x-auto',
  },

  // Lists
  list: {
    ul: 'my-6 ml-6 list-disc [&>li]:mt-2',
    ol: 'my-6 ml-6 list-decimal [&>li]:mt-2',
  },

  // Quotes
  blockquote: 'mt-6 border-l-2 pl-6 italic',

  // Links
  link: 'font-medium text-primary underline underline-offset-4 hover:opacity-80 transition-opacity',

  // Muted text
  muted: 'text-sm text-muted-foreground',

  // Lead paragraph
  lead: 'text-xl text-muted-foreground',
};

/**
 * Apply typography class helper
 */
export function getTypographyClass(variant: keyof typeof typography | string): string {
  if (typeof variant === 'string' && variant in typography) {
    const value = typography[variant as keyof typeof typography];
    return typeof value === 'string' ? value : '';
  }
  return '';
}

/**
 * Prose classes for rich text content
 */
export const prose = {
  base: `
    prose 
    prose-slate 
    dark:prose-invert 
    max-w-none
    prose-headings:scroll-m-20 
    prose-headings:tracking-tight
    prose-h1:text-4xl 
    prose-h1:font-bold 
    prose-h2:text-3xl 
    prose-h2:font-semibold 
    prose-h2:border-b 
    prose-h2:pb-2
    prose-h3:text-2xl 
    prose-h3:font-semibold
    prose-h4:text-xl 
    prose-h4:font-semibold
    prose-p:leading-7
    prose-a:font-medium 
    prose-a:text-primary 
    prose-a:underline 
    prose-a:underline-offset-4
    prose-blockquote:border-l-2 
    prose-blockquote:pl-6 
    prose-blockquote:italic
    prose-code:relative 
    prose-code:rounded 
    prose-code:bg-muted 
    prose-code:px-[0.3rem] 
    prose-code:py-[0.2rem] 
    prose-code:font-mono 
    prose-code:text-sm
    prose-pre:bg-muted
    prose-img:rounded-lg
  `
    .trim()
    .replace(/\s+/g, ' '),

  sm: 'prose-sm',
  lg: 'prose-lg',
  xl: 'prose-xl',
};
