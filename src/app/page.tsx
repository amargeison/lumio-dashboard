import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isSportsDomain = host.includes('lumiosports.com')

  if (isSportsDomain) {
    redirect('/sports')
  }

  // Default: redirect to /home (normal Lumio homepage)
  redirect('/home')
}
