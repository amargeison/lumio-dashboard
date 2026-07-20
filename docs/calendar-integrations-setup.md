# Calendar & email integrations — setup guide

The Tennis Coach portal supports two-way calendar sync (and send-as email) for
three providers. The **code is already built**; each provider just needs
credentials.

| Provider | Auth | What you set up | Coach action |
|---|---|---|---|
| Google (Gmail & Calendar) | OAuth | Google Cloud project + env vars | Settings → Connected accounts → Connect Google |
| Microsoft 365 (Outlook) | OAuth | Azure app registration + env vars | Connect Outlook |
| Apple iCloud | App-specific password (CalDAV) | Nothing — no app registration | Paste Apple ID + app password |

Redirect/callback base is your live origin: **`https://lumiosports.com`**.

---

## 1. Google (Gmail & Calendar)

**In the [Google Cloud Console](https://console.cloud.google.com):**

1. Create (or pick) a project, e.g. "Lumio Tennis Coach".
2. **APIs & Services → Library** → enable **Google Calendar API** and **Gmail API**.
3. **APIs & Services → OAuth consent screen**:
   - User type: **External**.
   - Fill app name, support email, developer email.
   - **Scopes** → add:
     - `.../auth/calendar`
     - `.../auth/gmail.send`
     - (plus the default `openid`, `email`, `profile`)
   - **Test users** → add Pete's Google address (and yours). While the app is in
     "Testing" only listed users can connect — that's fine for now. Publish later
     to remove the limit (Google may require verification for the calendar scope).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs** → add exactly:
     `https://lumiosports.com/api/coach/oauth/google/callback`
   - Create → copy the **Client ID** and **Client secret**.

**On the server (VPS env):**

```
GOOGLE_OAUTH_CLIENT_ID=<client id>
GOOGLE_OAUTH_CLIENT_SECRET=<client secret>
```

Restart the app. The "Connect Google" button will light up.

---

## 2. Microsoft 365 (Outlook)

There's already a default app-registration client ID in the code
(`60f7ad0b-978c-4bde-9ae5-36b88f7134a8`). If that registration is **yours**, you
only need to create a client secret for it. If not (or you're unsure), create a
fresh one — steps below.

**In the [Azure Portal](https://portal.azure.com) → Microsoft Entra ID → App registrations:**

1. **New registration** (or open the existing app):
   - Name: "Lumio Tennis Coach".
   - Supported account types: **Accounts in any organizational directory and
     personal Microsoft accounts** (multi-tenant + personal), so both work/school
     and personal Outlook accounts can connect.
   - **Redirect URI** → platform **Web** → `https://lumiosports.com/api/coach/oauth/microsoft/callback`
2. **API permissions → Add a permission → Microsoft Graph → Delegated**:
   - `Calendars.ReadWrite`
   - `Mail.Send`
   - `User.Read`
   - `offline_access`
   - `openid`, `email`, `profile`
   - (Grant admin consent if it's your org tenant; personal accounts consent at sign-in.)
3. **Certificates & secrets → New client secret** → copy the **Value** (not the ID).
4. Copy the **Application (client) ID** from the app's Overview.

**On the server (VPS env):**

```
MICROSOFT_OAUTH_CLIENT_SECRET=<secret value>
# only if you created a NEW app (otherwise the built-in default is used):
MICROSOFT_OAUTH_CLIENT_ID=<application client id>
# optional — leave unset to allow any tenant + personal accounts:
# MICROSOFT_OAUTH_TENANT=common
```

Restart. "Connect Outlook" lights up.

---

## 3. Apple iCloud (Pete)

No console, no app registration — iCloud isn't OAuth.

1. Pete signs in at **[appleid.apple.com](https://appleid.apple.com)** →
   **Sign-In & Security → App-Specific Passwords → Generate**. Name it "Lumio".
   Apple shows a password like `abcd-efgh-ijkl-mnop`.
2. In the portal: **Settings → Connected accounts → Apple iCloud** → enter his
   **Apple ID email** and that **app-specific password** → **Connect iCloud**.
3. Lumio validates it against iCloud CalDAV, resolves his default calendar, and
   from then on bookings push into iCloud, his iCloud busy times show on the
   booking calendar, and lesson-summary emails send **from his iCloud address**
   (over iCloud SMTP, using the same app-specific password).

Nothing to configure server-side for iCloud — the one app-specific password
covers both calendar (CalDAV) and send-as email (SMTP `smtp.mail.me.com`).

---

## Notes

- Secrets live only in the server environment, never in the repo. Lumio stores
  per-coach tokens/passwords in the `coach_oauth_connections` Supabase table
  (service-role only) and never exposes them to the browser.
- Optional: `OAUTH_REDIRECT_BASE` overrides the callback base if you ever run the
  OAuth flow from a non-canonical origin. Defaults to the request origin.
- Each coach connects their own accounts — this is per-coach, not global.
