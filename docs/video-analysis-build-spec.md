# Video analysis — phased build spec (highlights + coaching tips)

Status: 2026-06-30. Vision: AI splits a session video by shot type → per-player highlight
clips in the student/parent app (V1), then per-shot coaching tips (V2).

## Where we are (what's reusable)

The current pipeline (`/api/coach/media/process` + `src/lib/coach/transcribe.ts`) **strips
the video and transcribes only the audio** (`ffmpeg -vn` → Whisper) to write the lesson
summary. So today the AI *listens*, it doesn't *watch*. Reusable for video analysis:

- **ffmpeg** is already wired in (we use it to extract audio) — same tool cuts clips.
- **Per-player media storage** (`coach_media`, `coach-media` bucket) — clips slot straight in.
- **Whisper transcript** — and it can return **timestamps**, which powers the cheap V1.
- **Lumio Coach agent** (`src/lib/coach/agent.ts`) — phrases V2 tips in the house voice.

**Key architectural fact:** CV inference (pose/shot detection) is GPU-class work and won't
run in-process on the Next VPS. V1-full and V2 call a **separate inference service or a
cloud CV API** (Roboflow / Replicate / Google Video Intelligence). V1-lite needs none.

---

## Phase 1a — V1-lite: narration-driven highlights (ship first, ~3–5 days, no CV)

The fastest real version, reusing what we have. Coaches who narrate ("right, serves now…
good forehand") give us everything we need.

How it works:
1. Switch the Whisper call to **verbose JSON with segment/word timestamps** (Groq
   `whisper-large-v3-turbo` supports it) instead of plain text.
2. **Keyword parser** scans the transcript for shot words (serve, forehand, backhand,
   volley, smash/overhead, slice) → list of `{shot, timestamp}`.
3. **Clip windows** around each mention (e.g. −2s … +4s, or until the next shot keyword),
   cut from the stored video with **ffmpeg**.
4. Save each clip as a `coach_media` child tagged `shot_type` + player.
5. Surface in the student/parent app as **Highlights**, grouped by shot type.

- **Pros:** ships soon, no CV, no new infra, validates "do parents love highlights?"
- **Cons:** only as good as narration; timing offset between *saying* and *doing* a shot
  (tune the window); misses shots the coach doesn't call.
- Optional refinement: detect the ball-contact "pock" in the audio to tighten clip timing.

**This is the recommended first build** — it turns a hypothesis into a shippable feature.

---

## Phase 1b — V1-full: visual shot detection (narration-free, ~2–4 weeks + inference cost)

Add real computer vision so it works without the coach calling shots. Don't train from
scratch — integrate.

Pipeline: on upload → sample frames (~5–10 fps) → pose/shot inference → segment into shots
with timestamps → ffmpeg clips → tag/store (same as V1-lite downstream).

Integration options (in order of effort):

| Route | What | Effort | Cost |
|---|---|---|---|
| **Roboflow hosted model** | Call their tennis-shot-recognition model API per frame/clip | Low | per-inference |
| **Replicate / Modal** (self-hosted model) | Run an open pose+classifier (MediaPipe/YOLO-pose + LSTM) on serverless GPU | Medium | GPU-seconds |
| **Google Video Intelligence** | Person/pose detection; you build the classifier on top | Medium-high | per-minute |
| **Custom trained model** | Train your own on tennis datasets | High | infra + GPU |

- Accuracy to expect: ~75–90% on six shot classes (better with clean framing).
- **Recommendation:** prototype with **Roboflow or a Replicate-hosted model**; only
  self-host/train if volume and cost later justify it.

---

## Phase 2 — V2: per-shot coaching tips (after V1 proves out)

Per highlight clip: extract pose keypoints across the stroke → derive **measurable
features** (serve toss height, contact point height, knee flexion, shoulder rotation,
follow-through) → rules/small model flag faults → the **Lumio Coach agent** phrases them in
voice: *"Serve — your toss is drifting forward; try tossing slightly more over your head."*

**Non-negotiable guardrail:** every tip must be anchored to a **measured pose feature** or
to **what the coach actually said on the audio**. Never let the LLM invent biomechanics — a
confident-but-wrong correction damages credibility. Mark AI tips as *suggestions* and let
the coach approve before they reach the student.

- Effort: significant (weeks+). Strongly consider integrating a specialist for the
  biomechanics rather than building the fault-detection from scratch.

---

## Cross-cutting concerns

- **Capture / framing (affects accuracy a lot):** pose classifiers need the player
  reasonably framed at a consistent angle. Document a recommended setup (side-on or back,
  wide enough to keep them in frame). This is where a wide-angle lens or an auto-follow
  tracker would *earn its place* — for the CV, not just nicer footage.
- **Coach confirm / relabel step:** accuracy isn't 100%. A lightweight "is this a forehand?
  ✓/✗ + correct label" UI keeps quality high **and** generates labelled training data over
  time.
- **Compute cost:** budget per-video inference (Roboflow/Replicate per-call or GPU-seconds);
  it's the running cost of V1-full and V2.
- **Safeguarding / privacy (clips of minors):** video of children is sensitive. Gate on the
  existing **photo/video consent**; store clips in the private bucket; share only to the
  scoped parent/student. Prefer a CV vendor that **doesn't retain footage**, or self-host.
  GDPR: minimise, consent-gated, deletable on request.

---

## Build-vs-integrate verdict & sequencing

- **Build:** the V1-lite narration pipeline (it's just transcript-parsing + ffmpeg + app UI).
- **Integrate:** all the actual CV (Roboflow/Replicate/Google) — don't train your own first.
- **Sequence with demand gates:**
  1. **V1-lite** → ship → do parents engage with highlights?
  2. If yes → **V1-full** (hosted classifier) for narration-free detection.
  3. If coaches then want technique feedback → **V2** (pose features + agent phrasing).

## Rough effort / cost

| Phase | Effort | New running cost |
|---|---|---|
| V1-lite (narration highlights) | ~3–5 days | none (reuses Whisper) |
| V1-full (visual detection) | ~2–4 weeks | per-video CV inference |
| V2 (coaching tips) | weeks+ | per-video CV + LLM |

Start with V1-lite. It's cheap, it ships, and it tells you whether the whole video
direction is worth the CV investment.

Sources: tennis_analysis (YOLO+pose), tennis_shot_recognition (pose→GRU), Roboflow tennis
shot model/API, MediaPipe/OpenPose stroke-classification accuracy studies, YOLOv7-pose+LSTM.
