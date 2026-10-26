import { redirect } from 'next/navigation'
import { appHome } from '@/lib/app/home'

// Where the iPhone app opens (and where a notification with nothing more
// specific to show takes you). No page of its own: it sends you to your
// portal, your family page, or the sign-in page.
export const dynamic = 'force-dynamic'

export default async function AppStart() {
  redirect(await appHome())
}
