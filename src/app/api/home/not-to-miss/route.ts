import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    items: [
      { id: '1', urgency: 'critical', title: 'Stripe is still in TEST MODE', body: 'You have paying customers but Stripe is not live. Any payments will be rejected silently.', deadline: 'Before first invoice', consequence: 'Payments will silently fail', action: 'Switch Stripe live', actionUrl: 'https://dashboard.stripe.com/settings/account', category: 'Finance', dismissed: false },
      { id: '2', urgency: 'critical', title: 'Company not yet registered', body: 'You cannot legally sign customer contracts, hold IP, or accept money as an unregistered entity. Takes 24 hours and costs £12 at Companies House.', deadline: 'Before any contract signing', consequence: 'Contracts are unenforceable', action: 'Register at Companies House', actionUrl: 'https://www.gov.uk/limited-company-formation', category: 'Legal', dismissed: false },
      { id: '3', urgency: 'today', title: 'The Feed Network go-live is imminent', body: 'Testing guide has 13 flagged gaps. 6 phases need sign-off. Go-live is blocked until this is complete.', deadline: 'This week', consequence: 'Delays first revenue', action: 'Open testing guide', category: 'Operations', dismissed: false },
      { id: '4', urgency: 'today', title: 'Update Calendly link in the website nav', body: 'The "Book a Demo" button links to a placeholder. Every visitor who tries to book a demo hits a broken link.', deadline: 'Today', consequence: 'Lost demo bookings', action: 'Update in code', category: 'Marketing', dismissed: false },
      { id: '5', urgency: 'soon', title: 'Trademark "Lumio" before you scale marketing', body: 'IPO Class 42 registration. Check for conflicts — there is a US edtech company called Lumio. UK trademark costs £170.', deadline: 'Before major marketing push', consequence: 'Brand protection risk', action: 'Search IPO register', actionUrl: 'https://trademarks.ipo.gov.uk/ipo-tmcase/page/Results/1/', category: 'Legal', dismissed: false },
    ],
  })
}
