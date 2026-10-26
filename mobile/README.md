# Lumio Tennis Coach: the iPhone app

A native iPhone shell (Capacitor 8) around **www.lumiosports.com**. It opens
`/app`, which sends a coach to their portal, a player or parent to their own
page, and anyone else to sign in or to the demo. Website releases (`npm run
golive`) reach the app straight away. A new App Store build is only needed when
something in this folder changes.

What the app adds to the website (see `src/components/app/AppBridge.tsx`):

- push notifications (Apple's own service, called from our server: `src/lib/app/`)
- links to other sites open in a Safari sheet over the app
- exports and downloads go to the iPhone share sheet
- links in emails open the app (universal links, `src/app/.well-known/apple-app-site-association`)
- an offline screen (`www/offline.html`)

## Build it on the Mac

```bash
cd mobile
npm install
npx cap sync ios
npx cap open ios        # opens Xcode
```

In Xcode: pick the **App** target → **Signing & Capabilities** → choose your
team. Then run it on the simulator or your iPhone.

## Release a new version

Bump **Version** (e.g. 1.1) or **Build** in Xcode (App target → General), then
**Product → Archive → Distribute App → App Store Connect**.

The full first-time steps (App Store Connect listing, push key, review notes)
are in `APP_STORE_GUIDE.md`.

## Server settings the app needs

| Setting | What it is |
| --- | --- |
| `APNS_KEY_ID` | The push key's ID (developer.apple.com → Keys) |
| `APNS_TEAM_ID` | Your Apple team ID |
| `APNS_PRIVATE_KEY` | The contents of the `.p8` key file |
| `APPLE_TEAM_ID` | Optional: same team ID, for links in emails (defaults to `APNS_TEAM_ID`) |

Without them the app still works; it just sends no notifications.
