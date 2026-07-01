"""
Depth Anything V2 Monocular Depth Estimator
=============================================
Real per-pixel monocular depth estimation for interior scenes.
Generates a depth map and extracts per-object metric depth values.

Pipeline Position: Stage 3 of 3 (Detection → Segmentation → Depth)
"""

import io
import time
import numpy as np
import torch
from PIL import Image
from typing import List, Dict, Any, Optional
from app.logger import log_action

# ─── Attempt Transformers Import ─────────────────────────────────────────────
HAS_DEPTH = False
try:
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    HAS_DEPTH = True
except ImportError:
    pass


class DepthEstimator:
    """
    Monocular depth estimation using Depth Anything V2 (ViT-Small).
    Generates a per-pixel depth map and extracts per-object depth values.
    """
    def __init__(self):
        import threading
        self.model = None
        self.processor = None
        self.device = "cpu"  # CPU for MPS compatibility (depth models have limited MPS op support)
        self.model_available = HAS_DEPTH
        self._lock = threading.Lock()

    def _load_model(self):
        """Thread-safe lazy loading of Depth Anything V2 weights."""
        if self.model is not None:
            return
        with self._lock:
            if self.model is not None:
                return
            log_action("DEPTH_INIT_START", "Lazy loading Depth Anything V2 estimator")
            if not HAS_DEPTH:
                log_action("DEPTH_INIT_WARN", "transformers package not available for depth estimation")
                return
            try:
                # Apply thread constraints inside Python dynamically
                try:
                    torch.set_num_threads(1)
                    torch.set_num_interop_threads(1)
                except RuntimeError:
                    pass
                model_id = "depth-anything/Depth-Anything-V2-Small-hf"
                self.processor = AutoImageProcessor.from_pretrained(model_id)
                self.model = AutoModelForDepthEstimation.from_pretrained(model_id)
                self.model.to(self.device)
                self.model.eval()
                log_action("DEPTH_INIT_SUCCESS", f"Depth Anything V2 Small loaded on {self.device}")
            except Exception as e:
                log_action("DEPTH_INIT_ERROR", f"Depth Anything V2 init failed: {e}")

    def estimate_depth_map(self, file_bytes: bytes) -> Optional[np.ndarray]:
        """
        Generate a normalized depth map from raw image bytes.
        Returns: depth_map as np.ndarray (H, W) with values 0.0-1.0, or None on failure.
        """
        self._load_model()
        if not self.model or not self.processor or not file_bytes:
            return None

        try:
            img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
            inputs = self.processor(images=img, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                predicted_depth = outputs.predicted_depth

            # Interpolate to original size
            prediction = torch.nn.functional.interpolate(
                predicted_depth.unsqueeze(1),
                size=img.size[::-1],  # (H, W)
                mode="bicubic",
                align_corners=False
            ).squeeze()

            depth_map = prediction.cpu().numpy()

            # Normalize to 0-1 range
            depth_min = depth_map.min()
            depth_max = depth_map.max()
            if depth_max > depth_min:
                depth_map = (depth_map - depth_min) / (depth_max - depth_min)
            else:
                depth_map = np.zeros_like(depth_map)

            return depth_map

        except Exception as e:
            log_action("DEPTH_MAP_ERROR", f"Depth map generation failed: {e}")
            return None

    def estimate_per_object_depth(
        self,
        file_bytes: bytes,
        detections: List[Dict[str, Any]],
        image_id: str,
        max_scene_depth_m: float = 8.0
    ) -> List[Dict[str, Any]]:
        """
        Compute per-object depth values from the depth map.
        
        Args:
            file_bytes: Raw image bytes
            detections: List of dicts with 'bbox' and optionally 'polygon' keys
            image_id: Image identifier for logging
            max_scene_depth_m: Maximum scene depth in meters for normalization
            
        Returns:
            Enhanced detections with added 'depth' field (in meters).
        """
        start_time = time.time()
        log_action("DEPTH_ESTIMATE_START", f"Estimating depth for {len(detections)} objects in '{image_id}'")

        depth_map = self.estimate_depth_map(file_bytes)

        if depth_map is None:
            # Fallback: assign static depth values based on class
            static_depths = {
                "wall": 4.5, "floor": 3.0, "ceiling": 3.5, "sofa": 2.2, "chair": 2.1,
                "table": 2.0, "lampshade": 2.8, "window": 4.0, "door": 3.8, "rug": 2.5,
                "plant": 2.4, "shelf": 3.2, "curtain": 3.9, "television": 3.0,
                "wardrobe": 3.5, "pillow": 2.0, "clock": 3.5, "painting": 4.0,
                "mirror": 4.0, "bed": 2.3, "desk": 2.0, "cabinet": 3.2, "vase": 2.3,
                "lamp": 2.8
            }
            for det in detections:
                det["depth"] = static_depths.get(det.get("class", ""), 2.5)
            log_action("DEPTH_ESTIMATE_FALLBACK", "Using static depth lookup (model unavailable)")
            return detections

        h, w = depth_map.shape

        for det in detections:
            try:
                x1, y1, x2, y2 = det["bbox"]
                # Clamp to image bounds
                x1 = max(0, min(int(x1), w - 1))
                y1 = max(0, min(int(y1), h - 1))
                x2 = max(0, min(int(x2), w))
                y2 = max(0, min(int(y2), h))

                # Extract depth within bounding box region
                region = depth_map[y1:y2, x1:x2]
                if region.size > 0:
                    mean_depth_norm = float(np.mean(region))
                    # Convert normalized depth (0-1) to meters
                    # Depth Anything outputs relative depth (higher = further)
                    depth_m = round(mean_depth_norm * max_scene_depth_m, 2)
                    det["depth"] = max(0.5, min(depth_m, max_scene_depth_m))
                else:
                    det["depth"] = 2.5
            except Exception:
                det["depth"] = 2.5

        proc_time = round((time.time() - start_time) * 1000.0, 2)
        log_action("DEPTH_ESTIMATE_COMPLETE", f"Depth estimation finished in {proc_time}ms")

        return detections


# Module-level singleton
depth_estimator = DepthEstimator()
