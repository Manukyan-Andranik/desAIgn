"""
Grounding DINO 1.6 Open-Vocabulary Interior Object Detector
=============================================================
Text-prompted zero-shot object detection for architectural interior elements.
Uses Grounding DINO (Swin-T backbone) via HuggingFace Transformers.

Prompt format: "a sofa. a table. a lamp." (lowercased, period-separated phrases)

Pipeline Position: Stage 2 of 5
    Florence-2 → [Grounding DINO] → SAM 2.1 → Depth Anything V2 → SGG
"""

import io
import time
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Any, Tuple
from app.logger import log_action

# ─── HuggingFace Transformers Grounding DINO ─────────────────────────────────
HAS_TRANSFORMERS_GDINO = False
try:
    from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
    HAS_TRANSFORMERS_GDINO = True
except ImportError:
    pass

# ─── Interior Detection Text Prompt (period-separated format) ────────────────
# Format required by Grounding DINO: "a <noun>. a <noun>."
INTERIOR_DETECTION_PROMPT = (
    "a table. a sofa. a chair. a lamp. a plant. a door. a window. "
    "a rug. a shelf. a television. a wardrobe. a pillow. a clock. "
    "a painting. a mirror. a curtain. a bed. a desk. a cabinet. "
    "a vase. a bookshelf. a coffee table. a fireplace. a pendant light. "
    "a floor lamp. a wall lamp. an ottoman."
)

# ─── Class Normalization Map ─────────────────────────────────────────────────
GDINO_CLASS_NORMALIZE = {
    "a sofa": "sofa", "sofa": "sofa", "a couch": "sofa", "couch": "sofa",
    "a settee": "sofa", "settee": "sofa", "a loveseat": "sofa",
    "a chair": "chair", "chair": "chair", "a armchair": "chair", "armchair": "chair",
    "a stool": "chair", "stool": "chair", "a bench": "chair", "bench": "chair",
    "an ottoman": "chair", "ottoman": "chair", "a ottoman": "chair",
    "a table": "table", "table": "table", "a coffee table": "table",
    "coffee table": "table", "a dining table": "table", "dining table": "table",
    "a desk": "desk", "desk": "desk", "a side table": "table",
    "a plant": "plant", "plant": "plant", "a potted plant": "plant",
    "potted plant": "plant", "a flower": "plant", "flower": "plant",
    "a vase": "vase", "vase": "vase",
    "a lamp": "lampshade", "lamp": "lampshade", "a pendant light": "lampshade",
    "pendant light": "lampshade", "a floor lamp": "lampshade", "floor lamp": "lampshade",
    "a wall lamp": "lampshade", "wall lamp": "lampshade",
    "a chandelier": "lampshade", "chandelier": "lampshade",
    "a television": "television", "television": "television",
    "a tv": "television", "tv": "television", "a monitor": "television",
    "a window": "window", "window": "window",
    "a door": "door", "door": "door",
    "a rug": "rug", "rug": "rug", "a carpet": "rug", "carpet": "rug",
    "a curtain": "curtain", "curtain": "curtain", "a drape": "curtain",
    "a shelf": "shelf", "shelf": "shelf", "a bookshelf": "shelf",
    "bookshelf": "shelf", "a bookcase": "shelf",
    "a cabinet": "cabinet", "cabinet": "cabinet",
    "a wardrobe": "wardrobe", "wardrobe": "wardrobe", "a closet": "wardrobe",
    "a painting": "painting", "painting": "painting", "a picture": "painting",
    "picture": "painting", "a art": "painting", "a poster": "painting",
    "a mirror": "mirror", "mirror": "mirror",
    "a pillow": "pillow", "pillow": "pillow", "a cushion": "pillow",
    "a clock": "clock", "clock": "clock",
    "a bed": "bed", "bed": "bed",
    "a fireplace": "fireplace", "fireplace": "fireplace",
}


