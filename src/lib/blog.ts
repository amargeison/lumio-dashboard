import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog')

export interface BlogPost {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  author: string
  image?: string
  content: string       // raw markdown
  htmlContent?: string  // rendered HTML
}

function parseMdx(filePath: string): BlogPost {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const slug = path.basename(filePath, '.mdx')
  return {
    slug,
    title: data.title || slug,
    date: data.date || '2026-01-01',
    category: data.category || 'General',
    excerpt: data.excerpt || '',
    author: data.author || 'Lumio Team',
    image: data.image || undefined,
    content,
  }
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => parseMdx(path.join(CONTENT_DIR, f)))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  return fs
    .readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => f.replace('.mdx', ''))
}

export async function getPostBySlug(slug: string): Promise<BlogPost & { htmlContent: string }> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  const post = parseMdx(filePath)

  const result = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(post.content)

  return { ...post, htmlContent: String(result) }
}

export function getRelatedPosts(currentSlug: string, category: string, limit = 3): BlogPost[] {
  return getAllPosts()
    .filter(p => p.slug !== currentSlug)
    .sort((a, b) => (a.category === category ? -1 : 1) - (b.category === category ? -1 : 1))
    .slice(0, limit)
}
