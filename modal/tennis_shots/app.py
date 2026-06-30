# Lumio Tennis — Phase 1b visual shot detector (self-hosted on Modal).
#
# Given a session video URL, samples frames, runs YOLO pose estimation, detects
# "swing" events (peaks in racket-hand speed) and classifies each into a shot
# type (serve / forehand / backhand / volley / smash). Returns timestamped shots
# that the Lumio backend turns into highlight clips — so highlights work even when
# the coach doesn't narrate.
#
# Runs on a cheap T4 GPU, scales to zero when idle (no idle cost), and on Modal's
# $30/mo free credits comfortably covers a pilot's worth of videos.
#
# ── Deploy ────────────────────────────────────────────────────────────────────
#   pip install modal && modal token new
#   modal secret create lumio-shots SHARED_SECRET=<a-long-random-string>
#   modal deploy modal/tennis_shots/app.py
# Then set on the Lumio server:  MODAL_SHOTS_URL=<the deployed endpoint URL>
#                                MODAL_SHOTS_SECRET=<same SHARED_SECRET>
#
# IMPORTANT: the classifier below is a transparent, rule-based FIRST PASS so the
# pipeline ships and runs today. It will mislabel shots — treat its output as
# suggestions (the coach can delete wrong clips). The classify_swing() function is
# deliberately isolated so a trained model can replace it later, using labels the
# coach-confirm step will generate over time.

import os
import modal

app = modal.App("lumio-tennis-shots")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libgl1", "libglib2.0-0")
    .pip_install("ultralytics==8.3.39", "opencv-python-headless==4.10.0.84", "numpy<2", "requests", "fastapi[standard]")
)

with image.imports():
    import cv2
    import numpy as np
    import requests
    from ultralytics import YOLO
    import tempfile
    import torch                       # already present via ultralytics
    import torch.nn as nn

    # ── Trained classifier (shared shape with modal/tennis_shots/train.py) ──
    # A tiny GRU over a window of normalised pose keypoints → shot class.
    class ShotGRU(nn.Module):
        def __init__(self, feat=34, hidden=64, classes=5):
            super().__init__()
            self.gru = nn.GRU(feat, hidden, batch_first=True)
            self.fc = nn.Linear(hidden, classes)

        def forward(self, x):
            _, h = self.gru(x)
            return self.fc(h[-1])

    def pose_features(window_kps):
        """window_kps: list of kp[17,2]. Normalise each frame (centre on mid-hip,
        scale by shoulder width), pad/clip to WINDOW frames → [WINDOW,34] tensor."""
        feats = []
        for kp in window_kps:
            centre = (kp[L_HIP] + kp[R_HIP]) / 2.0
            scale = float(np.linalg.norm(kp[L_SH] - kp[R_SH])) + 1e-6
            feats.append(((kp - centre) / scale).reshape(-1))
        arr = np.array(feats, dtype=np.float32)
        if len(arr) < WINDOW:
            arr = np.vstack([arr, np.zeros((WINDOW - len(arr), 34), dtype=np.float32)])
        else:
            arr = arr[:WINDOW]
        return torch.from_numpy(arr).unsqueeze(0)  # [1, WINDOW, 34]

# COCO-17 keypoint indices used by yolov8 pose.
NOSE, L_SH, R_SH, L_EL, R_EL, L_WR, R_WR, L_HIP, R_HIP = 0, 5, 6, 7, 8, 9, 10, 11, 12
WINDOW = 17                                 # frames around the contact point (±8)
LABELS = ["serve", "forehand", "backhand", "volley", "smash"]


def classify_with_model(frames, peak_idx):
    """Use the trained GRU. frames[i] = (t, kp, kc, hand). Returns (label, conf)."""
    lo = max(0, peak_idx - WINDOW // 2)
    window = [frames[j][1] for j in range(lo, min(len(frames), lo + WINDOW))]
    x = pose_features(window)
    with torch.no_grad():
        probs = torch.softmax(CLASSIFIER(x), dim=1)[0]
    idx = int(torch.argmax(probs))
    return LABELS[idx], float(probs[idx])


def _download(url: str) -> str:
    r = requests.get(url, stream=True, timeout=120)
    r.raise_for_status()
    f = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False)
    for chunk in r.iter_content(chunk_size=1 << 20):
        if chunk:
            f.write(chunk)
    f.close()
    return f.name


def _largest_person(result):
    """Return (keypoints[17,2], conf[17]) for the biggest detected person, or None."""
    if result.keypoints is None or result.boxes is None or len(result.boxes) == 0:
        return None
    boxes = result.boxes.xyxy.cpu().numpy()
    areas = (boxes[:, 2] - boxes[:, 0]) * (boxes[:, 3] - boxes[:, 1])
    i = int(areas.argmax())
    kp = result.keypoints.xy.cpu().numpy()[i]          # [17,2]
    kc = result.keypoints.conf.cpu().numpy()[i] if result.keypoints.conf is not None else np.ones(17)
    return kp, kc


