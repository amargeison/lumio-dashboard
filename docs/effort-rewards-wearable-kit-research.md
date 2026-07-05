# Effort & Rewards — a cheap wearable to sell as kit

Research dive: 2026-06-30. Question: for students with no smartwatch, is there a cheap
device Lumio can add to the kit (a resale stream, like the racket keyrings) that feeds
the existing Effort & Rewards ingest?

> Prices are indicative (retail, mid-2026) and move around — confirm at sourcing time.

## The one constraint that decides everything

A device only helps if its data can reach Lumio. There are three doors:

- **Web Bluetooth (PWA reads a BLE sensor live):** works on **Android Chrome + desktop**,
  but **Apple blocks Web Bluetooth on iOS entirely** — no Safari, no PWA, only the niche
  "Bluefy" wrapper browser. So a strap-talks-to-the-app approach can't run on iPhones
  directly.
- **Aggregator (Terra) pulls from the device's cloud account:** works on iOS **and**
  Android, but needs the Terra subscription (~£399/mo) **and** a per-child cloud account
  (Zepp/Mi/Fitbit), which carry age minimums / parent-managed friction.
- **Manual log (already built):** £0, every device, every age — the baseline.

This splits the options cleanly.

## Option A — a Lumio HR sensor (BLE strap/armband) + Web Bluetooth  ⭐ best kit fit

A plain Bluetooth heart-rate sensor that broadcasts the **standard BLE Heart Rate
Service (0x180D)**. No app, no cloud account, no age minimum — it's just a sensor, so the
data goes **straight to Lumio** under your existing wearable consent. That makes it the
**cleanest option for children's data and the simplest physical product to resell.**

Candidates:

| Device | Type | Indicative price | Notes |
| --- | --- | --- | --- |
| Coospo H6 | Chest strap | **~£22** | Cheapest; very accurate; less kid-friendly |
| Coospo H808S | Chest strap | <£50 | 300-hr battery, 2× BLE + ANT+ |
| Coospo HW9 / HW807 | **Optical armband** | **~£45** | Armband = far better for juniors than a chest strap |
| Polar Verity Sense | Optical armband | ~£70+ | Premium reference; nicest, priciest |

**The iOS catch and the fix:** Web Bluetooth doesn't run on iPhones. Solution that suits a
coach-led product anyway — **run the live session on the COACH's Android phone/tablet at
the court.** Coach taps "Start session," the kid wears the Lumio band, the coach's device
reads HR over Web Bluetooth and posts the XP. One band per kid in the kit; the coach's
device is the hub. iPhone-owning families are no longer blocked, because the reader is the
coach's device, not the child's.

**Why this is the strongest kit play:**
- Cheapest hardware (£22–45) with the **highest resale margin potential** (generic/ODM
  bands are rebrandable — a "Lumio Band").
- **No subscription, ever** (no aggregator fee).
- **Best for child safeguarding/GDPR:** no third-party account, no third-party cloud — the
  sensor only emits live HR, captured under the consent you already record.
- Reuses the existing pipe: `/api/coach/watch/ingest` already accepts `avg_hr` / `max_hr`,
  so the build is a "Start HR session" button in the coach app using `navigator.bluetooth`
  → read 0x180D → compute avg/max HR + duration → POST. Small, ~1–2 days.

Trade-off: needs an **Android** device at the court to read it (most coaches have a phone;
a £100 Android tablet at the desk also works). Chest strap is cheaper + more accurate but
less kid-friendly than the optical armband.

## Option B — a cheap fitness band + Terra aggregator

A self-contained band the kid wears all day; its own app syncs to the cloud, Terra pulls it.

| Device | Indicative price | Notes |
| --- | --- | --- |
| Amazfit Band 7 | **~£40** | Best sub-£50 band; syncs via Zepp (Terra supports Zepp) |
| Xiaomi Smart Band 10 | ~£40 | Best-value all-rounder; Mi Fitness/Zepp |
| Fitbit Inspire 3 | ~£60 | Polished, but **Fitbit's API shuts down Sept 2026** — avoid as the primary |

Works on **iPhone and Android** with automatic background sync — the big advantage. But:
needs the **Terra subscription** (~£399/mo) and a **per-child cloud account** (age minimums:
Fitbit Ace under-13 via a parent; Zepp/Mi typically 13+). Prefer **Amazfit/Zepp or Garmin
via Terra** over Fitbit given the 2026 API shutdown.

## Option C — manual log (already shipped)

£0, any device, any age. The universal floor that's already live; keeps every family in the
reward loop while you decide on hardware.

## Recommendation

**Lead with Option A: a Lumio-branded optical HR armband (Coospo HW9-class, ~£45) sold in
the kit, read live on the coach's Android device.** It's the cheapest, has no monthly fee,
is the kindest to children's data (no third-party account/cloud), reuses the existing
ingest, and is a clean branded product to resell — a natural third item alongside the
racket keyrings and the student-app resale.

- If a coach's only court device is an **iPhone**, fall back to **manual logging** (built)
  for those, or add a cheap Android tablet to the academy kit as the HR hub.
- Reserve **Option B (band + Terra)** for later, when enough families want passive all-day
  sync and the subscription is justified — it's the "premium/automatic" tier, not the
  entry kit.

## Suggested next steps

1. Buy one **Coospo HW9 armband** + one **H6 strap** to prototype the Web Bluetooth
   "Start HR session" flow on an Android phone against the real ingest.
2. If it feels good, get **ODM/wholesale quotes** (Coospo direct or Alibaba ODM) for a
   Lumio-branded armband + MOQ/margin — mirror the keyring resale model.
3. Build the coach-app "Start HR session" button (`navigator.bluetooth` → 0x180D →
   `/api/coach/watch/ingest`). ~1–2 days.

I can spec/build step 3 whenever you want to trial it.

## Sources

- Coospo HW9 armband (~£45/$60): https://the5krunner.com/2023/08/08/coospo-hw9-review-h9z/
- Coospo H6 strap (~£22) / H808S: https://www.coospo.com/products/h6-chest-strap-heart-rate-monitor , https://www.coospo.com/products/h808s-chest-strap-heart-rate-monitor
- Polar Verity Sense armband: https://www.rei.com/product/198779/polar-verity-sense-optical-heart-rate-sensor
- Web Bluetooth browser support (no iOS/Safari): https://www.testmuai.com/learning-hub/web-bluetooth-browser-support/ , https://www.mobiloud.com/blog/progressive-web-apps-ios
- Budget bands (Xiaomi Smart Band 10, Amazfit Band 7, Fitbit Inspire 3): https://www.techradar.com/best/best-cheap-fitness-trackers , https://www.tomsguide.com/best-picks/best-cheap-fitness-trackers
- Terra device coverage (Amazfit/Zepp, Garmin, Fitbit): https://tryterra.co/integrations , https://tryterra.co/integrations/zepp
