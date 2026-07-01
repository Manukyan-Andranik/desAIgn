"""
Ultra-Robust Interior Instance Segmentation Engine (Mask2Former ADE20K + Connected Components + YOLO)
=====================================================================================================
Specialized high-sensitivity neural segmentation targeting 18 critical interior design classes:
table, wall decor, plant, lampshade, sofa, chair, glass, bottle, door, window, rug, book,
computer, television, wardrobe, shelf, clock, pillow.

Features:
- Layer Categorization (structural, furniture, decor, background)
- Connected Components Decomposition: Splits global semantic masks into individual physical object instances.
- Multi-Alias Taxonomy Harmonization: Maps all raw neural labels to exact taxonomy.
- Dual-Model Fusion: Mask2Former ADE20K for architectural/structural layout + YOLOv8x-Seg for high-recall furniture.
- Strict Output: Pixel-exact polygon / RLE masks only. ZERO bounding boxes.
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
from app.logger import log_action

# ─── Neural Framework Imports ──────────────────────────────────────────────────
HAS_TRANSFORMERS = False
try:
    from transformers import AutoImageProcessor, Mask2FormerForUniversalSegmentation
    HAS_TRANSFORMERS = True
except ImportError:
    pass

HAS_YOLO = False
try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    pass


# ─── Explicit 18-Category Target Taxonomy Mapping ──────────────────────────────
EXPLICIT_TAXONOMY_MAP = {
    # 1. Table
    "table": "table", "dining table": "table", "desk": "table", "coffee table": "table",
    
    # 2. Wall Decor
    "painting, picture": "wall decor", "painting": "wall decor", "picture": "wall decor",
    "poster": "wall decor", "mirror": "wall decor", "frame": "wall decor", "art": "wall decor",

    # 3. Plant
    "plant, flora, plant life": "plant", "house plant": "plant", "potted plant": "plant",
    "plant": "plant", "flower": "plant", "vase": "plant",

    # 4. Lampshade
    "lamp": "lampshade", "chandelier, pendant light": "lampshade", "light": "lampshade",
    "lighting": "lampshade", "sconce": "lampshade", "lampshade": "lampshade",

    # 5. Sofa
    "sofa, couch, lounge": "sofa", "couch": "sofa", "sofa": "sofa", "settee": "sofa",

    # 6. Chair
    "chair": "chair", "armchair": "chair", "seat": "chair", "stool": "chair", "bench": "chair",

    # 7. Glass
    "glass, drinking glass": "glass", "cup": "glass", "wine glass": "glass", "goblet": "glass",

    # 8. Bottle
    "bottle": "bottle", "decanter": "bottle", "carafe": "bottle",

    # 9. Door
    "door": "door", "double door": "door",

    # 10. Window
    "windowpane, window": "window", "window": "window", "skylight": "window",

    # 11. Rug
    "rug, carpet, carpeting": "rug", "rug": "rug", "carpet": "rug", "mat": "rug",

    # 12. Book
    "book": "book", "notebook": "book", "magazine": "book",

    # 13. Computer
    "computer": "computer", "laptop": "computer", "monitor": "computer", "desktop": "computer",

    # 14. Television
    "television receiver, television, television set, tv": "television", "tv": "television",

    # 15. Wardrobe
    "wardrobe, closet, press": "wardrobe", "wardrobe": "wardrobe", "closet": "wardrobe", "armoire": "wardrobe",

    # 16. Shelf
    "shelf": "shelf", "bookcase": "shelf", "shelving": "shelf", "cabinet": "shelf",

    # 17. Clock
    "clock": "clock", "wall clock": "clock",

    # 18. Pillow
    "pillow": "pillow", "cushion": "pillow", "bolster": "pillow",
}

BACKGROUND_STRUCTURAL_MAP = {
    "wall": "wall",
    "floor, flooring": "floor",
    "ceiling": "ceiling",
    "curtain, drapery, drape, curtaining": "curtain",
}


def get_layer_category(label: str) -> str:
    """Classifies architectural objects into 4 distinct scene layers."""
    lbl = label.lower().strip()
    if lbl in ["wall", "floor", "ceiling", "window", "door"]:
        return "structural"
    elif lbl in ["sofa", "chair", "table", "bed", "wardrobe", "desk", "armchair", "cabinet"]:
        return "furniture"
    elif lbl in ["plant", "lampshade", "rug", "book", "clock", "pillow", "wall decor", "mirror", "vase", "glass", "bottle", "curtain"]:
        return "decor"
    else:
        return "background"


# ─── Mask Utilities ────────────────────────────────────────────────────────────

def polygon_from_binary_mask(mask: np.ndarray, tolerance: float = 0.8) -> List[List[float]]:
    """Convert binary mask to simplified polygon vertices [[x1,y1], [x2,y2], ...]."""
    binary_uint8 = (mask > 0.5).astype(np.uint8) * 255
    contours, _ = cv2.findContours(binary_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return []

    largest = max(contours, key=cv2.contourArea)
    if len(largest) < 3:
        return []

    epsilon = tolerance * cv2.arcLength(largest, True) * 0.005
    approx = cv2.approxPolyDP(largest, epsilon, True)

    return [[float(p[0][0]), float(p[0][1])] for p in approx]


def mask_tensor_to_rle(mask: np.ndarray) -> str:
    """Compress binary mask into Base64-encoded Zlib RLE string."""
    binary = (mask > 0.5).astype(np.uint8)
    flat = binary.flatten(order="F")
    diffs = np.diff(flat)
    change_indices = np.where(diffs != 0)[0] + 1
    runs = np.diff(np.concatenate(([0], change_indices, [len(flat)])))

    raw_bytes = runs.astype(np.int32).tobytes()
    compressed = zlib.compress(raw_bytes, level=6)
    return base64.b64encode(compressed).decode("utf-8")


def clear_gpu_memory():
    """Flush GPU/MPS memory pools."""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        torch.cuda.ipc_collect()
    gc.collect()


# ═══════════════════════════════════════════════════════════════════════════════
#  High-Sensitivity Interior Segmentation Engine
# ═══════════════════════════════════════════════════════════════════════════════

class InteriorSegmentationPipeline:
    def __init__(self):
        import threading
        self.device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
        self.m2f_processor = None
        self.m2f_model = None
        self.yolo_model = None
        self.model_available = HAS_TRANSFORMERS or HAS_YOLO
        self._loaded = False
        self._lock = threading.Lock()

    def _load_model(self):
        """Thread-safe lazy loading of Mask2Former and YOLOv8-Seg models."""
        if self._loaded:
            return
        with self._lock:
            if self._loaded:
                return
            print(f"[InteriorPipeline] Lazy initializing ultra-robust pipeline on {self.device}")
            # Load Mask2Former ADE20K
            if HAS_TRANSFORMERS:
                try:
                    import torch
                    try:
                        torch.set_num_threads(1)
                        torch.set_num_interop_threads(1)
                    except RuntimeError:
                        pass
                    model_id = "facebook/mask2former-swin-base-ade-semantic"
                    try:
                        self.m2f_processor = AutoImageProcessor.from_pretrained(model_id)
                        self.m2f_model = Mask2FormerForUniversalSegmentation.from_pretrained(model_id).to(self.device)
                        print(f"[InteriorPipeline] Loaded High-Precision Swin-Base ADE20K ({model_id})")
                    except Exception:
                        model_id = "facebook/mask2former-swin-tiny-ade-semantic"
                        self.m2f_processor = AutoImageProcessor.from_pretrained(model_id)
                        self.m2f_model = Mask2FormerForUniversalSegmentation.from_pretrained(model_id).to(self.device)
                        print(f"[InteriorPipeline] Loaded Swin-Tiny ADE20K ({model_id})")
                    self.m2f_model.eval()
                except Exception as e:
                    print(f"[InteriorPipeline] Mask2Former error: {e}")

            if HAS_YOLO:
                try:
                    import torch
                    try:
                        torch.set_num_threads(1)
                        torch.set_num_interop_threads(1)
                    except RuntimeError:
                        pass
                    self.yolo_model = YOLO("yolov8x-seg.pt")
                    print(f"[InteriorPipeline] Loaded YOLOv8x-seg model")
                except Exception as e:
                    print(f"[InteriorPipeline] YOLO error: {e}")
            self._loaded = True

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
        start_time = time.time()
        if not file_bytes:
            return [], 0.0

        results_out: List[InteriorObjectInstance] = []

        self._load_model()

        log_action("INTERIOR_DETECTOR_START", f"Segmenting room render '{image_id}' ({width}x{height})")

        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            w, h = img.size

            # 1. Mask2Former Semantic Pass with Connected Components Decomposition
            if self.m2f_model and self.m2f_processor:
                inputs = self.m2f_processor(images=img, return_tensors="pt").to(self.device)
                with torch.no_grad():
                    outputs = self.m2f_model(**inputs)

                predicted_map = self.m2f_processor.post_process_semantic_segmentation(
                    outputs, target_sizes=[(h, w)]
                )[0].cpu().numpy()

                unique_ids = np.unique(predicted_map)
                id2label = self.m2f_model.config.id2label

                inst_counter = 1
                for cid in unique_ids:
                    raw_label = id2label.get(int(cid), "").lower()
                    target_label = EXPLICIT_TAXONOMY_MAP.get(raw_label)
                    if not target_label:
                        target_label = BACKGROUND_STRUCTURAL_MAP.get(raw_label)
                    if not target_label:
                        for k, v in EXPLICIT_TAXONOMY_MAP.items():
                            if k in raw_label:
                                target_label = v
                                break
                    
                    if not target_label:
                        continue

                    global_class_mask = (predicted_map == cid).astype(np.uint8)
                    layer_cat = get_layer_category(target_label)

                    if target_label in ["chair", "lampshade", "pillow", "wall decor", "plant", "glass", "bottle", "book", "shelf", "clock", "table", "window", "door"]:
                        num_labels, labels_im, stats, _ = cv2.connectedComponentsWithStats(global_class_mask, connectivity=8)
                        
                        for label_idx in range(1, num_labels):
                            area = stats[label_idx, cv2.CC_STAT_AREA]
                            if area < (w * h * 0.0001):
                                continue

                            instance_mask = (labels_im == label_idx)

                            if output_format == "rle":
                                seg = MaskSegmentation(type="rle", rle=mask_tensor_to_rle(instance_mask))
                            else:
                                poly = polygon_from_binary_mask(instance_mask, tolerance=0.8)
                                if not poly:
                                    continue
                                seg = MaskSegmentation(type="polygon", points=poly)

                            results_out.append(InteriorObjectInstance(
                                id=f"{image_id}_ade_{inst_counter:03d}",
                                **{"class": target_label},
                                layer=layer_cat,
                                mask=seg,
                                segmentation=seg,
                                confidence=0.95,
                                editable=True
                            ))
                            inst_counter += 1
                    else:
                        if np.sum(global_class_mask) < (w * h * 0.0005):
                            continue

                        if output_format == "rle":
                            seg = MaskSegmentation(type="rle", rle=mask_tensor_to_rle(global_class_mask))
                        else:
                            poly = polygon_from_binary_mask(global_class_mask, tolerance=0.8)
                            if not poly:
                                continue
                            seg = MaskSegmentation(type="polygon", points=poly)

                        results_out.append(InteriorObjectInstance(
                            id=f"{image_id}_ade_{inst_counter:03d}",
                            **{"class": target_label},
                            layer=layer_cat,
                            mask=seg,
                            segmentation=seg,
                            confidence=0.95,
                            editable=True
                        ))
                        inst_counter += 1

            # 2. YOLOv8-Seg High-Sensitivity Refinement Pass
            if self.yolo_model:
                yolo_res = self.yolo_model(img, verbose=False, conf=conf_threshold, imgsz=1280)
                if yolo_res and len(yolo_res) > 0:
                    r = yolo_res[0]
                    boxes = r.boxes
                    masks = getattr(r, "masks", None)
                    
                    if masks is not None and len(masks.xy) > 0:
                        for idx, box in enumerate(boxes):
                            raw_name = self.yolo_model.names[int(box.cls[0])].lower()
                            conf = float(box.conf[0])

                            target_label = EXPLICIT_TAXONOMY_MAP.get(raw_name)
                            if not target_label:
                                for k, v in EXPLICIT_TAXONOMY_MAP.items():
                                    if k in raw_name:
                                        target_label = v
                                        break
                            if not target_label or conf < conf_threshold:
                                continue

                            raw_mask = masks.data[idx].cpu().numpy() > 0.5 if masks.data is not None else None
                            if raw_mask is None:
                                continue

                            mask_res = cv2.resize(raw_mask.astype(np.float32), (w, h), interpolation=cv2.INTER_LINEAR) > 0.5
                            layer_cat = get_layer_category(target_label)

                            if output_format == "rle":
                                seg = MaskSegmentation(type="rle", rle=mask_tensor_to_rle(mask_res))
                            else:
                                poly = polygon_from_binary_mask(mask_res, tolerance=0.8)
                                if not poly and len(masks.xy[idx]) >= 3:
                                    poly = [[float(pt[0]), float(pt[1])] for pt in masks.xy[idx]]
                                if not poly:
                                    continue
                                seg = MaskSegmentation(type="polygon", points=poly)

                            results_out.append(InteriorObjectInstance(
                                id=f"{image_id}_yolo_{idx+1:03d}",
                                **{"class": target_label},
                                layer=layer_cat,
                                mask=seg,
                                segmentation=seg,
                                confidence=round(conf, 4),
                                editable=True
                            ))

            proc_time = round((time.time() - start_time) * 1000.0, 2)
            log_action("INTERIOR_DETECTOR_COMPLETE", f"Detected {len(results_out)} exact physical instances in {proc_time}ms")
            return results_out, proc_time

        except torch.cuda.OutOfMemoryError:
            clear_gpu_memory()
            raise HTTPException(status_code=507, detail="GPU memory limit reached.")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
        finally:
            clear_gpu_memory()


interior_pipeline = InteriorSegmentationPipeline()