def classify_swing(frames, peak_idx):
    """Shot classifier from pose. frames[i] = (t, kp[17,2], kc[17], hand).
    Returns (label, confidence). If a TRAINED model is loaded it's used and gives
    real softmax confidence; otherwise the rule-based fallback runs with LOW
    confidence on the ambiguous calls (serve/smash, volley) so the backend's audio
    cross-check kicks in and lets the coach's narration correct them."""
    if CLASSIFIER is not None:
        try:
            return classify_with_model(frames, peak_idx)
        except Exception:  # noqa: BLE001
            pass  # fall through to heuristic

    t, kp, kc, hand = frames[peak_idx]
    wr = R_WR if hand == "right" else L_WR
    sh = R_SH if hand == "right" else L_SH
    wrist = kp[wr]
    nose_y = kp[NOSE][1]
    sh_mid_x = (kp[L_SH][0] + kp[R_SH][0]) / 2.0
    sh_y = kp[sh][1]
    hip_y = (kp[L_HIP][1] + kp[R_HIP][1]) / 2.0

    # In image coords y grows downward, so "above the head" = smaller y.
    overhead = wrist[1] < nose_y

    if overhead:
        # Serve vs smash: ambiguous from pose alone → LOW confidence so audio decides.
        pre = [f for f in frames[max(0, peak_idx - 8):peak_idx]]
        moved = 0.0
        for j in range(1, len(pre)):
            moved += float(np.linalg.norm(pre[j][1][wr] - pre[j - 1][1][wr]))
        return ("serve", 0.5) if moved < 40 else ("smash", 0.5)

    # Groundstroke vs volley: compact + high contact → volley (also low-ish conf).
    pre = frames[max(0, peak_idx - 6):peak_idx + 1]
    min_wrist_y = max(f[1][wr][1] for f in pre)  # lowest point (largest y)
    compact = min_wrist_y < hip_y and wrist[1] < sh_y + 30
    if compact:
        return ("volley", 0.5)

    # Forehand vs backhand by which side the contact is on (clearer signal).
    on_right = wrist[0] > sh_mid_x
    if hand == "right":
        return ("forehand", 0.62) if on_right else ("backhand", 0.62)
    else:
        return ("forehand", 0.62) if not on_right else ("backhand", 0.62)


def detect_shots(path: str, target_fps: int = 5):
    model = MODEL
    cap = cv2.VideoCapture(path)
    src_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    step = max(1, round(src_fps / max(1, target_fps)))

    frames = []  # (t, kp, kc, hand) per sampled frame where a person was found
    batch, batch_t = [], []
    idx = 0

    def flush():
        if not batch:
            return
        results = model.predict(batch, verbose=False, device=0)
        for t, res in zip(batch_t, results):
            person = _largest_person(res)
            if person is None:
                continue
            kp, kc = person
            frames.append((t, kp, kc, None))
        batch.clear(); batch_t.clear()

    while True:
        ok, frame = cap.read()
        if not ok:
            break
        if idx % step == 0:
            batch.append(frame); batch_t.append(idx / src_fps)
            if len(batch) >= 16:
                flush()
        idx += 1
    flush()
    cap.release()

    if len(frames) < 4:
        return []

    # Decide the racket hand globally: whichever wrist travels more overall.
    rmove = lmove = 0.0
    for j in range(1, len(frames)):
        rmove += float(np.linalg.norm(frames[j][1][R_WR] - frames[j - 1][1][R_WR]))
        lmove += float(np.linalg.norm(frames[j][1][L_WR] - frames[j - 1][1][L_WR]))
    hand = "right" if rmove >= lmove else "left"
    wr = R_WR if hand == "right" else L_WR
    frames = [(t, kp, kc, hand) for (t, kp, kc, _) in frames]

    # Per-frame racket-hand speed (px per sample).
    speeds = [0.0]
    for j in range(1, len(frames)):
        dt = max(1e-3, frames[j][0] - frames[j - 1][0])
        speeds.append(float(np.linalg.norm(frames[j][1][wr] - frames[j - 1][1][wr])) / dt)

    # Swing = a local speed peak above threshold, with a min gap between hits.
    thr = max(120.0, float(np.percentile(speeds, 80)))
    MIN_GAP_S = 1.5
    shots = []
    last_t = -1e9
    for j in range(1, len(speeds) - 1):
        if speeds[j] >= thr and speeds[j] >= speeds[j - 1] and speeds[j] >= speeds[j + 1]:
            t = frames[j][0]
            if t - last_t < MIN_GAP_S:
                continue
            label, conf = classify_swing(frames, j)
            shots.append({"shot": label, "t": round(t, 2), "confidence": round(float(conf), 2)})
            last_t = t
    return shots


# ── Web endpoint ──────────────────────────────────────────────────────────────
MODEL = None          # YOLO pose model
CLASSIFIER = None     # trained ShotGRU, if one has been trained (else None → heuristic)

# Trained classifier weights live on a Modal Volume that train.py writes to.
models_vol = modal.Volume.from_name("lumio-shots-models", create_if_missing=True)


@app.cls(image=image, gpu="T4", timeout=900, scaledown_window=120,
         volumes={"/models": models_vol},
         secrets=[modal.Secret.from_name("lumio-shots")])
class Service:
    @modal.enter()
    def load(self):
        global MODEL, CLASSIFIER
        MODEL = YOLO("yolov8n-pose.pt")
        # Load the private trained classifier if train.py has produced one.
        try:
            import os as _os
            if _os.path.exists("/models/classifier.pt"):
                m = ShotGRU()
                m.load_state_dict(torch.load("/models/classifier.pt", map_location="cpu"))
                m.eval()
                CLASSIFIER = m
                print("[lumio-shots] loaded trained classifier")
        except Exception as e:  # noqa: BLE001
            print("[lumio-shots] no trained classifier:", e)

    @modal.fastapi_endpoint(method="POST")
    def detect(self, payload: dict):
        if payload.get("secret") != os.environ.get("SHARED_SECRET"):
            return {"error": "unauthorized"}, 401
        url = payload.get("video_url")
        if not url:
            return {"error": "missing video_url"}, 400
        fps = int(payload.get("target_fps", 5))
        path = None
        try:
            path = _download(url)
            shots = detect_shots(path, target_fps=fps)
            return {"shots": shots, "count": len(shots)}
        except Exception as e:  # noqa: BLE001
            return {"error": str(e)[:300]}, 500
        finally:
            try:
                if path:
                    os.remove(path)
            except OSError:
                pass
