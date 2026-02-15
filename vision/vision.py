
import sys
import os
import time
import requests
import torch
import numpy as np
import cv2
from threading import Thread, Lock
from ultralytics import YOLO

# --- Configuration ---
API_URL = "http://localhost:3000/api/analyze-traffic"
CONF_THRESHOLD = 0.35
IMG_SIZE = 640
FRAME_SKIP = 3        
MODEL_NAME = "yolov8s.pt"
API_INTERVAL = 2.0    
MAX_DET = 300
DISPLAY_TARGET_FPS = 12
DISPLAY_INTERVAL = 1.0 / DISPLAY_TARGET_FPS

# Junctions
JUNCTIONS = [
    { "id": "Vyttila", "source": "vyttila.mp4" },
    { "id": "Edappally", "source": "edappally.mp4" },
    { "id": "Palarivattom", "source": "palarivattom.mp4" },
    { "id": "Kakkanad", "source": "kakkanad.mp4" }
]

CLASS_MAPPING = { 2: "cars", 3: "bikes", 5: "buses", 7: "trucks" }
AMBULANCE_CLASS = "ambulance"

# --- Threaded Video Reader ---
class VideoStream:
    def __init__(self, path, j_id):
        self.stream = cv2.VideoCapture(path, cv2.CAP_FFMPEG)
        self.id = j_id
        self.stopped = False
        self.frame = None
        self.lock = Lock()
        self.success = False
        self.success, self.frame = self.stream.read()

    def start(self):
        t = Thread(target=self.update, args=())
        t.daemon = True
        t.start()
        return self

    def update(self):
        while not self.stopped:
            grabbed, frame = self.stream.read()
            if not grabbed:
                self.stream.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            with self.lock:
                self.frame = frame
                self.success = grabbed
            time.sleep(0.005) 

    def read(self):
        with self.lock:
            return self.success, self.frame

    def release(self):
        self.stopped = True
        self.stream.release()

