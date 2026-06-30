# Lumio Tennis — visual shot detector (Modal, Phase 1b)

Self-hosted GPU service that detects tennis shots from a session video by pose, so
highlight clips work **without the coach narrating**. The Lumio backend calls it;
if it's not deployed/configured, highlights fall back to the V1 narration parser.

## What it does

`POST` an endpoint with `{ video_url, target_fps, secret }`. The service downloads
the video, samples frames (~5 fps), runs YOLO pose estimation on a T4 GPU, finds
swing events (peaks in racket-hand speed) and classifies each into
`serve | forehand | backhand | volley | smash`. Returns `{ shots: [{shot, t}], count }`.
The backend feeds those timestamps into the existing ffmpeg clip-cutter.

## Cost

Runs on a **T4**, scales to zero when idle. ~5–8 min GPU per 45-min video
(~$0.05–0.12), and **Modal's $30/mo free credits cover ~1,000+ videos/month** — so a
pilot is effectively free.

## Deploy (one-time)

```bash
pip install modal
modal token new                                   # log in / create account
modal secret create lumio-shots SHARED_SECRET=$(openssl rand -hex 24)
modal deploy modal/tennis_shots/app.py            # prints the web endpoint URL
```

Then on the Lumio server (`.env` / VPS env), set:

```
MODAL_SHOTS_URL=https://<your-workspace>--lumio-tennis-shots-service-detect.modal.run
MODAL_SHOTS_SECRET=<the same SHARED_SECRET you set above>
```

Restart the app. Next session-video upload will use visual detection. Unset
`MODAL_SHOTS_URL` to instantly revert to narration-only V1.

## Important: accuracy

The classifier in `classify_swing()` is a transparent, **rule-based first pass** so
the pipeline ships and runs today. **It will mislabel shots** — treat clips as
suggestions; the coach can delete wrong ones in Video & Audio. The function is
isolated on purpose so a **trained model** can replace it later, using the labels
the coach-confirm step generates over time. Expect to tune thresholds
(`thr`, `MIN_GAP_S`) and the serve/smash and volley heuristics against real footage.

## Test it

```bash
curl -X POST "$MODAL_SHOTS_URL" \
  -H 'Content-Type: application/json' \
  -d '{"video_url":"<a signed video URL>","target_fps":5,"secret":"<SHARED_SECRET>"}'
```

## How it wires into the app

- `src/lib/coach/visual-shots.ts` — calls this endpoint (feature-flagged on `MODAL_SHOTS_URL`).
- `src/app/api/coach/media/process/route.ts` → `buildHighlights()` — uses visual
  shots when configured, else `parseShotMentions()` (narration). Same ffmpeg
  clip-cutting + `coach_media` storage downstream either way.
