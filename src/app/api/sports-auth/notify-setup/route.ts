import { NextRequest, NextResponse } from 'next/server'

const SPORT_CREDENTIALS: Record<string, { name: string; why: string; powers: string }[]> = {
  darts: [
    { name: 'DartConnect username', why: 'Links your match history and live scoring', powers: 'Match results, career stats, live scores' },
    { name: 'PDC membership ID', why: 'Pulls your official Order of Merit ranking', powers: 'PDC ranking tracker, Race to Ally Pally, points breakdown' },
    { name: 'Practice tracker preference (DartCounter / Lidarts / DartsForData)', why: 'Syncs your practice sessions automatically', powers: 'Practice log, doubles %, checkout trends' },
    { name: 'Home airport (e.g. MAN, LHR)', why: 'Pre-fills Smart Flights for every PDC venue', powers: 'Smart Flights AI, hotel finder, travel planner' },
    { name: 'Walk-on music track + BPM', why: 'Manages broadcaster clearances across Northbridge Sport, DAZN, Crown TV, Crown Broadcasting', powers: 'Walk-on Music Manager, broadcaster approvals' },
    { name: 'Sponsor names and contact emails', why: 'Tracks obligations and renewal dates', powers: 'Sponsorship pipeline, Social Media AI, media obligations' },
  ],
  tennis: [
    { name: 'ATP/WTA member ID', why: 'Pulls your live ranking and points breakdown', powers: 'Rankings tracker, Race to Finals, points expiry' },
    { name: 'Lumio Vision account email', why: 'Syncs match video and shot analytics (coming soon)', powers: 'GPS court heatmap, shot analysis, serve stats' },
    { name: 'Coach email', why: 'Connects your coach to the team hub', powers: 'Team hub, coach messaging, practice notes' },
    { name: 'Home airport', why: 'Pre-fills Smart Flights for every tour destination', powers: 'Smart Flights AI, hotel finder, travel planner' },
    { name: 'Sponsor names and contact emails', why: 'Tracks obligations and renewal dates', powers: 'Sponsorship pipeline, Social Media AI' },
  ],
  golf: [
    { name: 'DP World Tour / PGA Tour member ID', why: 'Pulls your OWGR ranking and exemption status', powers: 'OWGR tracker, course fit scores, exemption dashboard' },
    { name: 'Lumio Range account email', why: 'Syncs your strokes gained and round data', powers: 'Strokes Gained analysis, GPS course heatmap, practice log' },
    { name: 'Home airport', why: 'Pre-fills Smart Flights for every tour stop', powers: 'Smart Flights AI, hotel finder, travel planner' },
    { name: 'Caddie name and contact', why: 'Connects your caddie to the hub', powers: 'Caddie hub, yardage books, pre-round notes' },
    { name: 'Sponsor names and contact emails', why: 'Tracks obligations and renewal dates', powers: 'Sponsorship pipeline, Social Media AI, pro-am tracker' },
  ],
  boxing: [
    { name: 'BoxRec profile URL', why: 'Imports your full fight record', powers: 'Fight record, career stats, opponent research' },
    { name: 'Promoter name and contact email', why: 'Connects your promoter to the pipeline', powers: 'Promoter pipeline, purse simulator, contract tracker' },
    { name: 'Manager / trainer name and email', why: 'Connects your team to the hub', powers: 'Team hub, camp management, trainer notes' },
    { name: 'Weight class', why: 'Configures rankings and mandatory challenger tracking', powers: 'World rankings, Path to Title, mandatory challengers' },
    { name: 'GPS vest model (if any — Lumio GPS or compatible)', why: 'Syncs punch data and physical load', powers: 'GPS ring heatmap, punch analytics, camp load monitoring' },
    { name: 'Home gym name and location', why: 'Sets up camp mode and sparring log', powers: 'Fight Camp Mode, sparring log, weight tracker' },
  ],
}

