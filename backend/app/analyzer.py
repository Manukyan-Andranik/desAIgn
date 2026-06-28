"""
Antigravity Vision Pipeline — Multi-Model Scene Graph Builder
==============================================================
Production 3-Model MVP Core Stack for interior scene understanding:

    Stage 1: Grounding DINO → Open-vocabulary text-prompted object detection
    Stage 2: SAM (Segment Anything) → Pixel-perfect mask segmentation
    Stage 3: Depth Anything V2 → Monocular metric depth estimation
    Stage 4: Material Spec Lookup → Static curated material table
    Stage 5: Scene Graph Assembly → SceneGraph JSON response

Pipeline:
    Render → Grounding DINO → SAM → Depth Anything V2 → Scene Graph Builder
"""

import io
import time
from PIL import Image
from typing import List, Dict, Any
from app.models import SceneGraph, SceneObject, Point, NormalVector, MaskSegmentation
from app.logger import log_action
from app.config import settings

# ─── Import 3-Model Pipeline Modules ─────────────────────────────────────────
from app.grounding_dino import grounding_dino_detector
from app.sam_segmentor import sam_segmentor
from app.depth_estimator import depth_estimator
from app.scene_graph_generator import sgg_engine
from app.clip_classifier import clip_classifier
from app.learning_engine import learning_engine

# ─── Legacy Fallback Import ──────────────────────────────────────────────────
from app.interior_detector import interior_pipeline, EXPLICIT_TAXONOMY_MAP, BACKGROUND_STRUCTURAL_MAP


# ─── Layer Categorization ────────────────────────────────────────────────────
def get_layer_category(cls: str) -> str:
    """Classify detected object into scene layer taxonomy."""
    structural = {"wall", "floor", "ceiling", "door", "window", "stairway", "column", "beam"}
    furniture = {"sofa", "chair", "table", "bed", "desk", "wardrobe", "cabinet", "shelf", "bookcase"}
    decor = {"plant", "lampshade", "lamp", "painting", "mirror", "clock", "vase", "pillow", "curtain", "rug", "television"}
    if cls in structural:
        return "structural"
    elif cls in furniture:
        return "furniture"
    elif cls in decor:
        return "decor"
    return "background"


