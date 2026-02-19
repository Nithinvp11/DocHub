// Mock implementation for converters to avoid ESM issues
export function extractTitle(markdown: string): string | null {
  const titleRegex = /^#\s+(.+)$/m
  const match = markdown.match(titleRegex)
  return match ? match[1] : null
}

export function generateToc(markdown: string): Array<{
  level: number
  title: string
  slug: string
}> {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm
  const toc: Array<{ level: number; title: string; slug: string }> = []
  
  let match
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const title = match[2]
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
    
    toc.push({ level, title, slug })
  }
  
  return toc
}

export function extractFrontmatter(markdown: string): {
  frontmatter: Record<string, unknown> | null
  content: string
} {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---\n([\s\S]*)$/
  const match = markdown.match(frontmatterRegex)
  
  if (!match) {
    return { frontmatter: null, content: markdown }
  }
  
  const frontmatterText = match[1]
  const content = match[2]
  
  const frontmatter: Record<string, unknown> = {}
  frontmatterText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':')
    if (key && valueParts.length) {
      const value = valueParts.join(':').trim()
      frontmatter[key.trim()] = value
    }
  })
  
  return { frontmatter, content }
}

export function addFrontmatter(
  markdown: string,
  frontmatter: Record<string, unknown>
): string {
  const lines = Object.entries(frontmatter).map(([key, value]) => `${key}: ${value}`)
  return `---\n${lines.join('\n')}\n---\n\n${markdown}`
}