class GroundingDINODetector:
    """
    Open-vocabulary interior object detector using Grounding DINO via HuggingFace Transformers.
    Detects interior architectural elements via natural language text prompts.
    """
    def __init__(self):
        self.device = "cpu"  # GDINO on MPS has limited op support; CPU is stable
        self.model = None
        self.processor = None

        log_action("GDINO_INIT_START", f"Initializing Grounding DINO detector (target device: cpu)")

        if not HAS_TRANSFORMERS_GDINO:
            log_action("GDINO_INIT_WARN", "transformers not installed. Grounding DINO unavailable.")
            return

        try:
            model_id = "IDEA-Research/grounding-dino-base"
            self.processor = AutoProcessor.from_pretrained(model_id)
            self.model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id)
            self.model.to(self.device)
            self.model.eval()
            log_action("GDINO_INIT_SUCCESS", f"Loaded Grounding DINO Base (Swin-B) via HuggingFace Transformers ({self.device})")
        except Exception as e:
            log_action("GDINO_INIT_ERROR", f"Grounding DINO init failed: {e}")

    def detect(
        self,
        file_bytes: bytes,
        image_id: str,
        text_prompt: str = INTERIOR_DETECTION_PROMPT,
        threshold: float = 0.20,
        text_threshold: float = 0.20
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Detect interior objects using text-prompted Grounding DINO.

        Args:
            file_bytes: Raw image bytes
            image_id: Image identifier for logging & object IDs
            text_prompt: Period-separated detection prompt ("a sofa. a table.")
            threshold: Confidence threshold for box predictions
            text_threshold: Text matching threshold

        Returns:
            (detections, processing_time_ms)
            detections: [{id, class, bbox, confidence, raw_label}]
        """
        start_time = time.time()
        detections: List[Dict[str, Any]] = []

        if not self.model or not self.processor or not file_bytes:
            return detections, 0.0

        log_action("GDINO_DETECT_START", f"Running Grounding DINO on image '{image_id}'")

        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            w, h = img.size

            inputs = self.processor(images=img, text=text_prompt, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)

            # Use correct parameter names for current transformers API
            results = self.processor.post_process_grounded_object_detection(
                outputs,
                input_ids=inputs.input_ids,
                threshold=threshold,
                text_threshold=text_threshold,
                target_sizes=[(h, w)]
            )[0]

            boxes = results["boxes"]
            scores = results["scores"]
            # Use text_labels if available (newer API), fall back to labels
            labels = results.get("text_labels", results.get("labels", []))

            for i in range(len(boxes)):
                box = boxes[i].tolist()
                score = float(scores[i])
                raw_label = str(labels[i]).strip().lower()
                if raw_label in ["a", "an", "the", "in", "on", "at"]:
                    continue

                # Normalize class name
                norm_label = GDINO_CLASS_NORMALIZE.get(raw_label)
                if not norm_label:
                    # Check for partial word matches in taxonomy
                    matched = None
                    for key, target in GDINO_CLASS_NORMALIZE.items():
                        clean_key = key.replace("a ", "").replace("an ", "")
                        if clean_key in raw_label:
                            matched = target
                            break
                    norm_label = matched if matched else raw_label.replace("a ", "").replace("an ", "").split()[0]

                x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])
                # Clamp to image bounds
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)

                if (x2 - x1) < 5 or (y2 - y1) < 5:
                    continue  # Skip tiny detections

                detections.append({
                    "id": f"{image_id}_gdino_{i+1:03d}",
                    "class": norm_label,
                    "bbox": [x1, y1, x2, y2],
                    "confidence": round(score, 4),
                    "raw_label": raw_label
                })

            # Apply IoU Non-Maximum Suppression (NMS) to eliminate duplicate overlapping predictions
            detections = self._apply_nms(detections, iou_threshold=0.55)

            log_action("GDINO_DETECT_SUCCESS", f"Detected {len(detections)} high-precision objects via Grounding DINO NMS")
            for det in detections:
                log_action("GDINO_OBJECT", f"{det['id']}: {det['class']} (conf={det['confidence']}) bbox={det['bbox']}")

        except Exception as e:
            log_action("GDINO_DETECT_ERROR", str(e))

        proc_time = round((time.time() - start_time) * 1000.0, 2)
        log_action("GDINO_DETECT_COMPLETE", f"Grounding DINO finished in {proc_time}ms with {len(detections)} detections")
        return detections, proc_time

    def _apply_nms(self, detections: List[Dict[str, Any]], iou_threshold: float = 0.55) -> List[Dict[str, Any]]:
        """Filter out duplicate bounding box detections based on IoU overlap."""
        if not detections:
            return []

        sorted_dets = sorted(detections, key=lambda x: x["confidence"], reverse=True)
        keep = []

        for det in sorted_dets:
            b1 = det["bbox"]
            area1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
            duplicate = False

            for kept in keep:
                b2 = kept["bbox"]
                # Compute intersection
                ix1, iy1 = max(b1[0], b2[0]), max(b1[1], b2[1])
                ix2, iy2 = min(b1[2], b2[2]), min(b1[3], b2[3])
                iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
                intersection = iw * ih

                if intersection > 0:
                    area2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
                    union = area1 + area2 - intersection
                    iou = intersection / float(union) if union > 0 else 0
                    if iou > iou_threshold or (intersection / float(min(area1, area2)) > 0.85):
                        duplicate = True
                        break

            if not duplicate:
                keep.append(det)

        return keep

    def detect_from_captions(
        self,
        file_bytes: bytes,
        image_id: str,
        captions: List[str],
        threshold: float = 0.25,
        text_threshold: float = 0.25
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Detect objects using captions from Florence-2 / VLM as prompts.
        Each caption becomes a detection target.
        """
        if not captions:
            return self.detect(file_bytes, image_id, threshold=threshold, text_threshold=text_threshold)

        # Build period-separated prompt from captions
        prompt = ". ".join(f"a {c.strip().lower()}" for c in captions) + "."
        log_action("GDINO_CAPTION_PROMPT", f"Caption-driven prompt: {prompt[:120]}...")
        return self.detect(file_bytes, image_id, text_prompt=prompt, threshold=threshold, text_threshold=text_threshold)


# Module-level singleton
grounding_dino_detector = GroundingDINODetector()
