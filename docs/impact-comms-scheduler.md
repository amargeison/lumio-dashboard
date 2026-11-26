# Impact Communications — scheduler and provider set-up

Brief 4 needs things to happen without anyone pressing a button: scheduled newsletters,
the automations, and webhook results from Resend. This is what runs, and the server and
provider steps. Approved 26 Nov 2026: the crontab line (with the scheduler off first, a
dry run, then on for Lumio Test only), the Resend webhook without open tracking, inbound
through Cloudflare Email Routing. Twilio inbound: not now.

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
crontab line alone does nothing until that is set (each run answers `{"off":true}`).
`IMPACT_COMMS_SCHEDULER_ORGS=lumio-test` limits it to the listed org slugs (comma
separated); unset means every live org with Communications on. A dry run —
`POST /api/cron/impact-comms?dry=1` with the same secret — works whatever the switch says,
reports per org what a run would send (counts only, no names or addresses) and writes and
sends nothing. Each automation is also off until an
HQ switches it on, and shows "who would receive it today" before it is switched on. To
stop everything at once: remove the env var (and `pm2 restart lumio --update-env`) or
comment out the crontab line. Only dry runs are called while testing; a test never calls
the live route.

## 2. Resend webhook (delivered / bounced / complained)

Webhook `73698bff-411a-408c-b024-e7694c1930b7` → `https://www.lumiosports.com/api/impact/webhooks/resend`
for `email.delivered`, `email.bounced`, `email.complained`, `email.received`; signing secret in
`.env.production` as `RESEND_IMPACT_WEBHOOK_SECRET`. Verified with Svix; an event is recorded
for de-duplication only once it's known to be an Impact email or reply (Resend sends every
event on the account here). A bounce marks the family's email as bad ("needs a new email"
in Families) until the email is changed; a complaint unsubscribes the family.

**No open tracking** (decided 26 Nov 2026): it isn't on for any domain, Coach shares
lumiosports.com, and an Impact-only subdomain would need a paid Resend plan. "Opened" is
not shown in the results, and the "opened the last newsletter" audience isn't offered.

## 3. Inbound email (replies → threads): Cloudflare Email Routing

Impact emails carry **Reply-To `reply+<org slug>@inbound.lumiosports.com`**; From stays the
org's verified sender. Coach's replies use `reply+<token>.<signature>@inbound.lumiosports.com`.

Cloudflare Email Routing on the `inbound.lumiosports.com` subdomain → catch-all → the Email
Worker `lumio-inbound-email` (`workers/inbound-email/`) → `POST /api/inbound/email`, raw MIME,
HMAC-signed (`INBOUND_EMAIL_SECRET`, a Worker secret and in `.env.production`). The route
parses it with postal-mime and dispatches by the envelope recipient: `reply+<org>@` → the
Impact handler (family found by sender email only, otherwise "Not a family here"),
Coach's signed address → the Coach handler, anything else → dropped. Text only;
attachments listed as "not shown"; failed SPF/DKIM → filed, marked "Sender not verified".
If the app doesn't answer 2xx, the Worker forwards the message to the fallback address.
The main lumiosports.com mailbox is untouched (its MX records are separate).

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

## Server steps, in order (after the code is live)

1. Add `CRON_SECRET`-authenticated crontab line (section 1) and
   `IMPACT_COMMS_SCHEDULER=off` to `.env.production`; `pm2 restart lumio --update-env`.
2. Dry run on the server and show Arron its log:
   `curl -sS -X POST -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3000/api/cron/impact-comms?dry=1"`
3. On Arron's OK: `IMPACT_COMMS_SCHEDULER=on` and `IMPACT_COMMS_SCHEDULER_ORGS=lumio-test`,
   restart, test on Lumio Test only.
4. Resend: the webhook (section 2) with its secret in `.env.production` — done 26 Nov.
5. Cloudflare: Email Routing for inbound.lumiosports.com, the fallback destination, the
   catch-all → Worker (section 3); `INBOUND_EMAIL_SECRET` in `.env.production` and as a Worker secret.
6. Twilio inbound: not now.
