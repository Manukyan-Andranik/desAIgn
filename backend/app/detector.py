"""
Neural Object Detection & Instance Segmentation Engine
======================================================
Real YOLOv8-Seg inference for architectural and interior scene detection.
Extracts actual pixel-level polygon masks from neural tensors.
No hardcoded or fabricated detection coordinates.

Pipeline:
    Image bytes → YOLOv8n-seg forward pass → Extract boxes + masks.xy
    → Taxonomy normalization → IoU NMS dedup → Return detections
"""

import os
import io
import time
import cv2
import numpy as np
from PIL import Image
from typing import List, Dict, Any, Tuple
from dotenv import load_dotenv

load_dotenv()

# ─── Attempt to import ultralytics YOLO ───────────────────────────────────────
try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

# ─── Interior-Only Taxonomy ────────────────────────────────────────────────────
TAXONOMY = {
    "SEATING": ["sofa", "chair", "bed"],
    "TABLES": ["coffee_table", "dining_table"],
    "ELECTRONICS": ["tv", "laptop", "phone", "remote"],
    "DECOR": ["plant", "vase", "clock", "teddy_bear"],
    "KITCHEN": ["refrigerator", "oven", "microwave", "sink", "bottle", "cup", "bowl"],
    "BATHROOM": ["toilet", "sink"],
}

# ─── COCO → Interior Normalized Class Mapping ─────────────────────────────────
CLASS_NORMALIZATION_MAP = {
    "couch": "sofa",
    "bench": "chair",
    "dining table": "dining_table",
    "potted plant": "plant",
    "cell phone": "phone",
    "tv": "tv",
}

# ─── Interior-Only COCO Classes (skip everything not in this set) ─────────────
INTERIOR_COCO_CLASSES = {
    "couch", "chair", "bed", "dining table", "tv", "potted plant",
    "vase", "clock", "book", "bottle", "cup", "laptop", "remote",
    "refrigerator", "oven", "microwave", "sink", "toilet",
    "bowl", "knife", "fork", "spoon", "cell phone", "scissors",
    "teddy bear", "backpack", "handbag", "suitcase",
}

# ─── Interior Hierarchy Rules ─────────────────────────────────────────────────
HIERARCHY_RULES = {
    "sofa": "floor",
    "chair": "floor",
    "bed": "floor",
    "coffee_table": "floor",
    "dining_table": "floor",
    "tv": "wall",
    "plant": "floor",
    "vase": "dining_table",
    "laptop": "dining_table",
    "refrigerator": "floor",
    "oven": "floor",
    "toilet": "floor",
    "sink": "wall",
}


def calculate_iou(box_a: List[int], box_b: List[int]) -> float:
    """Calculate Intersection over Union of two [x1, y1, x2, y2] bounding boxes."""
    xa = max(box_a[0], box_b[0])
    ya = max(box_a[1], box_b[1])
    xb = min(box_a[2], box_b[2])
    yb = min(box_a[3], box_b[3])

    inter = max(0, xb - xa) * max(0, yb - ya)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union = float(area_a + area_b - inter)

    return inter / union if union > 0 else 0.0


class YOLOArchitecturalDetector:
    """
    Real Neural Instance Segmentation Engine (Ultralytics YOLOv8-Seg).

    Runs actual model inference — no hardcoded fallback detections.
    Extracts polygon masks directly from neural tensor output (masks.xy).
    """

    def __init__(self):
        self.replicate_token = os.getenv("REPLICATE_API_TOKEN")
        self.model = None

        if HAS_YOLO:
            try:
                # Extra-large model — maximum accuracy for interior details
                self.model = YOLO("yolov8x-seg.pt")
                print("[Detector] Loaded yolov8x-seg.pt (extra-large)")
            except Exception:
                try:
                    self.model = YOLO("yolov8m-seg.pt")
                    print("[Detector] Fallback: loaded yolov8m-seg.pt (medium)")
                except Exception as e:
                    print(f"[Detector] Failed to initialize YOLO model: {e}")

    def normalize_class(self, raw_class: str) -> str:
        """Map raw COCO class names to normalized taxonomy labels."""
        cls_lower = raw_class.lower().strip()
        return CLASS_NORMALIZATION_MAP.get(cls_lower, cls_lower)

    def apply_nms(self, objects: List[Dict[str, Any]], iou_threshold: float = 0.6) -> List[Dict[str, Any]]:
        """Per-class Non-Maximum Suppression to remove overlapping duplicates."""
        if not objects:
            return []
        sorted_objs = sorted(objects, key=lambda x: x["confidence"], reverse=True)
        keep = []
        while sorted_objs:
            current = sorted_objs.pop(0)
            keep.append(current)
            sorted_objs = [
                obj for obj in sorted_objs
                if obj["class"] != current["class"] or calculate_iou(current["bbox"], obj["bbox"]) < iou_threshold
            ]
        return keep

    def detect_with_yolo(self, file_bytes: bytes, width: int, height: int, prefix: str) -> List[Dict[str, Any]]:
        """
        Run real YOLOv8-Seg inference on image bytes.
        Only returns interior-relevant objects (skips cars, people, outdoor items).
        Extracts bounding boxes AND neural polygon masks from model tensors.
        """
        if not self.model or not file_bytes:
            return []

        candidates = []
        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            results = self.model(img, verbose=False, imgsz=1280, conf=0.10)

            for r in results:
                boxes = r.boxes
                masks = getattr(r, "masks", None)

                for idx, box in enumerate(boxes):
                    cls_id = int(box.cls[0])
                    raw_cls_name = self.model.names[cls_id]

                    # Skip non-interior classes (cars, people, outdoor objects, etc.)
                    if raw_cls_name not in INTERIOR_COCO_CLASSES:
                        continue

                    b = box.xyxy[0].tolist()
                    conf = float(box.conf[0])

                    # Extract neural polygon mask if available
                    poly_pts = None
                    if masks is not None and len(masks.xy) > idx:
                        pts = masks.xy[idx]
                        if len(pts) >= 3:
                            poly_pts = [[float(p[0]), float(p[1])] for p in pts]

                    candidates.append({
                        "id": f"{prefix}int_{raw_cls_name}_{len(candidates) + 1:02d}",
                        "class": raw_cls_name,
                        "bbox": [int(b[0]), int(b[1]), int(b[2]), int(b[3])],
                        "confidence": round(conf, 3),
                        "neural_polygon": poly_pts
                    })
        except Exception as e:
            print(f"[Detector] YOLO inference error: {e}")

        return candidates

    def detect(
        self,
        width: int,
        height: int,
        image_id: str,
        file_bytes: bytes = b"",
        conf_threshold: float = 0.15
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Main detection entry point. Runs YOLO inference only — no fabricated fallbacks.

        Returns:
            Tuple of (list of detected objects, processing_time_ms)
        """
        start_time = time.time()
        prefix = f"{image_id}_" if image_id else ""

        # Run real neural inference (only source of detections)
        raw_candidates = self.detect_with_yolo(file_bytes, width, height, prefix)

        # Post-process: normalize classes, apply hierarchy, filter by confidence
        processed = []
        for cand in raw_candidates:
            if cand["confidence"] < conf_threshold:
                continue
            norm_class = self.normalize_class(cand["class"])
            cand["class"] = norm_class
            cand["parent"] = HIERARCHY_RULES.get(norm_class)
            processed.append(cand)

        # NMS deduplication
        final_objects = self.apply_nms(processed, iou_threshold=0.6)
        processing_time_ms = round((time.time() - start_time) * 1000.0, 2)

        return final_objects, processing_time_ms


object_detector = YOLOArchitecturalDetector()
