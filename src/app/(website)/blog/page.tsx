import { headers } from 'next/headers'
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
  Football: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  Rugby: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  Tennis: 'linear-gradient(135deg, #A3E635 0%, #65A30D 100%)',
  Golf: 'linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)',
  Darts: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  Boxing: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
  Cricket: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
  "Women's Football": 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  General: 'linear-gradient(135deg, #1F2937 0%, #374151 100%)',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const SPORTS_CATEGORIES = new Set([
  'Football', 'Rugby', 'Tennis', 'Golf', 'Darts', 'Boxing', 'Cricket',
  "Women's Football", 'Product · Football', 'Club Stories', 'Player Stories',
  'Product', 'General',
])

export default async function BlogPage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const isSports = host.includes('lumiosports')

  const allPosts = getAllPosts()
  const posts = isSports
    ? allPosts.filter((p: { category: string }) => SPORTS_CATEGORIES.has(p.category) && p.category !== 'Schools' && p.category !== 'Business')
    : allPosts

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
            {isSports ? 'Lumio Sports — Insights & Intelligence' : 'Insights & Resources'}
          </h1>
          <p className="text-lg mt-4" style={{ color: '#9CA3AF', maxWidth: 640, margin: '16px auto 0' }}>
            {isSports
              ? 'Analysis, features and stories from across professional sport.'
              : 'Expert thinking on school management, business operations, and the future of work.'}
          </p>
        </div>
      </section>

      {/* Filter + Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px 80px' }}>
        <BlogFilter
          isSports={isSports}
          posts={posts.map((p: { slug: string; title: string; date: string; category: string; excerpt: string }) => ({
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
