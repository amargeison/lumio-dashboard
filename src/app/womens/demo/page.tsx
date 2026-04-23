import { redirect } from 'next/navigation'

export default function WomensDemoRedirect() {
  // Womens has two pre-mapped demo clubs (oakridge-women, harfield-women).
  // Picking oakridge-women as the canonical /demo target for consistency
  // with football pro's Oakridge theme.
  redirect('/womens/oakridge-women')
}