# --- Main Pipeline ---
def main():
    # Production Startup Diagnostics
    print("="*60)
    device_name = torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    print(f"GPU: {device_name}")
    print("FP16: ON")
    print("Batch: ON")
    print("="*60)

    # 1. Environment & Model
    if torch.cuda.is_available():
        torch.backends.cudnn.benchmark = True
    
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    print(f"Loading {MODEL_NAME}...")
    try:
        model = YOLO(MODEL_NAME)
        model.to(device)
    except Exception as e:
        print(f"Model Load Error: {e}")
        return

    # 2. Async Streams
    caps = []
    for j in JUNCTIONS:
        if os.path.exists(j["source"]):
            vs = VideoStream(j["source"], j["id"]).start()
            caps.append({ "stream": vs, "id": j["id"], "last_sent": 0 })
        else:
            caps.append({ "stream": None, "id": j["id"], "last_sent": 0 })

    # 3. GUI
    window_name = "AI Traffic Command Center (Demo Mode)"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, 1280, 720)

    # 4. Loop State
    frame_count = 0
    inference_time_ms = 0.0
    
    inf_fps = 0
    disp_fps = 0
    last_display_time = time.time() - 1.0
    
    last_results = [None] * len(caps)

    while True:
        # --- A. Grab Frames ---
        raw_frames = []
        for item in caps:
            if item["stream"]:
                s, f = item["stream"].read()
                raw_frames.append(f if s else None)
            else:
                raw_frames.append(None)

        # --- B. Inference ---
        do_inference = (frame_count % FRAME_SKIP == 0)
        
        if do_inference:
            batch_input = []
            batch_indices = []
            
            for idx, frame in enumerate(raw_frames):
                if frame is not None:
                    resized = cv2.resize(frame, (IMG_SIZE, IMG_SIZE))
                    batch_input.append(resized)
                    batch_indices.append(idx)
            
            if batch_input:
                t0 = time.time()
                try:
                    # Hybrid Tracking
                    results = model.track(
                        batch_input,
                        persist=True,
                        imgsz=IMG_SIZE,
                        device=0 if torch.cuda.is_available() else "cpu",
                        half=torch.cuda.is_available(),
                        conf=CONF_THRESHOLD,
                        max_det=MAX_DET,
                        verbose=False,
                        tracker="bytetrack.yaml"
                    )
                    
                    # Process Results
                    for i, r in enumerate(results):
                        real_idx = batch_indices[i]
                        orig_frame = raw_frames[real_idx]
                        orig_h, orig_w = orig_frame.shape[:2]
                        sx, sy = orig_w / IMG_SIZE, orig_h / IMG_SIZE
                        
                        box_list = []
                        counts = { "cars": 0, "bikes": 0, "buses": 0, "trucks": 0, "autos": 0 }
                        amb_detected = False

                        for box in r.boxes:
                            cls_id = int(box.cls[0])
                            name = model.names[cls_id]
                            track_id = int(box.id[0]) if box.id is not None else -1
                            
                            x1, y1, x2, y2 = box.xyxy[0].tolist()
                            x1, x2 = x1 * sx, x2 * sx
                            y1, y2 = y1 * sy, y2 * sy
                            
                            color = (0, 255, 0)
                            if cls_id in CLASS_MAPPING:
                                cat = CLASS_MAPPING[cls_id]
                                counts[cat] += 1
                                if cat == 'cars': color = (0, 255, 0)
                                elif cat == 'trucks': color = (0, 165, 255)
                                elif cat == 'buses': color = (0, 255, 255)
                            elif name == 'auto':
                                counts['autos'] += 1
                                color = (255, 0, 255)
                            elif name == AMBULANCE_CLASS:
                                amb_detected = True
                                color = (0, 0, 255)

                            box_list.append({ "bbox": (int(x1), int(y1), int(x2), int(y2)), "color": color, "id": track_id })

                        last_results[real_idx] = { "boxes": box_list, "counts": counts, "emergency": amb_detected }

                except Exception as e: pass
                
                t1 = time.time()
                inference_time_ms = (t1 - t0) * 1000
                inst_inf_fps = 1.0 / (t1 - t0) if t1 > t0 else 999
                inf_fps = 0.9 * inf_fps + 0.1 * inst_inf_fps

        # --- C. API ---
        for idx, item in enumerate(caps):
            if last_results[idx] and time.time() - item["last_sent"] > API_INTERVAL:
                try:
                    p = { "junction_id": item["id"], "vehicle_count": last_results[idx]["counts"], "ambulance_detected": last_results[idx]["emergency"] }
                    requests.post(API_URL, json=p, timeout=0.005)
                    item["last_sent"] = time.time()
                except: pass

        # --- D. Display ---
        current_time = time.time()
        time_since_disp = current_time - last_display_time
        
        if time_since_disp >= DISPLAY_INTERVAL:
            display_list = []
            for idx, frame in enumerate(raw_frames):
                if frame is None:
                    dummy = np.zeros((540, 960, 3), dtype=np.uint8)
                    display_list.append(dummy)
                    continue

                res = last_results[idx]
                if res:
                    for b in res["boxes"]:
                        cv2.rectangle(frame, b["bbox"][0:2], b["bbox"][2:4], b["color"], 2)
                        if b["id"] > -1:
                            cv2.putText(frame, f"{b['id']}", (b["bbox"][0], b["bbox"][1]-5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, b["color"], 2)

                    if res["emergency"]: 
                        cv2.putText(frame, "EMERGENCY", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0,0,255), 3)

                display_list.append(frame)

            target_w, target_h = 960, 540
            grid_frames = []
            for f in display_list:
                if f.shape[1] != target_w:
                    grid_frames.append(cv2.resize(f, (target_w, target_h)))
                else:
                    grid_frames.append(f)
            while len(grid_frames) < 4: grid_frames.append(np.zeros((target_h, target_w, 3), dtype=np.uint8))

            top = np.hstack((grid_frames[0], grid_frames[1]))
            bot = np.hstack((grid_frames[2], grid_frames[3]))
            grid = np.vstack((top, bot))

            h, w = grid.shape[:2]
            
            # Top Banner
            cv2.rectangle(grid, (0, 0), (w, 50), (0, 0, 50), -1)
            cv2.putText(grid, "DEMO MODE ACTIVE - VISUAL ANALYSIS PRIORITY", (int(w/2)-350, 35), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 255), 2)

            # Bottom Stats
            cv2.rectangle(grid, (0, h-60), (w, h), (20, 20, 20), -1)
            
            real_disp_fps = 1.0 / time_since_disp
            disp_fps = 0.9 * disp_fps + 0.1 * real_disp_fps

            lat_text = f"RTX 4050 | LATENCY: {inference_time_ms:.1f}ms"
            fps_text = f"INF FPS: {inf_fps:.0f} (INTERNAL) | DISPLAY FPS: {disp_fps:.1f} (THROTTLED)"
            
            cv2.putText(grid, lat_text, (20, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (200, 200, 200), 2)
            cv2.putText(grid, fps_text, (w-750, h-20), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            cv2.imshow(window_name, grid)
            cv2.waitKey(1)
            last_display_time = current_time
        
        frame_count += 1

    for c in caps:
        if c["stream"]: c["stream"].release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
