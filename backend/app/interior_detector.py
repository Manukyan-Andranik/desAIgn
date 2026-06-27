"""
Production Interior Instance Segmentation Engine
=================================================
Real neural inference using YOLOv8-Seg instance segmentation weights.
Extracts exact pixel-level polygon masks from neural tensors for each
detected interior object. No hardcoded or fabricated coordinates.

Architecture:
    Upload Image → YOLOv8n-seg forward pass → Extract masks.xy (polygon)
    and masks.data (binary tensor) → Filter to interior classes →
    NMS dedup → Return polygon/RLE masks + labels

Detectable COCO Interior Classes:
    sofa, chair, bed, dining_table, tv, plant, vase, clock, book,
    bottle, cup, laptop, remote, refrigerator, oven, microwave, sink, toilet
"""

import io
import time
import base64
import zlib
import gc
import cv2
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Any, Tuple, Optional
from fastapi import HTTPException
from app.models import MaskSegmentation, InteriorObjectInstance

# ─── Attempt to import Ultralytics YOLO ───────────────────────────────────────
try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False

# ─── COCO-80 → Interior Label Mapping ─────────────────────────────────────────
# Only classes relevant to indoor/interior scenes are included.
# YOLOv8 COCO weights CANNOT detect: wall, floor, ceiling, window, door,
# rug, curtain, lamp, shelf — those require ADE20K or open-vocab models.
INTERIOR_COCO_MAP: Dict[str, str] = {
    "couch": "sofa",
    "chair": "chair",
    "bed": "bed",
    "dining table": "dining_table",
    "tv": "tv",
    "potted plant": "plant",
    "vase": "vase",
    "clock": "clock",
    "book": "book",
    "bottle": "bottle",
    "cup": "cup",
    "laptop": "laptop",
    "remote": "remote",
    "refrigerator": "refrigerator",
    "oven": "oven",
    "microwave": "microwave",
    "sink": "sink",
    "toilet": "toilet",
    "cell phone": "phone",
    "scissors": "scissors",
    "teddy bear": "teddy_bear",
}

# ─── Interior Category Groups (for UI/frontend display) ───────────────────────
INTERIOR_CATEGORIES = {
    "FURNITURE": ["sofa", "chair", "bed", "dining_table"],
    "ELECTRONICS": ["tv", "laptop", "phone", "remote"],
    "DECOR": ["plant", "vase", "clock", "teddy_bear", "book"],
    "KITCHEN": ["refrigerator", "oven", "microwave", "sink", "bottle", "cup", "bowl", "knife"],
    "BATHROOM": ["toilet", "sink"],
}


# ─── Mask Conversion Utilities ─────────────────────────────────────────────────

def polygon_from_neural_contour(xy_points: np.ndarray, tolerance: float = 0.8) -> List[List[float]]:
    """
    Simplify raw neural polygon contour (from masks.xy) using Douglas-Peucker
    approximation. Returns [[x1,y1], [x2,y2], ...] point list.

    Args:
        xy_points: Raw (N, 2) float array from YOLOv8 masks.xy[i]
        tolerance: Simplification factor (lower = more precise, higher = fewer points)
    """
    if len(xy_points) < 3:
        return []

    # Convert to cv2 contour format (N, 1, 2) int32
    contour = xy_points.reshape(-1, 1, 2).astype(np.int32)
    epsilon = tolerance * cv2.arcLength(contour, True) * 0.005
    approx = cv2.approxPolyDP(contour, epsilon, True)

    return [[float(p[0][0]), float(p[0][1])] for p in approx]


