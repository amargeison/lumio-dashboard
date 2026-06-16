// Canonical coach portal lives at /tennis/coach/[slug] (e.g. /tennis/coach/demo).
// Re-export the coach layout so this route emits the same per-slug PWA manifest
// link, theme colour and iOS standalone tags as the implementation under
// /coach/[slug] — without duplicating the metadata logic. The manifest it links
// (/coach/<slug>/m/anon/...) now carries the tennis-scoped start_url/scope.
export { default, generateMetadata, viewport } from '@/app/coach/[slug]/layout'
