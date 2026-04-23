import { redirect } from 'next/navigation'

export default function GrassrootsDemoRedirect() {
  // Grassroots portal is hardcoded to "Sunday Rovers FC" regardless of slug;
  // the canonical demo URL uses the matching slug for clarity.
  redirect('/football/grassroots/sunday-rovers-fc')
}
