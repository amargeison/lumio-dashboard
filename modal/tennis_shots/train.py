# Lumio Tennis — train the PRIVATE shot classifier on Modal.
#
# Trains a small pose-sequence GRU on labelled clips and writes the weights to the
# `lumio-shots-models` volume, which the live detector (app.py) auto-loads. Your
# data never leaves your Modal account.
#
# ── Data layout ───────────────────────────────────────────────────────────────
# Put labelled clips on the `lumio-shots-data` volume, one folder per shot:
#   /data/serve/*.mp4  /data/forehand/*.mp4  /data/backhand/*.mp4
#   /data/volley/*.mp4 /data/smash/*.mp4
# Best source = your own coach-CONFIRMED highlight clips (private, on-domain).
# You can also drop in any clips you have the rights to. Do NOT scrape YouTube
# (ToS/copyright) — and broadcast angles don't match phone-on-a-tripod footage.
#
# Upload your clips, then train:
#   modal volume put lumio-shots-data ./my_labelled_clips/serve  serve
#   ...
#   modal run modal/tennis_shots/train.py            # uses /data, writes /models
#
# Rule of thumb: aim for ~80-150+ clips per shot for a usable first model; more
# (and balanced across shots) is better. Re-run as your confirmed set grows.
#
# Keep ShotGRU / pose_features / WINDOW / LABELS in sync with app.py.

import modal

app = modal.App("lumio-tennis-shots-train")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "libgl1", "libglib2.0-0")
    .pip_install("ultralytics==8.3.39", "opencv-python-headless==4.10.0.84", "numpy<2")
)

data_vol = modal.Volume.from_name("lumio-shots-data", create_if_missing=True)
models_vol = modal.Volume.from_name("lumio-shots-models", create_if_missing=True)

LABELS = ["serve", "forehand", "backhand", "volley", "smash"]
WINDOW = 17
NOSE, L_SH, R_SH, L_WR, R_WR, L_HIP, R_HIP = 0, 5, 6, 9, 10, 11, 12

with image.imports():
    import os
    import glob
    import cv2
    import numpy as np
    import torch
    import torch.nn as nn
    from ultralytics import YOLO

    class ShotGRU(nn.Module):
        def __init__(self, feat=34, hidden=64, classes=5):
            super().__init__()
            self.gru = nn.GRU(feat, hidden, batch_first=True)
            self.fc = nn.Linear(hidden, classes)

        def forward(self, x):
            _, h = self.gru(x)
            return self.fc(h[-1])

    def pose_features(window_kps):
        feats = []
        for kp in window_kps:
            centre = (kp[L_HIP] + kp[R_HIP]) / 2.0
            scale = float(np.linalg.norm(kp[L_SH] - kp[R_SH])) + 1e-6
            feats.append(((kp - centre) / scale).reshape(-1))
        arr = np.array(feats, dtype=np.float32)
        if len(arr) < WINDOW:
            arr = np.vstack([arr, np.zeros((WINDOW - len(arr), 34), dtype=np.float32)])
        return arr[:WINDOW]

    def largest_person(res):
        if res.keypoints is None or res.boxes is None or len(res.boxes) == 0:
            return None
        b = res.boxes.xyxy.cpu().numpy()
        i = int(((b[:, 2] - b[:, 0]) * (b[:, 3] - b[:, 1])).argmax())
        return res.keypoints.xy.cpu().numpy()[i]

    def clip_to_window(yolo, path, target_fps=5):
        """Pose the clip, find the contact peak (max racket-hand speed), return a
        WINDOW of kp around it. Clips are short + centred on the shot."""
        cap = cv2.VideoCapture(path)
        src = cap.get(cv2.CAP_PROP_FPS) or 30.0
        step = max(1, round(src / target_fps))
        kps, idx = [], 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if idx % step == 0:
                res = yolo.predict(frame, verbose=False, device=0)[0]
                kp = largest_person(res)
                if kp is not None:
                    kps.append(kp)
            idx += 1
        cap.release()
        if len(kps) < 4:
            return None
        # racket hand = busier wrist; peak = max wrist speed
        rmove = sum(float(np.linalg.norm(kps[j][R_WR] - kps[j - 1][R_WR])) for j in range(1, len(kps)))
        lmove = sum(float(np.linalg.norm(kps[j][L_WR] - kps[j - 1][L_WR])) for j in range(1, len(kps)))
        wr = R_WR if rmove >= lmove else L_WR
        speeds = [0.0] + [float(np.linalg.norm(kps[j][wr] - kps[j - 1][wr])) for j in range(1, len(kps))]
        peak = int(np.argmax(speeds))
        lo = max(0, peak - WINDOW // 2)
        return kps[lo:lo + WINDOW]


@app.function(image=image, gpu="T4", timeout=3600,
              volumes={"/data": data_vol, "/models": models_vol})
def train(epochs: int = 40, lr: float = 1e-3):
    yolo = YOLO("yolov8n-pose.pt")
    X, y = [], []
    for ci, shot in enumerate(LABELS):
        paths = glob.glob(f"/data/{shot}/*.mp4") + glob.glob(f"/data/{shot}/*.mov")
        for p in paths:
            try:
                w = clip_to_window(yolo, p)
                if w is None or len(w) < 4:
                    continue
                X.append(pose_features(w))
                y.append(ci)
            except Exception as e:  # noqa: BLE001
                print("skip", p, e)
        print(f"{shot}: {sum(1 for v in y if v == ci)} samples")

    if len(X) < 20:
        print(f"Only {len(X)} samples — add more labelled clips before training.")
        return len(X)

    Xt = torch.tensor(np.array(X), dtype=torch.float32)
    yt = torch.tensor(y, dtype=torch.long)
    model = ShotGRU()
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    lossf = nn.CrossEntropyLoss()
    model.train()
    for ep in range(epochs):
        opt.zero_grad()
        out = model(Xt)
        loss = lossf(out, yt)
        loss.backward()
        opt.step()
        if (ep + 1) % 10 == 0:
            acc = float((out.argmax(1) == yt).float().mean())
            print(f"epoch {ep + 1}: loss={loss.item():.3f} train_acc={acc:.2f}")

    torch.save(model.state_dict(), "/models/classifier.pt")
    models_vol.commit()
    print(f"Saved /models/classifier.pt — trained on {len(X)} clips. Redeploy app.py is not needed; it loads on next cold start.")
    return len(X)


@app.local_entrypoint()
def main(epochs: int = 40):
    n = train.remote(epochs)
    print("done; samples:", n)
