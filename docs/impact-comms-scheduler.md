# Impact Communications — scheduler and provider set-up (plan, for approval)

Brief 4 needs things to happen without anyone pressing a button: scheduled newsletters,
the automations, and webhook results from Resend and Twilio. This is what would run, and
the server and provider steps that need Arron's OK. Nothing here is switched on yet.

## 1. The five-minute runner

**Route:** `POST /api/cron/impact-comms` (new). Same pattern as the existing cron routes:
POST only, `Authorization: Bearer $CRON_SECRET`, refuses everything if `CRON_SECRET` is
unset. Called on localhost, because the public hostname sits behind Cloudflare and curl
gets a bot challenge.

**Crontab line to add on the VPS** (user `lumio`, next to the camp-emails line, same log):

```
# Impact comms: scheduled newsletters and automations, every 5 minutes. Localhost, same as camp-emails.
*/5 * * * * curl -sS -m 280 -X POST -H "Authorization: Bearer <CRON_SECRET>" http://127.0.0.1:3000/api/cron/impact-comms >> /home/lumio/lumio-cron.log 2>&1
```

`<CRON_SECRET>` is the value already used by the other lines (from
`/home/lumio/apps/lumio/.env.production`). Nothing else on the server changes.

**What one run does, in order**, for every live org with the Communications module on:

1. Takes the `impact-comms` lease (migration 238, `impact_scheduler_claim`, 290 seconds).
   If another run still holds it, this run stops at once, so two runs never send.
2. **Scheduled newsletters** whose time has come: claims each one (`scheduled → sending`
   in a single update, so it is claimed once), works out the audience at that moment,
   writes one `impact_campaign_recipients` row per family per channel (`queued`, or
   `skipped` with the reason: no consent, unsubscribed, no email, email bounced), and
   sends through Resend's batch endpoint in chunks of 100 with each family's own
   unsubscribe link. A run sends at most 1,000; the rest go on the next run. When all
   are done: `sent`, with counts.
3. **Automations** that are switched on, for families who are due today: welcome
   (instant, day 1, day 7), session reminder the day before, "we missed you" after two
   absences in a row, pack-issued confirmation, booklet-week nudge on Mondays in term.
   Each step is claimed in `impact_automation_sends` before it sends, so it goes once;
   the unique daily index means a family never gets more than one automated message a day.
4. **Quiet hours** (the org's, in Settings; default 8pm–8am UK): nothing automated or
   scheduled is sent inside them. A newsletter scheduled inside quiet hours waits until
   they end; the scheduling screen says so when you pick the time.
5. Writes an `impact_scheduler_runs` row (what was sent, skipped, failed) and releases
   the lease.

**Safety:** off unless `IMPACT_COMMS_SCHEDULER=on` is in `.env.production`, so adding the
crontab line alone does nothing until that is set. Each automation is also off until an
HQ switches it on, and shows "who would receive it today" before it is switched on. To
stop everything at once: remove the env var (and `pm2 restart lumio --update-env`) or
comment out the crontab line. Only dry runs are called while testing; a test never calls
the live route.

## 2. Resend webhooks (delivered / opened / bounced / complained)

**Route:** `POST /api/impact/webhooks/resend` (new), verified with Svix
(`RESEND_IMPACT_WEBHOOK_SECRET`), five-minute replay window, each event id handled once
(`impact_provider_events`).

**Provider step:** in Resend → Webhooks, add `https://www.lumiosports.com/api/impact/webhooks/resend`
for `email.delivered`, `email.opened`, `email.bounced`, `email.complained`, and put its
signing secret in `.env.production` as `RESEND_IMPACT_WEBHOOK_SECRET`. A bounce marks the
family's email as bad ("needs a new email" in Families) until the email is changed; a
complaint unsubscribes the family.

Open tracking must be turned on for each sending domain in Resend, or "opened" stays empty.
Apple Mail's privacy protection opens everything, so opens over-count; the results tab
will say so next to the number.

## 3. Inbound email (replies → threads)

**Pushback on the brief.** "replies@<their sending domain>" would mean pointing the MX
records of the org's own domain at Resend, which would take over the org's whole mailbox
(info@, the head's email…). That can't be done on a domain they use for email.

Two safe options:

- **A. A reply subdomain per org** — `replies@reply.<their domain>`, with an MX record on
  `reply.<their domain>` only. Their main mailbox is untouched. Each org (Ten Project,
  then others) adds one DNS record. Recommended.
- **B. Lumio's own inbound domain** — `reply+<org>@inbound.lumiosports.com`, which Coach
  already uses. No DNS work for the org, but the reply-to address shows lumiosports.com.

Either way: Resend inbound → `POST /api/impact/webhooks/inbound-email` (Svix-verified),
the org found from the recipient address, the family from the sender's email (a sender
who isn't a family here is filed as "unknown sender", never matched by name), de-duplicated
on the message id, and filed as `direction = 'in'` in that family's thread.

## 4. SMS replies

Only when `IMPACT_SMS_LIVE=on` (as now). Twilio inbound for the Impact number →
`POST /api/impact/webhooks/twilio` (X-Twilio-Signature verified, like Coach's), matched on
the family's phone. "STOP" turns that family's SMS off. Provider step: set the number's
"A message comes in" webhook in Twilio, once there is an Impact number.

## 5. AI cost control (no server step)

Per-org daily cap on `/api/ai/impact`: default 2.00 GBP of tokens a day, worked out from
the model's token prices; `IMPACT_AI_DAILY_PENCE_LUMIO_TEST` overrides it for Lumio Test.
Every call (and every refusal) is logged in `impact_ai_usage` with org, feature, model and
tokens; Settings shows today's spend against the cap. The importer's separate $5/day cap
(src/lib/import-engine/guard.ts) is replaced by this one: imports log as feature `import`.

## What needs Arron's OK

1. Add the crontab line (section 1) and `IMPACT_COMMS_SCHEDULER=on` to `.env.production`
   — after the code is live and has run as a dry run.
2. Add the Resend webhook and its secret (section 2); turn on open tracking per domain.
3. Choose A or B for inbound email (section 3); for A, a DNS record per org.
4. Twilio inbound webhook — only when there is an Impact SMS number.
