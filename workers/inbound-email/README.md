# inbound-email (Cloudflare Email Worker)

Receives every message for `inbound.lumiosports.com` (Email Routing catch-all) and posts
the raw MIME, HMAC-signed, to `https://www.lumiosports.com/api/inbound/email`, which
dispatches it: `reply+<org slug>@` → Lumio Impact, `reply+<token>.<sig>@` → Lumio Coach,
anything else dropped. If the app doesn't answer 2xx the message is forwarded to the
`FALLBACK_TO` secret address. Messages over 10 MB are rejected.

The main `lumiosports.com` mailbox is untouched: Email Routing for the subdomain only adds
MX/TXT records on `inbound.lumiosports.com`.

    npx wrangler login                    # once
    npx wrangler deploy                   # from this folder
    npx wrangler secret put INBOUND_EMAIL_SECRET   # same value as the app's .env.production
    npx wrangler secret put FALLBACK_TO
    npx wrangler tail                     # live logs

Signature: see `src/lib/inbound/signature.ts` in the app.