# ─── Curated Material Specifications ────────────────────────────────────────
MATERIAL_SPECS = {
    "wall": {"material": "Architectural Plaster Wall", "reflectivity": 0.10, "roughness": 0.80, "color_hex": "#E6E0D4", "sub_components": ["Drywall", "Baseboard"]},
    "floor": {"material": "Natural Wide-Plank Oak Flooring", "reflectivity": 0.35, "roughness": 0.30, "color_hex": "#C4A482", "sub_components": ["Timber planks"]},
    "ceiling": {"material": "Matte White Acoustic Ceiling", "reflectivity": 0.05, "roughness": 0.90, "color_hex": "#F8F8F8", "sub_components": ["Plasterboard"]},
    "sofa": {"material": "Italian Bouclé Fabric Upholstery", "reflectivity": 0.10, "roughness": 0.85, "color_hex": "#E2DFD8", "sub_components": ["Cushions", "Timber frame"]},
    "table": {"material": "Walnut Hardwood & Nero Marquina Marble", "reflectivity": 0.45, "roughness": 0.20, "color_hex": "#2B2625", "sub_components": ["Marble top", "Steel legs"]},
    "chair": {"material": "Molded Plywood & Aniline Leather", "reflectivity": 0.30, "roughness": 0.40, "color_hex": "#4A3525", "sub_components": ["Shell frame", "Leather pads"]},
    "lampshade": {"material": "Brushed Brass & Frosted Glass", "reflectivity": 0.75, "roughness": 0.10, "color_hex": "#D4AF37", "sub_components": ["Brass stem", "Glass shade"]},
    "lamp": {"material": "Brushed Brass & Frosted Glass", "reflectivity": 0.75, "roughness": 0.10, "color_hex": "#D4AF37", "sub_components": ["Brass stem", "Glass shade"]},
    "window": {"material": "Low-E Double Glazed Glass & Aluminum Frame", "reflectivity": 0.85, "roughness": 0.05, "color_hex": "#88B04B", "sub_components": ["Glass pane", "Frame"]},
    "door": {"material": "Solid Core White Oak Door", "reflectivity": 0.25, "roughness": 0.45, "color_hex": "#A08A75", "sub_components": ["Door panel", "Brass handle"]},
    "rug": {"material": "Hand-Woven Wool Rug", "reflectivity": 0.05, "roughness": 0.95, "color_hex": "#D3D3D3", "sub_components": ["Weave fibers"]},
    "plant": {"material": "Natural Organic Foliage", "reflectivity": 0.15, "roughness": 0.70, "color_hex": "#3B7A3B", "sub_components": ["Leaves", "Ceramic pot"]},
    "shelf": {"material": "Matte Black Powder-Coated Steel Shelving", "reflectivity": 0.40, "roughness": 0.25, "color_hex": "#1A1A1A", "sub_components": ["Shelves", "Supports"]},
    "curtain": {"material": "Custom Sheer Linen Drapery", "reflectivity": 0.12, "roughness": 0.80, "color_hex": "#F0EAE1", "sub_components": ["Drape fabric", "Curtain rod"]},
    "television": {"material": "OLED Display & Matte Black Bezel", "reflectivity": 0.90, "roughness": 0.05, "color_hex": "#0A0A0A", "sub_components": ["Screen panel", "Stand"]},
    "wardrobe": {"material": "Lacquered MDF & Brass Hardware", "reflectivity": 0.20, "roughness": 0.50, "color_hex": "#F5F0EB", "sub_components": ["Doors", "Shelves", "Handles"]},
    "painting": {"material": "Oil on Canvas & Timber Frame", "reflectivity": 0.15, "roughness": 0.60, "color_hex": "#8B7355", "sub_components": ["Canvas", "Frame"]},
    "mirror": {"material": "Silvered Glass & Brass Frame", "reflectivity": 0.95, "roughness": 0.02, "color_hex": "#C0C0C0", "sub_components": ["Mirror glass", "Frame"]},
    "pillow": {"material": "Linen & Down Fill", "reflectivity": 0.08, "roughness": 0.90, "color_hex": "#E8E3DB", "sub_components": ["Cover", "Fill"]},
    "clock": {"material": "Brushed Steel & Glass", "reflectivity": 0.50, "roughness": 0.15, "color_hex": "#888888", "sub_components": ["Face", "Housing"]},
    "bed": {"material": "Upholstered Linen Headboard & Oak Frame", "reflectivity": 0.12, "roughness": 0.75, "color_hex": "#D5C8B8", "sub_components": ["Headboard", "Mattress", "Frame"]},
    "desk": {"material": "Walnut Veneer & Steel Frame", "reflectivity": 0.35, "roughness": 0.30, "color_hex": "#5C4033", "sub_components": ["Desktop", "Legs", "Drawers"]},
    "cabinet": {"material": "Lacquered MDF & Brass Hardware", "reflectivity": 0.20, "roughness": 0.50, "color_hex": "#F5F0EB", "sub_components": ["Doors", "Shelves"]},
    "vase": {"material": "Ceramic Stoneware", "reflectivity": 0.25, "roughness": 0.60, "color_hex": "#C4A882", "sub_components": ["Body"]},
}


