"""
SAM (Segment Anything Model) Pixel-Perfect Mask Segmentor
==========================================================
Takes bounding box prompts from Grounding DINO and generates pixel-perfect
binary masks + polygon contours for each detected interior object.

Pipeline Position: Stage 2 of 3 (Detection → Segmentation → Depth)
"""

import os
import io
import time
import cv2
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional
from app.logger import log_action

# ─── Attempt SAM Import ──────────────────────────────────────────────────────
HAS_SAM = False
try:
    from segment_anything import sam_model_registry, SamPredictor
    HAS_SAM = True
except ImportError:
    pass

# ─── SAM Model Checkpoint Paths ──────────────────────────────────────────────
SAM_CHECKPOINTS = {
    "vit_b": {
        "url": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_b_01ec64.pth",
        "filename": "sam_vit_b_01ec64.pth"
    },
    "vit_l": {
        "url": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth",
        "filename": "sam_vit_l_0b3195.pth"
    },
    "vit_h": {
        "url": "https://dl.fbaipublicfiles.com/segment_anything/sam_vit_h_4b8939.pth",
        "filename": "sam_vit_h_4b8939.pth"
    }
}

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


def download_sam_checkpoint(model_type: str = "vit_b") -> str:
    """Download SAM checkpoint if not present."""
    os.makedirs(MODELS_DIR, exist_ok=True)
    checkpoint_info = SAM_CHECKPOINTS[model_type]
    checkpoint_path = os.path.join(MODELS_DIR, checkpoint_info["filename"])

    if not os.path.exists(checkpoint_path):
        log_action("SAM_DOWNLOAD_START", f"Downloading SAM {model_type} checkpoint (~375MB)...")
        import urllib.request
        urllib.request.urlretrieve(checkpoint_info["url"], checkpoint_path)
        log_action("SAM_DOWNLOAD_COMPLETE", f"SAM {model_type} checkpoint saved to {checkpoint_path}")

    return checkpoint_path


def mask_to_polygon(mask: np.ndarray, simplify_epsilon: float = 2.0) -> List[List[float]]:
    """Convert a binary mask to a simplified polygon contour."""
    mask_uint8 = (mask * 255).astype(np.uint8)
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return []

    # Take the largest contour
    largest = max(contours, key=cv2.contourArea)

    # Simplify to reduce point count
    epsilon = simplify_epsilon * cv2.arcLength(largest, True) / 1000.0
    approx = cv2.approxPolyDP(largest, epsilon, True)

    polygon = [[float(pt[0][0]), float(pt[0][1])] for pt in approx]

    # Ensure minimum 3 points for a valid polygon
    if len(polygon) < 3:
        return []

    return polygon


class SAMSegmentor:
    """
    Pixel-perfect mask segmentor using Meta's Segment Anything Model (SAM).
    Takes bounding boxes from Grounding DINO and generates exact polygon masks.
    """
    def __init__(self, model_type: str = "vit_b"):
        import threading
        self.model_type = model_type
        self.predictor = None
        self.device = "cpu"  # SAM on MPS can be unstable; CPU is safer and still fast
        self.model_available = HAS_SAM
        self._lock = threading.Lock()

    def _load_model(self):
        """Thread-safe lazy loading of SAM model weights."""
        if self.predictor is not None:
            return
        with self._lock:
            if self.predictor is not None:
                return
            log_action("SAM_INIT_START", f"Lazy loading SAM {self.model_type} segmentor")
            if not HAS_SAM:
                log_action("SAM_INIT_WARN", "segment-anything package not installed")
                return
            try:
                # Apply thread constraints inside Python dynamically
                try:
                    torch.set_num_threads(1)
                    torch.set_num_interop_threads(1)
                except RuntimeError:
                    pass
                checkpoint_path = download_sam_checkpoint(self.model_type)
                sam = sam_model_registry[self.model_type](checkpoint=checkpoint_path)
                sam.to(self.device)
                sam.eval()
                self.predictor = SamPredictor(sam)
                log_action("SAM_INIT_SUCCESS", f"SAM {self.model_type} loaded on {self.device}")
            except Exception as e:
                log_action("SAM_INIT_ERROR", f"SAM initialization failed: {e}")

    def segment(
        self,
        file_bytes: bytes,
        detections: List[Dict[str, Any]],
        image_id: str
    ) -> List[Dict[str, Any]]:
        """
        Generate pixel-perfect masks for each detection.

        Args:
            file_bytes: Raw image bytes
            detections: List of dicts from Grounding DINO with 'bbox' key [x1,y1,x2,y2]
            image_id: Image identifier for logging

        Returns:
            Enhanced detections with added 'polygon', 'mask_area', and 'mask_rle' fields.
        """
        start_time = time.time()

        self._load_model()

        if not self.predictor or not file_bytes or not detections:
            # Fallback: convert bounding boxes to rectangle polygons
            for det in detections:
                x1, y1, x2, y2 = det["bbox"]
                det["polygon"] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
                det["mask_area"] = (x2 - x1) * (y2 - y1)
            return detections

        log_action("SAM_SEGMENT_START", f"Running SAM on {len(detections)} detections for '{image_id}'")

        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            img_np = np.array(img)

            # Set the image embedding (computed once, reused for all boxes)
            self.predictor.set_image(img_np)

            for i, det in enumerate(detections):
                x1, y1, x2, y2 = det["bbox"]
                input_box = np.array([x1, y1, x2, y2])

                masks, scores, _ = self.predictor.predict(
                    point_coords=None,
                    point_labels=None,
                    box=input_box[None, :],
                    multimask_output=False
                )

                # Take the best mask
                best_mask = masks[0]  # shape: (H, W)
                best_score = float(scores[0])

                # Convert mask to polygon
                polygon = mask_to_polygon(best_mask)
                mask_area = int(np.sum(best_mask))

                if polygon:
                    det["polygon"] = polygon
                else:
                    # Fallback to bbox rectangle
                    det["polygon"] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]

                det["mask_area"] = mask_area
                det["mask_score"] = best_score

            log_action("SAM_SEGMENT_SUCCESS", f"Generated {len(detections)} pixel-perfect masks")

        except Exception as e:
            log_action("SAM_SEGMENT_ERROR", f"SAM segmentation failed: {e}. Using bbox fallback.")
            for det in detections:
                x1, y1, x2, y2 = det["bbox"]
                det["polygon"] = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
                det["mask_area"] = (x2 - x1) * (y2 - y1)
        finally:
            # Reset predictor state to free memory
            try:
                self.predictor.reset_image()
            except Exception:
                pass

        proc_time = round((time.time() - start_time) * 1000.0, 2)
        log_action("SAM_SEGMENT_COMPLETE", f"SAM segmentation finished in {proc_time}ms")

        return detections


# Module-level singleton
sam_segmentor = SAMSegmentor(model_type="vit_b")
