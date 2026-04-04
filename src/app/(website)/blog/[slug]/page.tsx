import Link from 'next/link'
import { getAllSlugs, getPostBySlug, getRelatedPosts } from '@/lib/blog'
import type { Metadata } from 'next'
import styles from '../blog-content.module.css'

export const dynamicParams = false

export function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  return {
    title: `${post.title} | Lumio Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      url: `https://lumiocms.com/blog/${slug}`,
    },
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractHeadings(html: string): { id: string; text: string; level: number }[] {
  const regex = /<h([23])[^>]*>([^<]+)<\/h[23]>/g
  const headings: { id: string; text: string; level: number }[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[2]
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    headings.push({ id, text, level: parseInt(match[1]) })
  }
  return headings
}

function addHeadingIds(html: string): string {
  return html.replace(/<h([23])>([^<]+)<\/h[23]>/g, (_match, level, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `<h${level} id="${id}">${text}</h${level}>`
  })
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  const related = getRelatedPosts(slug, post.category, 3)
  const htmlWithIds = addHeadingIds(post.htmlContent)
  const headings = extractHeadings(htmlWithIds)

  const CATEGORY_GRADIENTS: Record<string, string> = {
    Business: 'linear-gradient(135deg, #6C3FC5 0%, #0D9488 100%)',
    Schools: 'linear-gradient(135deg, #0D9488 0%, #22D3EE 100%)',
    Product: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    General: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
  }

  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
      {/* Back link */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0' }}>
        <Link
          href="/blog"
          className="text-sm font-medium transition-colors"
          style={{ color: '#0D9488' }}
        >
          ← Back to Blog
        </Link>
      </div>

      {/* Article header */}
      <header style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 0', textAlign: 'center' }}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}
          >
            {post.category}
          </span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{formatDate(post.date)}</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>·</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{post.author}</span>
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold"
          style={{ color: '#F9FAFB', lineHeight: 1.2, marginBottom: 16 }}
        >
          {post.title}
        </h1>
        <p className="text-lg" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
          {post.excerpt}
        </p>
      </header>

      {/* Content + TOC */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div className="flex gap-12">
          {/* Article body */}
          <article
            className={`flex-1 min-w-0 ${styles.blogContent}`}
            style={{ maxWidth: 760 }}
            dangerouslySetInnerHTML={{ __html: htmlWithIds }}
          />

          {/* Table of contents — desktop only */}
          {headings.length > 0 && (
            <aside className="hidden lg:block shrink-0" style={{ width: 240, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#6B7280' }}>
                On this page
              </p>
              <nav className="flex flex-col gap-2">
                {headings.map(h => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="text-sm transition-colors hover:underline"
                    style={{
                      color: '#9CA3AF',
                      paddingLeft: h.level === 3 ? 16 : 0,
                    }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </aside>
          )}
        </div>
      </div>

      {/* Related articles */}
      {related.length > 0 && (
        <section style={{ borderTop: '1px solid #1F2937', padding: '64px 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 className="text-xl font-bold mb-8" style={{ color: '#F9FAFB' }}>Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map(r => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="group rounded-xl overflow-hidden transition-all"
                  style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
                >
                  <div style={{ height: 120, background: CATEGORY_GRADIENTS[r.category] || CATEGORY_GRADIENTS.General }} />
                  <div className="p-5">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}
                    >
                      {r.category}
                    </span>
                    <h3 className="text-sm font-bold mt-3 group-hover:underline" style={{ color: '#F9FAFB', lineHeight: 1.4 }}>
                      {r.title}
                    </h3>
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: '#9CA3AF' }}>{r.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
