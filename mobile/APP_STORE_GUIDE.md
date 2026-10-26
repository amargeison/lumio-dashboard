# Lumio Tennis Coach on the App Store: first release

This takes you from the code on your Mac to the app being live. Do the steps in
order. Most of it is one-off. Later releases are steps 6 and 8 only, and only
when something in `mobile/` changes, because website releases reach the app
straight away.

**Costs:** none new. You already pay for the Apple Developer Program. Apple's
push service is free, and Capacitor is free and open source.

---

## 1. Before you start

- **Xcode 26 or later** (free, from the Mac App Store). Since 28 April 2026 Apple
  only accepts apps built with Xcode 26 and the iOS 26 SDK.
- **Your developer account type.** If you joined as an individual, the App Store
  shows *Arron Margeison* as the seller. That is fine for now. Once Lumio Ltd is
  registered you can ask Apple to change the membership to the company, which
  needs a D-U-N-S number.
- **EU countries.** Apple removes apps from the EU storefronts unless the seller
  declares trader status, which publishes an address and phone number. To launch
  without that, choose only the UK (and any non-EU countries) under
  Availability in step 7. Add the EU later.

## 2. Put the website side live

1. In Supabase, run `supabase/migrations/221_app_push_devices.sql`.
2. Commit and push the files from the Claude Code prompt, then run
   `npm run build` and `npm run golive` as usual.

The app opens `https://www.lumiosports.com/app`, so this has to be live before
the app can be tested on a phone.

## 3. Create the push key (once)

1. Go to developer.apple.com → **Certificates, IDs & Profiles** → **Keys** → **+**.
2. Name it `Lumio push`, tick **Apple Push Notifications service (APNs)**, then
   **Configure** → environment **Sandbox & Production** → **Save** →
   **Continue** → **Register**.
3. **Download** the `.p8` file. Apple lets you download it **once only**, so
   keep it safe, for example in your password manager.
4. Note the **Key ID** shown on the key, and your **Team ID** (top right of the
   developer site, or **Membership details**).
5. Add these four settings to the server, the same way as the other keys (never
   paste the key into a chat):
   - `APNS_KEY_ID`: the Key ID
   - `APNS_TEAM_ID`: the Team ID
   - `APNS_PRIVATE_KEY`: the whole contents of the `.p8` file. Newlines can
     stay as they are, or be written as `\n` on one line.
   - `APPLE_TEAM_ID`: the Team ID again (used by links in emails)
6. Restart the site. Check that
   `https://www.lumiosports.com/.well-known/apple-app-site-association` now
   shows your Team ID followed by `.com.lumiosports.tenniscoach`.

## 4. Open the app in Xcode

```bash
cd ~/Documents/lumio-dashboard/mobile
npm install
npx cap sync ios
npx cap open ios
```

In Xcode, click **App** (top of the left column), then the **App** target, then
**Signing & Capabilities**:

- **Team:** choose your team. Leave **Automatically manage signing** ticked.
- **Bundle Identifier:** `com.lumiosports.tenniscoach`, already set.
- **Push Notifications** and **Associated Domains**
  (`applinks:www.lumiosports.com`) should already be listed. If either has a red
  warning, press **Try Again**. Xcode registers them on the App ID for you.

## 5. Try it

Pick a simulator (iPhone 17 Pro) at the top and press ▶. Then plug in your
iPhone, choose it instead, and press ▶ again. Push notifications only arrive on
a real phone.

Check:

1. The app opens on the **Sign in** screen with **Explore the demo** below.
2. **Explore the demo** opens the coach demo straight away, with no email asked.
   **More → Exit demo** takes you back to Sign in.
3. Sign in as yourself (the code comes by email). You land on your portal, and
   the app asks once whether it can send notifications. Say **Allow**.
4. On the website on your computer, have a test family
   (`amargeison+fam@gmail.com`) message you from their page, or cancel a lesson.
   Your phone should get a notification, and tapping it opens the app.
5. Sign out, then sign in as the test family. You land on their own page, with
   lessons, **Book a session**, groups and **Plan & payments**.
6. Tap an outside link, such as a venue map. It opens in a Safari sheet over
   the app. Close it and you are back where you were.
7. Turn on flight mode and reopen the app. You see *You're offline* and
   **Try again**.
8. Check that nothing sits under the clock or the bottom bar of the iPhone.

## 6. Upload a build

1. At the top of Xcode choose **Any iOS Device (arm64)**.
2. **Product → Archive**. When the Organizer opens, choose
   **Distribute App → App Store Connect → Distribute**.
3. Wait about 10 to 30 minutes for the email saying the build has processed.

Before each later upload, raise the **Build** number (App target → General),
for example 1 → 2. Raise **Version** (1.0 → 1.1) when the release is one people
would notice.

## 7. Create the listing in App Store Connect (once)

At appstoreconnect.apple.com, go to **Apps → + → New App**:

| Field | Value |
| --- | --- |
| Platform | iOS |
| Name | Lumio Tennis Coach |
| Primary language | English (UK) |
| Bundle ID | com.lumiosports.tenniscoach |
| SKU | lumio-tennis-coach-ios |

