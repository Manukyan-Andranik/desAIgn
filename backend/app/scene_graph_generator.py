"""
Scene Graph Generator (SGG) — Spatial Relationship Engine
===========================================================
Generates 3D spatial & structural relationships between detected objects
based on bounding box overlaps, mask contacts, relative depths, and architectural rules.

Pipeline Position: Stage 5 of 5
    Florence-2 → Grounding DINO 1.6 → SAM 2.1 → Depth Anything V2 → [SGG Engine]
"""

import time
import math
from typing import List, Dict, Any, Tuple
from app.models import SceneObject, SceneRelationship
from app.logger import log_action


def compute_bbox_center(bbox: List[int]) -> Tuple[float, float]:
    x1, y1, x2, y2 = bbox
    return (x1 + x2) / 2.0, (y1 + y2) / 2.0


class SceneGraphGenerator:
    """
    Computes spatial relationships (e.g. 'lamp on table', 'TV mounted_on wall', 'chair next_to sofa')
    between physical objects using multi-modal depth, geometry, and proximity heuristics.
    """
    def generate_relationships(self, objects: List[SceneObject]) -> List[SceneRelationship]:
        start_time = time.time()
        relationships: List[SceneRelationship] = []

        if len(objects) < 2:
            return relationships

        log_action("SGG_START", f"Generating spatial relationships for {len(objects)} objects")

        for i, obj_a in enumerate(objects):
            if not obj_a.bbox:
                continue

            cx_a, cy_a = compute_bbox_center(obj_a.bbox)
            w_a = obj_a.bbox[2] - obj_a.bbox[0]
            h_a = obj_a.bbox[3] - obj_a.bbox[1]

            for j, obj_b in enumerate(objects):
                if i == j or not obj_b.bbox:
                    continue

                cx_b, cy_b = compute_bbox_center(obj_b.bbox)
                w_b = obj_b.bbox[2] - obj_b.bbox[0]
                h_b = obj_b.bbox[3] - obj_b.bbox[1]

                # Distance between centers normalized by diagonal
                dist = math.hypot(cx_a - cx_b, cy_a - cy_b)
                max_dim = max(w_a, h_a, w_b, h_b, 1.0)
                rel_dist = dist / max_dim

                predicate = None

                # 1. Wall-mounted objects (TV, painting, mirror, sconce mounted_on wall)
                if obj_b.object_class == "wall" and obj_a.object_class in ["television", "painting", "mirror", "lampshade", "clock", "shelf"]:
                    # Overlap check
                    if obj_a.bbox[0] >= obj_b.bbox[0] and obj_a.bbox[2] <= obj_b.bbox[2]:
                        predicate = "mounted_on"

                # 2. Objects resting ON horizontal surfaces (lamp/vase/book/pillow on table/shelf/sofa/floor)
                elif obj_a.object_class in ["lampshade", "vase", "book", "pillow", "television", "plant", "glass", "bottle", "clock"] and \
                     obj_b.object_class in ["table", "shelf", "sofa", "desk", "cabinet", "floor", "rug", "bed"]:
                    # Check if obj_a is geometrically above obj_b's base or overlapping top
                    if abs(cx_a - cx_b) < (w_b * 0.7) and obj_a.bbox[3] <= (obj_b.bbox[1] + h_b * 0.4):
                        predicate = "on"
                    elif abs(cx_a - cx_b) < (w_b * 0.5) and abs(cy_a - cy_b) < (h_b * 0.5):
                        predicate = "on"

                # 3. Next to / Beside relationships (furniture adjacent in space)
                elif rel_dist < 1.8 and abs(cy_a - cy_b) < (h_a + h_b) * 0.4:
                    if abs(obj_a.depth - obj_b.depth) < 1.2:
                        predicate = "next_to"

                # 4. In front of / Behind (depth ordering)
                elif rel_dist < 1.5 and abs(cx_a - cx_b) < (w_a + w_b) * 0.5:
                    if obj_a.depth < (obj_b.depth - 0.5):
                        predicate = "in_front_of"

                if predicate:
                    rel = SceneRelationship(
                        subject_id=obj_a.id,
                        predicate=predicate,
                        object_id=obj_b.id
                    )
                    # Deduplicate
                    if not any(r.subject_id == rel.subject_id and r.predicate == rel.predicate and r.object_id == rel.object_id for r in relationships):
                        relationships.append(rel)

        proc_time = round((time.time() - start_time) * 1000.0, 2)
        log_action("SGG_COMPLETE", f"Generated {len(relationships)} spatial relationships in {proc_time}ms")
        return relationships


sgg_engine = SceneGraphGenerator()
