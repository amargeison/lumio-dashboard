import { redirect } from 'next/navigation'

export default function NonLeagueDemoRedirect() {
  // Non-league portal is hardcoded to "Harfield FC" content regardless of
  // slug, so the canonical demo URL just uses the matching slug for clarity.
  redirect('/football/nonleague/harfield-fc')
}
