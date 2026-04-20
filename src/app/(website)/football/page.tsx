import { redirect } from 'next/navigation'

// /football is the tier index — redirect straight to Pro & Academy so the
// "Football" nav item always lands on real content. Non-League and Grassroots
// have their own routes (/football/non-league, /football/grassroots).
export default function FootballIndexPage() {
  redirect('/football/pro')
}
