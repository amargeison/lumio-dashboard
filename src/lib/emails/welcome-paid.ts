export function welcomePaidEmail({ name, slug }: { name: string; slug: string }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#07080F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px">

    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px">
      <img src="https://lumiocms.com/lumio-logo-primary.png" alt="Lumio" style="height:40px">
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#1a0533,#0f172a);border-radius:16px;padding:40px;margin-bottom:24px;border:1px solid #1F2937">
      <h1 style="color:#F9FAFB;font-size:28px;font-weight:800;margin:0 0 8px">Welcome to Lumio, ${name}! 🎉</h1>
      <p style="color:#9CA3AF;font-size:16px;margin:0 0 24px">Your workspace is live at <a href="https://lumiocms.com/${slug}" style="color:#0D9488">lumiocms.com/${slug}</a></p>
      <a href="https://lumiocms.com/${slug}" style="display:inline-block;background:#0D9488;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">Open My Workspace →</a>
    </div>

    <!-- Video CTAs -->
    <div style="margin-bottom:24px">
      <h2 style="color:#F9FAFB;font-size:18px;font-weight:700;margin:0 0 16px">🎬 Get up to speed in minutes</h2>
      <div style="display:grid;gap:12px">

        <a href="https://lumiocms.com/demo/walkthrough" style="display:block;background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px;text-decoration:none">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;background:rgba(13,148,136,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">▶️</div>
            <div>
              <div style="color:#F9FAFB;font-weight:700;font-size:14px">1-Minute Platform Walkthrough</div>
              <div style="color:#6B7280;font-size:12px;margin-top:2px">See Lumio running for a real UK business — CRM, HR, workflows and more</div>
            </div>
          </div>
        </a>

        <a href="https://lumiocms.com/demo/getting-started" style="display:block;background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px;text-decoration:none">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:48px;height:48px;background:rgba(108,63,197,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">🚀</div>
            <div>
              <div style="color:#F9FAFB;font-weight:700;font-size:14px">Getting Started in 1 Meeting</div>
              <div style="color:#6B7280;font-size:12px;margin-top:2px">Everything you need to go live with your team — step by step</div>
            </div>
          </div>
        </a>

      </div>
    </div>

    <!-- Features Grid -->
    <div style="margin-bottom:24px">
      <h2 style="color:#F9FAFB;font-size:18px;font-weight:700;margin:0 0 16px">✨ What's waiting for you</h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">📊</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">Live Dashboards</div>
          <div style="color:#6B7280;font-size:12px">Real-time insights across every department — sales, HR, finance and more</div>
        </div>

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">⚡</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">150+ Workflows</div>
          <div style="color:#6B7280;font-size:12px">Automate your most repetitive tasks from day one — no coding needed</div>
        </div>

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">🏆</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">Quick Wins</div>
          <div style="color:#6B7280;font-size:12px">Your personalised action list — the fastest ways to move the needle today</div>
        </div>

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">🤖</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">ARIA AI Assistant</div>
          <div style="color:#6B7280;font-size:12px">Your AI business co-pilot — briefings, insights, and answers on demand</div>
        </div>

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">📈</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">CRM & Pipeline</div>
          <div style="color:#6B7280;font-size:12px">Track every lead, deal, and customer interaction in one place</div>
        </div>

        <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:16px">
          <div style="font-size:24px;margin-bottom:8px">👥</div>
          <div style="color:#F9FAFB;font-weight:700;font-size:13px;margin-bottom:4px">HR & People</div>
          <div style="color:#6B7280;font-size:12px">Onboarding, leave, performance and contracts — all in one workflow</div>
        </div>

      </div>
    </div>

    <!-- Next Steps -->
    <div style="background:#111318;border:1px solid #1F2937;border-radius:12px;padding:24px;margin-bottom:24px">
      <h2 style="color:#F9FAFB;font-size:16px;font-weight:700;margin:0 0 16px">🎯 Your first 3 steps</h2>
      <div style="display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:24px;height:24px;background:#0D9488;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">1</div>
          <div>
            <div style="color:#F9FAFB;font-weight:600;font-size:13px">Load your demo data</div>
            <div style="color:#6B7280;font-size:12px">See Lumio with real-looking data so you can explore every feature immediately</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:24px;height:24px;background:#6C3FC5;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">2</div>
          <div>
            <div style="color:#F9FAFB;font-weight:600;font-size:13px">Invite your team</div>
            <div style="color:#6B7280;font-size:12px">Add your colleagues so they can start using their department dashboards today</div>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px">
          <div style="width:24px;height:24px;background:#F59E0B;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:12px;font-weight:700;flex-shrink:0">3</div>
          <div>
            <div style="color:#F9FAFB;font-weight:600;font-size:13px">Connect your tools</div>
            <div style="color:#6B7280;font-size:12px">Link Gmail, Slack, Xero, and more in Settings → Integrations</div>
          </div>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px">
      <a href="https://lumiocms.com/${slug}" style="display:inline-block;background:#0D9488;color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">Go to my workspace →</a>
      <p style="color:#6B7280;font-size:12px;margin-top:12px">Questions? Reply to this email or book a call at <a href="https://lumiocms.com/book-demo" style="color:#0D9488">lumiocms.com/book-demo</a></p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1F2937;padding-top:20px;text-align:center">
      <p style="color:#4B5563;font-size:11px;margin:0">Lumio · Your business, fully connected · <a href="https://lumiocms.com" style="color:#4B5563">lumiocms.com</a></p>
      <p style="color:#4B5563;font-size:11px;margin:4px 0 0">&copy; 2026 Lumio. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
`
}
