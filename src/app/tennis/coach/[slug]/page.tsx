// Serves the Lumio Coach portal at /tennis/coach/[slug] (e.g. /tennis/coach/demo).
// The portal itself lives at src/app/coach/[slug]/ — this thin route re-exports
// it so it's reachable under the /tennis/coach path without duplicating code.
export { default } from '@/app/coach/[slug]/page'