export async function POST(req: NextRequest) {
  try {
    const { name, sport, email, phone, clubName, location, portalSlug, setupType, integrations } = await req.json()
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ ok: true })

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const esc = (v: unknown) => {
      const s = v == null ? '' : String(v)
      return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
    }
    const dash = '<span style="color:#374151">—</span>'
    const val = (v: unknown) => (v && String(v).trim()) ? esc(v) : dash
    const sectionStart = (title: string) => `
      <div style="margin-top:24px">
        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#22c55e;margin-bottom:8px">${esc(title)}</p>
        <table style="width:100%;border-collapse:collapse">`
    const sectionEnd = `</table></div>`
    const row = (label: string, value: string) => `<tr><td style="padding:6px 0;font-size:13px;color:#9CA3AF;width:40%">${esc(label)}</td><td style="padding:6px 0;font-size:13px;color:#F5F5F5">${value}</td></tr>`

    let integrationsHtml = ''
    if (integrations && typeof integrations === 'object') {
      const ig = integrations as {
        fields?: Record<string, string>;
        airport?: string; airportName?: string; gymLocation?: string;
        tracker?: string; sanctioningBodies?: string[]; weightClass?: string;
        walkon?: string; bpm?: string;
        caddieeName?: string; caddiePhone?: string;
        email?: string; phone?: string;
        team?: { name: string; role: string }[];
        sponsors?: { name: string; email: string; cat: string }[];
      }
      const contactEmail = ig.email || email
      const contactPhone = ig.phone || phone
      const bpmVal = (ig.bpm && String(ig.bpm).trim())
        ? esc(ig.bpm)
        : `${dash} <span style="color:#6B7280;font-size:12px">auto-detect on setup</span>`

      integrationsHtml += sectionStart('Contact details')
        + row('Email', val(contactEmail))
        + row('Phone', val(contactPhone))
        + sectionEnd

      const sportRows: string[] = []
      if (ig.fields && typeof ig.fields === 'object') {
        for (const [k, v] of Object.entries(ig.fields)) {
          sportRows.push(row(k, val(v)))
        }
      }
      if (ig.airport) {
        const airportDisplay = ig.airportName ? `${esc(ig.airport)} (${esc(ig.airportName)})` : esc(ig.airport)
        sportRows.push(row('Home airport', airportDisplay))
      } else if (ig.gymLocation) {
        sportRows.push(row('Home gym', val(ig.gymLocation)))
      }
      if (Array.isArray(ig.sanctioningBodies) && ig.sanctioningBodies.length > 0) {
        sportRows.push(row('Sanctioning bodies', esc(ig.sanctioningBodies.join(', '))))
      }
      if (ig.weightClass) {
        sportRows.push(row('Weight class', val(ig.weightClass)))
      }
      if (ig.tracker) {
        sportRows.push(row('Practice tracker', val(ig.tracker)))
      }
      if (sportRows.length > 0) {
        integrationsHtml += sectionStart('Sport & Setup') + sportRows.join('') + sectionEnd
      }

      if (ig.walkon) {
        integrationsHtml += sectionStart('Walk-on music')
          + row('Track', val(ig.walkon))
          + row('BPM', bpmVal)
          + sectionEnd
      }

      if (ig.caddieeName) {
        integrationsHtml += sectionStart('Caddie')
          + row('Name', val(ig.caddieeName))
          + row('Phone', val(ig.caddiePhone))
          + sectionEnd
      }

      if (Array.isArray(ig.team) && ig.team.length > 0) {
        integrationsHtml += sectionStart('Team members')
          + ig.team.map(t => row(t.role, esc(t.name))).join('')
          + sectionEnd
      }
      if (Array.isArray(ig.sponsors) && ig.sponsors.length > 0) {
        integrationsHtml += sectionStart('Sponsors')
          + ig.sponsors.map(s => row(s.cat, `${esc(s.name)}${s.email ? ` <span style="color:#6B7280">(${esc(s.email)})</span>` : ''}`)).join('')
          + sectionEnd
      }
      integrationsHtml += `
        <div style="margin-top:32px;padding:16px;background:#0d1117;border-radius:10px;border:1px solid #1F2937">
          <p style="font-size:12px;color:#6B7280;margin:0">Setup checklist — mark off as you complete each integration during onboarding.</p>
        </div>`
    }

    // EMAIL 1 — Internal notification to support
    await resend.emails.send({
      from: 'Lumio Sports <hello@lumiocms.com>',
      to: 'support@lumiosports.com',
      subject: `New onboarding request — ${sport} — ${name}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#07080F;color:#F9FAFB;padding:32px;border-radius:12px;">
          <h2 style="color:#fff;margin-bottom:4px;">New portal setup request</h2>
          <p style="color:#6B7280;font-size:13px;margin-bottom:24px;">Action required — founding member needs onboarding</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Name</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${name}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Email</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${email}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Sport</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${sport}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Club / Brand</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${clubName || 'Not set'}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Location</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${location || 'Not set'}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Portal URL</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">lumiosports.com/${sport}/${portalSlug}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;border-bottom:1px solid #1F2937;">Setup type</td><td style="color:#fff;padding:8px 0;border-bottom:1px solid #1F2937;">${setupType}</td></tr>
            <tr><td style="color:#6B7280;padding:8px 0;">Signed up</td><td style="color:#fff;padding:8px 0;">${new Date().toLocaleString('en-GB')}</td></tr>
          </table>
          <a href="https://lumiosports.com/sports-admin/users" style="display:inline-block;margin-top:24px;background:#6C3FC5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View in Sports Admin →</a>
          ${integrationsHtml}
        </div>
      `
    })

    // EMAIL 2 — User email with what we need from them
    const credentials = SPORT_CREDENTIALS[sport] || []
    if (credentials.length > 0) {
      await resend.emails.send({
        from: 'Lumio Sports <hello@lumiocms.com>',
        to: email,
        subject: `Getting your ${sport} portal ready — here's what we need from you`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#07080F;color:#F9FAFB;padding:32px;border-radius:12px;">
            <img src="https://www.lumiosports.com/${sport}_logo.png" width="56" height="56" style="display:block;margin:0 auto 16px;object-fit:contain;" />
            <h2 style="color:#fff;text-align:center;margin-bottom:8px;">Hi ${name} — your portal setup has started</h2>
            <p style="color:#6B7280;text-align:center;font-size:14px;margin-bottom:32px;">Our team will have your portal configured within 2–3 business days. To get started, we need a few details from you. Simply reply to this email with the information below.</p>
            <h3 style="color:#fff;font-size:16px;margin-bottom:16px;">What we need from you:</h3>
            ${credentials.map((c, i) => `
              <div style="background:#0d1117;border:1px solid #1F2937;border-radius:10px;padding:16px;margin-bottom:12px;">
                <div style="display:flex;align-items:flex-start;gap:12px;">
                  <div style="background:#6C3FC520;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#a78bfa;font-weight:700;font-size:13px;">${i + 1}</div>
                  <div>
                    <div style="color:#fff;font-weight:700;font-size:14px;margin-bottom:4px;">${c.name}</div>
                    <div style="color:#6B7280;font-size:12px;margin-bottom:6px;">${c.why}</div>
                    <div style="color:#a78bfa;font-size:11px;">Powers: ${c.powers}</div>
                  </div>
                </div>
              </div>
            `).join('')}
            <div style="background:#6C3FC510;border:1px solid #6C3FC530;border-radius:10px;padding:16px;margin-top:24px;">
              <p style="color:#C4B5FD;font-size:13px;margin:0;"><strong>Just reply to this email</strong> with the details above and we'll handle everything else. You don't need to do anything technical — that's our job.</p>
            </div>
            <p style="color:#4B5563;font-size:12px;text-align:center;margin-top:24px;">Questions? Just reply to this email — a real person reads every one.</p>
          </div>
        `
      })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[notify-setup] Error:', e)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