**App Information:** category **Sports**, secondary **Business**. Content
rights: no third-party content.

**Pricing and Availability:** Free. Countries: the UK (see step 1 about the EU).

**App Privacy:** privacy policy URL `https://www.lumiosports.com/privacy`.
Under *Data collection*, answer **Yes**, and for each type below choose
**linked to the user**, **not used for tracking**, purpose **App
Functionality**:

- Contact Info: name, email address, phone number
- Health & Fitness: health (the medical notes families can choose to give)
- User Content: photos or videos, audio data, other user content (messages, lesson notes)
- Purchases: purchase history (lesson and group payments)
- Identifiers: user ID
- Usage Data: product interaction (choose purpose **Analytics**, and **not**
  linked to the user)

Card details are collected by Stripe, never by the app, so leave Financial Info
off. Tracking: **No**.

**Age rating:** answer the questionnaire honestly. There are no mature themes.
If it asks about messaging, the app lets a coach and their own clients message
each other.

**Version page (1.0):**

- **Screenshots:** use the files from this chat. `p69-…` are 1320 × 2868
  (6.9-inch iPhone) and `p17-…` are 1206 × 2622 (6.3-inch). Upload whichever
  size App Store Connect asks for, in this order: dashboard, calendar, family
  app, planner, sign in.
- **Promotional text:** Run your coaching like a business. Lessons, payments,
  groups and families in one app.
- **Description:**

  > Lumio Tennis Coach runs the admin side of a tennis coaching business, so
  > you can spend your time on court.
  >
  > For coaches
  > • Your day at a glance: today's lessons, who's confirmed, what's owed
  > • Booking calendar, booking links and free-slot offers
  > • Session planner and lesson summaries families can read
  > • Weekly groups: ask who's coming, take payment when they say yes
  > • Payments with your own cancellation policy, packs and monthly plans
  > • Leads, waiting lists and trips
  > • Notifications when a client books, cancels or messages you
  >
  > For players and parents
  > • Your lessons, with I'll be there and Can't make it
  > • Book a free slot with your coach
  > • Say yes or no to this week's group and pay for your place
  > • Your plan, lesson packs and anything still to pay
  > • Messages with your coach
  >
  > Coaches set up their academy at lumiosports.com. Players and parents are
  > invited by their coach. Anyone can explore the demo without an account.

- **Keywords:** `tennis,coach,coaching,lessons,academy,booking,court,club,players,parents,groups,camps`
- **Support URL:** `https://www.lumiosports.com/tennis-coach/support`
- **Marketing URL:** `https://www.lumiosports.com/tennis-coach`
- **Build:** choose the build from step 6.
- **App Review Information:**
  - **Sign-in required:** untick it. Sign-in uses an emailed code, not a
    password, and the demo needs no account.
  - **Contact:** your name, email and phone.
  - **Notes:**

  > Lumio Tennis Coach is used by tennis coaches and the players and parents
  > they coach. Accounts are created by coaching academies on our website, and
  > players and parents are invited by their coach, so there is no sign-up in
  > the app.
  >
  > To review every feature without an account, tap "Explore the demo" on the
  > first screen. It opens a complete sample academy. To see what a player or
  > parent sees, tap the coach's photo (top right), then "Player", then pick a
  > player.
  >
  > Sign-in uses a six-digit code sent by email, with no password. We are happy
  > to set up a review account if you would like one.
  >
  > Payments for coaching lessons, groups and camps are for services delivered
  > in person, and are taken through Stripe (guideline 3.1.3(e)). The app sells
  > no digital content or subscriptions, and has no way to buy or link to buy
  > a Lumio plan.
  >
  > Native features: push notifications (bookings, cancellations, messages,
  > reminders), universal links from our emails, the share sheet for exports,
  > and an offline screen.

## 8. TestFlight, then review

1. **TestFlight → Internal Testing → +**, then add yourself. Install the
   TestFlight app on your iPhone and try the build. This build talks to the
   production push service, so notifications behave exactly as they will live.
2. On the version page, press **Add for Review**, then **Submit**. Reviews
   usually take one to two days.

## If Apple comes back with a question

- **"Please provide a demo account" (2.1):** tell me and I'll add a review-only
  account with a fixed code, tied to a sample academy.
- **"Minimum functionality" (4.2):** reply with the native features in the
  notes above. If they still refuse, the next step is adding more native
  screens, and I'll scope it before building.
- **"Account deletion" (5.1.1(v)):** reply that the app has no account creation,
  and point to the support page's data request link.

## What works differently in the app

- **Printing** (run-sheets, certificates) is not available in the app. Print
  from a computer.
- **Connecting Gmail, Outlook or a calendar:** Google and Microsoft block
  sign-in inside apps, so connect them once on the website on a computer. The
  connection then works everywhere.
- **Exports and calendar files** open the iPhone share sheet, so you can save
  them to Files, AirDrop them or email them.
- **iPhone only.** The app is not offered on iPad, so no iPad screenshots are
  needed. The website still works on an iPad.
