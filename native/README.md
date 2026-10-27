# Lumio Tennis Coach — iPhone app (SwiftUI)

Version 2.0 of the App Store app (bundle `com.lumiosports.tenniscoach`, team
5UD3D95Y4M). It replaces the 1.0 web shell in `mobile/` under the same listing.

## What's native and what isn't

| Native screens | Opens the website inside the app |
| --- | --- |
| Coach: Today, Calendar, booking detail, Players, player page, Messages (reply to players) | Add/edit bookings, payments, lesson summaries, planner, groups, camps, leads, development, settings, new message |
| Family: Lessons (I'll be there / Can't make it), weekly groups (coming / not / pay), Book a session, Plan & payments, Messages, Lesson notes | Progress, videos and badges; paying (Stripe) |

Website pages open in a sheet already signed in (`/api/app/v1/web-session`).

## How it talks to the server

- Sign-in: email code via `/api/app/v1/auth/start` and `/verify`; the session is kept in the Keychain.
- Every request sends `Authorization: Bearer <token>` and `X-Lumio-App: 1`. The middleware turns that into the normal
  Supabase session cookie, so the existing `/api/coach/*` and `/api/portal/*` routes work unchanged.
- Tokens refresh through `/api/app/v1/auth/refresh`; a 401 refreshes once, then signs out.
- Academy: `x-lumio-academy: <slug>`.
- Coach screens: `/api/app/v1/coach/{today,bookings,players,players/[id],messages,messages/thread,messages/reply}`.
- Push: `/api/app/push` (APNs keys are on the VPS already).

## Build

```sh
brew install xcodegen      # once
cd native && xcodegen      # makes LumioCoach.xcodeproj (not committed)
open LumioCoach.xcodeproj
```

Bump `CURRENT_PROJECT_VERSION` in `project.yml` for every upload, and `MARKETING_VERSION` for each App Store version.
