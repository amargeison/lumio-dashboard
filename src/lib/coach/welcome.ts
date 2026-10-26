// The welcome link's email (pure — no database, no browser).
//
// "I am using a new coaching app" is the natural moment to ask a client for
// three things at once: the questionnaire, a card or Direct Debit for lessons,
// and (when the coach has set one up) agreement to their monthly plan.

const esc = (x: unknown) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function welcomeMessage(o: {
  hello: string; childFirst: string | null; coachName: string | null; academy: string; logoUrl?: string | null
  url: string; minutes: number; askCard: boolean; plan: string | null
}): { subject: string; text: string; html: string } {
  const who = o.coachName || o.academy
  const whose = o.childFirst ? `${o.childFirst}’s` : 'your'
  const asks = [
    `tells me where ${whose} tennis is now and where you’d like it to go`,
    o.askCard ? 'lets you save a card or Direct Debit for lessons' : '',
    o.plan ? `confirms ${whose} monthly plan (${o.plan})` : '',
  ].filter(Boolean)
  const list = asks.length > 1 ? `${asks.slice(0, -1).join(', ')} and ${asks[asks.length - 1]}` : asks[0]
  const p1 = `I’ve started using Lumio for my bookings, lesson notes and payments. To get ${o.childFirst || 'you'} set up, could you spend about ${o.minutes} minutes on this short form? It ${list}.`
  const p2 = 'Your answers help me plan lessons around what you want from your tennis.'
  const subject = `${o.academy}: getting ${o.childFirst || 'you'} set up`
  const text = `${o.hello}\n\n${p1}\n\n${p2}\n\n${o.url}\n\n${who}`
  const html = `<!doctype html><html><body style="margin:0;background:#eef0f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:26px 18px">
    ${o.logoUrl ? `<div style="text-align:center;margin-bottom:16px"><img src="${esc(o.logoUrl)}" alt="" style="height:46px;max-width:150px;object-fit:contain"></div>` : ''}
    <div style="background:#fff;border-radius:14px;padding:22px 24px;box-shadow:0 2px 12px rgba(20,25,40,.07)">
      <p style="font-size:16px;color:#1a1d29;margin:0 0 10px">${esc(o.hello)}</p>
      <p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(p1)}</p>
      <p style="font-size:15.5px;color:#374151;margin:0 0 10px;line-height:1.6">${esc(p2)}</p>
      <p style="text-align:center;margin:18px 0 6px"><a href="${esc(o.url)}" style="display:inline-block;background:#3A8EE0;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:14px 26px;border-radius:12px">Start (about ${o.minutes} minutes) →</a></p>
      <p style="font-size:14px;color:#6b7280;margin:16px 0 0">${esc(who)}</p>
    </div>
    <p style="font-size:12px;color:#9aa1ad;text-align:center;margin:14px 0 0;line-height:1.5">${esc(o.academy)} · sent through Lumio · reply to this email to reach your coach</p>
  </div></body></html>`
  return { subject, text, html }
}