def mask_tensor_to_polygon(mask_tensor: np.ndarray, tolerance: float = 1.0) -> List[List[float]]:
    """
    Convert a full binary mask tensor (H, W) to simplified polygon contours
    using OpenCV findContours + Douglas-Peucker approximation.

    Used as fallback when masks.xy is unavailable but masks.data exists.
    """
    mask_uint8 = (mask_tensor > 0.5).astype(np.uint8) * 255
    contours, _ = cv2.findContours(mask_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        return []

    # Use the largest contour (most pixels)
    largest = max(contours, key=cv2.contourArea)
    if len(largest) < 3:
        return []

    epsilon = tolerance * cv2.arcLength(largest, True) * 0.01
    approx = cv2.approxPolyDP(largest, epsilon, True)

    return [[float(p[0][0]), float(p[0][1])] for p in approx]


def mask_tensor_to_rle(mask_tensor: np.ndarray) -> str:
    """
    Compress a binary mask tensor (H, W) into Base64-encoded Zlib RLE string.
    Column-major (Fortran) order for COCO-compatible RLE format.
    """
    binary = (mask_tensor > 0.5).astype(np.uint8)
    flat = binary.flatten(order="F")
    diffs = np.diff(flat)
    change_indices = np.where(diffs != 0)[0] + 1
    runs = np.diff(np.concatenate(([0], change_indices, [len(flat)])))

    raw_bytes = runs.astype(np.int32).tobytes()
    compressed = zlib.compress(raw_bytes, level=6)
    return base64.b64encode(compressed).decode("utf-8")


# ─── GPU Memory Management ────────────────────────────────────────────────────

def clear_gpu_memory():
    """Flush CUDA caches to prevent OOM during repeated inference."""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    gc.collect()


# ─── IoU NMS ──────────────────────────────────────────────────────────────────

def _iou(box_a: List[int], box_b: List[int]) -> float:
    """Intersection over Union for two [x1, y1, x2, y2] boxes."""
    xa = max(box_a[0], box_b[0])
    ya = max(box_a[1], box_b[1])
    xb = min(box_a[2], box_b[2])
    yb = min(box_a[3], box_b[3])

    inter = max(0, xb - xa) * max(0, yb - ya)
    area_a = (box_a[2] - box_a[0]) * (box_a[3] - box_a[1])
    area_b = (box_b[2] - box_b[0]) * (box_b[3] - box_b[1])
    union = float(area_a + area_b - inter)

    return inter / union if union > 0 else 0.0


def _nms_filter(detections: List[Dict[str, Any]], iou_threshold: float = 0.5) -> List[Dict[str, Any]]:
    """Per-class Non-Maximum Suppression to deduplicate overlapping detections."""
    if not detections:
        return []

    sorted_dets = sorted(detections, key=lambda d: d["confidence"], reverse=True)
    keep = []

    while sorted_dets:
        best = sorted_dets.pop(0)
        keep.append(best)
        sorted_dets = [
            d for d in sorted_dets
            if d["label"] != best["label"] or _iou(best["bbox"], d["bbox"]) < iou_threshold
        ]

    return keep


# ═══════════════════════════════════════════════════════════════════════════════
#  Interior Segmentation Pipeline — Real Neural Inference
# ═══════════════════════════════════════════════════════════════════════════════

class InteriorSegmentationPipeline:
    """
    Production Instance Segmentation Engine for Interior Design.

    Runs real YOLOv8-Seg inference on uploaded images and extracts:
    - Per-instance pixel-level polygon masks (from neural tensors)
    - Class labels mapped to interior design taxonomy
    - Confidence scores from neural network output

    Does NOT return bounding boxes in final output.
    Does NOT fabricate detections for undetectable classes.
    """

    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None

        if HAS_YOLO:
            try:
                # Extra-large model — maximum accuracy for interior details
                self.model = YOLO("yolov8x-seg.pt")
                print(f"[InteriorPipeline] Loaded yolov8x-seg.pt on {self.device}")
            except Exception as e:
                print(f"[InteriorPipeline] Failed to load yolov8x-seg.pt: {e}")
                try:
                    self.model = YOLO("yolov8m-seg.pt")
                    print(f"[InteriorPipeline] Fallback: loaded yolov8m-seg.pt on {self.device}")
                except Exception as e2:
                    print(f"[InteriorPipeline] No YOLO model available: {e2}")
        else:
            print("[InteriorPipeline] ultralytics not installed — no inference available")

    def segment_room(
        self,
        file_bytes: bytes,
        width: int,
        height: int,
        image_id: str,
        prompts: Optional[str] = None,
        conf_threshold: float = 0.10,
        output_format: str = "polygon"
    ) -> Tuple[List[InteriorObjectInstance], float]:
        """
        Run real instance segmentation on an interior room image.

        Args:
            file_bytes: Raw image bytes from upload
            width, height: Image dimensions (recalculated from actual image)
            image_id: Unique identifier for this inference run
            prompts: Unused (reserved for future Grounding DINO integration)
            conf_threshold: Minimum confidence to include a detection
            output_format: "polygon" for vertex points or "rle" for compressed mask

        Returns:
            Tuple of (list of InteriorObjectInstance, processing_time_ms)
        """
        start_time = time.time()

        if not self.model or not file_bytes:
            proc_time = round((time.time() - start_time) * 1000.0, 2)
            return [], proc_time

        try:
            # ── 1. Open and validate image ─────────────────────────────────
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            w, h = img.size

            # ── 2. Run YOLOv8-Seg neural inference (1280px for small objects) ─
            results = self.model(img, verbose=False, conf=conf_threshold, imgsz=1280)

            if not results or len(results) == 0:
                proc_time = round((time.time() - start_time) * 1000.0, 2)
                return [], proc_time

            r = results[0]
            boxes = r.boxes
            masks = getattr(r, "masks", None)

            # ── 3. Extract detections + masks ──────────────────────────────
            raw_detections: List[Dict[str, Any]] = []

            for idx, box in enumerate(boxes):
                # Get raw COCO class name
                cls_id = int(box.cls[0])
                raw_name = self.model.names[cls_id]
                conf = float(box.conf[0])

                # Filter: only keep interior-relevant classes
                interior_label = INTERIOR_COCO_MAP.get(raw_name)
                if interior_label is None:
                    continue

                # Confidence gate
                if conf < conf_threshold:
                    continue

                # Bounding box (used only for NMS, NOT in final output)
                b = box.xyxy[0].tolist()
                bbox = [int(b[0]), int(b[1]), int(b[2]), int(b[3])]

                # ── Extract pixel mask ─────────────────────────────────
                polygon_points: List[List[float]] = []
                rle_string: Optional[str] = None

                if masks is not None and len(masks.xy) > idx:
                    # Primary: neural polygon contour from masks.xy
                    neural_xy = masks.xy[idx]
                    if len(neural_xy) >= 3:
                        polygon_points = polygon_from_neural_contour(neural_xy, tolerance=0.8)

                    # For RLE: use the full binary mask tensor
                    if output_format == "rle" and masks.data is not None and len(masks.data) > idx:
                        mask_tensor = masks.data[idx].cpu().numpy()
                        # Resize mask tensor to original image dimensions
                        if mask_tensor.shape != (h, w):
                            mask_resized = cv2.resize(
                                mask_tensor.astype(np.float32), (w, h),
                                interpolation=cv2.INTER_LINEAR
                            )
                        else:
                            mask_resized = mask_tensor
                        rle_string = mask_tensor_to_rle(mask_resized)

                    # Fallback: if masks.xy was too sparse, try masks.data → contour
                    if not polygon_points and masks.data is not None and len(masks.data) > idx:
                        mask_tensor = masks.data[idx].cpu().numpy()
                        if mask_tensor.shape != (h, w):
                            mask_resized = cv2.resize(
                                mask_tensor.astype(np.float32), (w, h),
                                interpolation=cv2.INTER_LINEAR
                            )
                        else:
                            mask_resized = mask_tensor
                        polygon_points = mask_tensor_to_polygon(mask_resized)

                # Skip detections without usable mask data
                if not polygon_points and not rle_string:
                    continue

                raw_detections.append({
                    "label": interior_label,
                    "confidence": round(conf, 4),
                    "bbox": bbox,
                    "polygon": polygon_points,
                    "rle": rle_string,
                })

            # ── 4. NMS deduplication ───────────────────────────────────────
            filtered = _nms_filter(raw_detections, iou_threshold=0.5)

            # ── 5. Build response objects ──────────────────────────────────
            results_out: List[InteriorObjectInstance] = []

            for i, det in enumerate(filtered):
                if output_format == "rle" and det.get("rle"):
                    seg = MaskSegmentation(type="rle", rle=det["rle"])
                else:
                    seg = MaskSegmentation(type="polygon", points=det["polygon"])

                results_out.append(InteriorObjectInstance(
                    id=f"{image_id}_obj_{i + 1:03d}",
                    **{"class": det["label"]},
                    segmentation=seg,
                    confidence=det["confidence"],
                ))

            proc_time = round((time.time() - start_time) * 1000.0, 2)
            return results_out, proc_time

        except torch.cuda.OutOfMemoryError:
            clear_gpu_memory()
            raise HTTPException(
                status_code=507,
                detail="GPU out of memory during interior segmentation. Try a smaller image."
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Interior segmentation failed: {str(e)}")
        finally:
            clear_gpu_memory()


# ─── Module-Level Singleton ────────────────────────────────────────────────────
interior_pipeline = InteriorSegmentationPipeline()
