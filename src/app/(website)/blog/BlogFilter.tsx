'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PostCard {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  gradient: string
}

const CATEGORIES = ['All', 'Schools', 'Business', 'Product']

export default function BlogFilter({ posts }: { posts: PostCard[] }) {
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? posts : posts.filter(p => p.category === active)

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-10 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: active === cat ? '#0D9488' : '#111318',
              color: active === cat ? '#F9FAFB' : '#9CA3AF',
              border: `1px solid ${active === cat ? '#0D9488' : '#1F2937'}`,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(post => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-xl overflow-hidden transition-all"
            style={{ backgroundColor: '#111318', border: '1px solid #1F2937' }}
          >
            {/* Gradient image placeholder */}
            <div style={{ height: 180, background: post.gradient, position: 'relative' }}>
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.15)' }}
              >
                <span className="text-6xl font-black" style={{ color: 'rgba(255,255,255,0.08)' }}>
                  {post.title.charAt(0)}
                </span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xs font-semibold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(13,148,136,0.15)', color: '#0D9488' }}
                >
                  {post.category}
                </span>
                <span className="text-xs" style={{ color: '#6B7280' }}>{post.date}</span>
              </div>
              <h2
                className="text-lg font-bold mb-2 group-hover:underline decoration-1 underline-offset-4"
                style={{ color: '#F9FAFB', lineHeight: 1.35 }}
              >
                {post.title}
              </h2>
              <p className="text-sm line-clamp-2" style={{ color: '#9CA3AF', lineHeight: 1.6 }}>
                {post.excerpt}
              </p>
              <span
                className="inline-block mt-4 text-sm font-medium transition-colors"
                style={{ color: '#0D9488' }}
              >
                Read more →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center py-20 text-sm" style={{ color: '#6B7280' }}>
          No articles in this category yet.
        </p>
      )}
    </>
  )
}
