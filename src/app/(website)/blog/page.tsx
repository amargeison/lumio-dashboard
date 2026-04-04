import Link from 'next/link'
import { getAllPosts } from '@/lib/blog'
import BlogFilter from './BlogFilter'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Insights & Resources | Lumio',
  description: 'Expert thinking on school management, business operations, and the future of work.',
  openGraph: {
    title: 'Blog — Insights & Resources | Lumio',
    description: 'Expert thinking on school management, business operations, and the future of work.',
    url: 'https://lumiocms.com/blog',
    type: 'website',
  },
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Business: 'linear-gradient(135deg, #6C3FC5 0%, #0D9488 100%)',
  Schools: 'linear-gradient(135deg, #0D9488 0%, #22D3EE 100%)',
  Product: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  General: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <div style={{ backgroundColor: '#07080F', minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ paddingTop: 80, paddingBottom: 48 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: '#0D9488', marginBottom: 16 }}>
            Blog
          </p>
          <h1
            className="text-4xl md:text-5xl font-bold"
            style={{
              color: '#F9FAFB',
              background: 'linear-gradient(135deg, #F9FAFB, #9CA3AF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.15,
            }}
          >
            Insights & Resources
          </h1>
          <p className="text-lg mt-4" style={{ color: '#9CA3AF', maxWidth: 640, margin: '16px auto 0' }}>
            Expert thinking on school management, business operations, and the future of work.
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <BlogFilter
          posts={posts.map(p => ({
            slug: p.slug,
            title: p.title,
            date: formatDate(p.date),
            category: p.category,
            excerpt: p.excerpt,
            gradient: CATEGORY_GRADIENTS[p.category] || CATEGORY_GRADIENTS.General,
          }))}
        />
      </section>
    </div>
  )
}