class AntigravityVisionPipeline:
    """
    Production Multi-Model Interior Scene Understanding System.
    
    Competitive Advantage: Editable World Model
    Render → Scene Understanding → Digital Scene Graph → AI Editing Orchestrator → Versioned Design System
    """
    def __init__(self):
        self.gdino = grounding_dino_detector
        self.sam = sam_segmentor
        self.depth = depth_estimator

        # Check which models are available
        self.has_gdino = self.gdino.model is not None
        self.has_sam = self.sam.predictor is not None
        self.has_depth = self.depth.model is not None

        log_action("PIPELINE_INIT", f"Multi-Model Pipeline: GDINO={self.has_gdino} SAM={self.has_sam} Depth={self.has_depth}")

    def analyze(
        self,
        file_bytes: bytes,
        image_id: str,
        image_url: str = None,
        room_type: str = "Living Room",
        design_style: str = "Japandi Minimalist"
    ) -> SceneGraph:
        """
        Execute the full 5-stage production vision pipeline tailored to room function and architectural style.
        """
        pipeline_start = time.time()

        try:
            img = Image.open(io.BytesIO(file_bytes))
            width, height = img.size
        except Exception:
            width, height = 1920, 1080

        log_action("PIPELINE_START", f"Analyzing render '{image_id}' ({width}x{height}) for Room: '{room_type}', Style: '{design_style}'")

        # ─── Check if new pipeline is available ───────────────────────
        if not self.has_gdino:
            log_action("PIPELINE_FALLBACK", "Grounding DINO unavailable. Falling back to legacy Mask2Former + YOLO pipeline.")
            return self._legacy_analyze(file_bytes, image_id, image_url, width, height)

        # ─── Stage 1: Grounding DINO Open-Vocabulary Detection ────────
        log_action("STAGE_1_START", f"Running Grounding DINO Base open-vocabulary detection for '{room_type}'...")
        detections, gdino_time = self.gdino.detect(
            file_bytes=file_bytes,
            image_id=image_id,
            room_type=room_type,
            threshold=settings.GDINO_BOX_THRESHOLD,
            text_threshold=settings.GDINO_TEXT_THRESHOLD
        )
        
        # Adaptive confidence refinement: filter out raw predictions with low bounding box aspect ratio consistency
        detections = [
            d for d in detections 
            if (d["bbox"][2] - d["bbox"][0]) >= 8 and (d["bbox"][3] - d["bbox"][1]) >= 8
        ]
        log_action("STAGE_1_COMPLETE", f"Grounding DINO Swin-B: {len(detections)} refined objects detected in {gdino_time}ms")

        if not detections:
            log_action("PIPELINE_EMPTY", "No high-confidence objects detected. Engaging legacy pipeline.")
            return self._legacy_analyze(file_bytes, image_id, image_url, width, height)

        # ─── Stage 2: SAM Segmentation ───────────────────────────────
        log_action("STAGE_2_START", f"Running SAM pixel-perfect segmentation on {len(detections)} objects...")
        detections = self.sam.segment(
            file_bytes=file_bytes,
            detections=detections,
            image_id=image_id
        )
        log_action("STAGE_2_COMPLETE", "SAM segmentation complete")

        # ─── Stage 3: Depth Anything V2 ──────────────────────────────
        log_action("STAGE_3_START", "Running Depth Anything V2 monocular depth estimation...")
        detections = self.depth.estimate_per_object_depth(
            file_bytes=file_bytes,
            detections=detections,
            image_id=image_id
        )
        log_action("STAGE_3_COMPLETE", "Depth estimation complete")

        # ─── Stage 4: OpenCLIP Zero-Shot Material & Style Classification ────
        log_action("STAGE_4_START", "Running OpenCLIP zero-shot material classification & OpenCV color extraction...")
        detections = clip_classifier.classify_object_crops(
            file_bytes=file_bytes,
            detections=detections,
            image_id=image_id
        )
        log_action("STAGE_4_COMPLETE", "Zero-shot material classification complete")

        # ─── Stage 5: Scene Graph Assembly ─────
        scene_objects: List[SceneObject] = []
        for det in detections:
            raw_cls = det["class"]
            cls = learning_engine.get_corrected_class(raw_cls)
            polygon_points = det.get("polygon", [])
            pts = [Point(x=p[0], y=p[1]) for p in polygon_points]

            if not pts:
                continue

            mask_data = MaskSegmentation(type="polygon", points=polygon_points)

            spec = MATERIAL_SPECS.get(cls, {
                "reflectivity": 0.20, "roughness": 0.50, "sub_components": []
            })

            # Use OpenCLIP classified material if available, else fall back to spec
            material_name = det.get("classified_material", spec.get("material", f"{cls.capitalize()} Surface Finish"))
            color_hex = det.get("color_hex", spec.get("color_hex", "#888888"))
            style_name = det.get("style", "Modern Interior Design")

            layer = get_layer_category(cls)
            depth_val = det.get("depth", 2.5)

            scene_objects.append(SceneObject(
                id=det["id"],
                **{"class": cls},
                layer=layer,
                polygon=pts,
                segmentation=mask_data,
                mask=mask_data,
                bbox=det["bbox"],
                depth=depth_val,
                material=material_name,
                style=style_name,
                editable=True,
                confidence=det["confidence"],
                parent="room_structure" if cls in {"wall", "floor", "ceiling", "window", "door"} else "floor",
                surface_orientation="Horizontal Plane" if cls in {"floor", "table", "rug", "desk", "bed"} else "Vertical Facade",
                normal_vector=NormalVector(nx=0.0, ny=1.0, nz=0.0) if cls in {"floor", "table", "rug", "desk"} else NormalVector(nx=0.0, ny=0.0, nz=1.0),
                reflectivity=spec.get("reflectivity", 0.20),
                roughness=spec.get("roughness", 0.50),
                color_hex=color_hex,
                sub_components=spec.get("sub_components", [])
            ))

        # ─── Stage 5: Scene Graph Spatial Relationships (SGG) ────────
        relationships = sgg_engine.generate_relationships(scene_objects)

        pipeline_time = round((time.time() - pipeline_start) * 1000.0, 2)
        log_action("PIPELINE_COMPLETE", f"5-Stage Production Pipeline finished: {len(scene_objects)} objects, {len(relationships)} relationships in {pipeline_time}ms")

        return SceneGraph(
            image_id=image_id,
            image_url=image_url,
            width=width,
            height=height,
            version=1,
            room_type=room_type,
            design_style=design_style,
            objects=scene_objects,
            relationships=relationships
        )

    def _legacy_analyze(self, file_bytes: bytes, image_id: str, image_url: str, width: int, height: int) -> SceneGraph:
        """Fallback to legacy Mask2Former ADE20K + YOLOv8 pipeline."""
        log_action("LEGACY_PIPELINE_START", "Executing legacy Mask2Former + YOLO interior pipeline")

        interior_instances, proc_time = interior_pipeline.segment_room(
            file_bytes=file_bytes,
            width=width,
            height=height,
            image_id=image_id,
            conf_threshold=0.15,
            output_format="polygon"
        )

        scene_objects: List[SceneObject] = []
        for inst in interior_instances:
            cls = inst.object_class
            mask_data = inst.mask or inst.segmentation
            if not mask_data or not mask_data.points:
                continue
            pts = [Point(x=p[0], y=p[1]) for p in mask_data.points]

            xs = [p.x for p in pts]
            ys = [p.y for p in pts]
            bbox = [int(min(xs)), int(min(ys)), int(max(xs)), int(max(ys))]

            spec = MATERIAL_SPECS.get(cls, {
                "material": f"{cls.capitalize()} Surface Finish",
                "reflectivity": 0.20, "roughness": 0.50,
                "color_hex": "#888888", "sub_components": []
            })

            static_depths = {
                "wall": 4.5, "floor": 3.0, "ceiling": 3.5, "sofa": 2.2, "chair": 2.1,
                "table": 2.0, "lampshade": 2.8, "window": 4.0, "door": 3.8, "rug": 2.5,
                "plant": 2.4, "shelf": 3.2, "curtain": 3.9
            }

            scene_objects.append(SceneObject(
                id=inst.id,
                **{"class": cls},
                layer=inst.layer,
                polygon=pts,
                segmentation=mask_data,
                mask=mask_data,
                bbox=bbox,
                depth=static_depths.get(cls, 2.5),
                material=spec["material"],
                style="modern interior design",
                editable=inst.editable,
                confidence=inst.confidence,
                parent="room_structure" if cls in {"wall", "floor", "ceiling", "window", "door"} else "floor",
                surface_orientation="Horizontal Plane" if cls in {"floor", "table", "rug"} else "Vertical Facade",
                normal_vector=NormalVector(nx=0.0, ny=1.0, nz=0.0) if cls in {"floor", "table", "rug"} else NormalVector(nx=0.0, ny=0.0, nz=1.0),
                reflectivity=spec["reflectivity"],
                roughness=spec["roughness"],
                color_hex=spec["color_hex"],
                sub_components=spec["sub_components"]
            ))

        log_action("LEGACY_PIPELINE_COMPLETE", f"Legacy pipeline: {len(scene_objects)} objects in {proc_time}ms")

        return SceneGraph(
            image_id=image_id,
            image_url=image_url,
            width=width,
            height=height,
            version=1,
            objects=scene_objects
        )


pipeline = AntigravityVisionPipeline()
