"""
Grounding DINO Open-Vocabulary Interior Object Detector
========================================================
Text-prompted zero-shot object detection for architectural interior elements.
Uses Grounding DINO (Swin-T backbone) to detect objects by natural language prompts.

Pipeline Position: Stage 1 of 3 (Detection → Segmentation → Depth)
"""

import os
import time
import io
import cv2
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional
from app.logger import log_action

# ─── Attempt Grounding DINO Import ────────────────────────────────────────────
HAS_GDINO = False
try:
    from groundingdino.util.inference import load_model, load_image, predict
    HAS_GDINO = True
except ImportError:
    pass

# ─── HuggingFace Transformers Grounding DINO (fallback) ──────────────────────
HAS_TRANSFORMERS_GDINO = False
try:
    from transformers import AutoProcessor, AutoModelForZeroShotObjectDetection
    HAS_TRANSFORMERS_GDINO = True
except ImportError:
    pass

# ─── Interior Detection Text Prompt ──────────────────────────────────────────
INTERIOR_DETECTION_PROMPT = (
    "table . plant . lampshade . lamp . sofa . chair . door . window . "
    "rug . shelf . television . wardrobe . pillow . clock . painting . "
    "mirror . curtain . bed . desk . cabinet . bookcase . vase"
)

# ─── Class Normalization Map ─────────────────────────────────────────────────
GDINO_CLASS_NORMALIZE = {
    "couch": "sofa", "settee": "sofa", "loveseat": "sofa",
    "armchair": "chair", "stool": "chair", "bench": "chair", "seat": "chair",
    "dining table": "table", "coffee table": "table", "desk": "table", "side table": "table",
    "potted plant": "plant", "flower": "plant", "houseplant": "plant",
    "tv": "television", "monitor": "television", "screen": "television",
    "light": "lampshade", "chandelier": "lampshade", "sconce": "lampshade",
    "closet": "wardrobe", "armoire": "wardrobe",
    "carpet": "rug", "mat": "rug",
    "picture": "painting", "art": "painting", "frame": "painting", "poster": "painting",
    "drape": "curtain", "blind": "curtain",
    "bookshelf": "shelf", "bookcase": "shelf", "shelving": "shelf",
}


class GroundingDINODetector:
    """
    Open-vocabulary interior object detector using Grounding DINO.
    Detects interior architectural elements via text prompts without fixed class vocabulary.
    """
    def __init__(self):
        self.device = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.processor = None
        self.backend = None  # "transformers" or "native"

        log_action("GDINO_INIT_START", f"Initializing Grounding DINO detector on {self.device}")

        # Prefer HuggingFace Transformers pipeline (most stable, auto-downloads)
        if HAS_TRANSFORMERS_GDINO:
            try:
                model_id = "IDEA-Research/grounding-dino-tiny"
                self.processor = AutoProcessor.from_pretrained(model_id)
                self.model = AutoModelForZeroShotObjectDetection.from_pretrained(model_id)
                # MPS has limited op support for some DINO ops, use CPU for inference stability
                self.model = self.model.to("cpu")
                self.model.eval()
                self.backend = "transformers"
                log_action("GDINO_INIT_SUCCESS", f"Loaded Grounding DINO Tiny via HuggingFace Transformers (cpu)")
            except Exception as e:
                log_action("GDINO_INIT_WARN", f"HF Transformers GDINO failed: {e}")

        if not self.model and HAS_GDINO:
            try:
                log_action("GDINO_INIT_NATIVE", "Attempting native groundingdino-py load...")
                self.backend = "native"
                log_action("GDINO_INIT_WARN", "Native groundingdino requires manual config/weights path. Using HF fallback.")
            except Exception as e:
                log_action("GDINO_INIT_ERROR", str(e))

        if not self.model:
            log_action("GDINO_INIT_FALLBACK", "No Grounding DINO backend available. Will use YOLO fallback in analyzer.")

    def detect(
        self,
        file_bytes: bytes,
        image_id: str,
        text_prompt: str = INTERIOR_DETECTION_PROMPT,
        box_threshold: float = 0.25,
        text_threshold: float = 0.20
    ) -> Tuple[List[Dict[str, Any]], float]:
        """
        Detect interior objects using text-prompted Grounding DINO.
        Returns list of detections: [{id, class, bbox, confidence}] and processing time.
        """
        start_time = time.time()
        detections: List[Dict[str, Any]] = []

        if not self.model or not file_bytes:
            return detections, 0.0

        log_action("GDINO_DETECT_START", f"Running Grounding DINO on image '{image_id}'")

        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            w, h = img.size

            if self.backend == "transformers":
                inputs = self.processor(images=img, text=text_prompt, return_tensors="pt").to("cpu")

                with torch.no_grad():
                    outputs = self.model(**inputs)

                results = self.processor.post_process_grounded_object_detection(
                    outputs,
                    inputs.input_ids,
                    box_threshold=box_threshold,
                    text_threshold=text_threshold,
                    target_sizes=[(h, w)]
                )[0]

                boxes = results["boxes"]  # [N, 4] in xyxy pixel coords
                scores = results["scores"]
                labels = results["labels"]

                for i in range(len(boxes)):
                    box = boxes[i].tolist()
                    score = float(scores[i])
                    raw_label = labels[i].strip().lower()

                    # Normalize class name
                    norm_label = GDINO_CLASS_NORMALIZE.get(raw_label, raw_label)

                    x1, y1, x2, y2 = int(box[0]), int(box[1]), int(box[2]), int(box[3])

                    detections.append({
                        "id": f"{image_id}_gdino_{i+1:03d}",
                        "class": norm_label,
                        "bbox": [x1, y1, x2, y2],
                        "confidence": round(score, 4),
                        "raw_label": raw_label
                    })

                log_action("GDINO_DETECT_SUCCESS", f"Detected {len(detections)} objects via Grounding DINO Transformers")

        except Exception as e:
            log_action("GDINO_DETECT_ERROR", str(e))

        proc_time = round((time.time() - start_time) * 1000.0, 2)
        log_action("GDINO_DETECT_COMPLETE", f"Grounding DINO finished in {proc_time}ms with {len(detections)} detections")
        return detections, proc_time


# Module-level singleton
grounding_dino_detector = GroundingDINODetector()
