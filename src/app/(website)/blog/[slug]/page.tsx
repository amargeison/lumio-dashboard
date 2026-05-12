// HIDDEN — original content contains pre-launch fabrications (fake school
// customer counts, fake "schools switching" narratives, etc.). Do not restore
// /blog route or these files to the public site without rewriting content to
// honest post-launch standards. See May 2026 audit commit for context.
//
// The route returns 404 while the underlying markdown content in
// src/content/blog and the BlogFilter / blog-content.module.css are preserved
// for future reference / rewrite.

import { notFound } from 'next/navigation'

export default function BlogArticlePage() {
  notFound()
}
