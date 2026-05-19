import { redirect } from 'next/navigation'

export default function JuniorDemoRedirect() {
  // Junior has two pre-mapped demo clubs (oakridge-juniors,
  // sunday-rovers-juniors). Picking oakridge-juniors as the canonical
  // /demo target — the flagship Charter Standard development club with
  // the U11 squad and demo child "Jack".
  redirect('/junior/oakridge-juniors')
}
